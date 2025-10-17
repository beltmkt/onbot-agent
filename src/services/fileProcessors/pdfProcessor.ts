import { FileProcessingResult, FileProcessor } from '../types';

export class PDFProcessor implements FileProcessor {
  async process(file: File): Promise<FileProcessingResult> {
    return {
      success: true,
      message: "📄 PDF recebido! Por favor, me diga quais informações de usuários devo extrair deste documento."
    };
  }
}
