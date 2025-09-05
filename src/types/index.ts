export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  downloadUrl: string | null;
  fileExists: boolean;
  uploadedFileName: string | null;
}

export interface YandexDiskError {
  message: string;
  description: string;
  error: string;
}

export interface UploadResponse {
  href: string;
  method: string;
  templated: boolean;
}
