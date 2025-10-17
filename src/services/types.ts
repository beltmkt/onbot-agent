export interface FileProcessingResult {
  success: boolean;
  message: string;
  data?: any[];
  totalItems?: number;
}

export interface UserData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface FileProcessor {
  process(file: File): Promise<FileProcessingResult>;
}