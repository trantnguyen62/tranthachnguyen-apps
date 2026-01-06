export interface ProcessedImage {
  data: string; // Base64 string for display (includes data:image/...)
  mimeType: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  READY_TO_EDIT = 'READY_TO_EDIT',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
