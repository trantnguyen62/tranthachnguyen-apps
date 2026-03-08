import { Project } from './types';

export const PROJECTS: Project[] = [
  {
    name: 'NanoEdit AI',
    path: 'nanoedit-ai-prod',
    description: 'AI-powered photo editing with Gemini'
  },
  {
    name: 'LinguaFlow',
    path: 'linguaflow',
    description: 'AI language learning with Gemini Live voice'
  },
  {
    name: 'Illinois Driver Study',
    path: 'illinois-driver-study',
    description: 'DMV practice test application'
  },
  {
    name: 'Passport Photo AI',
    path: 'passport-photo-ai',
    description: 'AI passport photo generator'
  },
  {
    name: 'Landing Page',
    path: 'landing-page',
    description: 'Personal portfolio landing page'
  },
  {
    name: 'Cloudify',
    path: 'cloudify',
    description: 'Cloud deployment platform — a self-hosted Vercel alternative'
  },
  {
    name: 'Comic News',
    path: 'comic-news',
    description: 'Comic-style news reader with AI-generated visuals'
  },
  {
    name: 'Daily Quote',
    path: 'daily-quote',
    description: 'PWA serving AI-generated daily quotes with offline support'
  },
  {
    name: 'DevOps Game',
    path: 'devops-game',
    description: 'Interactive browser game for learning CI/CD and DevOps concepts'
  },
  {
    name: 'DevOps Study',
    path: 'devops-study',
    description: 'Study guide and quiz app for DevOps concepts'
  },
  {
    name: 'Pipeline Runner',
    path: 'pipeline-runner',
    description: 'CI/CD pipeline automation runner with task orchestration'
  },
  {
    name: 'Quill',
    path: 'quill',
    description: 'AI-assisted writing and document editing tool'
  },
  {
    name: 'Skokie Home Buyers',
    path: 'skokie-home-buyers',
    description: 'Local real estate guide with neighborhood maps and search'
  },
  {
    name: 'Cloudify Docs',
    path: 'cloudify-docs',
    description: 'Documentation site for Cloudify — built with Next.js and MDX'
  },
  {
    name: 'Code Study App',
    path: 'code-study-app',
    description: 'This app — AI voice tutor for exploring and learning codebases'
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
- Several apps integrate Google Gemini AI APIs — pay attention to how prompts and context are constructed, how streaming is handled, and how errors are caught
- Many apps follow a client + API server pattern with Express backends
- The developer wants to learn the reasoning behind design decisions, not just surface-level descriptions
- Custom React hooks encapsulate complex stateful logic — explain what state is being managed and why it lives in the hook
- TypeScript generics and utility types are used throughout — when relevant, explain what type safety they enforce

WHEN THE DEVELOPER SEEMS STUCK OR CONFUSED:
- Reframe the concept with a concrete real-world analogy
- Walk through the code execution step by step from the triggering event
- Ask a clarifying question to identify exactly where the understanding breaks down

Start by greeting the developer and asking which part of the codebase they want to explore — the overall architecture, a specific file, or a particular feature.`;
