// Audio encoding/decoding utilities for the Gemini Live API.
//
// Audio pipeline:
//   Microphone (Float32, 16 kHz) → createBlob → PCM Int16 base64 → Gemini
//   Gemini → base64 PCM Int16 (24 kHz) → decodeAudioData → AudioBuffer → speaker

import { Blob } from '@google/genai';

// Converts raw Float32 microphone samples to a Gemini-compatible PCM blob.
// Float32 web audio samples are in [-1, 1]; PCM Int16 uses [-32768, 32767].
// Negative uses 0x8000 (32768) and positive uses 0x7FFF (32767) to preserve
// the asymmetric Int16 range correctly.
export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Base64-encodes a byte array for transmission over JSON.
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64-decodes a string back to raw bytes.
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Converts raw PCM bytes received from Gemini into a Web Audio API AudioBuffer.
// Trims a trailing byte if present to keep the Int16 view 2-byte-aligned.
// Divides Int16 samples by 32768 to normalise back to Float32 [-1, 1].
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const alignedData = data.length % 2 !== 0 ? data.slice(0, data.length - 1) : data;
  const dataInt16 = new Int16Array(alignedData.buffer, alignedData.byteOffset, alignedData.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
