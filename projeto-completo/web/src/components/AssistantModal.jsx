import { useState } from 'react';
import { apiFetch } from '../utils/api';

const GUIDED_PROMPTS = [
  'Onde posso almoçar hoje com criança pequena e cachorro?',
  'Procuro um café silencioso e acessível com rampa para ir com meu avô idoso.',
  'Quero um parque ao ar livre com trocador e espaço para cachorro de porte grande.',
];

export default function AssistantModal({ token, onClose, onOpenPlaceDetail }) {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([
    {
      sender: 'bot',
      text: 'Olá! Sou o Assistente Family Place (RF013). Descreva com quem você vai sair ou escolha uma opção rápida abaixo para receber recomendações do banco de dados.',
      recommendations: [],
    },
  ]);
  const [loading, setLoading] = useState(false);

  const askAssistant = async (textToSend) => {
    const clean = textToSend.trim();
    if (!clean) return;
    setLoading(true);
    setHistory((prev) => [...prev, { sender: 'user', text: clean }]);
    setMessage('');

    try {
      const res = await apiFetch('/api/assistant/recommend', {
        method: 'POST',
        token,
        body: { message: clean },
      });
      setHistory((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.reply,
          recommendations: res.recommendations || [],
        },
      ]);
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        { sender: 'bot', text: `Erro ao consultar assistente: ${err.message}`, recommendations: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="bot-title">
      <div className="modal-card modal-wide">
        <div className="modal-header">
          <div>
            <h2 id="bot-title">Assistente Virtual de Recomendação (RF013)</h2>
            <p className="place-meta">
              Consulte em linguagem natural ou use o fluxo guiado sobre os estabelecimentos no SQLite.
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Fechar assistente">
            ✕
          </button>
        </div>

        <div className="quick-scenarios">
          <span className="quick-label">Sugestões rápidas:</span>
          {GUIDED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="btn-chip"
              onClick={() => askAssistant(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="chat-log">
          {history.map((entry, idx) => (
            <div key={idx} className={`chat-bubble ${entry.sender === 'user' ? 'is-user' : 'is-bot'}`}>
              <p className="chat-text">{entry.text}</p>
              {entry.recommendations?.length > 0 && (
                <div className="chat-recs">
                  {entry.recommendations.map((rec) => (
                    <div key={rec.id} className="chat-rec-card">
                      <div>
                        <strong>{rec.name}</strong> ({rec.category} · {rec.neighborhood})
                        <p className="chat-rec-reasons">
                          Compatível em: {rec.reasons.join(' | ')}
                        </p>
                        <p className="chat-rec-scores">
                          Kids {rec.averages.kids.toFixed(1)}★ · PCD/Idoso {rec.averages.accessibility.toFixed(1)}★ · Pet {rec.averages.pet.toFixed(1)}★
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          onClose();
                          onOpenPlaceDetail(rec.id);
                        }}
                      >
                        Abrir Perfil
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            askAssistant(message);
          }}
          className="chat-input-row"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex.: Onde jantar hoje com criança e banheiro adaptado?"
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Buscando...' : 'Perguntar'}
          </button>
        </form>
      </div>
    </div>
  );
}
