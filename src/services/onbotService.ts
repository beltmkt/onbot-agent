// src/services/onbotService.ts - VERSÃO SIMPLIFICADA
export const sendMessageToOnbot = async (message: string, sessionId: string): Promise<string> => {
  try {
    const response = await fetch('https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatInput: message,
        sessionId: sessionId
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const responseText = await response.text();
    
    // ✅ EXTRAÇÃO DIRETA: Junta todos os conteúdos dos itens
    const finalResponse = responseText
      .split('\n')
      .map(line => {
        try {
          const data = JSON.parse(line);
          return data.type === 'item' && data.content ? data.content : '';
        } catch {
          return '';
        }
      })
      .filter(content => content.length > 0)
      .join(' ')
      .replace(/\\n/g, '\n')
      .replace(/\\\\/g, '\\')
      .trim();

    console.log('✅ Resposta completa:', finalResponse);
    return finalResponse;

  } catch (error) {
    console.error('Erro no serviço onbot:', error);
    throw error;
  }
};