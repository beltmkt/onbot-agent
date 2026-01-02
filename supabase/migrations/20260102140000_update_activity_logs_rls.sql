-- Define the list of admin emails
CREATE OR REPLACE FUNCTION get_admin_emails()
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY[
    'alisson@c2sglobal',
    'mario@c2sglobal.com',
    'gabriel.lima@c2sglobal.com',
    'pedro@c2sglobal.com',
    'vitor@c2sglobal.com'
  ];
END;
$$ LANGUAGE plpgsql;

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can read own audit logs" ON activity_logs;

-- Create a new policy that allows admins to read all logs,
-- and other users to read only their own.
CREATE POLICY "Users can read own audit logs and admins can read all"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = ANY (get_admin_emails())
    OR
    (auth.jwt() ->> 'email') = user_email
  );
