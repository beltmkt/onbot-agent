import { FileProcessingResult, FileProcessor } from '../types';

export class ImageProcessor implements FileProcessor {
  async process(file: File): Promise<FileProcessingResult> {
    return {
      success: true,
      message: "🖼️ Imagem recebida! Se contém dados de usuários, por favor descreva ou digite as informações."
    };
  }
}