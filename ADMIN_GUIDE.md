# Guia do Administrador - C2S CreateSeller

Este guia contém informações importantes para administradores do sistema.

## Gerenciamento de Usuários

### Criar Novos Usuários

Usuários podem se auto-registrar na plataforma desde que:
- Usem email corporativo @contact2sale.com.br
- Criem uma senha com no mínimo 6 caracteres

### Remover Acesso de Usuário

Acesse o Supabase Dashboard:
1. Vá para Authentication > Users
2. Localize o usuário
3. Clique em "Delete User"

Alternativamente, via SQL:
```sql
-- Ver todos os usuários
SELECT * FROM auth.users;

-- Deletar usuário (use com cuidado!)
DELETE FROM auth.users WHERE email = 'usuario@contact2sale.com.br';
```

## Auditoria e Logs

### Dashboard de Logs

Para criar um dashboard de monitoramento, use estas queries:

```sql
-- Atividade nas últimas 24 horas
SELECT
  user_email,
  action_type,
  status,
  COUNT(*) as total
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_email, action_type, status
ORDER BY total DESC;

-- Usuários mais ativos (últimos 30 dias)
SELECT
  user_email,
  COUNT(*) as total_actions
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_email
ORDER BY total_actions DESC
LIMIT 10;

-- Taxa de sucesso de uploads
SELECT
  DATE(created_at) as dia,
  COUNT(*) FILTER (WHERE status = 'success') as sucessos,
  COUNT(*) FILTER (WHERE status = 'error') as erros,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'success')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as taxa_sucesso_pct
FROM audit_logs
WHERE action_type = 'csv_upload'
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY dia DESC;

-- Arquivos mais enviados
SELECT
  file_name,
  COUNT(*) as vezes_enviado,
  AVG(file_size) as tamanho_medio_bytes,
  COUNT(*) FILTER (WHERE status = 'success') as sucessos
FROM audit_logs
WHERE action_type = 'csv_upload'
AND file_name IS NOT NULL
GROUP BY file_name
ORDER BY vezes_enviado DESC
LIMIT 20;
```

### Exportar Logs para Análise

```sql
-- Exportar logs do último mês (copie o resultado para CSV)
COPY (
  SELECT
    user_email,
    action_type,
    file_name,
    status,
    created_at
  FROM audit_logs
  WHERE created_at > NOW() - INTERVAL '30 days'
  ORDER BY created_at DESC
) TO '/tmp/audit_logs_export.csv' WITH CSV HEADER;
```

### Alertas de Segurança

Configure alertas para:

```sql
-- Múltiplas falhas de login do mesmo usuário
SELECT
  user_email,
  COUNT(*) as tentativas_falhas,
  MAX(created_at) as ultima_tentativa
FROM audit_logs
WHERE action_type = 'login'
AND status = 'error'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_email
HAVING COUNT(*) >= 5;

-- Uploads suspeitos (muito grandes ou muito frequentes)
SELECT
  user_email,
  COUNT(*) as uploads_na_hora,
  SUM(file_size) as total_bytes
FROM audit_logs
WHERE action_type = 'csv_upload'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_email
HAVING COUNT(*) > 20 OR SUM(file_size) > 100000000;
```

## Manutenção do Banco de Dados

### Limpeza de Logs Antigos

Logs de auditoria podem acumular. Configure uma rotina de limpeza:

```sql
-- Ver tamanho da tabela
SELECT
  pg_size_pretty(pg_total_relation_size('audit_logs')) as tamanho_total,
  COUNT(*) as total_registros
FROM audit_logs;

-- Deletar logs com mais de 1 ano
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year';

-- Ou arquivar antes de deletar
CREATE TABLE audit_logs_archive AS
SELECT * FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year';

-- Depois delete da tabela principal
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Backup

Configure backups automáticos no Supabase Dashboard:
1. Vá para Settings > Backups
2. Habilite backups diários
3. Configure retenção para 30 dias

Ou faça backup manual via SQL:

```bash
# Exportar toda a tabela
pg_dump -h seu-projeto.supabase.co \
  -U postgres \
  -d postgres \
  -t audit_logs \
  > audit_logs_backup.sql
```

## Gerenciamento de Domínio

### Adicionar Novo Domínio Autorizado

Atualmente, apenas @contact2sale.com.br é permitido. Para adicionar outro:

1. Edite `src/contexts/AuthContext.tsx`
2. Localize `AUTHORIZED_DOMAIN`
3. Modifique para aceitar múltiplos domínios:

```typescript
const AUTHORIZED_DOMAINS = [
  '@contact2sale.com.br',
  '@novoDominio.com'
];

const isAuthorizedDomain = (email: string): boolean => {
  return AUTHORIZED_DOMAINS.some(domain =>
    email.toLowerCase().endsWith(domain)
  );
};
```

4. Faça rebuild e redeploy

## Monitoramento de Performance

### Queries Lentas

```sql
-- Ver queries mais lentas (requer pg_stat_statements)
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%audit_logs%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Uso de Índices

```sql
-- Verificar se índices estão sendo usados
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'audit_logs';
```

## Troubleshooting

### Usuário não consegue fazer login

1. Verifique se o email termina com @contact2sale.com.br
2. Confirme que o usuário existe no Supabase Auth
3. Verifique os logs de erro:

```sql
SELECT * FROM audit_logs
WHERE user_email = 'usuario@contact2sale.com.br'
AND status = 'error'
ORDER BY created_at DESC
LIMIT 5;
```

### Upload de CSV falhando

1. Verifique se o webhook n8n está respondendo
2. Consulte logs de erro:

```sql
SELECT
  user_email,
  file_name,
  error_message,
  metadata,
  created_at
FROM audit_logs
WHERE action_type = 'csv_upload'
AND status = 'error'
ORDER BY created_at DESC
LIMIT 10;
```

3. Verifique a variável de ambiente `VITE_N8N_WEBHOOK_URL`

### Tema não está funcionando

1. Verifique se o localStorage está habilitado no navegador
2. Limpe o cache do navegador
3. Teste em modo anônimo

## Atualizações de Segurança

### Rotação de Chaves

Para rotacionar as chaves do Supabase:

1. Acesse Supabase Dashboard > Settings > API
2. Gere novas chaves
3. Atualize as variáveis de ambiente no deploy
4. Redeploy a aplicação
5. Revogue as chaves antigas após confirmar funcionamento

### Auditoria de Acesso

Recomenda-se revisar logs semanalmente:

```sql
-- Resumo semanal
SELECT
  DATE_TRUNC('week', created_at) as semana,
  COUNT(DISTINCT user_email) as usuarios_unicos,
  COUNT(*) FILTER (WHERE action_type = 'login') as logins,
  COUNT(*) FILTER (WHERE action_type = 'csv_upload') as uploads,
  COUNT(*) FILTER (WHERE status = 'error') as erros
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY semana DESC;
```

## Contato de Emergência

Em caso de problemas críticos:
1. Verifique o status do Supabase em status.supabase.com
2. Consulte logs de erro no dashboard
3. Entre em contato com suporte técnico: dev@contact2sale.com.br

---

Mantenha este documento atualizado conforme o sistema evolui.
