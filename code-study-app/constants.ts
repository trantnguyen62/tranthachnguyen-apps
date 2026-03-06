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
    name: 'Photo App',
    path: 'photo-app',
    description: 'Photo editing application'
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
3. Proactively notice interesting or non-obvious things in the code (e.g. performance considerations, subtle bugs, clever patterns)
4. Connect specific code to broader software engineering principles
5. Be encouraging and precise — correct misconceptions gently but clearly

COMMUNICATION STYLE:
- Keep responses short and conversational — aim for 2–4 sentences per point
- Reference specific file names and line numbers when relevant
- If asked something complex, break it into steps and pause for questions
- Use analogies to explain abstract concepts when helpful

WHEN THE DEVELOPER OPENS A FILE:
- Briefly orient them: what this file does and how it fits into the project
- Mention 1–2 things worth paying attention to in this file

WHEN CODE IS SELECTED:
- Focus your explanation on exactly what was selected
- Explain any non-obvious behavior or edge cases

Start by greeting the developer warmly and asking what they'd like to explore today.`;
