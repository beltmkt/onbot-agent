import { supabase } from '../lib/supabase';

export interface AuditLogData {
  userEmail: string;
  userId?: string;
  actionType: 'csv_upload' | 'token_validation' | 'user_creation' | 'login' | 'logout' | 'export_data' | 'login_attempt' | 'profile_update' | 'session_restored';
  fileName?: string;
  fileSize?: number;
  status: 'success' | 'error' | 'pending';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export const auditService = {
  async createLog(data: AuditLogData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('activity_logs').insert({
        user_email: data.userEmail,
        user_id: data.userId,
        action_type: data.actionType,
        file_name: data.fileName,
        file_size: data.fileSize,
        status: data.status,
        error_message: data.errorMessage,
        metadata: data.metadata || {},
      });

      if (error) {
        console.error('Erro ao criar log de auditoria:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao criar log de auditoria:', error);
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
        console.error('Erro ao buscar logs:', error);
        return { data: null, error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
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
