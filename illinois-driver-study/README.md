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

# Set up environment
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Start development server
npm run dev
```

### Run with Docker

```bash
docker build -t illinois-driver-study .
docker run -p 4000:4000 illinois-driver-study
```

## 📁 Project Structure

```
illinois-driver-study/
├── App.tsx             # Main React component
├── index.html          # Entry HTML file
├── index.tsx           # React entry point
├── components/         # Reusable UI components
├── data/               # Question data and content
├── services/           # API services (Gemini AI)
├── public/             # Static assets
└── Dockerfile          # Docker configuration
```

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: TailwindCSS
- **AI**: Google Gemini API

## 🌐 Live Demo

[illinoisdriverstudy.tranthachnguyen.com](https://illinoisdriverstudy.tranthachnguyen.com)

## 📄 License

© 2025 Tran Thach Nguyen. All rights reserved.
