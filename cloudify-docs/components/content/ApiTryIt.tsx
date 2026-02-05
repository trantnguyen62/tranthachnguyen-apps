"use client";

import { useState, useCallback } from "react";
import { Send, ChevronDown, ChevronUp, Copy, Check, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Parameter {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  defaultValue?: string;
}

interface ApiTryItProps {
  method: HttpMethod;
  endpoint: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: string;
  headers?: Record<string, string>;
}

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-success/10 text-success border-success/30",
  POST: "bg-accent/10 text-accent border-accent/30",
  PUT: "bg-warning/10 text-warning border-warning/30",
  PATCH: "bg-info/10 text-info border-info/30",
  DELETE: "bg-error/10 text-error border-error/30",
};

export function ApiTryIt({
  method,
  endpoint,
  description,
  parameters = [],
  requestBody: initialBody,
  headers: initialHeaders = {},
}: ApiTryItProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    parameters.forEach((p) => {
      if (p.defaultValue) initial[p.name] = p.defaultValue;
    });
    return initial;
  });
  const [requestBody, setRequestBody] = useState(initialBody || "");
  const [response, setResponse] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const buildUrl = useCallback(() => {
    let url = endpoint;
    // Replace path parameters
    Object.entries(paramValues).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, encodeURIComponent(value));
    });
    return url;
  }, [endpoint, paramValues]);

  const handleSend = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);
    setResponseTime(null);

    const startTime = performance.now();

    try {
      // For demo purposes, simulate an API response
      // In a real implementation, you would make an actual fetch request
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));

      // Simulated response based on method
      const simulatedResponses: Record<HttpMethod, object> = {
        GET: {
          success: true,
          data: {
            id: "proj_abc123",
            name: "my-project",
            status: "active",
            created_at: new Date().toISOString(),
          },
        },
        POST: {
          success: true,
          message: "Resource created successfully",
          id: "new_" + Math.random().toString(36).substr(2, 9),
        },
        PUT: {
          success: true,
          message: "Resource updated successfully",
        },
        PATCH: {
          success: true,
          message: "Resource partially updated",
        },
        DELETE: {
          success: true,
          message: "Resource deleted successfully",
        },
      };

      setStatusCode(method === "POST" ? 201 : 200);
      setResponse(JSON.stringify(simulatedResponses[method], null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setStatusCode(500);
    } finally {
      setIsLoading(false);
    }
  }, [method]);

  const handleCopy = useCallback(async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [response]);

  return (
    <div className="my-6 rounded-xl border border-border overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          w-full flex items-center justify-between
          px-4 py-3
          bg-background-secondary
          transition-colors duration-fast
          hover:bg-border-light
        "
      >
        <div className="flex items-center gap-3">
          <span className={`
            px-2 py-1 rounded-md
            text-caption font-bold uppercase
            border
            ${methodColors[method]}
          `}>
            {method}
          </span>
          <code className="text-body-sm font-mono text-foreground">
            {endpoint}
          </code>
        </div>
        <div className="flex items-center gap-2">
          {description && (
            <span className="hidden sm:block text-body-sm text-foreground-secondary">
              {description}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-foreground-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-foreground-secondary" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 border-t border-border">
              {/* Parameters */}
              {parameters.length > 0 && (
                <div>
                  <h5 className="text-body-sm font-medium text-foreground mb-2">
                    Parameters
                  </h5>
                  <div className="space-y-2">
                    {parameters.map((param) => (
                      <div key={param.name} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <label className="text-body-sm font-mono text-foreground">
                            {param.name}
                          </label>
                          <span className="text-caption text-foreground-secondary">
                            {param.type}
                          </span>
                          {param.required && (
                            <span className="text-caption text-error">required</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={paramValues[param.name] || ""}
                          onChange={(e) =>
                            setParamValues((prev) => ({
                              ...prev,
                              [param.name]: e.target.value,
                            }))
                          }
                          placeholder={param.description || `Enter ${param.name}`}
                          className="
                            w-full px-3 py-2
                            bg-background border border-border rounded-lg
                            text-body-sm text-foreground
                            placeholder:text-foreground-secondary
                            focus:outline-none focus:ring-2 focus:ring-accent
                          "
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request Body */}
              {(method === "POST" || method === "PUT" || method === "PATCH") && (
                <div>
                  <h5 className="text-body-sm font-medium text-foreground mb-2">
                    Request Body
                  </h5>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="
                      w-full h-32 px-3 py-2
                      bg-code-bg text-code-text
                      font-mono text-[14px]
                      border border-border rounded-lg
                      resize-none
                      focus:outline-none focus:ring-2 focus:ring-accent
                    "
                  />
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="
                  flex items-center gap-2
                  px-4 py-2
                  rounded-lg
                  text-body-sm font-medium text-white
                  bg-accent
                  transition-all duration-fast
                  hover:bg-accent-hover
                  disabled:opacity-50
                "
              >
                <Send className={`w-4 h-4 ${isLoading ? "animate-pulse" : ""}`} />
                {isLoading ? "Sending..." : "Send Request"}
              </button>

              {/* Response */}
              {(response || error) && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h5 className="text-body-sm font-medium text-foreground">
                        Response
                      </h5>
                      {statusCode && (
                        <span className={`
                          px-2 py-0.5 rounded-md text-caption font-medium
                          ${statusCode < 300
                            ? "bg-success/10 text-success"
                            : statusCode < 500
                            ? "bg-warning/10 text-warning"
                            : "bg-error/10 text-error"
                          }
                        `}>
                          {statusCode}
                        </span>
                      )}
                      {responseTime && (
                        <span className="flex items-center gap-1 text-caption text-foreground-secondary">
                          <Clock className="w-3 h-3" />
                          {responseTime}ms
                        </span>
                      )}
                    </div>
                    {response && (
                      <button
                        onClick={handleCopy}
                        className="
                          flex items-center gap-1
                          px-2 py-1 rounded-md
                          text-caption text-foreground-secondary
                          transition-colors duration-fast
                          hover:bg-background-secondary hover:text-foreground
                        "
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-success" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <pre className="
                    p-4 rounded-lg
                    bg-code-bg
                    text-[14px] leading-relaxed font-mono
                    overflow-x-auto
                  ">
                    <code className={error ? "text-error" : "text-code-text"}>
                      {error || response}
                    </code>
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
