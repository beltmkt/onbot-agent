import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// ✅ MANTER O SERVIDOR ATIVO
const wss = new WebSocketServer({ port: 8081 });

// ✅ VARIÁVEIS GLOBAIS
const clients = new Map();
const sessions = new Map();

console.log('🚀 WebSocket Chat Server running on port 8081');

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  clients.set(clientId, ws);
  
  console.log(`✅ Client connected: ${clientId}`);
  console.log(`📊 Total clients: ${clients.size}`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received:', message);

      if (message.sessionId && message.type === 'user_message') {
        sessions.set(message.sessionId, clientId);
        console.log(`📝 Session registered: ${message.sessionId} -> ${clientId}`);
      }

      // ✅ RESPOSTA SIMPLES PARA TESTE
      const response = {
        type: 'bot_response',
        sessionId: message.sessionId || 'unknown',
        content: `OnBot: Recebi "${message.content}". WebSocket funcionando! 🚀`,
        timestamp: new Date().toISOString(),
        messageId: uuidv4()
      };
      
      ws.send(JSON.stringify(response));
      console.log(`📤 Sent response to ${clientId}`);

    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`❌ Client disconnected: ${clientId}`);
    clients.delete(clientId);
    
    for (const [sessionId, cId] of sessions.entries()) {
      if (cId === clientId) {
        sessions.delete(sessionId);
        console.log(`🗑️ Session removed: ${sessionId}`);
        break;
      }
    }
    
    console.log(`📊 Remaining clients: ${clients.size}`);
  });

  // ✅ MENSAGEM DE BOAS-VINDAS
  const welcomeMessage = {
    type: 'system',
    content: 'Conectado ao OnBot Chat - WebSocket funcionando! 🚀',
    timestamp: new Date().toISOString(),
    sessionId: 'system',
    messageId: uuidv4()
  };
  
  ws.send(JSON.stringify(welcomeMessage));
});

// ✅ FUNÇÃO PARA O N8N ENVIAR MENSAGENS
function sendToSession(sessionId, response) {
  const clientId = sessions.get(sessionId);
  if (clientId) {
    const ws = clients.get(clientId);
    if (ws && ws.readyState === 1) {
      const message = {
        type: 'bot_response',
        sessionId,
        content: response,
        timestamp: new Date().toISOString(),
        messageId: uuidv4()
      };
      ws.send(JSON.stringify(message));
      console.log(`📤 Sent to session ${sessionId}:`, response.substring(0, 50));
      return true;
    }
  }
  console.log(`❌ No client found for session: ${sessionId}`);
  return false;
}

// ✅ EXPORTAR FUNÇÕES
export { sendToSession, clients, sessions };

// ✅ MANTER O PROCESSO ATIVO
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// ✅ LOG PARA CONFIRMAR QUE ESTÁ RODANDO
setInterval(() => {
  console.log(`💓 WebSocket Server heartbeat - Clients: ${clients.size}, Sessions: ${sessions.size}`);
}, 30000);