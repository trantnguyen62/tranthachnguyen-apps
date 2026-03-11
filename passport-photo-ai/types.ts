/** A passport photo represented as a base64 data URL and its MIME type. */
export interface PassportImage {
  /** Base64 data URL, e.g. `data:image/jpeg;base64,...` */
  data: string;
  /** MIME type of the encoded image, e.g. `"image/jpeg"`. */
  mimeType: string;
}

/** Response returned by the `/api/passport/check` endpoint. */
export interface PassportCheckResult {
  /** Whether the photo meets passport requirements. */
  compliant: boolean;
  /** One-sentence summary of the analysis result. */
  summary: string;
  /** List of detected compliance issues. */
  issues: string[];
  /** List of actionable improvement tips. */
  suggestions: string[];
}

/** Tracks the current analysis lifecycle in the UI. */
export enum AppStatus {
  IDLE = 'idle',
  CHECKING = 'checking',
  COMPLETED = 'completed',
  ERROR = 'error',
}




