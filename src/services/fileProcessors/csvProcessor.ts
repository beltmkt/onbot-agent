import { FileProcessingResult, UserData, FileProcessor } from '../types';

export class CSVProcessor implements FileProcessor {
  async process(file: File): Promise<FileProcessingResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          const lines = csvText.split('\n').filter(line => line.trim());
          
          const users: UserData[] = [];
          
          for (let i = 0; i < lines.length; i++) {
            const cells = lines[i].split(',').map(cell => 
              cell.trim().replace(/"/g, '').replace(/'/g, '')
            );
            
            // Detecta se a linha tem dados de usuário
            if (cells.length >= 2 && cells[0] && this.isEmail(cells[1])) {
              users.push({
                name: cells[0],
                email: cells[1],
                phone: cells[2] || '',
                company: cells[3] || ''
              });
            }
          }
          
          if (users.length > 0) {
            resolve({
              success: true,
              message: `📊 Planilha CSV com ${users.length} usuários detectados!`,
              data: users,
              totalItems: users.length
            });
          } else {
            resolve({
              success: false,
              message: "📊 CSV recebido, mas não identifiquei dados de usuários. Pode verificar o formato?"
            });
          }
        } catch (error) {
          resolve({
            success: false,
            message: `❌ Erro ao processar CSV: ${error}`
          });
        }
      };
      
      reader.readAsText(file);
    });
  }
  
  private isEmail(text: string): boolean {
    return text.includes('@') && text.includes('.');
  }
}