# 🚗 Illinois Driver Study

An interactive study guide for the Illinois Driver's License test, powered by AI to help you pass.

## 🎯 Features

- **Practice Questions** - Study with real exam-style questions
- **AI-Powered Help** - Get explanations from Gemini AI when stuck
- **Progress Tracking** - Track your study progress across topics
- **Topic Categories** - Road signs, rules of the road, safety, and more
- **Mobile Friendly** - Study on any device

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- Gemini API Key (for AI features)

### Run Locally

```bash
# Install dependencies
npm install

# Set up environment (create .env and add your API key)
echo "API_KEY=your_gemini_api_key_here" > .env

# Start development server
npm run dev
```

### Run with Docker

```bash
docker build -t illinois-driver-study .
docker run -p 80:80 illinois-driver-study
```

## 📁 Project Structure

```
illinois-driver-study/
├── App.tsx             # Main React component with nav and layout
├── index.html          # Entry HTML file
├── index.tsx           # React entry point
├── types.ts            # Shared TypeScript types and enums
├── components/         # UI components (QuizMode, StudyMode, LivePractice, VoiceTools)
├── data/               # Question data in English and Vietnamese
├── services/           # Gemini AI service (speech, transcription, image generation)
├── public/             # Static assets (road sign SVGs, sitemap, robots.txt)
└── Dockerfile          # Serves pre-built dist/ with Node serve on port 80
```

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: TailwindCSS
- **AI**: Google Gemini API

## 🌐 Live Demo

[illinoisdriverstudy.tranthachnguyen.com](https://illinoisdriverstudy.tranthachnguyen.com)

## 📄 License

© 2025 Tran Thach Nguyen. All rights reserved.
