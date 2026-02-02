/**
 * AI Client Abstraction
 * Supports Anthropic Claude for AI-powered features
 */

import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: string;
}

export interface StreamChunk {
  type: "text" | "done" | "error";
  content?: string;
  error?: string;
}

/**
 * Generate a completion with Claude
 */
export async function generateCompletion(params: {
  systemPrompt: string;
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<AIResponse> {
  const {
    systemPrompt,
    messages,
    model = "claude-3-sonnet-20240229",
    maxTokens = 2048,
    temperature = 0.7,
  } = params;

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textContent = response.content.find((c) => c.type === "text");

  return {
    content: textContent?.type === "text" ? textContent.text : "",
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    stopReason: response.stop_reason || "end_turn",
  };
}

/**
 * Generate a streaming completion
 */
export async function* generateStreamingCompletion(params: {
  systemPrompt: string;
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): AsyncGenerator<StreamChunk> {
  const {
    systemPrompt,
    messages,
    model = "claude-3-sonnet-20240229",
    maxTokens = 2048,
    temperature = 0.7,
  } = params;

  try {
    const stream = await anthropic.messages.stream({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield { type: "text", content: event.delta.text };
      }
    }

    yield { type: "done" };
  } catch (error) {
    yield {
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Analyze text with a specific prompt
 */
export async function analyzeWithPrompt(params: {
  prompt: string;
  content: string;
  model?: string;
}): Promise<string> {
  const response = await generateCompletion({
    systemPrompt: params.prompt,
    messages: [{ role: "user", content: params.content }],
    model: params.model,
    maxTokens: 4096,
    temperature: 0.3,
  });

  return response.content;
}

/**
 * Parse JSON from AI response
 */
export function parseAIJson<T>(content: string): T | null {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // Try direct parse
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Check if AI is available
 */
export function isAIAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
