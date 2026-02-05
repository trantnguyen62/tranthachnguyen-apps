"use client";

import { useState, useCallback } from "react";
import { Play, RotateCcw, Check, Copy, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlaygroundProps {
  code: string;
  language?: string;
  title?: string;
  description?: string;
  editable?: boolean;
  showPreview?: boolean;
}

export function Playground({
  code: initialCode,
  language = "javascript",
  title,
  description,
  editable = true,
  showPreview = true,
}: PlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setOutput("");

    try {
      // Create a sandboxed execution environment
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: unknown[]) => {
          logs.push(args.map(arg =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(" "));
        },
        error: (...args: unknown[]) => {
          logs.push(`Error: ${args.join(" ")}`);
        },
        warn: (...args: unknown[]) => {
          logs.push(`Warning: ${args.join(" ")}`);
        },
      };

      // Execute the code
      const fn = new Function("console", code);
      fn(mockConsole);

      setOutput(logs.join("\n") || "// No output");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsRunning(false);
    }
  }, [code]);

  const handleReset = useCallback(() => {
    setCode(initialCode);
    setOutput("");
    setError(null);
  }, [initialCode]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [code]);

  return (
    <div className={`
      my-6 rounded-xl border border-border overflow-hidden
      bg-background
      ${isExpanded ? "fixed inset-4 z-50" : ""}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background-secondary">
        <div>
          {title && (
            <h4 className="text-body font-medium text-foreground">{title}</h4>
          )}
          {description && (
            <p className="text-body-sm text-foreground-secondary mt-0.5">
              {description}
            </p>
          )}
          {!title && !description && (
            <span className="text-label uppercase text-foreground-secondary tracking-wider">
              Interactive Example
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="
              flex items-center justify-center
              h-8 w-8 rounded-lg
              text-foreground-secondary
              transition-colors duration-fast
              hover:bg-background hover:text-foreground
            "
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              flex items-center justify-center
              h-8 w-8 rounded-lg
              text-foreground-secondary
              transition-colors duration-fast
              hover:bg-background hover:text-foreground
            "
            aria-label={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`
        grid
        ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}
        ${isExpanded ? "h-[calc(100%-57px)]" : ""}
      `}>
        {/* Code Editor */}
        <div className={`
          relative
          ${showPreview ? "border-r border-border" : ""}
          ${isExpanded ? "h-full" : ""}
        `}>
          <textarea
            value={code}
            onChange={(e) => editable && setCode(e.target.value)}
            readOnly={!editable}
            spellCheck={false}
            className={`
              w-full p-4
              bg-code-bg text-code-text
              font-mono text-[14px] leading-relaxed
              resize-none
              focus:outline-none
              ${isExpanded ? "h-full" : "min-h-[200px]"}
              ${!editable ? "cursor-default" : ""}
            `}
          />
          {code !== initialCode && (
            <button
              onClick={handleReset}
              className="
                absolute top-2 right-2
                flex items-center gap-1.5 px-2 py-1
                rounded-md
                text-caption text-gray-400
                bg-gray-800
                transition-colors duration-fast
                hover:bg-gray-700 hover:text-gray-300
              "
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Preview / Output */}
        {showPreview && (
          <div className={`
            flex flex-col
            ${isExpanded ? "h-full" : ""}
          `}>
            {/* Run Button */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background-secondary">
              <span className="text-label uppercase text-foreground-secondary tracking-wider">
                Output
              </span>
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="
                  flex items-center gap-1.5 px-3 py-1.5
                  rounded-lg
                  text-body-sm font-medium text-white
                  bg-accent
                  transition-all duration-fast
                  hover:bg-accent-hover
                  disabled:opacity-50
                "
              >
                <Play className={`w-3.5 h-3.5 ${isRunning ? "animate-pulse" : ""}`} />
                {isRunning ? "Running..." : "Run"}
              </button>
            </div>

            {/* Output Area */}
            <div className={`
              flex-1 p-4
              bg-code-bg
              font-mono text-[14px] leading-relaxed
              overflow-auto
              ${isExpanded ? "" : "min-h-[168px]"}
            `}>
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.pre
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-error whitespace-pre-wrap"
                  >
                    {error}
                  </motion.pre>
                ) : output ? (
                  <motion.pre
                    key="output"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-code-text whitespace-pre-wrap"
                  >
                    {output}
                  </motion.pre>
                ) : (
                  <motion.span
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-gray-500"
                  >
                    // Click &quot;Run&quot; to execute the code
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
