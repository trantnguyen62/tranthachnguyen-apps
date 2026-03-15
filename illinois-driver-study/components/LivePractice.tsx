import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Language, Question } from '../types';
import { getQuestions } from '../data/questions';
import { arrayBufferToBase64 } from '../services/gemini';

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
// Tolerance (in seconds) when detecting that all queued audio has finished playing.
const AUDIO_END_TOLERANCE = 0.1;

interface LivePracticeProps {
  language: Language;
}

// Static translations moved outside component
const TRANSLATIONS = {
  en: {
    title: "Live Driving Instructor",
    subtitle: "Practice with an AI instructor. The instructor will quiz you on the 58 official questions.",
    start: "Start Session",
    stop: "End Session",
    status_connecting: "Connecting...",
    status_connected: "Listening...",
    status_speaking: "Instructor Speaking...",
    status_disconnected: "Session Ended",
    mic_permission: "Please allow microphone access to start.",
    instruction: "You are a friendly but strict Illinois driving instructor. Your goal is to quiz the user on the specific list of 58 questions provided below. \n\nRULES:\n1. Pick a question from the list.\n2. CRITICAL: Before reading the question, you MUST call the function \"displayQuestion\" with the question's ID.\n3. After calling the function, read the question text and the options aloud to the user.\n4. Wait for the user's answer.\n5. Tell them if they are correct or incorrect. If incorrect, explain why based on the correct answer.\n6. Move on to another question.\n\nKeep your responses concise.",
    current_question: "Current Question"
  },
  vi: {
    title: "Giáo Viên Lái Xe Ảo",
    subtitle: "Luyện tập với giáo viên AI. Giáo viên sẽ kiểm tra bạn về 58 câu hỏi chính thức.",
    start: "Bắt Đầu",
    stop: "Kết Thúc",
    status_connecting: "Đang kết nối...",
    status_connected: "Đang nghe...",
    status_speaking: "Giáo viên đang nói...",
    status_disconnected: "Đã kết thúc",
    mic_permission: "Vui lòng cho phép truy cập micro để bắt đầu.",
    instruction: "Bạn là một giáo viên dạy lái xe Illinois thân thiện nhưng nghiêm khắc. Mục tiêu của bạn là kiểm tra người dùng về danh sách 58 câu hỏi cụ thể được cung cấp dưới đây.\n\nQUY TẮC:\n1. Chọn một câu hỏi từ danh sách.\n2. QUAN TRỌNG: Trước khi đọc câu hỏi, bạn PHẢI gọi hàm \"displayQuestion\" với ID của câu hỏi đó.\n3. Sau khi gọi hàm, đọc to nội dung câu hỏi và các lựa chọn cho người dùng.\n4. Chờ người dùng trả lời.\n5. Thông báo cho họ biết họ đúng hay sai. Nếu sai, hãy giải thích tại sao dựa trên câu trả lời đúng.\n6. Chuyển sang câu hỏi khác.\n\nHãy trả lời ngắn gọn và dùng Tiếng Việt.",
    current_question: "Câu Hỏi Hiện Tại"
  }
} as const;

// Utility functions moved outside component

/**
 * Converts a Float32Array of audio samples (Web Audio API format, range [-1, 1])
 * into a signed 16-bit PCM Int16Array for transmission to the Gemini Live API.
 * Clamps values to avoid overflow before scaling.
 */
function createPcmData(data: Float32Array): Int16Array {
  const length = data.length;
  const int16 = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
}

/**
 * Decodes a base64 string into a raw Uint8Array.
 * Used to convert base64-encoded PCM audio chunks received from the Gemini Live API.
 */
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts raw 16-bit PCM bytes (24 kHz, mono) into a Web Audio API AudioBuffer.
 * Normalizes Int16 values to the [-1, 1] float range expected by Web Audio.
 * The output AudioContext must be initialized at 24 kHz to match the API's output rate.
 */
function decodeAudioData(data: Uint8Array, ctx: AudioContext): AudioBuffer {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const LivePractice = memo<LivePracticeProps>(({ language }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'speaking' | 'disconnected'>('idle');
  const [volume, setVolume] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  // Two separate AudioContexts are required: one for microphone capture at 16 kHz
  // (the rate expected by the Gemini Live API input) and one for playback at 24 kHz
  // (the rate of PCM audio returned by the API). Sharing a single context would
  // force resampling and degrade quality on at least one path.
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  // Tracks the scheduled end time of the last audio buffer so consecutive chunks
  // are queued back-to-back without gaps or overlap.
  const nextStartTimeRef = useRef<number>(0);
  // Tracks all currently scheduled/playing output audio sources so they can be
  // stopped immediately when the server signals an interruption.
  const activeOutputSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const sessionRef = useRef<any>(null);
  const resolvedSessionRef = useRef<any>(null);
  const lastVolumeRef = useRef<number>(0);
  
  const t = TRANSLATIONS[language];

  const stopSession = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    activeOutputSourcesRef.current.forEach(s => { try { s.stop(); } catch { /* already ended */ } });
    activeOutputSourcesRef.current = [];
    resolvedSessionRef.current = null;
    lastVolumeRef.current = 0;
    nextStartTimeRef.current = 0;
    setIsActive(false);
    setStatus('idle');
    setVolume(0);
    setCurrentQuestion(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  // Update questions list when language changes, effectively resetting the session context conceptually
  // though the session itself needs manual restart to pick up new system instructions.
  const allQuestions = useMemo(() => getQuestions(language), [language]);
  const questionsMap = useMemo(() => new Map(allQuestions.map(q => [q.id, q])), [allQuestions]);

  const startSession = async () => {
    try {
      setStatus('connecting');
      setIsActive(true);
      setCurrentQuestion(null);
      setSessionError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outputAudioContext;
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prepare the tools
      const displayQuestionTool: FunctionDeclaration = {
        name: 'displayQuestion',
        description: 'Display a specific question from the study list on the user\'s screen. Use this before reading the question.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.NUMBER,
              description: `The ID of the question (1-${allQuestions.length}) to display.`,
            },
          },
          required: ['id'],
        },
      };

      // Prepare context with all questions in compact format to minimize token usage.
      // Format: "id. Question text [A: opt | B: opt* | C: opt]" where * marks the correct answer.
      const questionsContext = allQuestions.map(q => {
        const opts = q.options.map((o, i) =>
          `${String.fromCharCode(65 + i)}: ${o}${i === q.correctIndex ? '*' : ''}`
        ).join(' | ');
        return `${q.id}. ${q.text} [${opts}]`;
      }).join('\n');

      const config = {
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `${t.instruction}\n\nAVAILABLE QUESTIONS LIST:\n${questionsContext}`,
          tools: [{ functionDeclarations: [displayQuestionTool] }],
        },
      };

      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            sessionPromise.then(s => { resolvedSessionRef.current = s; });
            setStatus('connected');
            
            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Compute RMS (root mean square) loudness of the captured frame,
              // scaled by 5 to amplify the visualizer response. The 0.05 dead-band
              // prevents excessive React re-renders from small fluctuations.
              let sum = 0;
              for(let i=0; i<inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              const newVolume = Math.min(rms * 5, 1);
              if (Math.abs(newVolume - lastVolumeRef.current) > 0.05) {
                lastVolumeRef.current = newVolume;
                setVolume(newVolume);
              }

              const pcmData = createPcmData(inputData);
              const base64Data = arrayBufferToBase64(pcmData.buffer);
              
              resolvedSessionRef.current?.sendRealtimeInput({
                media: {
                  mimeType: 'audio/pcm;rate=16000',
                  data: base64Data
                }
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Tool Calls (Display Question)
             if (message.toolCall) {
                const responses = message.toolCall.functionCalls.map(fc => {
                  if (fc.name === 'displayQuestion') {
                    const rawId = fc.args['id'];
                    const id = typeof rawId === 'number' && Number.isInteger(rawId) && rawId >= 1 && rawId <= allQuestions.length
                      ? rawId
                      : NaN;
                    const q = Number.isNaN(id) ? undefined : questionsMap.get(id);
                    if (q) {
                      setCurrentQuestion(q);
                      return {
                        id: fc.id,
                        name: fc.name,
                        response: { result: `Question ${id} displayed on screen: "${q.text}"` }
                      };
                    } else {
                      return {
                        id: fc.id,
                        name: fc.name,
                        response: { result: `Error: Question ID ${id} not found.` }
                      };
                    }
                  }
                  return {
                    id: fc.id,
                    name: fc.name,
                    response: { result: "Unknown function" }
                  };
                });

                resolvedSessionRef.current?.sendToolResponse({
                  functionResponses: responses
                });
             }

             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio) {
               const ctx = outputAudioContextRef.current;
               if (!ctx || ctx.state === 'closed') return;
               setStatus('speaking');

               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

               const audioBuffer = decodeAudioData(
                 decodeBase64(base64Audio),
                 ctx
               );

               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(ctx.destination);
               activeOutputSourcesRef.current.push(source);
               source.start(nextStartTimeRef.current);

               nextStartTimeRef.current += audioBuffer.duration;

               source.onended = () => {
                 activeOutputSourcesRef.current = activeOutputSourcesRef.current.filter(s => s !== source);
                 const currentCtx = outputAudioContextRef.current;
                 if (currentCtx && currentCtx.currentTime >= nextStartTimeRef.current - AUDIO_END_TOLERANCE) {
                    setStatus('connected');
                 }
               };
             }

             if (message.serverContent?.interrupted) {
               activeOutputSourcesRef.current.forEach(s => { try { s.stop(); } catch { /* already ended */ } });
               activeOutputSourcesRef.current = [];
               nextStartTimeRef.current = 0;
               setStatus('connected');
             }
          },
          onclose: () => {
            setStatus('disconnected');
            setIsActive(false);
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setStatus('disconnected');
            setIsActive(false);
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Connection failed", err);
      setStatus('idle');
      setIsActive(false);
      const isPermissionError = err instanceof Error && err.name === 'NotAllowedError';
      setSessionError(isPermissionError ? t.mic_permission : (language === 'vi' ? 'Không thể kết nối. Vui lòng thử lại.' : 'Connection failed. Please try again.'));
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col items-center justify-start min-h-[60vh] gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.title}</h2>
        <p className="text-slate-600 max-w-md mx-auto">{t.subtitle}</p>
      </div>

      <div className="relative">
        {/* Status Indicator Ring (decorative) */}
        <div aria-hidden="true" className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
          status === 'speaking' ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]' :
          status === 'connected' ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' :
          status === 'connecting' ? 'border-yellow-400 animate-pulse' :
          'border-slate-200'
        }`}>
          {/* Visualizer Core */}
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 ${
            status === 'speaking' ? 'bg-blue-100' :
            status === 'connected' ? 'bg-green-50' :
            'bg-slate-50'
          }`}
          style={{
             transform: isActive && status !== 'speaking' ? `scale(${1 + volume})` : 'scale(1)'
          }}
          >
             {status === 'speaking' ? (
               <div className="flex gap-1 h-12 items-center">
                 <div className="w-2 bg-blue-500 animate-[bounce_1s_infinite] h-8"></div>
                 <div className="w-2 bg-blue-500 animate-[bounce_1s_infinite_0.1s] h-12"></div>
                 <div className="w-2 bg-blue-500 animate-[bounce_1s_infinite_0.2s] h-6"></div>
                 <div className="w-2 bg-blue-500 animate-[bounce_1s_infinite_0.15s] h-10"></div>
                 <div className="w-2 bg-blue-500 animate-[bounce_1s_infinite_0.05s] h-7"></div>
               </div>
             ) : status === 'connected' ? (
                <svg aria-hidden="true" className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
             ) : (
                <svg aria-hidden="true" className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
             )}
          </div>
        </div>

        <div aria-live="polite" aria-atomic="true" className="absolute -bottom-8 left-0 right-0 text-center font-medium text-slate-500 animate-pulse text-sm">
          {status === 'connecting' ? t.status_connecting :
           status === 'speaking' ? t.status_speaking :
           status === 'connected' ? t.status_connected :
           status === 'disconnected' ? t.status_disconnected :
           null}
        </div>
      </div>

      <div className="w-full min-h-[200px] flex items-center justify-center">
        {currentQuestion ? (
          <div aria-live="polite" aria-atomic="true" className="w-full bg-white rounded-xl shadow-lg border border-slate-200 p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
               <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wide">
                  {t.current_question}
               </span>
               <span className="text-slate-400 text-sm font-mono">#{currentQuestion.id}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">{currentQuestion.text}</h3>
            {currentQuestion.image && (
               <div className="mb-4 flex justify-center">
                 <img src={currentQuestion.image} alt={currentQuestion.text} loading="lazy" className="max-h-40 object-contain rounded shadow-sm" />
               </div>
            )}
            <div className="space-y-2">
              {currentQuestion.options.map((opt, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-sm flex items-start">
                   <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-xs mr-3 flex-shrink-0 bg-white">
                      {String.fromCharCode(65 + idx)}
                   </span>
                   {opt}
                </div>
              ))}
            </div>
          </div>
        ) : isActive && status === 'connected' ? (
           <div className="text-slate-400 italic text-sm text-center max-w-xs">
             "{language === 'en' ? "Say 'Quiz me' to start practicing questions!" : "Nói 'Kiểm tra tôi' để bắt đầu luyện tập!"}"
           </div>
        ) : null}
      </div>

      {sessionError && (
        <p role="alert" className="text-red-600 text-center text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-sm">
          {sessionError}
        </p>
      )}

      <button
        onClick={isActive ? stopSession : startSession}
        aria-label={isActive ? (language === 'vi' ? 'Kết thúc phiên luyện tập' : 'End practice session') : (language === 'vi' ? 'Bắt đầu phiên luyện tập' : 'Start practice session')}
        className={`px-8 py-3 rounded-full text-lg font-bold shadow-lg transition-all transform hover:-translate-y-1 ${
          isActive
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {isActive ? t.stop : t.start}
      </button>
    </div>
  );
});

LivePractice.displayName = 'LivePractice';
