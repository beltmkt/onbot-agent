// src/api/websocket-server.js
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const wss = new WebSocketServer({ port: 8081 });
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

      // Simular resposta do n8n
      setTimeout(() => {
        const response = {
          type: 'bot_response',
          sessionId: message.sessionId || 'unknown',
          content: `OnBot: Recebi "${message.content}". WebSocket funcionando! 🚀`,
          timestamp: new Date().toISOString(),
          messageId: uuidv4()
        };
        
        sendToClient(clientId, response);
      }, 500);

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

  // Mensagem de boas-vindas
  const welcomeMessage = {
    type: 'system',
    content: 'Conectado ao OnBot Chat - WebSocket funcionando! 🚀',
    timestamp: new Date().toISOString(),
    sessionId: 'system',
    messageId: uuidv4()
  };
  
  ws.send(JSON.stringify(welcomeMessage));
});

function sendToClient(clientId, message) {
  const ws = clients.get(clientId);
  if (ws && ws.readyState === 1) { // 1 = OPEN
    ws.send(JSON.stringify(message));
    console.log(`📤 Sent to ${clientId}:`, message.content.substring(0, 50) + '...');
    return true;
  }
  return false;
}

export function sendToSession(sessionId, response) {
  const clientId = sessions.get(sessionId);
  if (clientId) {
    return sendToClient(clientId, {
      type: 'bot_response',
      sessionId,
      content: response,
      timestamp: new Date().toISOString(),
      messageId: uuidv4()
    });
  }
  console.log(`❌ No client found for session: ${sessionId}`);
  return false;
}

// Manter a instância do servidor
export { wss, clients, sessions };