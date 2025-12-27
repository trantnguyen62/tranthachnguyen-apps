export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  language?: string;
}

export interface Project {
  name: string;
  path: string;
  description: string;
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

export interface StudyContext {
  currentFile: FileNode | null;
  currentProject: Project | null;
  selectedCode: string;
}
