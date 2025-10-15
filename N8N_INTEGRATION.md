# Integração N8N - C2S CreateSeller

Este documento descreve como o N8N deve se integrar com a interface C2S CreateSeller.

## Endpoints da Interface que Enviam para N8N

### 1. Validação de Token
**URL N8N:** `https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/criar_conta_final`

**Método:** POST

**Payload Enviado:**
```json
{
  "token": "56f8038aa2abc866105cf6a02039a7e60fdd0c57072910c88c"
}
```

**Resposta Esperada do N8N:**
```json
{
  "success": true,
  "valido": true,
  "token_valido": true,
  "empresa": "Nome da Empresa",
  "id_empresa": "123456",
  "equipes": [
    {
      "id": "eq-1",
      "nome": "Equipe Vendas"
    },
    {
      "id": "eq-2",
      "nome": "Equipe Marketing"
    }
  ],
  "message": "Token válido"
}
```

**Resposta em Caso de Erro:**
```json
{
  "success": false,
  "valido": false,
  "message": "Token inválido ou expirado",
  "error": "Descrição do erro"
}
```

---

### 2. Upload de Planilha CSV
**URL N8N:** `https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/dados_recebidos`

**Método:** POST

**Content-Type:** `multipart/form-data`

**Campos Enviados:**
- `csv_file` - Arquivo CSV
- `file_name` - Nome do arquivo
- `file_size` - Tamanho em bytes
- `uploaded_at` - Timestamp ISO
- `empresa` - Nome da empresa
- `id_empresa` - ID da empresa
- `token` - Token de autenticação
- `total_usuarios` - Quantidade de usuários
- `equipes` - JSON array com as equipes
- `usuarios` - JSON array com os dados dos usuários

**Exemplo de usuarios enviado:**
```json
[
  {
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "+5511999999999",
    "empresa_ou_equipe": "Equipe Vendas",
    "master": false
  }
]
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "CSV recebido e processado com sucesso"
}
```

---

### 3. Resultado do Processamento
**URL N8N:** `https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/dados_users`

**Método:** POST

**Payload Enviado:**
```json
{
  "status": "processamento_concluido",
  "token_utilizado": "56f8038aa2abc866105cf6a02039a7e60fdd0c57072910c88c",
  "empresa": "Nome da Empresa",
  "usuarios_criados": 45,
  "usuarios_falhos": 5,
  "detalhes": [
    {
      "nome": "João Silva",
      "status": "sucesso"
    },
    {
      "nome": "Maria Santos",
      "status": "falhou",
      "motivo": "Equipe \"Equipe X\" não encontrada"
    }
  ]
}
```

---

## Endpoint da Interface para Receber Callbacks do N8N

### Callback de Status (Bidirecional)
**URL:** `https://vqxnmvprucqcfzxqpcec.supabase.co/functions/v1/n8n-status-callback`

**Método:** POST

**Headers:**
```
Content-Type: application/json
```

**Payload para Validação:**
```json
{
  "token": "56f8038aa2abc866105cf6a02039a7e60fdd0c57072910c88c",
  "success": true,
  "status": "validated",
  "message": "Token validado com sucesso",
  "operation": "validation",
  "empresa": "Nome da Empresa",
  "id_empresa": "123456",
  "equipes": [
    {"id": "eq-1", "nome": "Equipe Vendas"}
  ],
  "timestamp": "2025-10-08T12:00:00Z"
}
```

**Payload para Upload:**
```json
{
  "token": "56f8038aa2abc866105cf6a02039a7e60fdd0c57072910c88c",
  "success": true,
  "status": "uploaded",
  "message": "CSV processado com sucesso",
  "operation": "upload",
  "details": {
    "total_rows": 50,
    "processed": 50
  },
  "timestamp": "2025-10-08T12:05:00Z"
}
```

**Payload para Processamento:**
```json
{
  "token": "56f8038aa2abc866105cf6a02039a7e60fdd0c57072910c88c",
  "success": true,
  "status": "completed",
  "message": "Usuários criados com sucesso",
  "operation": "processing",
  "details": {
    "created": 45,
    "failed": 5,
    "errors": [
      {"user": "Maria Santos", "reason": "Email já existe"}
    ]
  },
  "timestamp": "2025-10-08T12:10:00Z"
}
```

**Payload em Caso de Erro:**
```json
{
  "token": "56f8038aa2abc866105cf6a02039a7e60fdd0c57072910c88c",
  "success": false,
  "status": "error",
  "message": "Erro ao processar dados",
  "error": "Descrição técnica do erro",
  "operation": "processing",
  "timestamp": "2025-10-08T12:10:00Z"
}
```

---

## Fluxo de Comunicação

```
1. INTERFACE → N8N: POST /webhook/criar_conta_final
   Envia token para validação

2. N8N → INTERFACE: Response com dados da empresa e equipes
   Retorna empresa, id_empresa, equipes[]

3. N8N → INTERFACE (Opcional): POST /functions/v1/n8n-status-callback
   Callback assíncrono com status da validação

4. INTERFACE → N8N: POST /webhook/dados_recebidos
   Envia arquivo CSV + metadados

5. N8N → INTERFACE: Response confirmando recebimento
   Confirma que CSV foi recebido

6. N8N → INTERFACE: POST /functions/v1/n8n-status-callback
   Callback com progresso do processamento

7. INTERFACE → N8N: POST /webhook/dados_users
   Envia resultado final do processamento

8. N8N → INTERFACE: POST /functions/v1/n8n-status-callback
   Callback final com status de conclusão
```

---

## Tipos de Operação (operation)

- `validation` - Validação de token
- `upload` - Upload de arquivo CSV
- `processing` - Processamento e criação de usuários

---

## Estrutura do Banco de Dados

Os callbacks são armazenados na tabela `n8n_callbacks`:

```sql
CREATE TABLE n8n_callbacks (
  id uuid PRIMARY KEY,
  token text,
  success boolean,
  status text,
  message text,
  error text,
  empresa text,
  operation text,
  payload jsonb,
  created_at timestamptz
);
```

---

## Testando a Integração

### 1. Teste de Validação
```bash
curl -X POST https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/criar_conta_final \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token-123"}'
```

### 2. Teste de Callback
```bash
curl -X POST https://vqxnmvprucqcfzxqpcec.supabase.co/functions/v1/n8n-status-callback \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test-token-123",
    "success": true,
    "status": "validated",
    "message": "Token OK",
    "operation": "validation"
  }'
```

---

## Observações Importantes

1. **Todas as respostas do N8N devem incluir CORS headers**
2. **O campo `success` ou `valido` ou `token_valido` determina o sucesso da operação**
3. **Callbacks são opcionais mas recomendados para comunicação bidirecional**
4. **Todos os timestamps devem estar no formato ISO 8601**
5. **O token deve ser consistente em todas as requisições de uma mesma operação**
