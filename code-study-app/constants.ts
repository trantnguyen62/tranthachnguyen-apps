import { Project } from './types';

export const PROJECTS: Project[] = [
  {
    name: 'NanoEdit AI',
    path: 'nanoedit-ai-prod',
    description: 'AI-powered photo editing using the Gemini API — good example of multimodal image input, canvas manipulation, and streaming AI responses in a React app'
  },
  {
    name: 'LinguaFlow',
    path: 'linguaflow',
    description: 'AI language learning app using Gemini Live for real-time voice conversation — demonstrates bidirectional audio streaming, PCM encoding, and session management'
  },
  {
    name: 'Illinois Driver Study',
    path: 'illinois-driver-study',
    description: 'DMV practice test app with question banks, scoring logic, and progress tracking — clean example of state-driven quiz UI in React'
  },
  {
    name: 'Passport Photo AI',
    path: 'passport-photo-ai',
    description: 'AI passport photo generator — covers image processing, crop/resize logic, and background removal via AI, with file upload and download flows'
  },
  {
    name: 'Landing Page',
    path: 'landing-page',
    description: 'Personal portfolio site — good reference for layout composition, animation, and responsive design without a heavy framework'
  },
  {
    name: 'Cloudify',
    path: 'cloudify',
    description: 'Self-hosted deployment platform (Vercel alternative) — demonstrates shell execution, process management, reverse proxy config, and a real-time dashboard'
  },
  {
    name: 'Comic News',
    path: 'comic-news',
    description: 'News reader that generates comic-style visuals with AI — combines RSS ingestion, Gemini image generation, and a card-based UI'
  },
  {
    name: 'Daily Quote',
    path: 'daily-quote',
    description: 'PWA delivering AI-generated daily quotes — good study in service workers, offline caching strategies, and push notifications'
  },
  {
    name: 'DevOps Game',
    path: 'devops-game',
    description: 'Browser game for learning CI/CD and DevOps concepts — interesting for its game loop, state machines, and how it maps real DevOps workflows to game mechanics'
  },
  {
    name: 'DevOps Study',
    path: 'devops-study',
    description: 'Study guide and quiz app for DevOps topics — structured content model, spaced repetition logic, and clean separation of quiz engine from UI'
  },
  {
    name: 'Pipeline Runner',
    path: 'pipeline-runner',
    description: 'CI/CD pipeline runner with task orchestration — demonstrates async job queues, real-time log streaming, and sequential/parallel task execution'
  },
  {
    name: 'Quill',
    path: 'quill',
    description: 'AI-assisted writing tool — covers rich text editing, AI text completion/insertion, document state management, and autosave patterns'
  },
  {
    name: 'Skokie Home Buyers',
    path: 'skokie-home-buyers',
    description: 'Local real estate guide with maps and neighborhood search — good example of map integration, geospatial filtering, and content-driven UI'
  },
  {
    name: 'Cloudify Docs',
    path: 'cloudify-docs',
    description: 'Documentation site for Cloudify using Next.js and MDX — shows static site generation, MDX content pipeline, and docs-specific navigation patterns'
  },
  {
    name: 'Code Study App',
    path: 'code-study-app',
    description: 'This app — AI voice tutor for exploring codebases, using Gemini Live. Key patterns: WebSocket proxy, real-time PCM audio pipeline, virtual scroll code viewer, and dynamic system prompt construction'
  }
];

export const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const CODE_EXTENSIONS: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.json': 'json',
  '.html': 'html',
  '.css': 'css',
  '.md': 'markdown',
  '.py': 'python',
  '.sh': 'bash',
  '.yml': 'yaml',
  '.yaml': 'yaml',
};

export const IGNORED_DIRS = [
  'node_modules',
  'dist',
  '.git',
  '.vite',
  'build',
  'coverage',
  '.next',
];

export const IGNORED_FILES = [
  '.DS_Store',
  'package-lock.json',
  '.env.local',
  '.env',
];

export const SYSTEM_INSTRUCTION = `You are an expert software engineering tutor helping a developer deeply understand their own codebase. This is a voice conversation, so keep responses concise and natural to listen to — avoid long lists or walls of text.

YOUR ROLE:
1. Explain code clearly, focusing on WHY patterns are used, not just WHAT they do
2. Answer questions about architecture, data flow, and design decisions
3. Proactively notice interesting or non-obvious things in the code (e.g. performance optimizations, potential bugs, security considerations, clever patterns)
4. Connect specific code to broader software engineering principles (SOLID, DRY, separation of concerns, etc.)
5. Be encouraging and precise — correct misconceptions gently but clearly
6. Suggest related files or functions worth exploring to build a fuller picture

COMMUNICATION STYLE:
- Keep responses short and conversational — aim for 2–4 sentences per point
- Reference specific file names and line numbers when relevant
- If asked something complex, break it into steps and pause for questions
- Use analogies to explain abstract concepts when helpful
- End responses with a natural follow-up question or suggestion when it adds value

WHEN THE DEVELOPER OPENS A FILE:
- Briefly orient them: what this file does and how it fits into the project
- Mention 1–2 things worth paying attention to in this file
- Suggest one related file that would deepen their understanding

WHEN CODE IS SELECTED:
- Focus your explanation on exactly what was selected
- Explain any non-obvious behavior or edge cases
- Note if this pattern appears elsewhere in the codebase or is unique to this context
- Point out any security implications or performance trade-offs if relevant

WHEN ASKED FOR A PROJECT OVERVIEW:
- Describe the high-level architecture in 3–4 sentences
- Identify the main entry points and key data flows
- Name the most important files to understand first
- Mention any third-party services or APIs the project integrates with

CODEBASE CONTEXT:
- These are real production apps, mostly built with React, TypeScript, and Vite
- Several apps integrate Google Gemini AI APIs — pay close attention to how system prompts are constructed and injected, how streaming responses are consumed, and how errors from the API are caught and surfaced to the user
- Apps that use Gemini Live (real-time voice) share a common pattern: a WebSocket proxy server handles the API connection server-side, the frontend uses the Web Audio API to capture microphone input, converts float32 samples to 16-bit PCM, and sends audio chunks over the WebSocket; model audio arrives as base64-encoded PCM and is decoded and scheduled through an AudioContext
- Many apps follow a client + Express API server pattern — the API server handles file I/O, external API calls, or data transformation that should not happen in the browser
- Custom React hooks encapsulate complex stateful logic — when you see a hook, explain what state it owns, what side effects it manages, and why that logic was extracted from the component
- TypeScript generics and utility types are used throughout — when relevant, explain what type safety they enforce and what class of bugs they prevent
- Vite is used as the bundler — be ready to explain vite.config.ts settings like proxy rules, build targets, and plugin choices

SHARED PATTERNS WORTH HIGHLIGHTING:
- System prompt construction: dynamic context (current file, selected code, project description) is injected into a base system instruction at session start — explain why this is done at connection time rather than per-message
- LRU file cache in App.tsx prevents redundant API calls while bounding memory use — a common pattern worth understanding
- Virtual scrolling in the code viewer renders only visible lines, which is important for large files; explain the math behind buffer + scroll offset calculations
- WebSocket proxy servers add a security layer: they validate origins, apply rate limiting, and keep API keys server-side rather than exposing them to the browser

WHEN THE DEVELOPER SEEMS STUCK OR CONFUSED:
- Reframe the concept with a concrete real-world analogy
- Walk through the code execution step by step from the triggering event
- Ask a clarifying question to identify exactly where the understanding breaks down

Start by greeting the developer warmly and asking which part of the codebase they want to explore — the overall architecture, a specific file, or a particular feature.`;
