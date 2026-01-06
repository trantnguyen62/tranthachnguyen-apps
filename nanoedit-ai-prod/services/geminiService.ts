// Secure version - calls backend proxy which routes to gemini-web-proxy
const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:5174';

/**
 * Sends an image and a text prompt to edit/generate an image.
 * Routes through gemini-web-proxy (Puppeteer automation) instead of paid API.
 */
export const generateEditedImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string | null> => {
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
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate image');
    }

    const data = await response.json();
    return data.imageData;
  } catch (error) {
    console.error('Error generating edited image:', error);
    throw error;
  }
};
