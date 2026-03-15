// Custom hook that manages a Gemini Live voice session.
//
// Audio pipeline:
//   Microphone → ScriptProcessorNode (4096-sample chunks, 16 kHz)
//     → Float32→Int16 PCM (createBlob) → proxy → Gemini
//   Gemini → PCM Int16 base64 (24 kHz) → AudioBuffer
//     → AudioBufferSourceNode → shared AnalyserNode → speakers
//
// Transcription:
//   Gemini streams partial transcription tokens for both user speech
//   (inputTranscription) and model speech (outputTranscription).
//   Tokens are accumulated in refs and committed to React state only when
//   a turnComplete event signals that a conversational turn has finished.
//   This avoids many small re-renders and keeps messages atomic.
//
// studyContext is kept in a ref so that the connect callback does not need to
// be recreated every time the user selects a new file or highlights code.

import { useState, useRef, useEffect, useCallback } from 'react';
import { Modality, LiveServerMessage } from '@google/genai';
import { ProxyGoogleGenAI, ProxyLiveSession } from '../utils/proxyClient';
import { createBlob, decode, decodeAudioData } from '../utils/audio';
import { ConnectionState, ChatMessage, StudyContext } from '../types';
import { MODEL_NAME, SYSTEM_INSTRUCTION } from '../constants';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const MAX_FILE_CHARS = 12000;
const MAX_MESSAGES = 200;

let messageCounter = 0;
const nextMessageId = (role: string) => `${++messageCounter}-${role}`;

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
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastInputVolumeRef = useRef(0);
  const lastOutputVolumeRef = useRef(0);
  
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
      try { source.stop(); } catch (e) { console.warn('Error stopping audio source:', e); }
    });
    sourcesRef.current.clear();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }

    analyserRef.current = null;

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
    lastInputVolumeRef.current = 0;
    setVolume({ input: 0, output: 0 });
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

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
      const inputCtx = new AudioContextImpl({ sampleRate: 16000 });
      const outputCtx = new AudioContextImpl({ sampleRate: 24000 });

      audioContextsRef.current = { input: inputCtx, output: outputCtx };
      streamRef.current = stream;

      const ai = new ProxyGoogleGenAI();

      // Build system instruction with current code context
      const ctx = studyContextRef.current;
      let systemInstruction = SYSTEM_INSTRUCTION;
      if (ctx.currentFile) {
        systemInstruction += `\n\nCURRENT FILE: ${ctx.currentFile.path}\nLANGUAGE: ${ctx.currentFile.language || 'unknown'}`;
        if (ctx.currentFile.content) {
          const content = ctx.currentFile.content.length > MAX_FILE_CHARS
            ? ctx.currentFile.content.slice(0, MAX_FILE_CHARS) + '\n... [truncated]'
            : ctx.currentFile.content;
          systemInstruction += `\n\nFILE CONTENT:\n\`\`\`${ctx.currentFile.language || ''}\n${content}\n\`\`\``;
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
              const newInputVolume = rms * 5;
              // Skip state update if change is negligible to avoid unnecessary re-renders
              if (Math.abs(newInputVolume - lastInputVolumeRef.current) > 0.01) {
                lastInputVolumeRef.current = newInputVolume;
                setVolume(prev => ({ ...prev, input: newInputVolume }));
              }

              const pcmBlob = createBlob(inputData);
              if (sessionRef.current) {
                sessionRef.current.sendRealtimeInput({ media: pcmBlob });
              }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);

            // Single shared analyser for output volume — avoids creating one per audio chunk
            const analyser = outputCtx.createAnalyser();
            analyser.fftSize = 256;
            analyser.connect(outputCtx.destination);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            volumeIntervalRef.current = setInterval(() => {
              if (sourcesRef.current.size > 0) {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const newOutputVolume = (sum / dataArray.length) / 255;
                if (Math.abs(newOutputVolume - lastOutputVolumeRef.current) > 0.01) {
                  lastOutputVolumeRef.current = newOutputVolume;
                  setVolume(prev => ({ ...prev, output: newOutputVolume }));
                }
              } else if (lastOutputVolumeRef.current > 0) {
                lastOutputVolumeRef.current = 0;
                setVolume(prev => ({ ...prev, output: 0 }));
              }
            }, 100);
          },
          onmessage: async (message: LiveServerMessage) => {
            // 1. Accumulate streaming transcription tokens (many partial tokens per turn)
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              if (text) currentOutputTranscriptionRef.current += text;
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text) currentInputTranscriptionRef.current += text;
            }

            // 2. Commit accumulated text to React state once the turn is complete.
            //    Batching until turnComplete avoids many small re-renders mid-sentence.
            if (message.serverContent?.turnComplete) {
              const userText = currentInputTranscriptionRef.current.trim();
              const modelText = currentOutputTranscriptionRef.current.trim();

              if (userText || modelText) {
                setMessages(prev => {
                  const next = [...prev];
                  if (userText) next.push({ id: nextMessageId('user'), role: 'user' as const, text: userText, timestamp: new Date(), isFinal: true });
                  if (modelText) next.push({ id: nextMessageId('model'), role: 'model' as const, text: modelText, timestamp: new Date(), isFinal: true });
                  return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
                });
              }

              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
            }

            // 3. Schedule audio chunk for gapless playback.
            //    nextStartTimeRef chains each chunk so they play back-to-back without
            //    gaps even when network delivery is slightly uneven.
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

              // Connect to the shared analyser created in onopen
              if (analyserRef.current) {
                source.connect(analyserRef.current);
              } else {
                source.connect(outputCtx.destination);
              }

              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // 4. Barge-in / interrupt: user spoke over the model. Stop all queued audio
            //    immediately and reset the playback timeline to the present.
            if (message.serverContent?.interrupted) {
              console.log("Interrupted!");
              sourcesRef.current.forEach(src => {
                try { src.stop(); } catch (e) { console.warn('Error stopping audio source:', e); }
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
          onerror: (err: unknown) => {
            console.error("Session error:", err);
            const errorMessage = err instanceof Error ? err.message : "Connection error occurred. Please try again.";
            setError(errorMessage);
            setConnectionState(ConnectionState.ERROR);
            disconnect();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

      sessionPromise.then(session => {
        // Only assign if this promise is still the active one (guard against disconnect race)
        if (sessionPromiseRef.current === sessionPromise) {
          sessionRef.current = session;
        }
      }).catch((err: unknown) => {
        console.error("Session promise rejected:", err);
        if (sessionPromiseRef.current === sessionPromise) {
          const errorMessage = err instanceof Error ? err.message : "Failed to establish session";
          setError(errorMessage);
          setConnectionState(ConnectionState.ERROR);
          disconnect();
        }
      });

    } catch (err: unknown) {
      console.error("Setup error:", err);
      let errorMessage = err instanceof Error ? err.message : "Failed to start session";

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = "Microphone access denied. Please allow microphone access and try again.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = "No microphone found. Please connect a microphone and try again.";
        }
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
  };
};
