import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  ExternalLink,
  Minimize2,
  Wrench,
  FlaskConical,
} from 'lucide-react';
import api from '../../services/api.js';

export const FloatingAiButton: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre Copilot IA Videojet. Posez-moi une question technique ou tapez un code d\'erreur.',
    },
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const newMsgs = [...messages, { role: 'user' as const, content: query }];
    setMessages(newMsgs);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { messages: newMsgs });
      setMessages([...newMsgs, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages([
        ...newMsgs,
        { role: 'assistant', content: '⚠️ Service temporairement indisponible.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-videojet-blue to-cyan-700 hover:from-slate-900 hover:to-cyan-800 text-white rounded-2xl shadow-xl border border-cyan-400/30 hover:scale-105 transition-all text-xs font-bold"
          title="Ouvrir l'Assistant IA Videojet"
        >
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Copilot IA</span>
        </button>
      )}

      {/* Floating Drawer Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="px-4 py-3 bg-videojet-blue text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-videojet-orange flex items-center justify-center font-bold text-[10px]">
                VJ
              </div>
              <div>
                <span className="font-bold text-xs block leading-tight">Copilot IA Industriel</span>
                <span className="text-[10px] text-cyan-300 block">Assistance SAV & Commerciale</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-assistant');
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="Plein écran"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="Fermer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick chip suggestions */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => setQuery('Panne CIJ 1580 code E52')}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-md font-medium text-slate-700 whitespace-nowrap"
            >
              🚨 Code E52
            </button>
            <button
              onClick={() => setQuery('Défaut gouttière FA10')}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-md font-medium text-slate-700 whitespace-nowrap"
            >
              🛠️ Code FA10
            </button>
            <button
              onClick={() => setQuery('Encre pour bouteille huile PEHD')}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-md font-medium text-slate-700 whitespace-nowrap"
            >
              🧪 Encre PEHD
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-2.5 rounded-xl max-w-[85%] whitespace-pre-wrap text-[11px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-videojet-blue text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center text-slate-400 italic text-[11px]">
                <Sparkles className="w-3 h-3 text-cyan-600 animate-spin" />
                <span>Recherche dans la base Videojet...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-slate-100 flex items-center gap-1.5 bg-white">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Code panne, encre, question..."
              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="p-2 bg-videojet-blue hover:bg-slate-800 text-white rounded-xl text-xs disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
