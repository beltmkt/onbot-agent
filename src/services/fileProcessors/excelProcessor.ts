import { FileProcessingResult, FileProcessor } from '../types';

export class ExcelProcessor implements FileProcessor {
  async process(_file: File): Promise<FileProcessingResult> {
    // Para Excel, precisaríamos de uma biblioteca como sheetjs
    return {
      success: false,
      message: "📊 Arquivo Excel detectado! Para processar Excel, precisamos instalar a biblioteca 'xlsx'. Deseja converter para CSV primeiro?"
    };
  }
}