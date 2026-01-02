import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// URL de placeholder mais descritiva para o webhook de sugestões
const SUGGESTION_WEBHOOK_URL = "https://seu-workflow.n8n.app/webhook/sugestao-onbot";

export const SuggestionForm: React.FC = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.warning('Por favor, preencha o assunto e a descrição.');
      return;
    }

    setIsSending(true);

    const payload = {
      tipo: "sugestao",
      remetente: user?.email,
      assunto: subject,
      mensagem: description,
      destinatario: "alisson@c2sglobal.com", // Adiciona o e-mail de destino
    };

    try {
      // Simulação de chamada de webhook para fins de demonstração
      // Em um cenário real, a URL seria uma variável de ambiente
      console.log("Enviando para o webhook:", SUGGESTION_WEBHOOK_URL);
      console.log("Payload:", payload);
      
      // Simula um atraso de rede
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // const response = await fetch(SUGGESTION_WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(payload),
      // });

      // if (!response.ok) {
      //   throw new Error('A resposta da rede não foi boa.');
      // }

      toast.success('Sua sugestão foi enviada para a equipe de desenvolvimento!');
      setSubject('');
      setDescription('');
    } catch (error) {
      console.error("Erro ao enviar sugestão:", error);
      toast.error('Houve um problema ao enviar sua sugestão. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">Assunto</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Um breve título para sua sugestão"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Descreva sua ideia ou melhoria em detalhes"
          />
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSending}
            className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {isSending ? 'Enviando...' : 'Enviar Sugestão'}
          </button>
        </div>
      </form>
    </div>
  );
};
