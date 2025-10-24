// api/n8n-webhook.js
import { sendToSession } from './src/api/websocket-server.js';

// 🔐 TOKEN 
const EXPECTED_TOKEN = 'zyobpHbtZ6uD4KI8OIL9BZjIaDrQZrl7Oqa6o9X4DX7YPRbqemi9HdBrRpQgCgUTH';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, response, authorization } = req.body;

    console.log('📨 Webhook received from n8n');

    // Verificar token
    if (!authorization || authorization !== `Bearer ${EXPECTED_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    // Enviar via WebSocket
    const messageContent = typeof response === 'string' ? response : 
                          (response?.output || response?.response || JSON.stringify(response));
    
    const success = sendToSession(sessionId, messageContent);

    if (success) {
      res.status(200).json({ 
        success: true, 
        message: 'Message sent via WebSocket',
        sessionId
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'No active WebSocket connection',
        sessionId
      });
    }

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}