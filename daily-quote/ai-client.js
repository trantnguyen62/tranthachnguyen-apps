/**
 * Quotidian AI Client - Voice Conversations
 * WebSocket proxy client for Gemini Live Audio API
 * Ported from linguaflow's implementation for vanilla JavaScript
 */

// ===================================
// Configuration
// ===================================

// Use linguaflow's WebSocket proxy for Gemini Live Audio
const PROXY_URL = 'wss://linguaflow.tranthachnguyen.com/ws';

console.log('[QuotidianAI] Proxy URL:', PROXY_URL);

// ===================================
// Audio Utilities
// ===================================

function createAudioBlob(data) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        // Clamp values to [-1, 1] range before converting to PCM16
        const s = Math.max(-1, Math.min(1, data[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
        data: encodeBase64(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

function encodeBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decodeBase64(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data, ctx, sampleRate, numChannels) {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

// ===================================
// WebSocket Session Class
// ===================================

class ProxyLiveSession {
    constructor() {
        this.ws = null;
        this.callbacks = {};
        this.messageQueue = [];
        this.isOpen = false;
    }

    async connect(config) {
        console.log('[QuotidianAI] Connecting to:', PROXY_URL);

        return new Promise((resolve, reject) => {
            this.callbacks = config.callbacks || {};

            try {
                this.ws = new WebSocket(PROXY_URL);
            } catch (err) {
                console.error('[QuotidianAI] Failed to create WebSocket:', err);
                reject(err);
                return;
            }

            this.ws.onopen = () => {
                console.log('[QuotidianAI] WebSocket connected');
                this.isOpen = true;

                // Send connection config to proxy
                const connectMessage = {
                    type: 'connect',
                    config: config.config
                };
                this.ws.send(JSON.stringify(connectMessage));

                // Process any queued messages
                while (this.messageQueue.length > 0) {
                    const msg = this.messageQueue.shift();
                    this.ws.send(JSON.stringify(msg));
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'open':
                            if (this.callbacks.onopen) {
                                this.callbacks.onopen();
                            }
                            resolve(this);
                            break;

                        case 'message':
                            if (this.callbacks.onmessage) {
                                this.callbacks.onmessage(data.data);
                            }
                            break;

                        case 'close':
                            if (this.callbacks.onclose) {
                                this.callbacks.onclose();
                            }
                            this.isOpen = false;
                            break;

                        case 'error':
                            console.error('[QuotidianAI] Server error:', data.error);
                            if (this.callbacks.onerror) {
                                this.callbacks.onerror(new Error(data.error));
                            }
                            reject(new Error(data.error));
                            break;
                    }
                } catch (error) {
                    console.error('[QuotidianAI] Error parsing message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[QuotidianAI] WebSocket error:', error);
                if (this.callbacks.onerror) {
                    this.callbacks.onerror(error);
                }
                reject(error);
            };

            this.ws.onclose = (event) => {
                console.log('[QuotidianAI] WebSocket closed:', event.code, event.reason);
                this.isOpen = false;
                if (this.callbacks.onclose) {
                    this.callbacks.onclose();
                }
            };
        });
    }

    sendRealtimeInput(input) {
        const message = {
            type: 'realtimeInput',
            input: input
        };

        if (this.isOpen && this.ws) {
            this.ws.send(JSON.stringify(message));
        } else {
            this.messageQueue.push(message);
        }
    }

    // Send text context to AI without interrupting voice
    sendTextContext(text) {
        const message = {
            type: 'realtimeInput',
            input: {
                text: text
            }
        };

        if (this.isOpen && this.ws) {
            this.ws.send(JSON.stringify(message));
        } else {
            this.messageQueue.push(message);
        }
    }

    close() {
        if (this.ws) {
            this.ws.send(JSON.stringify({ type: 'disconnect' }));
            this.ws.close();
            this.ws = null;
        }
        this.isOpen = false;
    }
}

// ===================================
// Quotidian Voice AI Controller
// ===================================

class QuotidianAI {
    constructor() {
        this.session = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.messages = [];

        // Audio contexts
        this.inputAudioContext = null;
        this.outputAudioContext = null;
        this.scriptProcessor = null;
        this.mediaStream = null;
        this.audioSources = new Set();
        this.nextStartTime = 0;

        // Transcription buffers
        this.currentInputTranscription = '';
        this.currentOutputTranscription = '';

        // Volume for visualizer
        this.volume = { input: 0, output: 0 };

        // Callbacks
        this.onMessageCallback = null;
        this.onStatusCallback = null;
        this.onErrorCallback = null;
        this.onVolumeCallback = null;
    }

    // Register callbacks
    onMessage(callback) {
        this.onMessageCallback = callback;
    }

    onStatus(callback) {
        this.onStatusCallback = callback;
    }

    onError(callback) {
        this.onErrorCallback = callback;
    }

    onVolume(callback) {
        this.onVolumeCallback = callback;
    }

    // Get system instruction for literary discussion
    getSystemInstruction(quoteContext = null) {
        let instruction = `You are a thoughtful literature companion for Quotidian, a daily literary quotes app. 
Your role is to engage users in meaningful VOICE discussions about quotes, literature, authors, and the deeper themes they explore.

Guidelines:
- Be warm, curious, and intellectually engaging
- Speak conversationally as this is a voice chat
- Encourage deep reflection rather than surface-level explanations
- Share interesting context about authors, historical periods, and literary movements
- Ask thought-provoking questions to spark discussion
- Connect quotes to universal human experiences
- Keep responses conversational and not too long (1-2 paragraphs when speaking)
- Use a gentle, bookish tone that feels like chatting with a well-read friend`;

        if (quoteContext) {
            instruction += `\n\nThe user is currently viewing this quote:
"${quoteContext.text}"
— ${quoteContext.author}, ${quoteContext.book} (${quoteContext.year})

Category: ${quoteContext.category || 'general'}
${quoteContext.story ? `Context story: ${quoteContext.story}` : ''}

Start by acknowledging this quote and offer an insightful observation or question about it.`;
        }

        return instruction;
    }

    async connect(quoteContext = null) {
        if (this.isConnecting || this.isConnected) {
            return;
        }

        this.isConnecting = true;
        this._updateStatus('connecting');

        try {
            // Check for microphone support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support microphone access. Please use a modern browser.');
            }

            // Initialize Audio Contexts
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.inputAudioContext = new AudioContext({ sampleRate: 16000 });
            this.outputAudioContext = new AudioContext({ sampleRate: 24000 });

            // Request Microphone Access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000
                }
            });

            // Create session
            this.session = new ProxyLiveSession();

            const config = {
                config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                    },
                    systemInstruction: { parts: [{ text: this.getSystemInstruction(quoteContext) }] },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {}
                },
                callbacks: {
                    onopen: () => {
                        console.log('[QuotidianAI] Connected - Starting audio');
                        this.isConnected = true;
                        this.isConnecting = false;
                        this._updateStatus('connected');
                        this._setupAudioProcessing();
                    },
                    onmessage: (message) => {
                        this._handleMessage(message);
                    },
                    onclose: () => {
                        console.log('[QuotidianAI] Disconnected');
                        this.isConnected = false;
                        this.isConnecting = false;
                        this._updateStatus('disconnected');
                    },
                    onerror: (error) => {
                        console.error('[QuotidianAI] Error:', error);
                        this.isConnected = false;
                        this.isConnecting = false;
                        this._updateStatus('error');
                        if (this.onErrorCallback) {
                            this.onErrorCallback(error.message || 'Connection error');
                        }
                    }
                }
            };

            await this.session.connect(config);

        } catch (error) {
            console.error('[QuotidianAI] Connection failed:', error);
            this.isConnecting = false;
            this._updateStatus('error');

            let errorMessage = error.message || 'Failed to connect';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Microphone access denied. Please allow microphone access.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No microphone found. Please connect a microphone.';
            }

            if (this.onErrorCallback) {
                this.onErrorCallback(errorMessage);
            }
        }
    }

    _setupAudioProcessing() {
        if (!this.inputAudioContext || !this.mediaStream) return;

        const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
        this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

        this.scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);

            // Calculate volume for visualizer
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sum / inputData.length);
            this.volume.input = rms * 5;

            if (this.onVolumeCallback) {
                this.onVolumeCallback(this.volume);
            }

            // Send audio to AI
            const pcmBlob = createAudioBlob(inputData);
            if (this.session && this.session.isOpen) {
                this.session.sendRealtimeInput({ media: pcmBlob });
            }
        };

        source.connect(this.scriptProcessor);
        this.scriptProcessor.connect(this.inputAudioContext.destination);
    }

    async _handleMessage(message) {
        // Handle Transcriptions
        if (message.serverContent?.outputTranscription) {
            this.currentOutputTranscription += message.serverContent.outputTranscription.text;
        } else if (message.serverContent?.inputTranscription) {
            this.currentInputTranscription += message.serverContent.inputTranscription.text;
        }

        // When turn is complete, finalize messages
        if (message.serverContent?.turnComplete) {
            const userText = this.currentInputTranscription.trim();
            const modelText = this.currentOutputTranscription.trim();

            if (userText) {
                const userMessage = {
                    role: 'user',
                    text: userText,
                    timestamp: new Date()
                };
                this.messages.push(userMessage);
                if (this.onMessageCallback) {
                    this.onMessageCallback(userMessage);
                }
            }

            if (modelText) {
                const aiMessage = {
                    role: 'model',
                    text: modelText,
                    timestamp: new Date()
                };
                this.messages.push(aiMessage);
                if (this.onMessageCallback) {
                    this.onMessageCallback(aiMessage);
                }
            }

            this.currentInputTranscription = '';
            this.currentOutputTranscription = '';
        }

        // Handle Audio Output
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio && this.outputAudioContext) {
            try {
                const audioBuffer = await decodeAudioData(
                    decodeBase64(base64Audio),
                    this.outputAudioContext,
                    24000,
                    1
                );

                // Schedule playback
                const now = this.outputAudioContext.currentTime;
                this.nextStartTime = Math.max(this.nextStartTime, now);

                const source = this.outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;

                // Analyzer for output visualization
                const analyser = this.outputAudioContext.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyser.connect(this.outputAudioContext.destination);

                // Update volume state periodically
                const volumeInterval = setInterval(() => {
                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                    const avg = sum / dataArray.length;
                    this.volume.output = avg / 255;

                    if (this.onVolumeCallback) {
                        this.onVolumeCallback(this.volume);
                    }
                }, 50);

                source.addEventListener('ended', () => {
                    this.audioSources.delete(source);
                    clearInterval(volumeInterval);
                    this.volume.output = 0;
                    if (this.onVolumeCallback) {
                        this.onVolumeCallback(this.volume);
                    }
                });

                source.start(this.nextStartTime);
                this.nextStartTime += audioBuffer.duration;
                this.audioSources.add(source);
            } catch (err) {
                console.error('[QuotidianAI] Error playing audio:', err);
            }
        }

        // Handle Interruption
        if (message.serverContent?.interrupted) {
            console.log('[QuotidianAI] Interrupted');
            this.audioSources.forEach(src => {
                try { src.stop(); } catch (e) { }
            });
            this.audioSources.clear();
            this.nextStartTime = 0;
            this.volume.output = 0;
            if (this.onVolumeCallback) {
                this.onVolumeCallback(this.volume);
            }
        }
    }

    disconnect() {
        // Close session
        if (this.session) {
            this.session.close();
            this.session = null;
        }

        // Stop all audio sources
        this.audioSources.forEach(source => {
            try { source.stop(); } catch (e) { }
        });
        this.audioSources.clear();

        // Stop microphone
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        // Disconnect script processor
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
        }

        // Close audio contexts
        if (this.inputAudioContext) {
            this.inputAudioContext.close();
            this.inputAudioContext = null;
        }
        if (this.outputAudioContext) {
            this.outputAudioContext.close();
            this.outputAudioContext = null;
        }

        this.isConnected = false;
        this.isConnecting = false;
        this.nextStartTime = 0;
        this.volume = { input: 0, output: 0 };

        this._updateStatus('disconnected');
    }

    _updateStatus(status) {
        if (this.onStatusCallback) {
            this.onStatusCallback(status);
        }
    }

    getMessages() {
        return [...this.messages];
    }

    clearMessages() {
        this.messages = [];
    }

    // Notify the AI about a quote change without interrupting the conversation
    updateQuoteContext(newQuote) {
        if (!this.isConnected || !this.session) {
            return false;
        }

        // Build a brief context message for the AI
        const contextMessage = `[Context Update: The user just navigated to a new quote. They are now viewing: "${newQuote.text}" — ${newQuote.author}, ${newQuote.book} (${newQuote.year}). Category: ${newQuote.category || 'general'}. ${newQuote.story ? `Story: ${newQuote.story}` : ''} Please acknowledge this new quote naturally if relevant to the conversation, or wait for the user to bring it up.]`;

        // Send as text input so the AI receives it seamlessly
        this.session.sendTextContext(contextMessage);

        console.log('[QuotidianAI] Sent quote context update to AI');
        return true;
    }
}

// ===================================
// Global Instance
// ===================================

window.QuotidianAI = QuotidianAI;
console.log('🎙️ Quotidian Voice AI Client loaded');
