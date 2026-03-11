// WebSocket proxy client for the Gemini Live API.
//
// The browser cannot connect directly to Gemini Live because that would expose
// the API key in client-side code. This client connects to the local WebSocket
// proxy server (websocket-proxy.js), which holds the key and forwards messages.
//
// Two-phase connect protocol:
//   1. Open WebSocket to proxy → send { type: "connect", config }
//   2. Proxy replies { type: "open" } once Gemini is ready → resolve connect()
//
// Messages sent before the connection is open are queued and flushed in order
// once the WebSocket handshake completes.

interface SessionCallbacks {
  onopen?: () => void;
  onmessage?: (data: unknown) => void;
  onclose?: () => void;
  onerror?: (error: Error | Event) => void;
}

interface QueuedMessage {
  type: string;
  [key: string]: unknown;
}

function getProxyUrl(): string {
  const configuredUrl = import.meta.env.VITE_PROXY_URL || 'ws://localhost:3005';
  
  if (configuredUrl.startsWith('ws://') || configuredUrl.startsWith('wss://')) {
    return configuredUrl;
  }
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}${configuredUrl}`;
}

const PROXY_URL = getProxyUrl();

console.log('[ProxyClient] Configured PROXY_URL:', PROXY_URL);

export class ProxyLiveSession {
  private ws: WebSocket | null = null;
  private callbacks: SessionCallbacks = {};
  private messageQueue: QueuedMessage[] = [];
  private isOpen = false;

  async connect(config: { config: unknown; callbacks?: SessionCallbacks }): Promise<void> {
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
        
        const connectMessage = {
          type: 'connect',
          config: config.config
        };
        console.log('[ProxyClient] Sending connect message');
        this.ws!.send(JSON.stringify(connectMessage));
        
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
        if (this.callbacks.onerror) {
          this.callbacks.onerror(error);
        }
        reject(error);
      };
      
      this.ws.onclose = (event) => {
        console.log('[ProxyClient] WebSocket closed, code:', event.code);
        this.isOpen = false;
        if (this.callbacks.onclose) {
          this.callbacks.onclose();
        }
      };
    });
  }

  async sendRealtimeInput(input: unknown): Promise<void> {
    const message: QueuedMessage = {
      type: 'realtimeInput',
      input,
    };
    
    if (this.isOpen && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  async sendText(text: string): Promise<void> {
    const message: QueuedMessage = {
      type: 'sendText',
      text,
    };
    
    if (this.isOpen && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  close(): void {
    if (this.ws) {
      try {
        this.ws.send(JSON.stringify({ type: 'disconnect' }));
      } catch (e) {
        // WebSocket may already be closing
      }
      this.ws.close();
      this.ws = null;
    }
    this.isOpen = false;
  }
}

export class ProxyGoogleGenAI {
  live = {
    connect: async (config: { config: unknown; callbacks?: SessionCallbacks }) => {
      const session = new ProxyLiveSession();
      await session.connect(config);
      return session;
    }
  };
}
