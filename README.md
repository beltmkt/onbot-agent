# C2S CreateSeller - Plataforma Corporativa Interna

Sistema corporativo de gestão e criação de vendedores para Contact2Sale, com autenticação restrita, auditoria completa e interface moderna.

## Funcionalidades Principais

### Segurança e Autenticação
- **Autenticação via Supabase Auth** com email/senha
- **Restrição de domínio**: apenas emails @contact2sale.com.br podem acessar
- **Proteção automática de rotas** baseada em sessão JWT
- **Logout automático** para domínios não autorizados

### Sistema de Auditoria
- **Log completo de ações** no banco de dados Supabase
- Registra todas as operações de upload de CSV
- Armazena: email do usuário, data/hora, nome do arquivo, status e metadados
- Políticas RLS (Row Level Security) garantindo que usuários vejam apenas seus próprios logs

### Interface Moderna
- **Dark Mode e Light Mode** com toggle no header
- Design responsivo e profissional
- Toasts (notificações) para feedback em tempo real
- Animações suaves usando Framer Motion
- Componentes reutilizáveis construídos com Tailwind CSS

### Upload e Processamento
- Upload de arquivos CSV via drag-and-drop ou clique
- Envio automático para webhook n8n
- Feedback visual em tempo real do status do upload
- Download de modelo CSV pré-formatado

### Chat OnBot
- Assistente virtual integrado
- Interface conversacional para suporte ao usuário
- Integração com sistema de processamento n8n

## Estrutura do Projeto

```
src/
├── components/
│   ├── ui/              # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   ├── CSVUpload.tsx    # Upload de arquivos
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── Header.tsx       # Cabeçalho com tema e logout
│   ├── Login.tsx        # Tela de login/cadastro
│   └── OnBotChat.tsx    # Chat do assistente
├── contexts/
│   ├── AuthContext.tsx  # Contexto de autenticação
│   └── ThemeContext.tsx # Contexto de tema
├── services/
│   ├── auditService.ts  # Serviço de logs de auditoria
│   ├── csvService.ts    # Serviço de upload CSV
│   └── onbotService.ts  # Serviço do OnBot
├── lib/
│   ├── supabase.ts      # Cliente Supabase
│   └── utils.ts         # Utilitários (cn)
└── App.tsx              # Componente raiz

supabase/
└── migrations/
    └── create_audit_logs_table.sql  # Migration da tabela de auditoria
```

## Variáveis de Ambiente

Certifique-se de ter o arquivo `.env` configurado:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_N8N_WEBHOOK_URL=url_webhook_n8n
```

## Banco de Dados

### Tabela: audit_logs

Armazena todos os logs de auditoria da plataforma:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | ID único do log |
| user_email | text | Email do usuário |
| user_id | uuid | ID do usuário autenticado |
| action_type | text | Tipo de ação (csv_upload, login, etc) |
| file_name | text | Nome do arquivo (se aplicável) |
| file_size | integer | Tamanho do arquivo em bytes |
| status | text | Status: success, error, pending |
| error_message | text | Mensagem de erro (se houver) |
| metadata | jsonb | Dados adicionais em JSON |
| ip_address | text | IP do usuário |
| user_agent | text | User agent do navegador |
| created_at | timestamptz | Data/hora da ação |

### Políticas de Segurança (RLS)

- Usuários autenticados podem ler apenas seus próprios logs
- Logs são imutáveis (não podem ser atualizados ou deletados)
- Sistema pode inserir logs para qualquer usuário

## Comandos

```bash
# Instalar dependências
npm install

# Modo de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Linting
npm run lint

# Type checking
npm run typecheck
```

## Fluxo de Autenticação

1. Usuário acessa a plataforma
2. Sistema verifica se há sessão ativa
3. Se não autenticado, mostra tela de login
4. Login valida domínio @contact2sale.com.br
5. Se domínio inválido, exibe erro e impede acesso
6. Se válido, cria sessão e redireciona para dashboard
7. Token JWT é armazenado automaticamente
8. Sistema registra login nos logs de auditoria

## Fluxo de Upload CSV

1. Usuário seleciona arquivo CSV
2. Sistema valida formato
3. Registra início do upload nos logs
4. Envia arquivo para webhook n8n
5. Aguarda resposta do servidor
6. Registra resultado (sucesso/erro) nos logs
7. Exibe toast de confirmação
8. Permite novo upload ou retornar ao início

## Segurança

### Proteção Implementada

- Autenticação obrigatória para todas as rotas
- Validação de domínio no frontend e backend
- RLS habilitado em todas as tabelas
- Logs imutáveis para auditoria
- Variáveis de ambiente protegidas no .gitignore
- CORS configurado no edge functions

### Dados Sensíveis

Nunca commitar:
- Arquivo `.env`
- Pasta `dist/`
- Pasta `node_modules/`
- Chaves de API

## Deploy

### Vercel/Netlify

1. Conecte seu repositório
2. Configure as variáveis de ambiente
3. Build automático a cada push

### Supabase Edge Functions

```bash
# Deploy das edge functions (se necessário)
supabase functions deploy n8n-status-callback
supabase functions deploy n8n-webhook
```

## Manutenção e Monitoramento

### Consultar Logs de Auditoria

```sql
-- Todos os logs de um usuário
SELECT * FROM audit_logs
WHERE user_email = 'usuario@contact2sale.com.br'
ORDER BY created_at DESC;

-- Logs de erro nas últimas 24h
SELECT * FROM audit_logs
WHERE status = 'error'
AND created_at > NOW() - INTERVAL '24 hours';

-- Uploads por dia
SELECT DATE(created_at) as dia, COUNT(*) as uploads
FROM audit_logs
WHERE action_type = 'csv_upload'
GROUP BY DATE(created_at);
```

## Suporte

Para suporte ou dúvidas sobre a plataforma:
- Email: suporte@contact2sale.com.br
- Use o OnBot Chat integrado na plataforma

## Tecnologias Utilizadas

- **React 18** com TypeScript
- **Vite** para build rápido
- **Tailwind CSS** para estilização
- **Framer Motion** para animações
- **Supabase** para backend (auth + database)
- **Sonner** para toasts
- **Lucide React** para ícones
- **n8n** para automação (webhook)

---

Desenvolvido com segurança e atenção aos detalhes para Contact2Sale.
