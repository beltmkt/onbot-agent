// src/services/csvService.ts

export interface CSVUser {
  nome: string;
  email: string;
  telefone: string;
  empresa_ou_equipe: string;
  master: boolean;
}

export interface ValidationResponse {
  success: boolean;
  empresa?: string;
  equipes?: any[];
  id_empresa?: string | null;
  mensagem?: string;
}

export interface ProcessingResponse {
  usuarios_criados: number;
  usuarios_falhos: number;
  detalhes?: string[];
}

export interface Team {
  id: string;
  nome: string;
  id_empresa: string;
}

export interface UploadCompleteResponse {
  operation: string;
  status: 'processing' | 'completed' | 'error';
  message: string;
  data?: {
    file_name?: string;
    total_rows?: number;
    empresa?: string;
    resultados?: {
      sucessos: number;
      falhas: number;
    };
  };
  error?: {
    code: string;
    details: string;
  };
  success: boolean;
}

// 🔑 Sua chave Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5tdnBydWNxY2Z6eHFwY2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODQ1MTQsImV4cCI6MjA3NTM2MDUxNH0.jhDWlRM51z_GUZTfq04pbiJozF-huW_sInYyTYOZ9KA';

// ==========================
// Função de upload de CSV ajustada com headers
// ==========================
export const uploadCSVToN8N = async (file: File, token: string): Promise<{ success: boolean; mensagem?: string }> => {
  try {
    console.log('📤 Iniciando upload do CSV para N8N...');

    const formData = new FormData();
    formData.append('csv_file', file);
    formData.append('file_name', file.name);
    formData.append('file_size', file.size.toString());
    formData.append('uploaded_at', new Date().toISOString());

    // 🔹 Envio para webhook com headers personalizados
    const response = await fetch(
      'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/criar_conta_final',
      {
        method: 'POST',
        headers: {
          'arquivo': 'enviado',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (response.ok) {
      const text = await response.text();
      console.log('✅ Upload realizado. Resposta:', text);

      if (text.toUpperCase().includes('WORKFLOW WAS STARTED')) {
        return { success: true, mensagem: 'Arquivo enviado com sucesso' };
      }

      try {
        const result = JSON.parse(text);
        if (result.success) {
          return { success: true, mensagem: result.mensagem || 'Arquivo enviado com sucesso' };
        } else {
          return { success: false, mensagem: result.mensagem || 'Erro no processamento do arquivo' };
        }
      } catch {
        return { success: true, mensagem: 'Arquivo enviado com sucesso (resposta não JSON)' };
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Erro do servidor:', response.status, errorText);
      return { success: false, mensagem: `Erro ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error('❌ Erro ao enviar arquivo:', error);
    return { success: false, mensagem: error instanceof Error ? error.message : 'Erro de conexão' };
  }
};

// ==========================
// Função de validação de token
// ==========================
export const validateTokenWithN8N = async (token: string): Promise<ValidationResponse> => {
  try {
    console.log('🔐 Validando token com N8N...', token);

    const response = await fetch(
      'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/criar_conta_final',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }
    );

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const text = await response.text();

    if (text.toUpperCase().includes('WORKFLOW WAS STARTED')) {
      return { success: true, empresa: 'Empresa Validada', equipes: [], id_empresa: 'default-id', mensagem: 'Token validado com sucesso' };
    }

    try {
      const result = JSON.parse(text);
      return result.success
        ? { success: true, empresa: result.empresa, equipes: result.equipes, id_empresa: result.id_empresa, mensagem: result.mensagem }
        : { success: false, mensagem: result.mensagem || 'Token inválido' };
    } catch {
      return { success: false, mensagem: 'Resposta inválida do servidor' };
    }
  } catch (error) {
    console.error('❌ Erro na validação do token:', error);
    return { success: false, mensagem: error instanceof Error ? error.message : 'Erro de conexão' };
  }
};

// ==========================
// Parse CSV
// ==========================
export const parseCSV = async (file: File): Promise<CSVUser[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length < 2) return reject(new Error('CSV vazio ou inválido'));

        const users: CSVUser[] = [];
        const dataLines = lines.slice(1);

        dataLines.forEach((line, i) => {
          const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 5) {
            const user: CSVUser = {
              nome: cols[0],
              email: cols[1],
              telefone: cols[2],
              empresa_ou_equipe: cols[3],
              master: ['true', '1', 'sim'].includes(cols[4].toLowerCase()),
            };
            if (user.nome && user.email) users.push(user);
          }
        });

        console.log(`📊 ${users.length} usuários encontrados no CSV`);
        resolve(users);
      } catch (err) {
        reject(new Error('Erro ao processar CSV: ' + err));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};

// ==========================
// Validação de estrutura CSV
// ==========================
export const validateCSVStructure = (users: CSVUser[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  users.forEach((u, i) => {
    if (!u.nome?.trim()) errors.push(`Linha ${i + 2}: Nome é obrigatório`);
    if (!u.email?.trim()) errors.push(`Linha ${i + 2}: Email é obrigatório`);
    else if (!isValidEmail(u.email)) errors.push(`Linha ${i + 2}: Email inválido`);
    if (!u.empresa_ou_equipe?.trim()) errors.push(`Linha ${i + 2}: Empresa/Equipe é obrigatório`);
  });
  return { isValid: errors.length === 0, errors };
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
