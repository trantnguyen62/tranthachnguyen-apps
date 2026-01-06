export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper-intermediate' | 'advanced';

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  description: string;
}

export interface LevelConfig {
  level: DifficultyLevel;
  label: string;
  labelVi: string;
  description: string;
  systemInstruction: string;
}

export interface TopicOption {
  id: string;
  icon: string;
  labelVi: string;
  labelEn: string;
}

export interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
  voiceName: string;
  systemInstruction: string;
  requiresUserProfile?: boolean;
  levels?: LevelConfig[];
  selectedLevel?: DifficultyLevel;
  selectedTopic?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  lessonNumber: number;
  wordsLearned: string[];
  lastSessionDate: string;
  totalSessions: number;
  notes: string;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

export interface AudioVolume {
  input: number;
  output: number;
}
