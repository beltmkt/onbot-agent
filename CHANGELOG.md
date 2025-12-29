# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2.0.0] - 2024-12-29

### Adicionado

#### Autenticação e Segurança
- Sistema completo de autenticação via Supabase Auth
- Restrição de domínio: apenas emails @contact2sale.com.br
- Proteção automática de rotas baseada em sessão
- Logout automático para usuários não autorizados
- Validação de domínio no frontend e backend

#### Sistema de Auditoria
- Tabela de logs de auditoria no Supabase
- Registro automático de todas as operações:
  - Login/Logout
  - Upload de CSV
  - Validação de token
  - Criação de usuários
- Políticas RLS (Row Level Security) garantindo privacidade
- Logs imutáveis para compliance
- Metadados extensíveis em formato JSON

#### Interface Moderna
- Dark Mode e Light Mode com toggle no header
- Design responsivo e profissional
- Sistema de toasts (notificações) usando Sonner
- Componentes UI reutilizáveis (Button, Input)
- Animações suaves com Framer Motion
- Tela de login corporativa
- Header com informações do usuário

#### Componentes
- `AuthContext`: Gerenciamento de autenticação
- `ThemeContext`: Gerenciamento de tema
- `Login`: Tela de login/cadastro
- `Dashboard`: Dashboard principal autenticado
- `Header`: Cabeçalho com tema e logout
- `Button` e `Input`: Componentes UI base
- Serviço de auditoria (`auditService.ts`)

#### Documentação
- README completo com guia de uso
- ADMIN_GUIDE com instruções para administradores
- CHANGELOG para rastreamento de versões
- .env.example para facilitar setup

### Modificado

#### App.tsx
- Refatorado para usar contextos de Auth e Theme
- Roteamento baseado em estado de autenticação
- Integração com Toaster para notificações

#### CSVUpload
- Atualizado para tema claro/escuro
- Integração com sistema de logs de auditoria
- Melhorias visuais e de UX

#### Dashboard
- Componente dedicado para área autenticada
- Integração com auditoria
- Melhor organização do código

### Removido
- Sistema antigo de TokenInput manual
- Wizard de duas etapas (token -> upload)
- Cores hardcoded incompatíveis com temas

### Segurança
- Todas as tabelas com RLS habilitado
- Variáveis de ambiente protegidas
- Logs imutáveis
- Validação de domínio em múltiplas camadas
- JWT gerenciado automaticamente pelo Supabase

### Performance
- Build otimizado com code splitting
- Lazy loading onde apropriado
- Índices no banco de dados para queries rápidas

### Banco de Dados
- Nova tabela: `audit_logs`
- Índices em: user_email, created_at, action_type, status
- Função helper: `log_audit_action()`

---

## [1.0.0] - 2024-12-15

### Versão Inicial
- Upload de CSV básico
- Integração com n8n
- Chat OnBot
- Sistema de tokens manual
- Interface básica em dark mode

---

## Convenções de Versionamento

Este projeto segue [Semantic Versioning](https://semver.org/):
- MAJOR: Mudanças incompatíveis com versões anteriores
- MINOR: Novas funcionalidades mantendo compatibilidade
- PATCH: Correções de bugs mantendo compatibilidade

### Tipos de Mudanças
- **Adicionado**: Novas funcionalidades
- **Modificado**: Mudanças em funcionalidades existentes
- **Removido**: Funcionalidades removidas
- **Corrigido**: Correções de bugs
- **Segurança**: Vulnerabilidades corrigidas
- **Deprecated**: Funcionalidades que serão removidas em breve
