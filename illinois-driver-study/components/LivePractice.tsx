import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Language, Question } from '../types';
import { getQuestions } from '../data/questions';

interface LivePracticeProps {
  language: Language;
}

// Static translations moved outside component
const TRANSLATIONS = {
  en: {
    title: "Live Driving Instructor",
    subtitle: "Practice with an AI instructor. The instructor will quiz you on the 40 official questions.",
    start: "Start Session",
    stop: "End Session",
    status_connecting: "Connecting...",
    status_connected: "Listening...",
    status_speaking: "Instructor Speaking...",
    status_disconnected: "Session Ended",
    mic_permission: "Please allow microphone access to start.",
    instruction: "You are a friendly but strict Illinois driving instructor. Your goal is to quiz the user on the specific list of 40 questions provided below. \n\nRULES:\n1. Pick a question from the list.\n2. CRITICAL: Before reading the question, you MUST call the function \"displayQuestion\" with the question's ID.\n3. After calling the function, read the question text and the options aloud to the user.\n4. Wait for the user's answer.\n5. Tell them if they are correct or incorrect. If incorrect, explain why based on the correct answer.\n6. Move on to another question.\n\nKeep your responses concise.",
    current_question: "Current Question"
  },
  vi: {
    title: "Giáo Viên Lái Xe Ảo",
    subtitle: "Luyện tập với giáo viên AI. Giáo viên sẽ kiểm tra bạn về 40 câu hỏi chính thức.",
    start: "Bắt Đầu",
    stop: "Kết Thúc",
    status_connecting: "Đang kết nối...",
    status_connected: "Đang nghe...",
    status_speaking: "Giáo viên đang nói...",
    status_disconnected: "Đã kết thúc",
    mic_permission: "Vui lòng cho phép truy cập micro để bắt đầu.",
    instruction: "Bạn là một giáo viên dạy lái xe Illinois thân thiện nhưng nghiêm khắc. Mục tiêu của bạn là kiểm tra người dùng về danh sách 40 câu hỏi cụ thể được cung cấp dưới đây.\n\nQUY TẮC:\n1. Chọn một câu hỏi từ danh sách.\n2. QUAN TRỌNG: Trước khi đọc câu hỏi, bạn PHẢI gọi hàm \"displayQuestion\" với ID của câu hỏi đó.\n3. Sau khi gọi hàm, đọc to nội dung câu hỏi và các lựa chọn cho người dùng.\n4. Chờ người dùng trả lời.\n5. Thông báo cho họ biết họ đúng hay sai. Nếu sai, hãy giải thích tại sao dựa trên câu trả lời đúng.\n6. Chuyển sang câu hỏi khác.\n\nHãy trả lời ngắn gọn và dùng Tiếng Việt.",
    current_question: "Câu Hỏi Hiện Tại"
  }
} as const;

// Utility functions moved outside component
function createPcmData(data: Float32Array): Int16Array {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'speaking'>('idle');
  const [volume, setVolume] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  
  const t = TRANSLATIONS[language];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  // Update questions list when language changes, effectively resetting the session context conceptually
  // though the session itself needs manual restart to pick up new system instructions.
  const allQuestions = getQuestions(language);

  const stopSession = () => {
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
    
    setIsActive(false);
    setStatus('idle');
    setVolume(0);
    setCurrentQuestion(null);
  };

  const startSession = async () => {
    try {
      setStatus('connecting');
      setIsActive(true);
      setCurrentQuestion(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
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
              description: 'The ID of the question (1-40) to display.',
            },
          },
          required: ['id'],
        },
      };

      // Prepare context with all questions
      const questionsContext = allQuestions.map(q => 
        `ID: ${q.id}\nQuestion: ${q.text}\nOptions: ${q.options.join(', ')}\nCorrect Answer: ${q.options[q.correctIndex]}`
      ).join('\n---\n');

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
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
            setStatus('connected');
            
            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!isActive) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              
              let sum = 0;
              for(let i=0; i<inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(rms * 5, 1));

              const pcmData = createPcmData(inputData);
              const base64Data = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(pcmData.buffer))));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data
                  }
                });
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
                    const id = fc.args['id'] as number;
                    const q = allQuestions.find(q => q.id === id);
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

                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: responses
                  });
                });
             }

             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio) {
               setStatus('speaking');
               
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
               
               const audioBuffer = decodeAudioData(
                 decodeBase64(base64Audio),
                 outputAudioContext
               );
               
               const source = outputAudioContext.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputNode);
               source.start(nextStartTimeRef.current);
               
               nextStartTimeRef.current += audioBuffer.duration;
               
               source.onended = () => {
                 if (outputAudioContext.currentTime >= nextStartTimeRef.current - 0.1) {
                    setStatus('connected');
                 }
               };
             }

             if (message.serverContent?.interrupted) {
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
      alert(t.mic_permission);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col items-center justify-start min-h-[60vh] gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.title}</h2>
        <p className="text-slate-600 max-w-md mx-auto">{t.subtitle}</p>
      </div>

      <div className="relative">
        {/* Status Indicator Ring */}
        <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
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
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
             ) : (
                <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
             )}
          </div>
        </div>

        {isActive && (
          <div className="absolute -bottom-8 left-0 right-0 text-center font-medium text-slate-500 animate-pulse text-sm">
            {status === 'connecting' ? t.status_connecting :
             status === 'speaking' ? t.status_speaking :
             t.status_connected}
          </div>
        )}
      </div>

      <div className="w-full min-h-[200px] flex items-center justify-center">
        {currentQuestion ? (
          <div className="w-full bg-white rounded-xl shadow-lg border border-slate-200 p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
               <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wide">
                  {t.current_question}
               </span>
               <span className="text-slate-400 text-sm font-mono">#{currentQuestion.id}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">{currentQuestion.text}</h3>
            {currentQuestion.image && (
               <div className="mb-4 flex justify-center">
                 <img src={currentQuestion.image} alt={currentQuestion.text} className="max-h-40 object-contain rounded shadow-sm" />
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

      <button
        onClick={isActive ? stopSession : startSession}
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
