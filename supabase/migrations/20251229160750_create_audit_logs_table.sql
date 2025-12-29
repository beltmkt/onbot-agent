/*
  # Tabela de Logs de Auditoria

  ## Nova Tabela: audit_logs
  
  Esta tabela registra todas as ações importantes realizadas na plataforma para fins de auditoria corporativa.
  
  ### Colunas:
  - `id` (uuid, primary key) - Identificador único do log
  - `user_email` (text) - Email do usuário que realizou a ação
  - `user_id` (uuid, nullable) - ID do usuário autenticado (se disponível)
  - `action_type` (text) - Tipo de ação (csv_upload, token_validation, user_creation, etc)
  - `file_name` (text, nullable) - Nome do arquivo enviado (se aplicável)
  - `file_size` (integer, nullable) - Tamanho do arquivo em bytes
  - `status` (text) - Status da operação (success, error, pending)
  - `error_message` (text, nullable) - Mensagem de erro (se houver)
  - `metadata` (jsonb) - Dados adicionais da operação
  - `ip_address` (text, nullable) - IP do usuário
  - `user_agent` (text, nullable) - User agent do navegador
  - `created_at` (timestamptz) - Data e hora da ação
  
  ### Segurança:
  - RLS habilitado
  - Apenas usuários autenticados podem ler seus próprios logs
  - Sistema pode inserir logs para qualquer usuário
  
  ### Índices:
  - Índice em user_email para consultas rápidas por usuário
  - Índice em created_at para consultas temporais
  - Índice em action_type para filtros por tipo de ação
*/

-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_id uuid,
  action_type text NOT NULL,
  file_name text,
  file_size integer,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários autenticados podem ler apenas seus próprios logs
CREATE POLICY "Users can read own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = user_email);

-- Policy: Sistema pode inserir logs (via service role)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Ninguém pode atualizar ou deletar logs (imutabilidade)
CREATE POLICY "Audit logs are immutable"
  ON audit_logs
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Audit logs cannot be deleted"
  ON audit_logs
  FOR DELETE
  TO authenticated
  USING (false);

-- Criar função para facilitar inserção de logs
CREATE OR REPLACE FUNCTION log_audit_action(
  p_user_email text,
  p_user_id uuid,
  p_action_type text,
  p_file_name text DEFAULT NULL,
  p_file_size integer DEFAULT NULL,
  p_status text DEFAULT 'success',
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    user_email,
    user_id,
    action_type,
    file_name,
    file_size,
    status,
    error_message,
    metadata
  ) VALUES (
    p_user_email,
    p_user_id,
    p_action_type,
    p_file_name,
    p_file_size,
    p_status,
    p_error_message,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
