import { supabase } from '../lib/supabase';

export interface AuditLogData {
  userEmail: string;
  userId?: string;
  actionType: 'csv_upload' | 'token_validation' | 'user_creation' | 'login' | 'logout' | 'export_data' | 'login_attempt' | 'profile_update' | 'session_restored' | 'team_creation' | 'chat_message' | 'process_spreadsheet' | 'test_connection';
  fileName?: string;
  fileSize?: number;
  status: 'success' | 'error' | 'pending';
  errorMessage?: string;
  metadata?: Record<string, any>;
  duration_seconds?: number;
}

export const auditService = {
  async createLog(data: AuditLogData): Promise<{ success: boolean; error?: string }> {
    try {
      // Adicionado para evitar logs duplicados de 'login' e 'session_restored' no mesmo dia
      if (data.actionType === 'login' || data.actionType === 'session_restored') {
        if (data.userId) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const { data: existingLog, error: selectError } = await supabase
            .from('activity_logs')
            .select('id')
            .eq('user_id', data.userId)
            .in('action_type', ['login', 'session_restored'])
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
            .limit(1);

          if (selectError) {
            console.error('Erro ao verificar log existente:', selectError.message);
            // Prosseguir com a criação do log mesmo em caso de erro na verificação
          } else if (existingLog && existingLog.length > 0) {
            // Log de check-in já existe para hoje, então não faz nada.
            return { success: true };
          }
        }
      }

      const { error } = await supabase.from('activity_logs').insert({
        user_email: data.userEmail,
        user_id: data.userId,
        action_type: data.actionType,
        file_name: data.fileName,
        file_size: data.fileSize,
        status: data.status,
        error_message: data.errorMessage,
        metadata: data.metadata || {},
        duration_seconds: data.duration_seconds,
      });

      if (error) {
        console.error('Erro ao criar log de auditoria:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao criar log de auditoria:', error instanceof Error ? error.message : 'Erro desconhecido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  },

  async getUserLogs(userEmail: string): Promise<{ data: any[] | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Erro ao buscar logs:', error.message);
        return { data: null, error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Erro ao buscar logs:', error instanceof Error ? error.message : 'Erro desconhecido');
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  },

  async logCSVUpload(
    userEmail: string,
    userId: string | undefined,
    fileName: string,
    fileSize: number,
    status: 'success' | 'error' | 'pending',
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.createLog({
      userEmail,
      userId,
      actionType: 'csv_upload',
      fileName,
      fileSize,
      status,
      errorMessage,
      metadata,
    });
  },

  async logLogin(userEmail: string, userId?: string): Promise<void> {
    await this.createLog({
      userEmail,
      userId,
      actionType: 'login',
      status: 'success',
    });
  },

  async logLogout(userEmail: string, userId?: string): Promise<void> {
    await this.createLog({
      userEmail,
      userId,
      actionType: 'logout',
      status: 'success',
    });
  },
};
