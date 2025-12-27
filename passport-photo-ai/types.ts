export interface PassportImage {
  data: string;
  mimeType: string;
}

export interface PassportCheckResult {
  compliant: boolean;
  summary: string;
  issues: string[];
  suggestions: string[];
}

export enum AppStatus {
  IDLE = 'idle',
  READY = 'ready',
  CHECKING = 'checking',
  COMPLETED = 'completed',
  ERROR = 'error',
}




