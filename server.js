import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔹 Rota que o OnBot vai usar para enviar e receber mensagens
app.post("/api/onbot", async (req, res) => {
  try {
    const { userMessage, sessionId } = req.body;

    // 🔸 Aqui você conecta ao seu AGENT IA
    const response = await fetch("https://seu-agent-ai-endpoint.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer SEU_TOKEN_DO_AGENT`,
      },
      body: JSON.stringify({
        message: userMessage,
        session_id: sessionId,
      }),
    });

    const data = await response.json();

    // 🔸 Retorna a resposta do Agent pro OnBot
    res.json({
      reply: data.reply || "Desculpe, não entendi a resposta do Agent.",
    });
  } catch (error) {
    console.error("Erro no /api/onbot:", error);
    res.status(500).json({ error: "Erro ao comunicar com o Agent IA." });
  }
});

// 🔹 Inicializa o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor OnBot rodando na porta ${PORT}`);
});
