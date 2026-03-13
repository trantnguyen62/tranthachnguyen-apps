/**
 * WebSocket proxy client that mimics the GoogleGenAI Live API interface
 * but routes all traffic through the secure local backend proxy instead of
 * calling the Gemini API directly from the browser.
 *
 * Architecture:
 *   Browser (this file) ──WS──▶ websocket-proxy.js (port 3001)
 *                                       │
 *                                       ▼ Gemini Live API
 *                                (API key stays on server)
 *
 * WebSocket message protocol (browser → proxy):
 *   { type: 'connect',       config: <LiveConnectConfig>  }   // Opens Gemini session
 *   { type: 'realtimeInput', input:  <RealtimeInput>      }   // Sends audio chunk
 *   { type: 'clientContent', content: <ClientContent>     }   // Sends text turn
 *   { type: 'disconnect'                                   }   // Closes Gemini session
 *
 * WebSocket message protocol (proxy → browser):
 *   { type: 'open'                                         }   // Gemini session ready
 *   { type: 'message',  data: <LiveServerMessage>         }   // AI audio/text chunk
 *   { type: 'close'                                        }   // Session ended
 *   { type: 'error',    error: string                     }   // Error from proxy
 *
 * Drop-in replacement: ProxyGoogleGenAI exposes the same `ai.live.connect()`
 * interface as the real GoogleGenAI SDK so useLiveSession.ts requires no changes.
 */

// Build WebSocket URL - handle both absolute and relative paths
function getProxyUrl(): string {
  const configuredUrl = import.meta.env.VITE_PROXY_URL || 'ws://localhost:3001';
  
  // If it's already an absolute WebSocket URL, use as-is
  if (configuredUrl.startsWith('ws://') || configuredUrl.startsWith('wss://')) {
    return configuredUrl;
  }
  
  // If it's a relative path, construct absolute URL from current location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}${configuredUrl}`;
}

const PROXY_URL = getProxyUrl();

console.log('[ProxyClient] Configured PROXY_URL:', PROXY_URL);

/**
 * Manages a single live audio session via the backend proxy.
 *
 * The connection lifecycle is:
 *   1. `connect(config)` opens the WebSocket to the proxy and sends a
 *      `connect` message with the Gemini session config (model, voice, etc.).
 *   2. The proxy forwards the config to Gemini and replies with `{ type: 'open' }`
 *      once the Gemini session is ready — at which point the Promise resolves.
 *   3. Callers stream audio with `sendRealtimeInput()` and receive AI responses
 *      via the `onmessage` callback passed in `config.callbacks`.
 *   4. `close()` sends a `disconnect` message and tears down the WebSocket.
 */
export class ProxyLiveSession {
  private ws: WebSocket | null = null;
  private callbacks: any = {};
  private messageQueue: any[] = [];
  /**
   * Maximum number of outbound messages buffered before the WebSocket opens.
   * If the queue fills up, new messages are silently dropped to avoid runaway
   * memory growth in cases where the proxy takes a long time to connect.
   */
  private readonly MAX_QUEUE_SIZE = 50;
  private isOpen = false;

  /**
   * Opens the WebSocket connection to the proxy and initiates a Gemini session.
   *
   * Resolves when the proxy confirms the Gemini session is ready (`type: 'open'`).
   * Rejects if the WebSocket fails to connect or the proxy returns an error.
   *
   * @param config - Session configuration, including:
   *   - `config.config`     Gemini LiveConnectConfig (model, voice, system prompt, …)
   *   - `config.callbacks`  Event handlers: `onopen`, `onmessage`, `onclose`, `onerror`
   */
  async connect(config: any): Promise<void> {
    console.log('[ProxyClient] Attempting to connect to:', PROXY_URL);
    return new Promise((resolve, reject) => {
      this.callbacks = config.callbacks || {};
      
      try {
        this.ws = new WebSocket(PROXY_URL);
      } catch (err) {
        console.error('[ProxyClient] Failed to create WebSocket:', err);
        reject(err);
        return;
      }
      
      this.ws.onopen = () => {
        console.log('[ProxyClient] WebSocket connected to proxy server');
        this.isOpen = true;
        
        // Send connection request with config to proxy
        const connectMessage = {
          type: 'connect',
          config: config.config
        };
        console.log('[ProxyClient] Sending connect message:', JSON.stringify(connectMessage).substring(0, 200));
        this.ws!.send(JSON.stringify(connectMessage));
        
        // Process any queued messages
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          this.ws!.send(JSON.stringify(msg));
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
              resolve();
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
              // DEBUGGING: Common errors include:
              // - "API quota exceeded" - Check Gemini billing at https://aistudio.google.com/
              // - "Service configuration error" - API key not set on server
              // - "Unable to connect to AI service" - Network or API issues
              console.error('[ProxyClient] Server error:', data.error);
              if (this.callbacks.onerror) {
                this.callbacks.onerror(new Error(data.error));
              }
              reject(new Error(data.error));
              break;
          }
        } catch (error) {
          console.error('Error parsing proxy message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[ProxyClient] WebSocket error:', error);
        console.error('[ProxyClient] WebSocket readyState:', this.ws?.readyState);
        if (this.callbacks.onerror) {
          this.callbacks.onerror(error);
        }
        reject(error);
      };
      
      this.ws.onclose = (event) => {
        console.log('[ProxyClient] WebSocket closed, code:', event.code, 'reason:', event.reason || 'none');
        this.isOpen = false;
        if (this.callbacks.onclose) {
          this.callbacks.onclose();
        }
      };
    });
  }

  /**
   * Sends a real-time audio chunk to the proxy for forwarding to Gemini.
   *
   * If the WebSocket is not yet open, the message is buffered in `messageQueue`
   * (up to `MAX_QUEUE_SIZE` entries) and flushed once the connection opens.
   *
   * @param input - Typically `{ media: Blob }` where `Blob` contains PCM16 audio
   *   at 16 kHz — see `utils/audio.ts createBlob()`.
   */
  async sendRealtimeInput(input: any): Promise<void> {
    const message = {
      type: 'realtimeInput',
      input: input
    };

    if (this.isOpen && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else if (this.messageQueue.length < this.MAX_QUEUE_SIZE) {
      this.messageQueue.push(message);
    }
  }

  /**
   * Sends a text turn to the live session (e.g. a mid-session instruction).
   *
   * Unlike `sendRealtimeInput`, this sends structured content rather than raw
   * audio, allowing the caller to inject text prompts without interrupting the
   * audio stream. Also buffered if the connection is not yet open.
   *
   * @param content - `{ turns: Turn[], turnComplete: boolean }` following the
   *   Gemini `clientContent` message format.
   */
  sendClientContent(content: any): void {
    const message = {
      type: 'clientContent',
      content: content
    };

    if (this.isOpen && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else if (this.messageQueue.length < this.MAX_QUEUE_SIZE) {
      this.messageQueue.push(message);
    }
  }

  /**
   * Gracefully closes the session by notifying the proxy before tearing down
   * the WebSocket. The proxy will close the Gemini session on its end.
   */
  close(): void {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'disconnect' }));
      this.ws.close();
      this.ws = null;
    }
    this.isOpen = false;
  }
}

/**
 * Drop-in replacement for the `GoogleGenAI` SDK class.
 *
 * Exposes the same `ai.live.connect(config)` interface so that `useLiveSession.ts`
 * can be written against the standard SDK shape while transparently routing all
 * traffic through the secure backend proxy.
 */
export class ProxyGoogleGenAI {
  live = {
    connect: async (config: any) => {
      const session = new ProxyLiveSession();
      await session.connect(config);
      return session;
    }
  };
}
