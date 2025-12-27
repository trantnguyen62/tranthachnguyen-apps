import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/../.env.local` });

const app = express();
const PORT = 5174;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment');
  }
  return new GoogleGenAI({ apiKey });
};

app.post('/api/gemini/edit-image', async (req, res) => {
  try {
    const { base64Image, mimeType, prompt } = req.body;
    
    if (!base64Image || !prompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ai = getAIClient();
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp|heic);base64,/, '');

    const modelName = 'gemini-2.5-flash-image';
    console.log(`[edit-image] Using model: ${modelName}`);
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates returned from Gemini');
    }

    const content = response.candidates[0].content;
    
    if (content && content.parts) {
      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const outMime = part.inlineData.mimeType || 'image/png';
          return res.json({
            success: true,
            imageData: `data:${outMime};base64,${part.inlineData.data}`
          });
        }
      }
    }

    const textPart = content?.parts?.find(p => p.text);
    if (textPart?.text) {
      return res.status(400).json({
        error: `Model responded with text: "${textPart.text}"`
      });
    }

    res.status(500).json({ error: 'No image generated' });
  } catch (error) {
    console.error('Error in edit-image:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gemini/generate-video', async (req, res) => {
  try {
    const { base64Image, mimeType, prompt } = req.body;
    
    if (!base64Image || !prompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ai = getAIClient();
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp|heic);base64,/, '');
    const aspectRatio = '16:9';

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || 'Animate this image cinematically',
      image: {
        imageBytes: cleanBase64,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      throw new Error('Video generation completed but no URI was returned');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(`${videoUri}&key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64Video = Buffer.from(buffer).toString('base64');
    
    res.json({
      success: true,
      videoData: `data:video/mp4;base64,${base64Video}`,
      mimeType: 'video/mp4'
    });

  } catch (error) {
    console.error('Error in generate-video:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`NanoEdit AI Proxy Server running on port ${PORT}`);
  console.log(`API Key loaded: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
});
