import React, { useEffect, useRef, memo } from 'react';
import { ChatMessage } from '../types';

interface Props {
  /**
   * Ordered list of finalised conversation turns to display.
   * The component auto-scrolls to the latest message whenever this array grows.
   * The last 100 messages are kept in memory by `useLiveSession`; older ones are
   * dropped to avoid unbounded growth during long sessions.
   */
  messages: ChatMessage[];
}

const Transcript = memo<Props>(({ messages }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div role="log" aria-live="polite" aria-label="Conversation transcript" className="h-full flex flex-col items-center justify-center gap-3 text-slate-500 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
          <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-slate-400">Your conversation will appear here.</p>
          <p className="text-xs text-slate-600 mt-1">Start speaking to see your dialogue in real time.</p>
        </div>
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
          <span className="text-xs text-slate-500 mt-1 px-1">
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
