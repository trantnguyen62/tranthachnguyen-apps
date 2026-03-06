/** A single quiz/study question with multiple-choice options. */
export interface Question {
  id: number;
  text: string;
  options: string[];
  /** Zero-based index of the correct option in `options`. */
  correctIndex: number;
  explanation?: string;
  /** Optional path to a road sign image displayed with the question. */
  image?: string;
}

/** Top-level navigation modes available in the app. */
export enum AppMode {
  QUIZ = 'QUIZ',
  STUDY = 'STUDY',
  LIVE_PRACTICE = 'LIVE_PRACTICE'
}

/** Supported UI and content languages. */
export type Language = 'en' | 'vi';

/** Resolution options for AI-generated study images. */
export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K',
}
