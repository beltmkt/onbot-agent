/*
  # C2S CreateSeller Database Schema

  ## Overview
  Creates the database structure for the C2S CreateSeller application to manage
  token validation, company information, and user creation processing.

  ## New Tables

  ### 1. `token_validations`
  Stores token validation history and company information
  - `id` (uuid, primary key)
  - `token` (text) - Company token from Contact2Sale
  - `is_valid` (boolean) - Token validation status
  - `company_name` (text) - Name of the validated company
  - `company_id` (text) - UUID of the company in Contact2Sale
  - `teams` (jsonb) - Array of team objects with id and name
  - `validated_at` (timestamptz) - When validation occurred
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `csv_processing_logs`
  Tracks CSV file processing and user creation results
  - `id` (uuid, primary key)
  - `token_validation_id` (uuid, foreign key) - Links to token validation
  - `total_users` (integer) - Total users in CSV
  - `users_created` (integer) - Successfully created users
  - `users_failed` (integer) - Failed user creations
  - `processing_details` (jsonb) - Detailed results per user
  - `status` (text) - Processing status (processing, completed, failed)
  - `webhook_sent` (boolean) - Whether N8n webhook was notified
  - `webhook_sent_at` (timestamptz) - When webhook was called
  - `created_at` (timestamptz) - Record creation timestamp
  - `completed_at` (timestamptz) - When processing finished

  ## Security
  - Enable RLS on all tables
  - Public read/write access for demo purposes (can be restricted later)
  - Policies allow authenticated and anonymous access for webhook integration

  ## Indexes
  - Index on token for fast validation lookups
  - Index on created_at for chronological queries
*/

-- Create token_validations table
CREATE TABLE IF NOT EXISTS token_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  is_valid boolean DEFAULT false,
  company_name text,
  company_id text,
  teams jsonb DEFAULT '[]'::jsonb,
  validated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create csv_processing_logs table
CREATE TABLE IF NOT EXISTS csv_processing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_validation_id uuid REFERENCES token_validations(id),
  total_users integer DEFAULT 0,
  users_created integer DEFAULT 0,
  users_failed integer DEFAULT 0,
  processing_details jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'processing',
  webhook_sent boolean DEFAULT false,
  webhook_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_validations_token ON token_validations(token);
CREATE INDEX IF NOT EXISTS idx_token_validations_created_at ON token_validations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_csv_processing_logs_created_at ON csv_processing_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_csv_processing_logs_status ON csv_processing_logs(status);

-- Enable Row Level Security
ALTER TABLE token_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_processing_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for token_validations (allow public access for webhook integration)
CREATE POLICY "Allow public read access to token validations"
  ON token_validations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to token validations"
  ON token_validations FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to token validations"
  ON token_validations FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for csv_processing_logs
CREATE POLICY "Allow public read access to processing logs"
  ON csv_processing_logs FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to processing logs"
  ON csv_processing_logs FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to processing logs"
  ON csv_processing_logs FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);