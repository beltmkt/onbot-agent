import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface AuditLog {
  id: string;
  created_at: string;
  user_email: string;
  action_type: string;
  metadata: any;
  duration_seconds?: number;
  status: string;
  error_message?: string;
}

interface AuditFilters {
  userEmail: string;
  actionType: string;
  startDate: Date | null;
  endDate: Date | null;
}

export const useRealtimeAudit = (initialFilters: AuditFilters) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.userEmail) {
      query = query.ilike('user_email', `%${filters.userEmail}%`);
    }
    if (filters.actionType) {
      query = query.eq('action_type', filters.actionType);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error("Erro ao buscar logs de auditoria:", error);
      setLogs([]);
    } else {
      setLogs(data || []);
    }
    setIsLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_logs' },
        (payload) => {
          // Re-fetch logs to apply filters and sorting
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  return { logs, isLoading, filters, setFilters };
};
