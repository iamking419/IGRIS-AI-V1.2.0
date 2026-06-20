export interface ChatSession {
  id: number;
  title: string;
  created_at?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  files?: FileAttachment[];
}

export interface User {
  username: string;
  email: string;
  token?: string;
  rememberMe?: boolean;
}

export interface FileAttachment {
  fileName: string;
  fileType: "image" | "code" | "pdf" | "docx" | "txt";
  analysis?: any;
  pageCount?: number;
  previewUrl?: string;
}

export interface UploadedFile {
  fileName: string;
  fileType: "image" | "code" | "pdf" | "docx" | "txt";
  fileObject?: File | null;
  previewUrl?: string;
  analysis?: any;
  isStaged?: boolean;
  pageCount?: number;
  fileSize: number;
  lastModified: number;
}

export interface AppConfig {
  apiBaseUrl: string;
  themeAccent: "violet" | "crimson" | "silver";
  systemInstructions: string;
}
