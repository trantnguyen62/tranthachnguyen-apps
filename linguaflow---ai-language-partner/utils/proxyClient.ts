// WebSocket proxy client that mimics the GoogleGenAI Live API interface
// but connects to our secure backend proxy instead

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

export class ProxyLiveSession {
  private ws: WebSocket | null = null;
  private callbacks: any = {};
  private messageQueue: any[] = [];
  private isOpen = false;

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

  async sendRealtimeInput(input: any): Promise<void> {
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

  close(): void {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'disconnect' }));
      this.ws.close();
      this.ws = null;
    }
    this.isOpen = false;
  }
}

// Proxy client that mimics GoogleGenAI interface
export class ProxyGoogleGenAI {
  live = {
    connect: async (config: any) => {
      const session = new ProxyLiveSession();
      await session.connect(config);
      return session;
    }
  };
}
