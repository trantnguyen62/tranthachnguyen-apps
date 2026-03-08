import { useEffect, useRef, memo } from 'react';
import { ChatMessage } from '../types';
import { User, Bot } from 'lucide-react';

interface TranscriptProps {
  messages: ChatMessage[];
}

const Transcript = memo<TranscriptProps>(({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      const raf = requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-5 px-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <Bot className="w-7 h-7 text-emerald-500/50" />
          </div>
          <div>
            <p className="text-slate-300 font-semibold mb-1">AI Tutor ready</p>
            <p className="text-slate-500 text-xs">Start a voice session to ask questions about your code</p>
          </div>
          <div className="text-left space-y-2.5 text-xs text-slate-500 bg-slate-800/60 rounded-lg p-3">
            <p className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs flex-shrink-0">1</span>
              Open a file from the sidebar
            </p>
            <p className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs flex-shrink-0">2</span>
              Click <span className="text-emerald-400 font-medium mx-1">Start Voice Session</span>
            </p>
            <p className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs flex-shrink-0">3</span>
              Speak your question
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="log"
      aria-label="Conversation transcript"
      aria-live="polite"
      aria-relevant="additions"
      className="flex-1 overflow-y-auto space-y-4 pr-2"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.role === 'model' && (
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
          )}
          <div
            aria-label={`${message.role === 'user' ? 'You' : 'AI Tutor'}: ${message.text}`}
            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              message.role === 'user'
                ? 'bg-blue-500/20 text-blue-100'
                : 'bg-slate-700/50 text-slate-200'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
            {message.role === 'model' && !message.isFinal && (
              <span className="inline-flex items-center gap-0.5 mt-1" aria-label="AI is responding">
                <span className="w-1 h-1 rounded-full bg-emerald-400/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-emerald-400/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-emerald-400/70 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </div>
          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <User className="w-4 h-4 text-blue-400" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

Transcript.displayName = 'Transcript';

export default Transcript;
