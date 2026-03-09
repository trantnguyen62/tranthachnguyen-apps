import React, { useEffect, useRef, memo } from 'react';
import { ChatMessage } from '../types';

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
      <div role="log" aria-live="polite" aria-label="Conversation transcript" className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 px-6 text-center">
        <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <p className="text-sm">No messages yet.</p>
        <p className="text-xs text-slate-600">Press Start Conversation and speak — your dialogue will appear here in real time.</p>
      </div>
    );
  }

  return (
    <div role="log" aria-live="polite" aria-label="Conversation transcript" className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {messages.map((msg) => (
        <div
          key={msg.id}
          aria-label={`${msg.role === 'user' ? 'You' : 'AI Tutor'}: ${msg.text}`}
          className={`msg-fade-in flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
        >
          <div className={`
            px-4 py-2.5 rounded-2xl text-sm leading-relaxed
            ${msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-slate-700/80 text-slate-200 rounded-bl-sm'}
          `}>
            {msg.text}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 px-1">
            {msg.role === 'user' ? 'You' : 'AI Tutor'} · {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
});

Transcript.displayName = 'Transcript';

export default Transcript;
