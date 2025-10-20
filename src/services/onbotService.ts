// ✅ src/services/onbotService.ts — VERSÃO 2025 REFINADA

// 🔧 Variáveis de ambiente obrigatórias
const DATA_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;       // Ex: /dados_recebidos
const CHAT_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URLCHAT;   // Ex: /chat
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN;

// ============================================================
// 🧩 Função utilitária: leitura segura de arquivos CSV como texto
// ============================================================
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    reader.readAsText(file, "UTF-8");
  });
};

// ============================================================
// 🧠 Processamento LOCAL do CSV (antes de enviar ao n8n)
// ============================================================
const processCSVLocal = (
  csvContent: string
): { users: any[]; total: number; errors: string[] } => {
  try {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2)
      return { users: [], total: 0, errors: ["Arquivo precisa ter cabeçalho e dados."] };

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const users = lines
      .slice(1)
      .map((line) => line.split(","))
      .map((row) => {
        const obj: any = {};
        headers.forEach((h, i) => (obj[h] = (row[i] || "").trim()));
        return {
          nome: obj.nome || obj.name || "",
          email: (obj.email || obj.mail || "").toLowerCase(),
          telefone: obj.telefone || obj.phone || obj.tel || "",
          empresa_ou_equipe:
            obj.empresa_ou_equipe ||
            obj.empresa ||
            obj.company ||
            obj.equipe ||
            obj.team ||
            "",
          master: (obj.master || obj.is_master || "não").toString().toLowerCase(),
        };
      })
      .filter((u) => u.nome && u.email && u.empresa_ou_equipe);

    return {
      users,
      total: users.length,
      errors: users.length ? [] : ["Nenhum usuário válido encontrado."],
    };
  } catch (error: any) {
    console.error("❌ Erro no processamento local:", error);
    return { users: [], total: 0, errors: [`Erro ao processar CSV: ${error.message}`] };
  }
};

// ============================================================
// 📤 Envio de dados processados (usuários) ao webhook de dados
// ============================================================
const sendToDataWebhook = async (
  processedData: any,
  sessionId: string,
  fileName: string = ""
): Promise<string> => {
  if (!DATA_WEBHOOK_URL) throw new Error("Webhook de dados não configurado");

  const payload = {
    sessionId,
    action: "process_csv",
    timestamp: new Date().toISOString(),
    token: JWT_TOKEN,
    empresa: "Onboarding | Olha o Mistério",
    processType: "csv_upload",
    processedData,
    fileName,
    totalUsers: processedData.total,
    users: processedData.users,
    errors: processedData.errors,
  };

  console.log("📡 Enviando dados processados:", payload);

  const response = await fetch(DATA_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ${response.status}: ${text}`);
  }

  const data = await response.json().catch(() => ({}));
  console.log("✅ Resposta webhook de dados:", data);
  return data.output || data.response || data.message || "Dados enviados com sucesso!";
};

// ============================================================
// 💬 Envio de mensagens normais de chat (via webhook de chat)
// ============================================================
const sendToChatEndpoint = async (
  message: string,
  sessionId: string,
  file?: File
): Promise<string> => {
  if (!CHAT_WEBHOOK_URL) throw new Error("Webhook de chat não configurado");

  let chatInput = message;

  if (file) {
    try {
      const content = await readFileAsText(file);
      chatInput += `\n\n📎 Arquivo enviado: ${file.name}\n\`\`\`csv\n${content}\n\`\`\``;
    } catch {
      chatInput += `\n\n📎 Arquivo: ${file.name} (erro ao ler conteúdo)`;
    }
  }

  const payload = {
    sessionId,
    chatInput,
    action: "chat_message",
    timestamp: new Date().toISOString(),
    token: JWT_TOKEN,
  };

  console.log("💬 Enviando mensagem ao chat webhook:", payload);

  const response = await fetch(CHAT_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ${response.status}: ${text}`);
  }

  const data = await response.json().catch(() => ({}));
  console.log("📥 Resposta do chat webhook:", data);
  return data.output || data.response || data.message || "Mensagem enviada!";
};

// ============================================================
// 🧠 Função principal — escolhe o fluxo certo (CSV ou Chat)
// ============================================================
export const sendMessageToOnbot = async (
  message: string,
  sessionId: string,
  file?: File
): Promise<string> => {
  try {
    if (file) {
      console.log("📁 Processando arquivo local:", file.name);
      const content = await readFileAsText(file);
      const processedData = processCSVLocal(content);

      if (processedData.total > 0) {
        const result = await sendToDataWebhook(processedData, sessionId, file.name);
        return `✅ ${processedData.total} usuário(s) processado(s) localmente.\n${result}`;
      } else {
        return `❌ Erro: ${processedData.errors.join(", ")}`;
      }
    }

    if (message.trim()) {
      const lines = message.split("\n").filter((l) => l.includes(","));
      if (lines.length > 0) {
        const processedData = processCSVLocal(lines.join("\n"));
        if (processedData.total > 0) {
          const result = await sendToDataWebhook(processedData, sessionId, "dados_manuais.csv");
          return `✅ ${processedData.total} usuário(s) processado(s) manualmente.\n${result}`;
        }
      }
      return await sendToChatEndpoint(message, sessionId);
    }

    return "Envie uma mensagem ou um arquivo CSV para processar.";
  } catch (error: any) {
    console.error("❌ Erro no fluxo principal:", error);
    try {
      console.log("🔄 Fallback para chat (erro no envio principal)");
      return await sendToChatEndpoint(
        file ? `Falha ao enviar ${file.name}: ${error.message}` : message,
        sessionId
      );
    } catch {
      return `Erro: ${error.message}`;
    }
  }
};

// ============================================================
// 🔍 Teste de conexão
// ============================================================
export const testOnbotConnection = async (): Promise<{
  status: "success" | "error";
  message: string;
}> => {
  try {
    if (!DATA_WEBHOOK_URL || !CHAT_WEBHOOK_URL)
      throw new Error("Webhooks não configurados.");
    return { status: "success", message: "Conexão com o OnBot OK 🚀" };
  } catch (error: any) {
    return { status: "error", message: error.message };
  }
};

// ============================================================
// 📊 Interface auxiliar — para processamento isolado de CSV
// ============================================================
export const processCSVFile = async (
  file: File,
  sessionId: string
): Promise<{ success: boolean; message: string }> => {
  const message = await sendMessageToOnbot("Upload CSV", sessionId, file);
  return { success: true, message };
};
