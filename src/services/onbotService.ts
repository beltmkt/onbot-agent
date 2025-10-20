// src/services/onbotService.ts - VERSÃO PARA DADOS_RECEBIDOS

// ✅ URL para processar dados e acionar o cenário completo
const ONBOT_API_URL = import.meta.env.VITE_N8N_WEBHOOK_URL; // /dados_recebidos
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN;

/**
 * Lê o conteúdo do arquivo como texto
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error('Falha ao ler arquivo'));
    reader.readAsText(file);
  });
};

/**
 * Envia mensagem para processar dados - USA /dados_recebidos
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    if (!ONBOT_API_URL) {
      throw new Error('URL do webhook não configurada');
    }

    console.log('🔗 Enviando para URL de dados:', ONBOT_API_URL);

    let finalMessage = message;
    let fileContent = '';

    // ✅ LÊ O CONTEÚDO DO ARQUIVO
    if (file) {
      console.log('📖 Lendo arquivo:', file.name);
      fileContent = await readFileAsText(file);
      
      // Mensagem formatada com o CSV
      finalMessage = `Processar arquivo CSV: ${file.name}`;
      
      console.log('✅ Arquivo lido:', fileContent.length, 'caracteres');
      console.log('📋 Primeiras linhas:', fileContent.split('\n').slice(0, 3).join(' | '));
    }

    // ✅ PAYLOAD ESPECÍFICO PARA /dados_recebidos
    const payload = {
      sessionId: sessionId,
      chatInput: finalMessage,
      action: 'process_csv',
      timestamp: new Date().toISOString(),
      token: 'bf18117f82dfafb9354109b4b4b4f8cc1804d8cecca2e8dad5',
      // ✅ ENVIA DADOS NO FORMATO QUE /dados_recebidos ESPERA
      fileContent: fileContent,
      fileName: file?.name || '',
      fileType: file?.type || '',
      fileSize: file?.size || 0,
      // ✅ DADOS ADICIONAIS PARA O CENÁRIO
      empresa: 'Onboarding | Olha o Mistério',
      processType: 'csv_upload',
      users: fileContent ? fileContent.split('\n').length - 1 : 0 // conta linhas do CSV
    };

    console.log('🚀 Payload para /dados_recebidos:', {
      sessionId: sessionId,
      hasFile: !!file,
      fileName: file?.name,
      fileContentLength: fileContent.length,
      usersCount: payload.users
    });

    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📨 Status /dados_recebidos:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro detalhado:', errorText);
      
      // ✅ TENTATIVA ALTERNATIVA: Se der erro, tenta enviar para /chat
      if (response.status === 500) {
        console.log('🔄 Tentando enviar para URL do chat...');
        return await sendToChatEndpoint(message, sessionId, file);
      }
      
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Resposta de /dados_recebidos:', data);

    return data.output || data.response || data.message || 'Dados recebidos e processados!';

  } catch (error) {
    console.error('❌ Erro em /dados_recebidos:', error);
    
    // ✅ FALLBACK: Tenta o endpoint do chat
    try {
      console.log('🔄 Fallback: enviando para /chat...');
      return await sendToChatEndpoint(message, sessionId, file);
    } catch (fallbackError) {
      return `Erro: Não foi possível processar os dados. Tente novamente.`;
    }
  }
};

/**
 * ✅ FUNÇÃO FALLBACK - Envia para o endpoint /chat
 */
const sendToChatEndpoint = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  const CHAT_URL = import.meta.env.VITE_N8N_WEBHOOK_URLCHAT;
  
  let finalMessage = message;
  if (file) {
    const fileContent = await readFileAsText(file);
    finalMessage = `${message}\n\nArquivo: ${file.name}\nConteúdo:\n\`\`\`csv\n${fileContent}\n\`\`\``;
  }

  const payload = {
    sessionId: sessionId,
    chatInput: finalMessage,
    action: file ? 'process_csv' : 'chat_message',
    timestamp: new Date().toISOString(),
    token: 'bf18117f82dfafb9354109b4b4b4f8cc1804d8cecca2e8dad5'
  };

  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data.output || data.response || data.message || 'Processado via chat!';
};

/**
 * Testa a conexão com /dados_recebidos
 */
export const testOnbotConnection = async (): Promise<{ status: 'success' | 'error'; message: string }> => {
  try {
    if (!ONBOT_API_URL) {
      return { status: 'error', message: 'URL não configurada' };
    }

    const payload = {
      sessionId: 'health_check',
      chatInput: 'health_check',
      action: 'health_check',
      timestamp: new Date().toISOString()
    };

    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { status: 'success', message: 'Conectado ao processador de dados' };
    } else {
      return { status: 'error', message: `Erro ${response.status} no processador` };
    }

  } catch (error) {
    return { status: 'error', message: 'Sem conexão com processador' };
  }
};

export const processCSVFile = async (file: File, token: string, sessionId: string): Promise<any> => {
  const result = await sendMessageToOnbot('Upload CSV para processamento', sessionId, file);
  return { success: true, message: result };
};