// src/services/testConnection.ts
export const testN8nConnection = async () => {
  try {
    console.log('🧪 Testando conexão com n8n...');
    
    const response = await fetch('https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatInput: 'Teste de conexão',
        sessionId: 'test-session',
        timestamp: new Date().toISOString()
      }),
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', response.headers);
    
    const text = await response.text();
    console.log('📊 Response:', text);
    
    return { success: response.ok, status: response.status, data: text };
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
};