/**
 * Audio codec utilities for the Gemini Live API audio pipeline.
 *
 * Flow:
 *   Microphone (Float32, 16 kHz) → createBlob (PCM16, base64) → Gemini API
 *   Gemini API (PCM16, base64, 24 kHz) → decode → decodeAudioData (AudioBuffer) → speakers
 *
 * Sample rates:
 *   - Input (microphone → API): 16 000 Hz  — required by Gemini Live speech model
 *   - Output (API → speakers): 24 000 Hz   — returned by Gemini Live responses
 */

import { Blob } from '@google/genai';

/**
 * Encodes a Float32Array audio buffer as a PCM16 Gemini Blob ready to send
 * over the WebSocket.
 *
 * Web Audio API samples are 32-bit floats in [-1, 1]. The Gemini Live API
 * expects 16-bit signed PCM (little-endian). Conversion:
 *   negative samples → multiply by 0x8000 (32768) to reach −32768
 *   positive samples → multiply by 0x7FFF (32767) to reach  32767
 * This asymmetry preserves the full signed 16-bit range without overflow.
 */
export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp values to [-1, 1] range before converting to PCM16
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

/**
 * Encodes a Uint8Array as a base64 string.
 * Used to serialise raw PCM bytes for JSON transport over WebSocket.
 */
export function encode(bytes: Uint8Array): string {
  // Chunked to avoid call stack overflow on large buffers while avoiding O(n²) string concat
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/**
 * Decodes a base64 string back to raw bytes.
 * Used to deserialise PCM audio received from the Gemini API response.
 */
export function decode(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

/**
 * Converts raw PCM16 bytes received from the Gemini API into a Web Audio
 * AudioBuffer that can be played through the AudioContext.
 *
 * PCM16 stores each sample as a signed 16-bit integer; the Web Audio API
 * expects 32-bit floats in [-1, 1]. Dividing by 32768.0 (2^15) normalises
 * the range. For interleaved multi-channel data the de-interleaving loop
 * picks every Nth sample for each channel (stride = numChannels).
 *
 * @param data        Raw PCM16 bytes from the API (little-endian, interleaved)
 * @param ctx         AudioContext used to create the buffer
 * @param sampleRate  Sample rate of the incoming data (typically 24 000 Hz)
 * @param numChannels Number of audio channels (typically 1 — mono)
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  // frameCount = total samples ÷ channels (each frame has one sample per channel)
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // De-interleave: samples for channel C are at indices C, C+N, C+2N, …
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
