// Secure version - calls backend proxy which routes to gemini-web-proxy
const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:5174';

/**
 * Sends an image and a text prompt to edit/generate an image.
 * Routes through gemini-web-proxy (Puppeteer automation) instead of paid API.
 */
const REQUEST_TIMEOUT_MS = 120_000; // 2 minutes

export const generateEditedImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${PROXY_URL}/api/gemini/edit-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image,
        mimeType,
        prompt,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = 'Failed to generate image';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // response body is not JSON
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.imageData;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    console.error('Error generating edited image:', error);
    throw error;
  }
};
