/** Five CEFR-aligned proficiency levels used to tune the AI tutor's language. */
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper-intermediate' | 'advanced';

/** A Gemini voice that the AI tutor can speak with. */
export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  description: string;
}

/**
 * Per-level configuration for a language that supports difficulty selection
 * (e.g. the Vietnamese-to-English course).
 */
export interface LevelConfig {
  level: DifficultyLevel;
  /** Short English label shown in the UI (e.g. "Beginner"). */
  label: string;
  /** Vietnamese label shown to Vietnamese learners. */
  labelVi: string;
  description: string;
  /** Additional system instruction appended to the base language instruction when this level is active. */
  systemInstruction: string;
}

/** A conversation topic option shown in the topic picker. */
export interface TopicOption {
  id: string;
  icon: string;
  labelVi: string;
  labelEn: string;
}

/**
 * Full configuration for a supported language / learning mode.
 *
 * - `requiresUserProfile` — when true the app shows the UserProfileModal before
 *   starting a session so the AI tutor can address the learner by name and track
 *   their progress.
 * - `levels` / `selectedLevel` — only present for language courses that expose
 *   a difficulty picker (currently only the Vietnamese-to-English course).
 * - `selectedTopic` — the currently chosen conversation topic ID; `'free'`
 *   means free-form conversation with no forced topic.
 */
export interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
  /** Short one-line description shown in the language picker. */
  tagline?: string;
  /** Gemini voice name used when speaking in this language. */
  voiceName: string;
  /** Base system instruction sent to Gemini at session start. */
  systemInstruction: string;
  requiresUserProfile?: boolean;
  levels?: LevelConfig[];
  selectedLevel?: DifficultyLevel;
  selectedTopic?: string;
}

/**
 * Learner profile persisted in the backend (`/api/users`).
 * The `id` is also cached in `localStorage` under the key `linguaflow_user_id`
 * so returning users are recognised without re-entering their name.
 */
export interface UserProfile {
  id: string;
  name: string;
  /** Sequential lesson counter incremented by the AI tutor each session. */
  lessonNumber: number;
  /** Vocabulary words the AI has noted that the learner has acquired. */
  wordsLearned: string[];
  /** ISO 8601 date string of the most recent session. */
  lastSessionDate: string;
  totalSessions: number;
  /** Free-text notes the AI tutor may save about the learner's progress. */
  notes: string;
}

/** Lifecycle state of the WebSocket connection to the proxy server. */
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

/** A single turn in the live conversation transcript. */
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  /** False while the AI is still streaming the turn; true once the turn is complete. */
  isFinal: boolean;
}

/** Normalised [0, 1] volume levels for the microphone and speaker streams. */
export interface AudioVolume {
  input: number;
  output: number;
}
