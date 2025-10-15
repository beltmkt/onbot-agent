/*
  # Create N8N Callbacks Table

  1. New Tables
    - `n8n_callbacks`
      - `id` (uuid, primary key)
      - `token` (text) - Token usado na operação
      - `success` (boolean) - Se a operação foi bem-sucedida
      - `status` (text) - Status da operação
      - `message` (text) - Mensagem de retorno
      - `error` (text) - Mensagem de erro (se houver)
      - `empresa` (text) - Nome da empresa
      - `operation` (text) - Tipo de operação (validation, processing, upload)
      - `payload` (jsonb) - Payload completo do N8N
      - `created_at` (timestamptz) - Timestamp da criação
      
  2. Security
    - Enable RLS on `n8n_callbacks` table
    - Add policy for service role to insert callbacks
    - Add policy for authenticated users to read their own callbacks
    
  3. Indexes
    - Index on token for faster lookups
    - Index on created_at for time-based queries
*/

CREATE TABLE IF NOT EXISTS n8n_callbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text,
  success boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  message text,
  error text,
  empresa text,
  operation text DEFAULT 'validation',
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE n8n_callbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert callbacks"
  ON n8n_callbacks
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read callbacks"
  ON n8n_callbacks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_n8n_callbacks_token ON n8n_callbacks(token);
CREATE INDEX IF NOT EXISTS idx_n8n_callbacks_created_at ON n8n_callbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n8n_callbacks_operation ON n8n_callbacks(operation);
