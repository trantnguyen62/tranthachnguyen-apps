import { useState, useRef, useEffect, useCallback } from 'react';
import { Modality, LiveServerMessage } from '@google/genai';
import { ProxyGoogleGenAI } from '../utils/proxyClient';
import { createBlob, decode, decodeAudioData } from '../utils/audio';
import { ConnectionState, ChatMessage, LanguageConfig, UserProfile } from '../types';
import { MODEL_NAME } from '../constants';


export const useLiveSession = (activeLanguage: LanguageConfig, userProfile?: UserProfile | null) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [volume, setVolume] = useState({ input: 0, output: 0 });
  const [error, setError] = useState<string | null>(null);

  // Refs for audio context and session management
  const audioContextsRef = useRef<{ input: AudioContext | null; output: AudioContext | null }>({ input: null, output: null });
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const disconnect = useCallback(() => {
    // 1. Close session if possible (wrapper doesn't expose close explicitly on promise, but we stop sending)
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        try {
          session.close();
        } catch (e) {
          console.warn("Error closing session:", e);
        }
      }).catch(() => { });
      sessionPromiseRef.current = null;
    }

    // 2. Stop all audio sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { }
    });
    sourcesRef.current.clear();

    // 3. Stop mic stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // 4. Disconnect ScriptProcessor
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    // 5. Close AudioContexts
    if (audioContextsRef.current.input) {
      audioContextsRef.current.input.close();
      audioContextsRef.current.input = null;
    }
    if (audioContextsRef.current.output) {
      audioContextsRef.current.output.close();
      audioContextsRef.current.output = null;
    }

    setConnectionState(ConnectionState.DISCONNECTED);
    nextStartTimeRef.current = 0;
    setVolume({ input: 0, output: 0 });
  }, []);

  const connect = useCallback(async () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) return;

    setConnectionState(ConnectionState.CONNECTING);
    setError(null);
    setMessages([]);

    try {
      // Diagnostic logging
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isSecure = window.location.protocol === 'https:';
      console.log('Connection diagnostics:', {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        isLocalhost,
        isSecure,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      });

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!isLocalhost && !isSecure) {
          throw new Error(`Microphone access requires HTTPS or localhost. Current: ${window.location.protocol}//${window.location.hostname}. Please access via https://${window.location.hostname}:3000 (accept the certificate warning) or http://localhost:3000 on this computer.`);
        } else {
          throw new Error('Your browser does not support microphone access. Please use a modern browser like Chrome, Firefox, or Safari.');
        }
      }

      // Additional security check - warn if not secure and not localhost
      if (!isLocalhost && !isSecure) {
        throw new Error(`Microphone access requires HTTPS. You're accessing via ${window.location.protocol}. Please use https://${window.location.hostname}:3000 and accept the certificate warning.`);
      }

      // Additional check for older browsers
      if (typeof navigator.mediaDevices.getUserMedia === 'undefined') {
        throw new Error('getUserMedia is not available. Please use a modern browser or access via localhost:3000.');
      }

      // Initialize Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Request Mic Access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      audioContextsRef.current = { input: inputCtx, output: outputCtx };
      streamRef.current = stream;

      // Use proxy client instead of direct API - API key is now secure on server
      const ai = new ProxyGoogleGenAI();

      // Build system instruction with user profile and topic if available
      let systemInstruction = activeLanguage.systemInstruction;
      
      // Add topic context if selected
      if (activeLanguage.selectedTopic && activeLanguage.selectedTopic !== 'free') {
        const topicNames: Record<string, string> = {
          greetings: 'chào hỏi (greetings)',
          family: 'gia đình (family)',
          food: 'đồ ăn, nhà hàng (food)',
          shopping: 'mua sắm (shopping)',
          travel: 'du lịch (travel)',
          work: 'công việc (work)',
          weather: 'thời tiết (weather)',
          hobbies: 'sở thích (hobbies)',
          health: 'sức khỏe (health)',
        };
        const topicName = topicNames[activeLanguage.selectedTopic] || activeLanguage.selectedTopic;
        systemInstruction = systemInstruction + `\n\nCHỦ ĐỀ GỢI Ý: Học viên muốn nói về ${topicName}. Hãy hướng dẫn và luyện tập xoay quanh chủ đề này, nhưng vẫn linh hoạt nếu học viên muốn nói về điều khác.`;
      }
      
      if (userProfile) {
        const profileContext = `
THÔNG TIN HỌC VIÊN:
- Tên: ${userProfile.name}
- Bài học hiện tại: ${userProfile.lessonNumber}
- Số từ đã học: ${userProfile.wordsLearned.length}
- Các từ đã học: ${userProfile.wordsLearned.slice(-20).join(', ') || 'Chưa có'}
- Số buổi học: ${userProfile.totalSessions}
- Lần học gần nhất: ${userProfile.lastSessionDate ? new Date(userProfile.lastSessionDate).toLocaleDateString('vi-VN') : 'Lần đầu'}

Hãy chào ${userProfile.name} và ${userProfile.totalSessions > 0 ? 'tiếp tục bài học từ lần trước' : 'bắt đầu bài học đầu tiên'}.
`;
        systemInstruction = systemInstruction + '\n\n' + profileContext;
      }

      const config = {
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: activeLanguage.voiceName } },
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      };


      console.log("Initiating connection to proxy...");
      
      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            console.log("Connection opened successfully");
            setConnectionState(ConnectionState.CONNECTED);

            // Setup Audio Processing
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);

              // Calculate volume for visualizer
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(prev => ({ ...prev, input: rms * 5 })); // Boost for visibility

              const pcmBlob = createBlob(inputData);
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => session.sendRealtimeInput({ media: pcmBlob }));
              }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentOutputTranscriptionRef.current += text;
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentInputTranscriptionRef.current += text;
            }

            if (message.serverContent?.turnComplete) {
              const userText = currentInputTranscriptionRef.current.trim();
              const modelText = currentOutputTranscriptionRef.current.trim();

              if (userText) {
                setMessages(prev => [...prev, {
                  id: Date.now().toString() + '-user',
                  role: 'user',
                  text: userText,
                  timestamp: new Date(),
                  isFinal: true
                }]);
              }
              if (modelText) {
                setMessages(prev => [...prev, {
                  id: Date.now().toString() + '-model',
                  role: 'model',
                  text: modelText,
                  timestamp: new Date(),
                  isFinal: true
                }]);
              }

              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputCtx) {
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputCtx,
                24000,
                1
              );

              // Schedule playback
              const now = outputCtx.currentTime;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);

              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              const gainNode = outputCtx.createGain();
              // Rudimentary volume check for visualizer during playback
              // Ideally we use an AnalyserNode, but for simplicity here we just toggle state

              // Analyzer for output visualization
              const analyser = outputCtx.createAnalyser();
              analyser.fftSize = 256;
              source.connect(analyser);
              analyser.connect(outputCtx.destination);

              // Update volume state periodically for output
              const volumeInterval = setInterval(() => {
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;
                setVolume(prev => ({ ...prev, output: avg / 255 }));
              }, 50);

              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                clearInterval(volumeInterval);
                setVolume(prev => ({ ...prev, output: 0 }));
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              console.log("Interrupted!");
              sourcesRef.current.forEach(src => {
                try { src.stop(); } catch (e) { }
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setVolume(prev => ({ ...prev, output: 0 }));
            }
          },
          onclose: () => {
            console.log("Connection closed");
            setConnectionState(ConnectionState.DISCONNECTED);
          },
          onerror: (err) => {
            // DEBUGGING: Check server logs for actual error. Common issues:
            // - "API quota exceeded" - Gemini API credits exhausted
            // - WebSocket close code 1011 - Usually quota/billing issue
            // - Origin rejected (403) - Add origin to ALLOWED_ORIGINS in websocket-proxy.js
            console.error("Session error:", err);
            
            // Display actual error message from server if available
            const errorMessage = err?.message || "Connection error occurred. Please try again.";
            setError(errorMessage);
            setConnectionState(ConnectionState.ERROR);
            disconnect();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;
      
      // Handle promise rejection (WebSocket connection failure)
      sessionPromise.catch((err: any) => {
        console.error("Session promise rejected:", err);
        // The onerror callback should have already handled this,
        // but we catch here to prevent unhandled rejection warnings
      });

    } catch (err: any) {
      console.error("Setup error:", err);
      let errorMessage = err.message || "Failed to start session";

      // Provide more helpful error messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Microphone access denied. Please allow microphone access and try again.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      } else if (err.message?.includes('API key')) {
        errorMessage = err.message;
      } else if (err.message?.includes('401') || err.message?.includes('unauthorized')) {
        errorMessage = "Invalid API key. Please check your GEMINI_API_KEY in .env.local";
      }

      setError(errorMessage);
      setConnectionState(ConnectionState.ERROR);
      disconnect();
    }
  }, [activeLanguage, userProfile, connectionState, disconnect]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      disconnect();
    }
  }, [disconnect]);

  const sendInstruction = useCallback((instruction: string) => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        try {
          session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: instruction }] }],
            turnComplete: true
          });
        } catch (e) {
          console.warn("Error sending instruction:", e);
        }
      }).catch(() => { });
    }
  }, []);

  return {
    connectionState,
    connect,
    disconnect,
    sendInstruction,
    messages,
    volume,
    error
  };
};