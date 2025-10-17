// src/services/onbotService.ts
export const sendMessageToOnbot = async (message: string, sessionId: string, file?: File): Promise<string> => {
  try {
    console.log('🚀 Enviando para n8n:', { message, sessionId, hasFile: !!file });

    const formData = new FormData();
    formData.append('chatInput', message);
    formData.append('sessionId', sessionId);
    
    if (file) {
      formData.append('file', file);
      console.log('📁 Arquivo anexado:', file.name, file.type, file.size);
    }

    const response = await fetch('https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat', {
      method: 'POST',
      body: formData, // ✅ Mude para FormData para suportar arquivos
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('📨 Resposta bruta do n8n:', responseText);

    // Estratégias de extração (mantenha seu código atual)
    let finalResponse = '';

    try {
      const jsonData = JSON.parse(responseText);
      if (jsonData.response || jsonData.message) {
        finalResponse = jsonData.response || jsonData.message;
      } else if (jsonData.content) {
        finalResponse = jsonData.content;
      }
    } catch (jsonError) {
      const lines = responseText.split('\n').filter(line => line.trim());
      const contents: string[] = [];
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === 'item' && data.content) {
            contents.push(data.content);
          } else if (data.content) {
            contents.push(data.content);
          } else if (data.response) {
            contents.push(data.response);
          }
        } catch (lineError) {
          if (line.trim() && !line.includes('event:') && !line.includes('data:')) {
            contents.push(line.trim());
          }
        }
      }
      
      finalResponse = contents.join(' ').replace(/\\n/g, '\n').replace(/\\\\/g, '\\').trim();
    }

    if (!finalResponse) {
      finalResponse = responseText
        .replace(/\\n/g, '\n')
        .replace(/\\\\/g, '\\')
        .replace(/event:.*\n/g, '')
        .replace(/data:.*\n/g, '')
        .trim();
    }

    if (!finalResponse) {
      finalResponse = '✅ Mensagem recebida! Processando...';
    }

    console.log('✅ Resposta processada:', finalResponse);
    return finalResponse;

  } catch (error) {
    console.error('❌ Erro no serviço onbot:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return '🔌 Erro de conexão: Não foi possível conectar ao servidor.';
      } else if (error.message.includes('HTTP')) {
        return '🌐 Erro no servidor: Tente novamente.';
      }
    }
    
    return '⚠️ Ocorreu um erro inesperado. Por favor, tente novamente.';
  }
};