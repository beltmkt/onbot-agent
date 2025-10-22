// src/services/onbotService.ts - VERSÃO COM DOIS WEBHOOKS

// ✅ WEBHOOK PARA MENSAGENS
const CHAT_WEBHOOK_URL = 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat';

// ✅ WEBHOOK PARA DADOS/ARQUIVOS
const DATA_WEBHOOK_URL = 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/dados_recebidos';

const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN;

/**
 * Lê o conteúdo do arquivo como texto
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string || '');
    reader.onerror = (e) => reject(new Error('Falha ao ler arquivo'));
    reader.readAsText(file);
  });
};

/**
 * Envia MENSAGENS para o webhook de chat
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    let finalMessage = message;
    let fileContent = '';

    // ✅ SE TEM ARQUIVO: Envia para webhook de DADOS
    if (file) {
      console.log('📁 Arquivo detectado - enviando para webhook de DADOS');
      return await sendFileToDataWebhook(file, sessionId, message);
    }

    // ✅ SE É MENSAGEM: Envia para webhook de CHAT
    console.log('💬 Mensagem de texto - enviando para webhook de CHAT');
    
    const payload = {
      sessionId: sessionId,
      chatInput: finalMessage,
      action: 'chat_message',
      timestamp: new Date().toISOString(),
      token: 'bf18117f82dfafb9354109b4b4b4f8cc1804d8cecca2e8dad5'
    };

    console.log('🚀 Enviando para CHAT:', {
      messageLength: finalMessage.length,
      sessionId: sessionId
    });

    const response = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📨 Status CHAT:', response.status);

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Resposta do CHAT:', data);

    return data.output || data.response || data.message || 'Mensagem processada!';

  } catch (error) {
    console.error('❌ Erro no chat:', error);
    return 'Erro ao processar mensagem. Tente novamente.';
  }
};

/**
 * ✅ ENVIA ARQUIVOS para o webhook de DADOS
 */
const sendFileToDataWebhook = async (
  file: File, 
  sessionId: string, 
  message: string = ''
): Promise<string> => {
  try {
    console.log('📖 Lendo arquivo para webhook de DADOS:', file.name);
    const fileContent = await readFileAsText(file);

    // ✅ EXTRAI TOKEN DA MENSAGEM (se o usuário enviou token junto)
    const userToken = extractTokenFromMessage(message);

    const payload = {
      sessionId: sessionId,
      chatInput: message || `Upload de CSV: ${file.name}`,
      action: 'process_csv',
      timestamp: new Date().toISOString(),
      token: userToken || 'bf18117f82dfafb9354109b4b4b4f8cc1804d8cecca2e8dad5', // Token dinâmico
      // ✅ DADOS DO ARQUIVO
      fileContent: fileContent,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      hasFile: true,
      // ✅ DADOS ADICIONAIS
      empresa: 'Onboarding | Olha o Mistério',
      processType: 'csv_upload'
    };

    console.log('🚀 Enviando para DADOS:', {
      fileName: file.name,
      contentLength: fileContent.length,
      tokenLength: payload.token.length,
      sessionId: sessionId
    });

    const response = await fetch(DATA_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📨 Status DADOS:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro DADOS:', errorText);
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Resposta dos DADOS:', data);

    return data.output || data.response || data.message || 'Arquivo processado com sucesso!';

  } catch (error) {
    console.error('❌ Erro ao enviar arquivo:', error);
    return 'Erro ao processar arquivo. Tente novamente.';
  }
};

/**
 * Extrai token da mensagem do usuário
 */
const extractTokenFromMessage = (message: string): string | undefined => {
  const tokenPattern = /[a-fA-F0-9]{40,64}/;
  const match = message.match(tokenPattern);
  return match ? match[0] : undefined;
};

/**
 * Processa arquivo CSV via webhook de DADOS
 */
export const processCSVFile = async (
  file: File, 
  token: string, 
  sessionId: string
): Promise<any> => {
  try {
    const fileContent = await readFileAsText(file);

    const payload = {
      sessionId: sessionId,
      chatInput: `Upload de CSV: ${file.name}`,
      action: 'process_csv',
      token: token,
      timestamp: new Date().toISOString(),
      fileContent: fileContent,
      fileName: file.name,
      hasFile: true,
      empresa: 'Onboarding | Olha o Mistério',
      processType: 'csv_upload'
    };

    console.log('📁 Processando CSV via DADOS:', file.name);

    const response = await fetch(DATA_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📨 Resposta CSV:', response.status);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('❌ Erro ao processar CSV:', error);
    return {
      success: false,
      message: 'Erro ao processar arquivo CSV.'
    };
  }
};

/**
 * Testa a conexão com AMBOS webhooks
 */
export const testOnbotConnection = async (): Promise<{ status: 'success' | 'error'; message: string }> => {
  try {
    // ✅ TESTA WEBHOOK DE CHAT
    const chatPayload = {
      sessionId: 'health_check',
      chatInput: 'health_check',
      action: 'health_check',
      timestamp: new Date().toISOString()
    };

    const chatResponse = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(chatPayload),
    });

    // ✅ TESTA WEBHOOK DE DADOS
    const dataPayload = {
      sessionId: 'health_check',
      chatInput: 'health_check',
      action: 'health_check',
      timestamp: new Date().toISOString(),
      token: 'health_check_token'
    };

    const dataResponse = await fetch(DATA_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(dataPayload),
    });

    if (chatResponse.ok && dataResponse.ok) {
      return { status: 'success', message: 'Conectado a ambos webhooks' };
    } else {
      return { status: 'error', message: 'Erro em um ou ambos webhooks' };
    }

  } catch (error) {
    return { status: 'error', message: 'Erro de conexão' };
  }
};