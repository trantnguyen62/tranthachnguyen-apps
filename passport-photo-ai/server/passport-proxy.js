import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: `${__dirname}/../.env.local` });

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Serve static files from dist
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/passport/check', async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'No image' });
    
    const ai = getAI();
    const clean = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { inlineData: { data: clean, mimeType: 'image/jpeg' } },
          { text: `Analyze this passport photo. Return JSON only:
{"compliant":boolean,"summary":"string","issues":["string"],"suggestions":["string"]}
Check: plain background, neutral expression, proper lighting, no glasses glare, face centered.` }
        ]
      }
    });
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};
    
    res.json({
      compliant: !!parsed.compliant,
      summary: parsed.summary || '',
      issues: parsed.issues || [],
      suggestions: parsed.suggestions || []
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/passport/analyze', async (req, res) => {
  try {
    const { base64Image } = req.body;
    const ai = getAI();
    const clean = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { inlineData: { data: clean, mimeType: 'image/jpeg' } },
          { text: `Analyze photo for passport. Return JSON:
{"overallScore":number,"autoFixRecommendations":{"adjustBrightness":number,"adjustContrast":number}}
adjustBrightness/adjustContrast are % to add (e.g., 5 means +5%)` }
        ]
      }
    });
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    res.json(match ? JSON.parse(match[0]) : { overallScore: 70, autoFixRecommendations: { adjustBrightness: 5, adjustContrast: 8 } });
  } catch (e) {
    res.json({ overallScore: 70, autoFixRecommendations: { adjustBrightness: 5, adjustContrast: 8 } });
  }
});

// Handle SPA routing
app.get(/(.*)/, (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(5185, () => console.log('API on port 5185, Key:', process.env.GEMINI_API_KEY ? 'Yes' : 'No'));




