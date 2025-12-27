// Secure version - calls backend proxy instead of exposing API key
const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:5174';

/**
 * Sends an image and a text prompt to Gemini 2.5 Flash Image to generate/edit an image.
 * Now uses backend proxy to keep API key secure.
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

/**
 * Generates a video from an image using Veo.
 * Now uses backend proxy to keep API key secure.
 */
export const generateVideoFromImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<{ data: string; mimeType: string } | null> => {
  try {
    const response = await fetch(`${PROXY_URL}/api/gemini/generate-video`, {
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
      throw new Error(error.error || 'Failed to generate video');
    }

    const data = await response.json();
    return {
      data: data.videoData,
      mimeType: data.mimeType,
    };
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
};
