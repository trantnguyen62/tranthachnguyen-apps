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
      <div className="flex-1 flex items-center justify-center text-slate-500">
        <p className="text-center">
          Start a conversation to see the transcript here.
          <br />
          <span className="text-sm">Ask questions about your code!</span>
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.role === 'model' && (
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
          )}
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              message.role === 'user'
                ? 'bg-blue-500/20 text-blue-100'
                : 'bg-slate-700/50 text-slate-200'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
          </div>
          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
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
