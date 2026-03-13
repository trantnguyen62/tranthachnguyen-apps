import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { ChatMessage } from '../types';
import { User, Bot, Copy, Check, ChevronDown } from 'lucide-react';

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);
  return (
    <button
      onClick={handle}
      aria-label={copied ? 'Copied' : 'Copy message'}
      className="opacity-30 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded hover:bg-slate-600/50 flex-shrink-0 self-start mt-0.5"
    >
      {copied
        ? <Check className="w-3 h-3 text-green-400" />
        : <Copy className="w-3 h-3 text-slate-500" />}
    </button>
  );
}

interface TranscriptProps {
  messages: ChatMessage[];
}

const Transcript = memo<TranscriptProps>(({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowScrollBtn(false);
  }, []);

  const handleScroll = useCallback(() => {
    setShowScrollBtn(!isNearBottom());
  }, [isNearBottom]);

  useEffect(() => {
    if (isNearBottom()) {
      const raf = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setShowScrollBtn(true);
    }
  }, [messages, isNearBottom]);

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
          <div className="text-left space-y-2 text-xs text-slate-500 bg-slate-800/60 rounded-lg p-3 border border-slate-700/40">
            <p className="text-slate-400 font-medium mb-2.5">Get started in 3 steps:</p>
            <p className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-px">1</span>
              <span>Open a file from the sidebar</span>
            </p>
            <p className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-px">2</span>
              <span>Click <span className="text-emerald-400 font-medium">Start Voice Session</span></span>
            </p>
            <p className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-px">3</span>
              <span>Speak your question — select code first to add context</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
    {showScrollBtn && (
      <button
        onClick={scrollToBottom}
        aria-label="Scroll to latest message"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/90 hover:bg-emerald-400 text-white text-xs font-medium rounded-full shadow-lg transition-all animate-bounce-subtle"
      >
        <ChevronDown className="w-3 h-3" aria-hidden="true" />
        New messages
      </button>
    )}
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role="log"
      aria-label="Conversation transcript"
      aria-live="polite"
      aria-relevant="additions"
      className="flex-1 overflow-y-auto space-y-4 pr-2"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 group ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.role === 'model' && (
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
          )}
          <div className={`max-w-[80%] flex flex-col gap-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              aria-label={`${message.role === 'user' ? 'You' : 'AI Tutor'}: ${message.text}`}
              className={`flex items-start gap-1 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`rounded-2xl px-4 py-2.5 ${
                message.role === 'user'
                  ? 'bg-blue-600/25 text-blue-100 border border-blue-500/20'
                  : 'bg-slate-700/60 text-slate-200 border border-slate-600/30'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                {message.role === 'model' && !message.isFinal && (
                  <span className="inline-flex items-center gap-0.5 mt-1" aria-label="AI is responding">
                    <span className="w-1 h-1 rounded-full bg-emerald-400/70 animate-bounce" style={{ animationDelay: '0ms' }} aria-hidden="true" />
                    <span className="w-1 h-1 rounded-full bg-emerald-400/70 animate-bounce" style={{ animationDelay: '150ms' }} aria-hidden="true" />
                    <span className="w-1 h-1 rounded-full bg-emerald-400/70 animate-bounce" style={{ animationDelay: '300ms' }} aria-hidden="true" />
                  </span>
                )}
              </div>
              {message.isFinal && <CopyButton text={message.text} />}
            </div>
            <time dateTime={message.timestamp.toISOString()} className="text-xs text-slate-500 px-1">{formatTime(message.timestamp)}</time>
          </div>
          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <User className="w-4 h-4 text-blue-400" />
            </div>
          )}
        </div>
      ))}
    </div>
    </div>
  );
});

Transcript.displayName = 'Transcript';

export default Transcript;
