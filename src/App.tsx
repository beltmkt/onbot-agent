// src/services/onbotService.ts
const ONBOT_API_URL = import.meta.env.VITE_ONBOT_API_URL || 'https://sua-api-onbot.com/api';

interface OnbotResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface ConnectionTestResult {
  status: 'success' | 'error';
  message: string;
}

/**
 * Testa a conexão com o serviço OnBot
 */
export const testOnbotConnection = async (): Promise<ConnectionTestResult> => {
  try {
    const response = await fetch(`${ONBOT_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return {
        status: 'success',
        message: 'Conexão estabelecida com sucesso'
      };
    } else {
      return {
        status: 'error',
        message: 'Serviço indisponível'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return {
      status: 'error',
      message: 'Erro de conexão com o serviço'
    };
  }
};

/**
 * Envia mensagem para o OnBot AI
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('sessionId', sessionId);
    
    if (file) {
      formData.append('file', file);
    }

    const response = await fetch(`${ONBOT_API_URL}/chat`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data: OnbotResponse = await response.json();
    
    if (data.success) {
      return data.message || 'Mensagem processada com sucesso!';
    } else {
      throw new Error(data.message || 'Erro ao processar mensagem');
    }
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem para OnBot:', error);
    
    if (error instanceof Error) {
      throw new Error(`Falha na comunicação: ${error.message}`);
    }
    
    throw new Error('Erro desconhecido ao comunicar com OnBot AI');
  }
};

/**
 * Processa arquivo CSV via webhook n8n
 */
export const processCSVFile = async (file: File, token: string): Promise<OnbotResponse> => {
  try {
    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('token', token);

    const response = await fetch(`${ONBOT_API_URL}/process-csv`, {
      method: 'POST',
      body: formData,
    });

    const data: OnbotResponse = await response.json();
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao processar arquivo CSV:', error);
    return {
      success: false,
      message: 'Erro ao processar arquivo CSV'
    };
  }
};