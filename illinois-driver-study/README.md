# Illinois Driver Study

An interactive study guide for the Illinois Driver's License written knowledge test, powered by Google Gemini AI. Available in English and Vietnamese.

## Features

- **Quiz Mode** - 55 official exam-style questions with instant feedback and explanations. Requires 80% to pass (matching Illinois DMV standard).
- **Study List** - Searchable/filterable review of all questions with explanations.
- **Live AI Instructor** - Real-time voice conversation with a Gemini-powered instructor that quizzes you on official questions (uses Gemini Live API with WebSocket streaming).
- **Voice Transcription** - Record spoken notes and transcribe them via Gemini.
- **Visual Aids** - Generate driving scenario images from text prompts using Gemini image generation.
- **Bilingual** - Full English and Vietnamese support (toggle in the header).
- **Mobile Friendly** - Responsive design for any device.

## Quick Start

### Prerequisites

- Node.js >= 18.x
- Google Gemini API Key ([get one at aistudio.google.com](https://aistudio.google.com))

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `API_KEY` | Yes | Google Gemini API key. Used for TTS, transcription, and Live Practice. |

> **Note:** The image generation feature (`ImageGenerator`) uses `gemini-3-pro-image-preview`, a paid model. It will prompt users to select a key via AI Studio in the browser before generating images.

### Run Locally

```bash
# Install dependencies
npm install

# Set up environment
echo "API_KEY=your_gemini_api_key_here" > .env

# Start development server
npm run dev
```

### Run with Docker

The Dockerfile serves the pre-built `dist/` directory using Node `serve` on port 80. You must build the app before building the Docker image, or build inside the container.

```bash
docker build -t illinois-driver-study .
docker run -p 80:80 illinois-driver-study
```

## Project Structure

```
illinois-driver-study/
├── App.tsx                # Main app shell: navigation, language toggle, layout
├── index.html             # HTML entry point with meta tags
├── index.tsx              # React root
├── types.ts               # Shared TypeScript types (Question, AppMode, Language, ImageSize)
├── components/
│   ├── QuizMode.tsx       # Timed quiz with scoring and per-question audio feedback
│   ├── StudyMode.tsx      # Searchable question list (lazy-loaded)
│   ├── LivePractice.tsx   # AI voice instructor via Gemini Live API (lazy-loaded)
│   ├── VoiceTools.tsx     # Audio recording and Gemini transcription
│   └── ImageGenerator.tsx # Driving scenario image generation
├── data/
│   └── questions.ts       # 55 questions in English and Vietnamese
├── services/
│   └── gemini.ts          # Gemini API client (TTS, image generation, transcription)
└── public/
    ├── sitemap.xml        # SEO sitemap
    ├── robots.txt         # Crawler directives
    └── images/            # Road sign SVG assets
```

## Adding or Editing Questions

Questions are defined in `data/questions.ts` as two parallel arrays (`questionsEn` and `questionsVi`). Each entry follows the `Question` type:

```ts
{
  id: number;          // Unique identifier (must match between EN and VI arrays)
  text: string;        // The question prompt
  options: string[];   // Answer choices (2–4 options)
  correctIndex: number; // Zero-based index of the correct answer
  explanation: string; // Explanation shown after answering
  image?: string;      // Optional: path to a road sign image in public/images/
}
```

Keep `id` values in sync between `questionsEn` and `questionsVi`. The Live Practice instructor references questions by `id` via a Gemini function call (`displayQuestion`).

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS
- **AI**: Google Gemini API (`gemini-2.5-flash`, `gemini-2.5-flash-preview-tts`, `gemini-2.5-flash-native-audio-preview`, `gemini-3-pro-image-preview`)

## Live Demo

[illinoisdriverstudy.tranthachnguyen.com](https://illinoisdriverstudy.tranthachnguyen.com)

## License

© 2025 Tran Thach Nguyen. All rights reserved.
