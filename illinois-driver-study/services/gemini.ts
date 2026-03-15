import { GoogleGenAI, Modality } from "@google/genai";
import { ImageSize } from "../types";

const MODEL_TTS = "gemini-2.5-flash-preview-tts";
const MODEL_IMAGE = "gemini-3-pro-image-preview";
const MODEL_FLASH = "gemini-2.5-flash";

/** Singleton GoogleGenAI client — reused across all API calls to avoid repeated allocation. */
let _ai: GoogleGenAI | null = null;

/**
 * Returns a GoogleGenAI client configured with the environment API key.
 * When `requireSelection` is true (e.g. for paid image generation models),
 * prompts the user to select an API key via the AI Studio key picker before
 * proceeding. Throws if the user cancels the selection.
 */
const getAI = async (requireSelection: boolean = false) => {
  if (requireSelection) {
    if ('aistudio' in window) {
       const aistudio = (window as any).aistudio;
       if (!await aistudio.hasSelectedApiKey()) {
          const success = await aistudio.openSelectKey();
          if (!success) throw new Error("API Key selection failed or cancelled.");
       }
    }
  }
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return _ai;
};

/** Encodes an ArrayBuffer as a base64 string for use in Gemini API inline data payloads. */
export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 32768) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  }
  return btoa(binary);
}

const TTS_CACHE_MAX = 50;
const ttsCache = new Map<string, ArrayBuffer>();

/**
 * Generates spoken audio for the given text using Gemini TTS.
 * Returns raw PCM audio data as an ArrayBuffer suitable for Web Audio API decoding.
 * Results are cached in-memory to avoid redundant API calls for repeated questions.
 */
export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  const cached = ttsCache.get(text);
  if (cached) return cached.slice(0); // Return a copy since decodeAudioData may detach the buffer

  const ai = await getAI(false);
  const response = await ai.models.generateContent({
    model: MODEL_TTS,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  // Decode base64 to ArrayBuffer
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  if (ttsCache.size >= TTS_CACHE_MAX) {
    const firstKey = ttsCache.keys().next().value;
    if (firstKey !== undefined) ttsCache.delete(firstKey);
  }
  ttsCache.set(text, bytes.buffer);
  return bytes.buffer.slice(0); // Return a copy so decodeAudioData does not detach the cached buffer
};

const IMAGE_CACHE_MAX = 20;
const imageCache = new Map<string, string>();

/**
 * Generates a study image from a text prompt using Gemini image generation.
 * Requires the user to select a paid API key via AI Studio.
 * Returns a base64-encoded data URL (image/png).
 * Results are cached in-memory by prompt+size to avoid redundant API calls.
 */
export const generateStudyImage = async (prompt: string, size: ImageSize): Promise<string> => {
  const cacheKey = `${prompt}:${size}`;
  const cached = imageCache.get(cacheKey);
  if (cached) return cached;
  // Use gemini-3-pro-image-preview for high quality images as requested.
  // This model requires the user to select their own API key.
  const ai = await getAI(true);
  const response = await ai.models.generateContent({
    model: MODEL_IMAGE,
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
          aspectRatio: "1:1",
          imageSize: size
      },
    },
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const dataUrl = `data:image/png;base64,${part.inlineData.data}`;
        if (imageCache.size >= IMAGE_CACHE_MAX) {
          const firstKey = imageCache.keys().next().value;
          if (firstKey !== undefined) imageCache.delete(firstKey);
        }
        imageCache.set(cacheKey, dataUrl);
        return dataUrl;
      }
    }
  }
  throw new Error("No image generated");
};

/**
 * Transcribes an audio Blob to text using Gemini's multimodal content API.
 * Returns the transcribed string, or an empty string if no text was produced.
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const ai = await getAI(false);
  const arrayBuffer = await audioBlob.arrayBuffer();
  const base64Data = arrayBufferToBase64(arrayBuffer);

  const response = await ai.models.generateContent({
    model: MODEL_FLASH,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: audioBlob.type || 'audio/webm',
            data: base64Data
          }
        },
        {
          text: "Transcribe this audio exactly as spoken."
        }
      ]
    }
  });

  return response.text || "";
};
