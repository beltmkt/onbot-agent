-- Add duration_seconds column to activity_logs table
ALTER TABLE activity_logs ADD COLUMN duration_seconds INTEGER;

-- Update the log_activity function to include the new column
DROP FUNCTION IF EXISTS log_activity(text, uuid, text, text, integer, text, text, jsonb);

CREATE OR REPLACE FUNCTION log_activity(
  p_user_email text,
  p_user_id uuid,
  p_action_type text,
  p_file_name text DEFAULT NULL,
  p_file_size integer DEFAULT NULL,
  p_status text DEFAULT 'success',
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_duration_seconds integer DEFAULT NULL
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
    metadata,
    duration_seconds
  ) VALUES (
    p_user_email,
    p_user_id,
    p_action_type,
    p_file_name,
    p_file_size,
    p_status,
    p_error_message,
    p_metadata,
    p_duration_seconds
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
