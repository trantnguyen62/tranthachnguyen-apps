import React, { useEffect, useRef, memo } from 'react';
import { ChatMessage } from '../types';
import { sanitizeText } from '../utils/sanitize';

interface Props {
  messages: ChatMessage[];
}

const Transcript = memo<Props>(({ messages }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 italic">
        Conversation transcript will appear here...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
        >
          <div className={`
            px-4 py-2 rounded-2xl text-sm leading-relaxed
            ${msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-slate-700 text-slate-200 rounded-bl-none'}
          `}>
            {sanitizeText(msg.text)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 px-1">
            {msg.role === 'user' ? 'You' : 'Gemini'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
});

Transcript.displayName = 'Transcript';

export default Transcript;
