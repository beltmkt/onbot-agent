// src/services/onbotService.ts
// ✅ VERSÃO CORRIGIDA - COM URL ATUALIZADA

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  // ✅ URL CORRETA DO CHAT
  CHAT_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/4678ab47-cab4-4d6f-98cc-96ee92ed7ff6/chat',
  
  // ✅ URL para upload de arquivos (se necessário)
  DATA_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/54283140-3bf1-43e3-923c-6546241e6f7d/criar_conta_final',
  
  JWT_TOKEN: import.meta.env.VITE_JWT_TOKEN || '',
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
} as const;

// ==================== TIPOS SIMPLIFICADOS ====================
interface WebhookPayload {
  sessionId: string;
  chatInput: string;
  // ✅ APENAS campos que o n8n espera
}

interface ApiResponse {
  output?: string;
  response?: string;
  message?: string;
  error?: string;
  // ✅ Campos que o n8n realmente retorna
}

// ==================== FUNÇÃO PRINCIPAL CORRIGIDA ====================
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    console.log('🚀 Enviando mensagem para OnBot:', { message, sessionId, hasFile: !!file });

    // ✅ PAYLOAD SIMPLES - apenas o que o n8n espera
    const payload: WebhookPayload = {
      sessionId: sessionId,
      chatInput: message
    };

    // ✅ ENVIO DIRETO sem campos extras
    const response = await fetch(CONFIG.CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // ✅ Só adiciona Authorization se realmente necessário
        ...(CONFIG.JWT_TOKEN && { 'Authorization': `Bearer ${CONFIG.JWT_TOKEN}` })
      },
      body: JSON.stringify(payload)
    });

    console.log('📨 Resposta do webhook:', {
      status: response.status,
      ok: response.ok,
      url: CONFIG.CHAT_WEBHOOK_URL
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();
    console.log('📊 Dados recebidos:', data);

    // ✅ EXTRAI RESPOSTA dos campos possíveis
    return data.output || data.response || data.message || 'Processado com sucesso!';

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    return `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
  }
};

// ==================== TESTE DE CONEXÃO ====================
export const testConnection = async (): Promise<{ 
  status: 'success' | 'error'; 
  message: string; 
  timestamp: string 
}> => {
  try {
    const payload = {
      sessionId: 'test_' + Date.now(),
      chatInput: 'test'
    };

    const response = await fetch(CONFIG.CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { 
        status: 'success', 
        message: '✅ Conexão com n8n estabelecida',
        timestamp: new Date().toISOString()
      };
    } else {
      return { 
        status: 'error', 
        message: `❌ Erro HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    }

  } catch (error) {
    return { 
      status: 'error', 
      message: `❌ Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      timestamp: new Date().toISOString()
    };
  }
};

// ==================== VERSÃO SIMPLIFICADA PARA ARQUIVOS ====================
export const uploadFileToOnbot = async (
  file: File, 
  sessionId: string
): Promise<string> => {
  try {
    // ✅ Leitura simples do arquivo
    const fileContent = await readFileAsText(file);
    
    const payload = {
      sessionId: sessionId,
      chatInput: `Upload: ${file.name}`,
      fileData: {
        fileName: file.name,
        content: fileContent,
        size: file.size,
        type: file.type
      }
    };

    const response = await fetch(CONFIG.DATA_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.output || data.message || 'Arquivo processado com sucesso!';

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    return `Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
  }
};

// ==================== UTILITÁRIOS ====================
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Falha na leitura do arquivo'));
    reader.readAsText(file);
  });
};