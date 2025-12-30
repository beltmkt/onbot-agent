/*
  # Renomear tabela audit_logs para activity_logs
  
  Esta migration renomeia a tabela de auditoria para um nome mais genérico
  que está alinhado com o código frontend (activity_logs).
*/

-- Renomear a tabela
ALTER TABLE IF EXISTS audit_logs RENAME TO activity_logs;

-- Renomear índices
ALTER INDEX IF EXISTS idx_audit_logs_user_email RENAME TO idx_activity_logs_user_email;
ALTER INDEX IF EXISTS idx_audit_logs_created_at RENAME TO idx_activity_logs_created_at;
ALTER INDEX IF EXISTS idx_audit_logs_action_type RENAME TO idx_activity_logs_action_type;
ALTER INDEX IF EXISTS idx_audit_logs_status RENAME TO idx_activity_logs_status;

-- Atualizar função (drop e recreate com novo nome)
DROP FUNCTION IF EXISTS log_audit_action(text, uuid, text, text, integer, text, text, jsonb);

CREATE OR REPLACE FUNCTION log_activity(
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
  INSERT INTO activity_logs (
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

-- Atualizar policies (opcional, como documentação)
-- As políticas RLS já estão configuradas na tabela activity_logs após o rename
