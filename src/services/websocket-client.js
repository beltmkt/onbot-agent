// src/services/websocket-client.js
export class WebSocketChatClient {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.ws = null;
    this.messageHandlers = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('ws://localhost:8081');

        this.ws.onopen = () => {
          console.log('✅ Connected to WebSocket server');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => handler(message));
          } catch (error) {
            console.error('❌ Error parsing message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('❌ WebSocket connection closed');
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  sendMessage(content) {
    if (this.ws && this.ws.readyState === 1) { // 1 = OPEN
      const message = {
        type: 'user_message',
        sessionId: this.sessionId,
        content: content,
        timestamp: new Date().toISOString()
      };
      
      this.ws.send(JSON.stringify(message));
      console.log('📨 Sent message:', content);
    } else {
      console.error('❌ WebSocket not connected');
    }
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default WebSocketChatClient;