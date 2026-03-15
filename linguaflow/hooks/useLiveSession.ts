import { useState, useRef, useEffect, useCallback } from 'react';
import { Modality, LiveServerMessage } from '@google/genai';
import { ProxyGoogleGenAI } from '../utils/proxyClient';
import { createBlob, decode, decodeAudioData } from '../utils/audio';
import { ConnectionState, ChatMessage, LanguageConfig, UserProfile } from '../types';
import { MODEL_NAME, TOPIC_NAMES } from '../constants';


/**
 * Custom hook that manages a live audio conversation session with the AI tutor.
 *
 * Handles the full session lifecycle:
 *   1. Requests microphone access and initialises two AudioContexts — input at
 *      16 kHz (Gemini requirement) and output at 24 kHz (model response rate).
 *   2. Opens a WebSocket connection through the local proxy to the Gemini Live
 *      Audio API, authenticating with the server-side API key.
 *   3. Streams PCM16 audio from the microphone to Gemini via a ScriptProcessor.
 *   4. Receives audio chunks from Gemini, decodes them, and schedules gap-free
 *      playback using an AudioBufferSourceNode queue.
 *   5. Accumulates rolling transcription text and flushes it to `messages` on
 *      each `turnComplete` event from the server.
 *   6. Polls the AnalyserNode at 150 ms intervals to derive normalised [0, 1]
 *      volume levels for both input (RMS) and output (mean FFT magnitude).
 *   7. Tears down all Web Audio and WebSocket resources on disconnect or unmount.
 *
 * @param activeLanguage - Language configuration including voice, system prompt,
 *   optional difficulty level, and optional conversation topic.
 * @param userProfile - Optional learner profile injected into the system prompt
 *   to personalise greetings and track vocabulary progress.
 *
 * @returns
 *   - `connectionState` – current lifecycle state (DISCONNECTED / CONNECTING / CONNECTED / ERROR).
 *   - `connect` – starts a new session; no-op if already connected.
 *   - `disconnect` – gracefully stops all audio, clears the session, and resets state.
 *   - `sendInstruction` – sends an out-of-band text turn to the live session
 *     (used to inject mid-session instructions without interrupting audio).
 *   - `messages` – ordered array of finalised transcription turns (user + model).
 *   - `volume` – live `{ input, output }` volume levels for the visualiser.
 *   - `error` – human-readable error string, or `null` when there is no error.
 */
export const useLiveSession = (activeLanguage: LanguageConfig, userProfile?: UserProfile | null) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio context and session management
  const audioContextsRef = useRef<{ input: AudioContext | null; output: AudioContext | null }>({ input: null, output: null });
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const messageCounterRef = useRef(0);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const inputVolumeRef = useRef<number>(0);

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

    // 4. Disconnect analyser
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    // 5. Disconnect ScriptProcessor
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    // 6. Close AudioContexts
    if (audioContextsRef.current.input) {
      audioContextsRef.current.input.close();
      audioContextsRef.current.input = null;
    }
    if (audioContextsRef.current.output) {
      audioContextsRef.current.output.close();
      audioContextsRef.current.output = null;
    }

    inputVolumeRef.current = 0;
    setConnectionState(ConnectionState.DISCONNECTED);
    nextStartTimeRef.current = 0;
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
        const topicName = TOPIC_NAMES[activeLanguage.selectedTopic] || activeLanguage.selectedTopic;
        systemInstruction = systemInstruction + `\n\nCHỦ ĐỀ GỢI Ý: Học viên muốn nói về ${topicName}. Hãy hướng dẫn và luyện tập xoay quanh chủ đề này, nhưng vẫn linh hoạt nếu học viên muốn nói về điều khác.`;
      }
      
      if (userProfile) {
        // Strip newlines and prompt-injection patterns from user-controlled fields
        const safeName = userProfile.name.replace(/[\r\n\t]/g, ' ').replace(/[<>]/g, '').slice(0, 100);
        const safeWords = userProfile.wordsLearned
          .slice(-20)
          .map(w => w.replace(/[\r\n,]/g, ' ').slice(0, 50))
          .join(', ') || 'Chưa có';
        const profileContext = `
THÔNG TIN HỌC VIÊN:
- Tên: ${safeName}
- Bài học hiện tại: ${userProfile.lessonNumber}
- Số từ đã học: ${userProfile.wordsLearned.length}
- Các từ đã học: ${safeWords}
- Số buổi học: ${userProfile.totalSessions}
- Lần học gần nhất: ${userProfile.lastSessionDate ? new Date(userProfile.lastSessionDate).toLocaleDateString('vi-VN') : 'Lần đầu'}

Hãy chào ${safeName} và ${userProfile.totalSessions > 0 ? 'tiếp tục bài học từ lần trước' : 'bắt đầu bài học đầu tiên'}.
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

            // Setup shared analyser for output volume — sampled by Visualizer's RAF
            // loop directly, avoiding React state updates on every poll tick.
            const analyser = outputCtx.createAnalyser();
            analyser.fftSize = 256;
            analyser.connect(outputCtx.destination);
            analyserRef.current = analyser;

            // Setup Audio Processing
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);

              // Update input volume ref (read by the combined interval, avoids extra state update)
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              inputVolumeRef.current = Math.min(rms * 5, 1); // Boost for visibility, clamped to [0,1]

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
                const id = `${++messageCounterRef.current}-user`;
                setMessages(prev => [...prev.slice(-99), {
                  id,
                  role: 'user',
                  text: userText,
                  timestamp: new Date(),
                  isFinal: true
                }]);
              }
              if (modelText) {
                const id = `${++messageCounterRef.current}-model`;
                setMessages(prev => [...prev.slice(-99), {
                  id,
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

              // Route through the shared analyser (created once in onopen)
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

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              console.log("Interrupted!");
              sourcesRef.current.forEach(src => {
                try { src.stop(); } catch (e) { }
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Connection closed");
            disconnect();
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
    analyserRef,
    inputVolumeRef,
    error
  };
};