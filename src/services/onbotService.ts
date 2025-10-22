// src/services/onbotService.ts
// 🚀 VERSÃO ROBUSTA E COMPLETA - ESPECIALISTA

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  CHAT_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat',
  DATA_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/dados_recebidos',
  JWT_TOKEN: import.meta.env.VITE_JWT_TOKEN,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3
} as const;

// ==================== TIPOS ====================
interface EmpresaSelection {
  numero: number;
  nome: string;
  id: string;
}

interface FileData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  content: string;
  lastModified: number;
  encoding: string;
}

interface WebhookPayload {
  sessionId: string;
  chatInput: string;
  action: string;
  timestamp: string;
  token: string;
  empresa?: string;
  processType?: string;
  fileData?: FileData;
  isEmpresaSelection?: boolean;
  selectedEmpresa?: string;
}

interface ApiResponse {
  success: boolean;
  output?: string;
  response?: string;
  message?: string;
  error?: string;
}

// ==================== UTILITÁRIOS ====================
class FileProcessor {
  /**
   * Valida arquivo antes do processamento
   */
  static validateFile(file: File): void {
    if (!file) {
      throw new Error('Nenhum arquivo fornecido');
    }

    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('O arquivo deve ser um CSV válido');
    }

    if (file.size === 0) {
      throw new Error('O arquivo está vazio');
    }

    if (file.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande. Máximo: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
  }

  /**
   * Lê conteúdo do arquivo como texto
   */
  static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Falha ao ler conteúdo do arquivo'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error(`Erro na leitura do arquivo: ${file.name}`));
      };
      
      reader.onabort = () => {
        reject(new Error('Leitura do arquivo abortada'));
      };

      // Timeout de segurança
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('Timeout na leitura do arquivo'));
      }, 10000);

      reader.onloadend = () => clearTimeout(timeout);
      
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Lê arquivo como Base64 (alternativa)
   */
  static readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = (event.target.result as string).split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Falha ao converter arquivo para Base64'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erro na conversão para Base64'));
      };
      
      reader.readAsDataURL(file);
    });
  }
}

class SessionManager {
  /**
   * Gera session ID único
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Valida session ID
   */
  static validateSessionId(sessionId: string): boolean {
    return typeof sessionId === 'string' && sessionId.length > 10 && sessionId.startsWith('session_');
  }
}

class TokenManager {
  /**
   * Gera token seguro
   */
  static generateToken(): string {
    const randomPart1 = Math.random().toString(36).substr(2, 16);
    const randomPart2 = Math.random().toString(36).substr(2, 16);
    const randomPart3 = Math.random().toString(36).substr(2, 16);
    return `${randomPart1}${randomPart2}${randomPart3}`.substr(0, 48);
  }

  /**
   * Extrai token da mensagem
   */
  static extractTokenFromMessage(message: string): string | null {
    const tokenPattern = /[a-fA-F0-9]{40,64}/;
    const match = message.match(tokenPattern);
    return match ? match[0] : null;
  }

  /**
   * Valida formato do token
   */
  static validateToken(token: string): boolean {
    return typeof token === 'string' && token.length >= 40 && token.length <= 64 && /^[a-fA-F0-9]+$/.test(token);
  }
}

// ==================== SERVIÇO PRINCIPAL ====================
class OnbotService {
  private retryCount: number = 0;

  /**
   * 🎯 MÉTODO PRINCIPAL: Envia mensagens e arquivos para o webhook
   */
  async sendMessageToOnbot(
    message: string, 
    sessionId: string, 
    file?: File
  ): Promise<string> {
    try {
      this.retryCount = 0;
      
      // Validações básicas
      this.validateInput(message, sessionId);

      // 🎯 FLUXO 1: PROCESSAMENTO DE ARQUIVO
      if (file) {
        console.log('📁 Arquivo detectado - iniciando processamento...', {
          name: file.name,
          size: file.size,
          type: file.type
        });
        return await this.processFileUpload(file, sessionId, message);
      }

      // 🎯 FLUXO 2: SELEÇÃO DE EMPRESA
      const empresaSelection = this.detectEmpresaSelection(message);
      if (empresaSelection) {
        console.log('🏢 Seleção de empresa detectada:', empresaSelection);
        return await this.sendEmpresaSelection(empresaSelection, sessionId);
      }

      // 🎯 FLUXO 3: MENSAGEM NORMAL
      return await this.sendChatMessage(message, sessionId);

    } catch (error) {
      console.error('❌ Erro no processamento principal:', error);
      return this.handleError(error);
    }
  }

  /**
   * 📤 ENVIA MENSAGEM DE CHAT
   */
  private async sendChatMessage(message: string, sessionId: string): Promise<string> {
    const payload: WebhookPayload = {
      sessionId: sessionId,
      chatInput: message,
      action: 'chat_message',
      timestamp: new Date().toISOString(),
      token: TokenManager.generateToken()
    };

    console.log('💬 Enviando mensagem de chat:', { message, sessionId });

    const response = await this.makeRequest(CONFIG.CHAT_WEBHOOK_URL, payload);
    return this.parseResponse(response);
  }

  /**
   * 📁 PROCESSAMENTO ROBUSTO DE ARQUIVOS
   */
  private async processFileUpload(file: File, sessionId: string, message: string = ''): Promise<string> {
    try {
      // 🔒 VALIDAÇÃO DO ARQUIVO
      FileProcessor.validateFile(file);

      // 📖 LEITURA DO CONTEÚDO
      console.log('📖 Lendo conteúdo do arquivo...', file.name);
      const fileContent = await FileProcessor.readFileAsText(file);
      
      console.log('✅ Conteúdo lido com sucesso:', {
        fileName: file.name,
        contentLength: fileContent.length,
        lines: fileContent.split('\n').length
      });

      // 🚀 PREPARAÇÃO DO PAYLOAD
      const payload: WebhookPayload = {
        sessionId: sessionId,
        chatInput: message || `Upload de CSV: ${file.name}`,
        action: 'process_csv',
        timestamp: new Date().toISOString(),
        token: TokenManager.generateToken(),
        empresa: 'Onboarding | Olha o Mistério',
        processType: 'csv_upload',
        fileData: {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          content: fileContent, // ✅ CONTEÚDO REAL DO CSV
          lastModified: file.lastModified,
          encoding: 'utf-8'
        }
      };

      console.log('🚀 Enviando arquivo para processamento:', {
        fileName: file.name,
        sessionId: sessionId,
        contentSize: fileContent.length
      });

      // 📨 ENVIO PARA WEBHOOK
      const response = await this.makeRequest(CONFIG.DATA_WEBHOOK_URL, payload);
      return this.parseResponse(response);

    } catch (error) {
      console.error('❌ Erro no processamento do arquivo:', error);
      throw new Error(`Falha no upload do arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * 🏢 PROCESSAMENTO DE SELEÇÃO DE EMPRESA
   */
  private async sendEmpresaSelection(empresa: EmpresaSelection, sessionId: string): Promise<string> {
    const payload: WebhookPayload = {
      sessionId: sessionId,
      chatInput: `Selecionar empresa: ${empresa.numero} - ${empresa.nome}`,
      action: 'select_empresa',
      timestamp: new Date().toISOString(),
      token: TokenManager.generateToken(),
      empresa: empresa.nome,
      isEmpresaSelection: true,
      selectedEmpresa: empresa.nome
    };

    console.log('🏢 Enviando seleção de empresa:', empresa);

    const response = await this.makeRequest(CONFIG.CHAT_WEBHOOK_URL, payload);
    return this.parseResponse(response);
  }

  /**
   * 🔍 DETECTA SELEÇÃO DE EMPRESA
   */
  private detectEmpresaSelection(message: string): EmpresaSelection | null {
    const cleanMessage = message.trim();
    
    const empresas = [
      { numero: 1, nome: 'Onboarding', id: 'onboarding' },
      { numero: 2, nome: 'Onboarding | Joinville', id: 'onboarding-joinville' },
      { numero: 3, nome: 'Onboarding | Olha o Mistério', id: 'onboarding-olha-o-misterio' }
    ];

    const selected = empresas.find(emp => emp.numero.toString() === cleanMessage);
    return selected || null;
  }

  /**
   * 🌐 REQUISIÇÃO HTTP ROBUSTA COM RETRY
   */
  private async makeRequest(url: string, payload: WebhookPayload, attempt: number = 1): Promise<Response> {
    try {
      console.log(`🌐 Tentativa ${attempt} para:`, url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
          'X-Request-ID': this.generateRequestId(),
          'User-Agent': 'OnbotService/2.0.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;

    } catch (error) {
      if (attempt < CONFIG.RETRY_ATTEMPTS && this.shouldRetry(error)) {
        console.warn(`🔄 Retentativa ${attempt + 1} após erro:`, error);
        await this.delay(1000 * attempt); // Backoff exponencial
        return this.makeRequest(url, payload, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * ⏰ DELAY PARA RETRY
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🔄 DECIDE SE DEVE TENTAR NOVAMENTE
   */
  private shouldRetry(error: any): boolean {
    // Retry em erros de rede, timeout e servidor 5xx
    if (error.name === 'AbortError') return true; // Timeout
    if (error.message?.includes('Failed to fetch')) return true; // Erro de rede
    if (error.message?.includes('50')) return true; // Erro do servidor
    
    return false;
  }

  /**
   * 🆔 GERA ID ÚNICO PARA REQUISIÇÃO
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 📋 PARSE DA RESPOSTA
   */
  private parseResponse(response: Response): string {
    return response.json().then((data: ApiResponse) => {
      if (data.output) return data.output;
      if (data.response) return data.response;
      if (data.message) return data.message;
      return 'Processado com sucesso!';
    });
  }

  /**
   * 🔒 VALIDAÇÃO DE INPUT
   */
  private validateInput(message: string, sessionId: string): void {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Mensagem inválida ou vazia');
    }

    if (!SessionManager.validateSessionId(sessionId)) {
      throw new Error('Session ID inválido');
    }
  }

  /**
   * 🛑 TRATAMENTO DE ERROS
   */
  private handleError(error: any): string {
    if (error.name === 'AbortError') {
      return '⏰ Timeout: O servidor demorou muito para responder. Tente novamente.';
    }

    if (error.message?.includes('Failed to fetch')) {
      return '🌐 Erro de conexão: Verifique sua internet e tente novamente.';
    }

    if (error.message?.includes('HTTP 5')) {
      return '🔧 Erro no servidor: Tente novamente em alguns instantes.';
    }

    if (error.message?.includes('HTTP 4')) {
      return '❌ Erro na requisição: Verifique os dados e tente novamente.';
    }

    return `❌ Erro: ${error.message || 'Erro desconhecido'}`;
  }

  /**
   * 🧪 TESTE DE CONEXÃO
   */
  async testConnection(): Promise<{ status: 'success' | 'error'; message: string; timestamp: string }> {
    try {
      const payload: WebhookPayload = {
        sessionId: SessionManager.generateSessionId(),
        chatInput: 'health_check',
        action: 'health_check',
        timestamp: new Date().toISOString(),
        token: TokenManager.generateToken()
      };

      const response = await fetch(CONFIG.CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { 
          status: 'success', 
          message: '✅ Conexão estabelecida com sucesso',
          timestamp: new Date().toISOString()
        };
      } else {
        return { 
          status: 'error', 
          message: `❌ Erro HTTP ${response.status}`,
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      return { 
        status: 'error', 
        message: `❌ Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 📊 ESTATÍSTICAS DO SERVIÇO
   */
  getServiceStats() {
    return {
      maxFileSize: CONFIG.MAX_FILE_SIZE,
      timeout: CONFIG.TIMEOUT,
      retryAttempts: CONFIG.RETRY_ATTEMPTS,
      version: '2.0.0'
    };
  }
}

// ==================== EXPORTAÇÃO ====================
// Instância singleton para uso em toda a aplicação
const onbotService = new OnbotService();

// Exportações principais
export const {
  sendMessageToOnbot,
  testConnection,
  getServiceStats
} = onbotService;

// Exportações para uso avançado
export { OnbotService, FileProcessor, SessionManager, TokenManager };
export type { EmpresaSelection, FileData, WebhookPayload, ApiResponse };

// Métodos legados mantidos para compatibilidade
export const processCSVFile = onbotService.sendMessageToOnbot.bind(onbotService);
export const testOnbotConnection = onbotService.testConnection.bind(onbotService);