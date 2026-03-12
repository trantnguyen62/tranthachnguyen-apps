import { GoogleGenAI, Modality } from "@google/genai";
import { ImageSize } from "../types";

const MODEL_TTS = "gemini-2.5-flash-preview-tts";
const MODEL_IMAGE = "gemini-3-pro-image-preview";
const MODEL_FLASH = "gemini-2.5-flash";

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
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/** Encodes an ArrayBuffer as a base64 string for use in Gemini API inline data payloads. */
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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
  ttsCache.set(text, bytes.buffer);
  return bytes.buffer;
};

/**
 * Generates a study image from a text prompt using Gemini image generation.
 * Requires the user to select a paid API key via AI Studio.
 * Returns a base64-encoded data URL (image/png).
 */
export const generateStudyImage = async (prompt: string, size: ImageSize): Promise<string> => {
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
        const base64EncodeString: string = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
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
