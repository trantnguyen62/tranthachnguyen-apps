import { useState, useRef, useEffect, useCallback } from 'react';
import { Modality, LiveServerMessage } from '@google/genai';
import { ProxyGoogleGenAI, ProxyLiveSession } from '../utils/proxyClient';
import { createBlob, decode, decodeAudioData } from '../utils/audio';
import { ConnectionState, ChatMessage, StudyContext } from '../types';
import { MODEL_NAME, SYSTEM_INSTRUCTION } from '../constants';

export const useLiveSession = (studyContext: StudyContext) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [volume, setVolume] = useState({ input: 0, output: 0 });
  const [error, setError] = useState<string | null>(null);

  const audioContextsRef = useRef<{ input: AudioContext | null; output: AudioContext | null }>({ input: null, output: null });
  const sessionPromiseRef = useRef<Promise<ProxyLiveSession> | null>(null);
  const sessionRef = useRef<ProxyLiveSession | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Use ref for study context to avoid recreating connect callback
  const studyContextRef = useRef(studyContext);
  studyContextRef.current = studyContext;

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.warn("Error closing session:", e);
      }
      sessionRef.current = null;
    }
    sessionPromiseRef.current = null;

    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { }
    });
    sourcesRef.current.clear();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

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

  // Send code context to the AI
  const sendCodeContext = useCallback(async (context: string) => {
    if (sessionRef.current) {
      try {
        await sessionRef.current.sendText(context);
      } catch (e) {
        console.error("Error sending code context:", e);
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) return;

    setConnectionState(ConnectionState.CONNECTING);
    setError(null);
    setMessages([]);

    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isSecure = window.location.protocol === 'https:';

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!isLocalhost && !isSecure) {
          throw new Error(`Microphone access requires HTTPS or localhost.`);
        } else {
          throw new Error('Your browser does not support microphone access.');
        }
      }

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

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

      const ai = new ProxyGoogleGenAI();

      // Build system instruction with current code context
      const ctx = studyContextRef.current;
      let systemInstruction = SYSTEM_INSTRUCTION;
      if (ctx.currentFile) {
        systemInstruction += `\n\nCURRENT FILE: ${ctx.currentFile.path}\nLANGUAGE: ${ctx.currentFile.language || 'unknown'}`;
        if (ctx.currentFile.content) {
          systemInstruction += `\n\nFILE CONTENT:\n\`\`\`${ctx.currentFile.language || ''}\n${ctx.currentFile.content}\n\`\`\``;
        }
      }
      if (ctx.currentProject) {
        systemInstruction += `\n\nCURRENT PROJECT: ${ctx.currentProject.name}`;
        if (ctx.currentProject.description) {
          systemInstruction += ` - ${ctx.currentProject.description}`;
        }
      }
      if (ctx.selectedCode) {
        systemInstruction += `\n\nSELECTED CODE:\n\`\`\`\n${ctx.selectedCode}\n\`\`\``;
      }

      const config = {
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
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

            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);

              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(prev => ({ ...prev, input: rms * 5 }));

              const pcmBlob = createBlob(inputData);
              if (sessionRef.current) {
                sessionRef.current.sendRealtimeInput({ media: pcmBlob });
              }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
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

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputCtx) {
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputCtx,
                24000,
                1
              );

              const now = outputCtx.currentTime;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);

              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;

              const analyser = outputCtx.createAnalyser();
              analyser.fftSize = 256;
              source.connect(analyser);
              analyser.connect(outputCtx.destination);

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
          onerror: (err: any) => {
            console.error("Session error:", err);
            const errorMessage = err?.message || "Connection error occurred. Please try again.";
            setError(errorMessage);
            setConnectionState(ConnectionState.ERROR);
            disconnect();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;
      
      sessionPromise.then(session => {
        sessionRef.current = session;
      }).catch((err: any) => {
        console.error("Session promise rejected:", err);
      });

    } catch (err: any) {
      console.error("Setup error:", err);
      let errorMessage = err.message || "Failed to start session";

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Microphone access denied. Please allow microphone access and try again.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      }

      setError(errorMessage);
      setConnectionState(ConnectionState.ERROR);
      disconnect();
    }
  }, [connectionState, disconnect]);

  useEffect(() => {
    return () => {
      disconnect();
    }
  }, [disconnect]);

  return {
    connectionState,
    connect,
    disconnect,
    messages,
    volume,
    error,
    sendCodeContext
  };
};
