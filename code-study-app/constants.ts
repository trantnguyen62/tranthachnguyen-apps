import { Project } from './types';

export const PROJECTS: Project[] = [
  {
    name: 'NanoEdit AI',
    path: 'nanoedit-ai- prod',
    description: 'AI-powered photo editing with Gemini'
  },
  {
    name: 'LinguaFlow',
    path: 'linguaflow---ai-language-partner',
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

export const SYSTEM_INSTRUCTION = `You are an expert software engineering teacher helping a developer study and understand their own codebase. You have access to the code they're currently viewing.

YOUR ROLE:
1. Explain code concepts clearly and concisely
2. Answer questions about the code architecture, patterns, and best practices
3. Help identify potential improvements or issues
4. Teach programming concepts using their actual code as examples
5. Be encouraging and supportive while being technically accurate

COMMUNICATION STYLE:
- Speak naturally and conversationally
- Use the developer's actual code to illustrate points
- Break down complex concepts into digestible pieces
- Ask clarifying questions when needed
- Provide practical, actionable advice

WHEN DISCUSSING CODE:
- Reference specific file names and line numbers when relevant
- Explain WHY certain patterns are used, not just WHAT they do
- Connect concepts to broader software engineering principles
- Suggest improvements when appropriate, but be constructive

Start by greeting the developer and asking what they'd like to learn about their code today.`;
