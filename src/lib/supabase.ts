import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
console.log('Supabase URL:', supabaseUrl);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TokenValidation {
  id: string;
  token: string;
  is_valid: boolean;
  company_name: string | null;
  company_id: string | null;
  teams: Team[];
  validated_at: string;
  created_at: string;
}

export interface Team {
  id: string;
  nome: string;
}

export interface ProcessingLog {
  id: string;
  token_validation_id: string;
  total_users: number;
  users_created: number;
  users_failed: number;
  processing_details: ProcessingDetail[];
  status: 'processing' | 'completed' | 'failed';
  webhook_sent: boolean;
  webhook_sent_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ProcessingDetail {
  nome: string;
  status: 'sucesso' | 'falhou';
  motivo?: string;
}
