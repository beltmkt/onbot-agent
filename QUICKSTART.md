# Guia de Início Rápido

Configure e rode o projeto em minutos.

## 1. Pré-requisitos

Certifique-se de ter instalado:
- Node.js 18+ ([download](https://nodejs.org))
- npm ou yarn
- Conta no Supabase ([criar grátis](https://supabase.com))

## 2. Configuração do Supabase

### Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha nome e senha do banco

### Obter Credenciais
1. No dashboard, vá em Settings > API
2. Copie:
   - Project URL
   - anon/public key

### Aplicar Migration
1. No dashboard, vá em SQL Editor
2. Clique em "New Query"
3. Cole o conteúdo de `supabase/migrations/create_audit_logs_table.sql`
4. Execute (Run)

### Configurar Autenticação
1. Vá em Authentication > Providers
2. Habilite "Email" provider
3. Em Authentication > Settings:
   - Desabilite "Confirm Email" (opcional, para desenvolvimento)
   - Configure "Site URL" para seu domínio

## 3. Configuração do Projeto

### Clonar e Instalar
```bash
# Clone o repositório
git clone seu-repositorio.git
cd c2s-createseller

# Instale dependências
npm install
```

### Configurar Variáveis de Ambiente
```bash
# Copie o exemplo
cp .env.example .env

# Edite o arquivo .env
nano .env
```

Cole suas credenciais:
```env
VITE_SUPABASE_URL=https://seuProjeto.supabase.co
VITE_SUPABASE_ANON_KEY=suaChaveAqui
VITE_N8N_WEBHOOK_URL=https://seu-webhook.com
```

## 4. Rodar o Projeto

```bash
# Modo desenvolvimento
npm run dev
```

Acesse: http://localhost:5173

## 5. Criar Primeiro Usuário

1. Na tela de login, clique em "Não tem conta? Criar uma nova"
2. Use um email @contact2sale.com.br
3. Crie uma senha (mínimo 6 caracteres)
4. Clique em "Criar Conta"

Pronto! Você terá acesso ao dashboard.

## 6. Fazer Upload de CSV

1. No dashboard, clique em "Baixar modelo CSV" (opcional)
2. Clique ou arraste um arquivo CSV para a área de upload
3. Aguarde o processamento
4. Veja o resultado na tela

Todos os uploads são registrados na tabela `audit_logs`.

## 7. Verificar Logs (Opcional)

Acesse o Supabase Dashboard:
1. Vá em Table Editor > audit_logs
2. Veja todos os logs de atividades

Ou use SQL:
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

## Troubleshooting Rápido

### "Failed to fetch" ao fazer login
- Verifique se `VITE_SUPABASE_URL` está correto
- Confirme que a migration foi aplicada
- Verifique se o Supabase está online

### "Acesso negado" ao fazer login
- Confirme que está usando email @contact2sale.com.br
- Se quiser mudar o domínio, edite `src/contexts/AuthContext.tsx`

### Tema não muda
- Limpe o cache do navegador
- Verifique o localStorage do navegador
- Tente em modo anônimo

### Upload não funciona
- Verifique `VITE_N8N_WEBHOOK_URL` no .env
- Confirme que o webhook n8n está ativo
- Veja os logs de erro na tabela audit_logs

## Próximos Passos

- Leia o [README.md](README.md) completo
- Configure o [n8n workflow](N8N_INTEGRATION.md)
- Leia o [Guia do Administrador](ADMIN_GUIDE.md)
- Customize cores e temas em `tailwind.config.js`
- Configure deploy no Vercel/Netlify

## Deploy Rápido

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

Não esqueça de adicionar as variáveis de ambiente no dashboard da plataforma.

---

Dúvidas? Consulte a [documentação completa](README.md) ou abra uma issue.
