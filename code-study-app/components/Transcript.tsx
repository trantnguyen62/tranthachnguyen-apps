import { useEffect, useRef, memo } from 'react';
import { ChatMessage } from '../types';
import { User, Bot } from 'lucide-react';

interface TranscriptProps {
  messages: ChatMessage[];
}

const Transcript = memo<TranscriptProps>(({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <Bot className="w-10 h-10 mx-auto text-emerald-500/30" />
          <p className="text-slate-400 font-medium">No conversation yet</p>
          <div className="text-left space-y-2 text-sm text-slate-500">
            <p className="flex items-start gap-2"><span className="text-emerald-500/60 font-bold">1.</span> Select a project and open a file</p>
            <p className="flex items-start gap-2"><span className="text-emerald-500/60 font-bold">2.</span> Click <span className="text-emerald-400">Start Voice Session</span></p>
            <p className="flex items-start gap-2"><span className="text-emerald-500/60 font-bold">3.</span> Ask questions about your code</p>
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
