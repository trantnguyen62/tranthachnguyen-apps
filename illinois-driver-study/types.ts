export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  image?: string;
}

export enum AppMode {
  QUIZ = 'QUIZ',
  STUDY = 'STUDY',
  LIVE_PRACTICE = 'LIVE_PRACTICE'
}

export type Language = 'en' | 'vi';

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K',
}
