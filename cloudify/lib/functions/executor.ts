/**
 * Function Executor - Executes serverless functions in isolated containers
 * Supports Node.js and Python runtimes
 */

import { spawn, ChildProcess } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
const uuidv4 = randomUUID;

// Configuration
const FUNCTION_TIMEOUT_DEFAULT = 10000; // 10 seconds
const FUNCTION_TIMEOUT_MAX = 60000; // 60 seconds
const FUNCTION_MEMORY_DEFAULT = 128; // 128 MB
const FUNCTION_MEMORY_MAX = 3008; // 3 GB
const FUNCTIONS_DIR = "/data/functions";

export type Runtime = "nodejs18" | "nodejs20" | "python3.9" | "python3.10" | "python3.11" | "python3.12";

export interface FunctionConfig {
  functionId: string;
  runtime: Runtime;
  entrypoint: string;
  memory: number;
  timeout: number;
  envVars: Record<string, string>;
}

export interface FunctionEvent {
  httpMethod?: string;
  path?: string;
  headers?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
}

export interface FunctionContext {
  functionName: string;
  functionVersion: string;
  memoryLimitInMB: number;
  requestId: string;
  remainingTimeInMillis: () => number;
}

export interface FunctionResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded: boolean;
}

export interface ExecutionResult {
  success: boolean;
  result?: FunctionResult;
  error?: string;
  duration: number;
  memoryUsed: number;
  logs: string[];
}

// Runtime to Docker image mapping
const RUNTIME_IMAGES: Record<Runtime, string> = {
  nodejs18: "node:18-alpine",
  nodejs20: "node:20-alpine",
  "python3.9": "python:3.9-alpine",
  "python3.10": "python:3.10-alpine",
  "python3.11": "python:3.11-alpine",
  "python3.12": "python:3.12-alpine",
};

// Generate a unique request ID
function generateRequestId(): string {
  return uuidv4();
}

/**
 * Execute a function in an isolated Docker container
 */
export async function executeFunction(
  config: FunctionConfig,
  code: string,
  event: FunctionEvent
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const logs: string[] = [];

  // Validate config
  const memory = Math.min(Math.max(config.memory, FUNCTION_MEMORY_DEFAULT), FUNCTION_MEMORY_MAX);
  const timeout = Math.min(Math.max(config.timeout * 1000, 1000), FUNCTION_TIMEOUT_MAX);

  // Create temporary directory for function code
  const tempDir = path.join(FUNCTIONS_DIR, `exec-${requestId}`);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    // Write function code to temp directory
    const codeFile = config.runtime.startsWith("nodejs")
      ? "handler.js"
      : "handler.py";
    await fs.writeFile(path.join(tempDir, codeFile), code);

    // Create wrapper script based on runtime
    const wrapperCode = config.runtime.startsWith("nodejs")
      ? createNodeWrapper(config.entrypoint, event, requestId, memory)
      : createPythonWrapper(config.entrypoint, event, requestId, memory);

    const wrapperFile = config.runtime.startsWith("nodejs")
      ? "runner.js"
      : "runner.py";
    await fs.writeFile(path.join(tempDir, wrapperFile), wrapperCode);

    // Build Docker run command
    const dockerImage = RUNTIME_IMAGES[config.runtime];
    const envArgs: string[] = [];
    for (const [key, value] of Object.entries(config.envVars)) {
      envArgs.push("-e", `${key}=${value}`);
    }

    const dockerArgs = [
      "run",
      "--rm",
      "--network", "none", // No network access for security
      "--memory", `${memory}m`,
      "--memory-swap", `${memory}m`, // Disable swap
      "--cpus", "1",
      "-v", `${tempDir}:/function:ro`,
      "-w", "/function",
      "--read-only",
      "--tmpfs", "/tmp:size=100m",
      ...envArgs,
      dockerImage,
      config.runtime.startsWith("nodejs") ? "node" : "python",
      wrapperFile,
    ];

    // Execute function
    const result = await runDockerCommand(dockerArgs, timeout, logs);

    const duration = Date.now() - startTime;

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Function execution failed",
        duration,
        memoryUsed: memory,
        logs,
      };
    }

    // Parse the output
    try {
      const functionResult = JSON.parse(result.output || "{}");
      return {
        success: true,
        result: {
          statusCode: functionResult.statusCode || 200,
          headers: functionResult.headers || {},
          body: functionResult.body || "",
          isBase64Encoded: functionResult.isBase64Encoded || false,
        },
        duration,
        memoryUsed: memory,
        logs,
      };
    } catch {
      return {
        success: true,
        result: {
          statusCode: 200,
          headers: { "Content-Type": "text/plain" },
          body: result.output || "",
          isBase64Encoded: false,
        },
        duration,
        memoryUsed: memory,
        logs,
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration,
      memoryUsed: memory,
      logs,
    };
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Run Docker command with timeout
 */
async function runDockerCommand(
  args: string[],
  timeout: number,
  logs: string[]
): Promise<{ success: boolean; output?: string; error?: string }> {
  return new Promise((resolve) => {
    let output = "";
    let errorOutput = "";
    let killed = false;

    const proc: ChildProcess = spawn("docker", args, {
      env: process.env,
    });

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
      logs.push(`[ERROR] Function timed out after ${timeout}ms`);
    }, timeout);

    proc.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      output += text;
      // Separate logs from result (logs go to stderr or start with [LOG])
      if (!text.startsWith("{")) {
        logs.push(text.trim());
      }
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      errorOutput += text;
      logs.push(`[STDERR] ${text.trim()}`);
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (killed) {
        resolve({ success: false, error: "Function timed out" });
      } else if (code !== 0) {
        resolve({ success: false, error: errorOutput || `Exit code: ${code}` });
      } else {
        resolve({ success: true, output });
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Create Node.js wrapper script
 */
function createNodeWrapper(
  entrypoint: string,
  event: FunctionEvent,
  requestId: string,
  memory: number
): string {
  const [moduleName, handlerName] = entrypoint.split(".");

  return `
const handler = require('./${moduleName || "handler"}');

const event = ${JSON.stringify(event)};

const context = {
  functionName: 'cloudify-function',
  functionVersion: '$LATEST',
  memoryLimitInMB: ${memory},
  requestId: '${requestId}',
  getRemainingTimeInMillis: () => ${FUNCTION_TIMEOUT_MAX},
};

// Override console.log to capture logs
const originalLog = console.log;
const logs = [];
console.log = (...args) => {
  logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  originalLog.apply(console, args);
};

(async () => {
  try {
    const fn = handler.${handlerName || "handler"} || handler.default || handler;
    const result = await fn(event, context);

    // Output result as JSON
    console.log = originalLog; // Restore
    console.log(JSON.stringify(result));
  } catch (error) {
    console.log = originalLog;
    console.error(JSON.stringify({
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    }));
    process.exit(1);
  }
})();
`;
}

/**
 * Create Python wrapper script
 */
function createPythonWrapper(
  entrypoint: string,
  event: FunctionEvent,
  requestId: string,
  memory: number
): string {
  const [moduleName, handlerName] = entrypoint.split(".");

  return `
import json
import sys
import importlib.util

# Load the handler module
spec = importlib.util.spec_from_file_location("handler", "./${moduleName || "handler"}.py")
handler_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(handler_module)

event = ${JSON.stringify(event)}

class Context:
    function_name = 'cloudify-function'
    function_version = '$LATEST'
    memory_limit_in_mb = ${memory}
    aws_request_id = '${requestId}'

    @staticmethod
    def get_remaining_time_in_millis():
        return ${FUNCTION_TIMEOUT_MAX}

context = Context()

try:
    fn = getattr(handler_module, '${handlerName || "handler"}', None)
    if fn is None:
        fn = getattr(handler_module, 'main', None)
    if fn is None:
        raise Exception('Handler function not found')

    result = fn(event, context)
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({
        'statusCode': 500,
        'body': json.dumps({'error': str(e)}),
        'headers': {'Content-Type': 'application/json'}
    }))
    sys.exit(1)
`;
}

/**
 * Validate function code (basic syntax check)
 */
export async function validateFunctionCode(
  code: string,
  runtime: Runtime
): Promise<{ valid: boolean; error?: string }> {
  if (runtime.startsWith("nodejs")) {
    try {
      // Basic syntax check using Node's vm module would be ideal
      // For now, check for common issues
      if (!code.includes("exports") && !code.includes("module.exports") && !code.includes("export")) {
        return { valid: false, error: "No exports found in function code" };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : "Invalid syntax" };
    }
  } else {
    // Python validation
    if (!code.includes("def ")) {
      return { valid: false, error: "No function definition found" };
    }
    return { valid: true };
  }
}

/**
 * Get estimated cold start time for a runtime
 */
export function getColdStartEstimate(runtime: Runtime): number {
  const estimates: Record<Runtime, number> = {
    nodejs18: 200,
    nodejs20: 200,
    "python3.9": 300,
    "python3.10": 300,
    "python3.11": 300,
    "python3.12": 350,
  };
  return estimates[runtime] || 300;
}
