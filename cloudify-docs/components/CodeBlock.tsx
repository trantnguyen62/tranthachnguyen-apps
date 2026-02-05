"use client";

import { useState, useEffect } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  language = "typescript",
  filename,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Format language display
  const displayLanguage = language === "bash" || language === "shell" ? "terminal" : language;

  return (
    <div
      className="relative group rounded-xl overflow-hidden bg-code-bg my-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#2a2a2a] border-b border-[#3a3a3a]">
        <div className="flex items-center gap-2">
          {/* Language/Filename indicator */}
          {filename ? (
            <span className="text-body-sm text-gray-400">{filename}</span>
          ) : (
            <div className="flex items-center gap-1.5">
              {(language === "bash" || language === "shell") && (
                <Terminal className="w-3.5 h-3.5 text-gray-500" />
              )}
              <span className="text-label uppercase text-gray-500 tracking-wider">
                {displayLanguage}
              </span>
            </div>
          )}
        </div>

        {/* Copy Button */}
        <AnimatePresence mode="wait">
          <motion.button
            key={copied ? "copied" : "copy"}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered || copied ? 1 : 0.5, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={handleCopy}
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded-md
              text-caption font-medium
              transition-colors duration-fast
              ${copied
                ? "bg-success/20 text-success"
                : "hover:bg-[#3a3a3a] text-gray-400 hover:text-gray-300"
              }
            `}
            aria-label={copied ? "Copied!" : "Copy code"}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </motion.button>
        </AnimatePresence>
      </div>

      {/* Code Content */}
      <div className="relative overflow-x-auto">
        <pre className="p-4 text-[15px] leading-relaxed">
          <code className="text-code-text font-mono">
            {showLineNumbers ? (
              <span className="table">
                {code.split("\n").map((line, i) => (
                  <span key={i} className="table-row">
                    <span className="table-cell pr-4 text-right text-gray-600 select-none">
                      {i + 1}
                    </span>
                    <span className="table-cell">{line || " "}</span>
                  </span>
                ))}
              </span>
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

// Inline code component with theme support
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="
      px-1.5 py-0.5
      bg-background-secondary
      text-foreground
      text-[0.9em] font-medium
      rounded-md
    ">
      {children}
    </code>
  );
}
