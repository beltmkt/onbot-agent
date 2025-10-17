// src/services/onbotService.ts
export const sendMessageToOnbot = async (
  message: string,
  sessionId: string,
  file?: File
): Promise<string> => {
  try {
    console.log('🔄 Enviando para n8n:', { message, sessionId, hasFile: !!file });

    const url = 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat';

    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatInput', message);
      formData.append('sessionId', sessionId);

      const response = await fetch(url, { 
        method: 'POST', 
        body: formData 
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const responseText = await response.text();
      return processN8NResponse(responseText);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatInput: message, sessionId }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const responseText = await response.text();
    return processN8NResponse(responseText);

  } catch (error) {
    console.error('❌ Erro no serviço OnBot:', error);
    throw error;
  }
};

const processN8NResponse = (responseText: string): string => {
  try {
    const data = JSON.parse(responseText);
    return data.output || data.content || data.message || responseText;
  } catch {
    return responseText;
  }
};