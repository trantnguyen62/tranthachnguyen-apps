/** An image held in memory, stored as a data URL (e.g. `data:image/png;base64,...`). */
export interface ProcessedImage {
  /** Full data URL including the MIME prefix, ready for use in `<img src>` or download links. */
  data: string;
  mimeType: string;
}

/** Represents the current lifecycle state of the editor. */
export enum AppStatus {
  /** No image loaded. */
  IDLE = 'IDLE',
  /** Image loaded, waiting for a prompt. */
  READY_TO_EDIT = 'READY_TO_EDIT',
  /** Gemini generation request in flight. */
  PROCESSING = 'PROCESSING',
  /** Last generation succeeded; result is displayed. */
  COMPLETED = 'COMPLETED',
  /** Last generation failed; error message is shown. */
  ERROR = 'ERROR'
}
