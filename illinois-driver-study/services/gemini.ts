import { GoogleGenAI, Modality } from "@google/genai";
import { ImageSize } from "../types";

// Helper to get AI instance. Handles key selection for paid models if needed.
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

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  const ai = await getAI(false);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
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
  return bytes.buffer;
};

export const generateStudyImage = async (prompt: string, size: ImageSize): Promise<string> => {
  // Use gemini-3-pro-image-preview for high quality images as requested.
  // This model requires the user to select their own API key.
  const ai = await getAI(true);
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
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

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const ai = await getAI(false);
  const arrayBuffer = await audioBlob.arrayBuffer();
  const base64Data = arrayBufferToBase64(arrayBuffer);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
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
