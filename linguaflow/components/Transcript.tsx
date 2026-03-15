/**
 * Transcript — scrollable conversation log that displays finalised turns from
 * both the user and the AI tutor.
 *
 * Auto-scrolls to the newest message whenever the `messages` array grows.
 * Each message bubble includes a copy-to-clipboard button that appears on hover.
 * The component is memoised so it only re-renders when the message list changes.
 */
import React, { useEffect, useRef, memo, useState, useCallback } from 'react';
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

const CopyButton = memo<{ text: string }>(({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : 'Copy message'}
      className="opacity-30 group-hover:opacity-100 transition-opacity duration-150 w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-500"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
});
CopyButton.displayName = 'CopyButton';

const Transcript = memo<Props>(({ messages }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div role="log" aria-live="polite" aria-label="Conversation transcript" className="h-full flex flex-col items-center justify-center gap-4 text-slate-500 px-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
          <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">No messages yet</p>
          <p className="text-xs text-slate-500 leading-relaxed">Start a conversation and your dialogue<br />will appear here in real time.</p>
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
          className={`msg-fade-in group flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
        >
          <div className={`
            px-4 py-2.5 rounded-2xl text-sm leading-relaxed
            ${msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-slate-700/80 text-slate-200 rounded-bl-sm'}
          `}>
            {msg.text}
          </div>
          <div className={`flex items-center gap-1.5 mt-1 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <span className={`text-xs font-medium ${msg.role === 'user' ? 'text-blue-400' : 'text-slate-400'}`}>
              {msg.role === 'user' ? 'You' : 'AI Tutor'}
            </span>
            <span className="text-xs text-slate-600" aria-hidden="true">·</span>
            <span className="text-xs text-slate-400 tabular-nums">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <CopyButton text={msg.text} />
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
});

Transcript.displayName = 'Transcript';

export default Transcript;
