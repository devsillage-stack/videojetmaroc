import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Wrench,
  FlaskConical,
  Swords,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  Flame,
  HelpCircle,
} from 'lucide-react';
import api from '../../services/api.js';

export const AiCopilotPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'chat' | 'diagnostic' | 'ink' | 'pitch'>('chat');

  // Chat Mode State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `👋 Bonjour ! Je suis le **Copilote IA Industriel Videojet Maroc (NEXORA OS)**.\n\nJe suis entraîné sur les manuels constructeur Videojet, la chimie des encres certifiées, les procédures CleanFlow™, le diagnostic de pannes et l'intelligence concurrentielle.\n\nComment puis-je vous assister aujourd'hui ?`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Diagnostic Mode State
  const [diagForm, setDiagForm] = useState({
    model: 'Videojet CIJ 1580',
    errorCode: 'E52',
    symptoms: 'Viscosité encre trop élevée et alerte de fluide rouge sur le panneau de commande',
    lineContext: 'Ligne yaourts 450 pots/minute, ambiance 18°C avec humidité modérée',
  });
  const [diagResult, setDiagResult] = useState<any>(null);
  const [isDiagLoading, setIsDiagLoading] = useState(false);

  // Ink Advisor State
  const [inkForm, setInkForm] = useState({
    substrate: 'Bouteille PEHD (Plastique rigide gras avec condensation)',
    lineSpeed: 120,
    temperature: '4°C à 15°C',
    humidity: 'Ambiance humide (Ligne de remplissage)',
    foodContact: true,
  });
  const [inkResult, setInkResult] = useState<any>(null);
  const [isInkLoading, setIsInkLoading] = useState(false);

  // Sales Pitch State
  const [pitchForm, setPitchForm] = useState({
    competitor: 'Markem-Imaje 9450',
    targetIndustry: 'Agroalimentaire (Centrale Danone)',
    clientConcerns: 'Arrêts intempestifs de ligne et coût excessif des consommables',
  });
  const [pitchResult, setPitchResult] = useState<any>(null);
  const [isPitchLoading, setIsPitchLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Chat Submission
  const handleChatSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const query = customPrompt || chatInput;
    if (!query.trim() || isChatLoading) return;

    const newMessages = [...chatMessages, { role: 'user' as const, content: query }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await api.post('/ai/chat', { messages: newMessages });
      setChatMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setChatMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '⚠️ Erreur de connexion avec le moteur IA. Vérifiez que le serveur est bien en ligne.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Diagnostic Submission
  const handleDiagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDiagLoading(true);
    try {
      const res = await api.post('/ai/diagnose', diagForm);
      setDiagResult(res.data.diagnostic);
    } catch {
      alert('Erreur lors de la génération du diagnostic.');
    } finally {
      setIsDiagLoading(false);
    }
  };

  // Ink Advisor Submission
  const handleInkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInkLoading(true);
    try {
      const res = await api.post('/ai/ink-advisor', inkForm);
      setInkResult(res.data.recommendation);
    } catch {
      alert('Erreur lors de la recommandation d\'encre.');
    } finally {
      setIsInkLoading(false);
    }
  };

  // Sales Pitch Submission
  const handlePitchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPitchLoading(true);
    try {
      const res = await api.post('/ai/sales-pitch', pitchForm);
      setPitchResult(res.data.pitch);
    } catch {
      alert('Erreur lors de la génération du pitch commercial.');
    } finally {
      setIsPitchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl text-white shadow-md">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </span>
            Videojet AI Industrial Copilot
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Assistant d'ingénierie augmenté pour le diagnostic des pannes, la chimie des encres et la performance commerciale
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-white text-videojet-blue shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat Libre
          </button>
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'diagnostic'
                ? 'bg-white text-videojet-blue shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            Diagnostic SAV
          </button>
          <button
            onClick={() => setActiveTab('ink')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ink'
                ? 'bg-white text-videojet-blue shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-emerald-500" />
            Conseiller Encres
          </button>
          <button
            onClick={() => setActiveTab('pitch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pitch'
                ? 'bg-white text-videojet-blue shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-indigo-500" />
            Battlecard Vente
          </button>
        </div>
      </div>

      {/* TAB 1: CONVERSATIONAL CHAT */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Quick Prompts Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 font-medium shrink-0">Suggestions :</span>
            <button
              onClick={() => handleChatSubmit(undefined, 'Diagnostic panne CIJ 1580 code E52 viscosité')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 whitespace-nowrap transition-colors"
            >
              🚨 Panne E52 (Viscosité)
            </button>
            <button
              onClick={() => handleChatSubmit(undefined, 'Diagnostic défaut FA10 gouttière bouchée sur Videojet 1880')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 whitespace-nowrap transition-colors"
            >
              🛠️ Gouttière FA10
            </button>
            <button
              onClick={() => handleChatSubmit(undefined, 'Quelle encre et quel solvant utiliser pour des bouteilles PEHD huile alimentaire ?')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 whitespace-nowrap transition-colors"
            >
              🧪 Encre PEHD Huile
            </button>
            <button
              onClick={() => handleChatSubmit(undefined, 'Quels sont nos arguments face à Markem-Imaje 9450 ?')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 whitespace-nowrap transition-colors"
            >
              ⚔️ Arguments vs Markem-Imaje
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-2xl p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-videojet-blue text-white rounded-br-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <div className="prose prose-xs max-w-none whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 italic flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                  Le Copilot Videojet analyse la documentation technique...
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Posez votre question technique, code d'erreur ou demande commerciale..."
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="px-4 py-2.5 bg-videojet-blue hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Envoyer</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: TECHNICAL DIAGNOSTIC */}
      {activeTab === 'diagnostic' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              Diagnostic SAV & Guide de Dépannage
            </h2>
            <p className="text-slate-500 text-[11px]">
              Saisissez le code d'erreur affiché sur l'écran tactile pour obtenir l'arbre de résolution immédiat.
            </p>

            <form onSubmit={handleDiagSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Modèle de Machine Videojet *</label>
                <select
                  value={diagForm.model}
                  onChange={(e) => setDiagForm({ ...diagForm, model: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
                >
                  <option value="Videojet CIJ 1580">Videojet CIJ 1580 (Jet Continu Standard)</option>
                  <option value="Videojet CIJ 1880">Videojet CIJ 1880 (Jet Continu Haute Cadence IP66)</option>
                  <option value="Videojet Laser CO2 3340">Videojet Laser CO2 3340 (30 Watts)</option>
                  <option value="Videojet Laser Fibre 7340">Videojet Laser Fibre 7340 (20 Watts)</option>
                  <option value="Videojet TTO DataFlex 6530">Videojet TTO DataFlex 6530 (Transfert Thermique)</option>
                  <option value="Wolke m610 TIJ">Wolke m610 TIJ (Jet Thermique Sérialisation)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code d'Erreur (ex: E52, FA10, SHUTTER) *</label>
                <input
                  type="text"
                  value={diagForm.errorCode}
                  onChange={(e) => setDiagForm({ ...diagForm, errorCode: e.target.value })}
                  placeholder="Ex: E52, FA10..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description des Symptômes Constatés</label>
                <textarea
                  rows={3}
                  value={diagForm.symptoms}
                  onChange={(e) => setDiagForm({ ...diagForm, symptoms: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contexte Ligne & Environnement</label>
                <input
                  type="text"
                  value={diagForm.lineContext}
                  onChange={(e) => setDiagForm({ ...diagForm, lineContext: e.target.value })}
                  placeholder="Ex: Température atelier, cadence, présence d'humidité..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isDiagLoading}
                className="w-full py-2.5 bg-videojet-blue hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                {isDiagLoading ? 'Diagnostic en cours...' : 'Lancer le Diagnostic Expert IA'}
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            {diagResult ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mb-1.5 ${
                      diagResult.severity === 'CRITIQUE'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {diagResult.severity}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{diagResult.title}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>~{diagResult.estimatedDowntimeMin} min</span>
                  </div>
                </div>

                {/* Causes */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-1.5">Causes Probables :</h4>
                  <ul className="space-y-1">
                    {diagResult.probableCauses?.map((c: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600">
                        <span className="text-videojet-orange font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action steps */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Procédure de Dépannage Recommandée :</h4>
                  <div className="space-y-2">
                    {diagResult.actionSteps?.map((s: any) => (
                      <div key={s.step} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {s.step}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{s.action}</p>
                          {s.precaution && (
                            <p className="text-[11px] text-amber-700 mt-1 font-medium">⚠️ {s.precaution}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parts */}
                {diagResult.requiredParts?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1.5">Pièces & Fluides Requis :</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {diagResult.requiredParts.map((p: any, i: number) => (
                        <div key={i} className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-2.5">
                          <Package className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <span className="font-mono font-bold text-blue-900 block">{p.partNumber}</span>
                            <span className="text-[10px] text-slate-600">{p.name} (Qté: {p.quantity})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advice */}
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
                  <p className="font-bold text-[11px] mb-0.5">💡 Conseil Préventif Constructeur :</p>
                  <p className="text-[11px]">{diagResult.preventiveAdvice}</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <Wrench className="w-12 h-12 text-slate-300 mb-2 stroke-1" />
                <p className="font-bold text-slate-600">Aucun diagnostic généré</p>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                  Remplissez le formulaire à gauche pour lancer l'analyse automatisée des codes d'erreur et symptômes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: INK ADVISOR */}
      {activeTab === 'ink' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-500" />
              Conseiller Chimie & Substrats
            </h2>
            <p className="text-slate-500 text-[11px]">
              Définissez la matière du contenant et les contraintes pour obtenir l'encre Videojet certifiée.
            </p>

            <form onSubmit={handleInkSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Matière & Type de Substrat *</label>
                <input
                  type="text"
                  value={inkForm.substrate}
                  onChange={(e) => setInkForm({ ...inkForm, substrate: e.target.value })}
                  placeholder="Ex: Bouteille PEHD, Verre consigné, Carton pharma..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vitesse de Ligne Estimée (mètres / min)</label>
                <input
                  type="number"
                  value={inkForm.lineSpeed}
                  onChange={(e) => setInkForm({ ...inkForm, lineSpeed: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Température & Humidité Ambiante</label>
                <input
                  type="text"
                  value={inkForm.temperature}
                  onChange={(e) => setInkForm({ ...inkForm, temperature: e.target.value })}
                  placeholder="Ex: 4°C froid positif, 35°C été chaud..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="foodContact"
                  checked={inkForm.foodContact}
                  onChange={(e) => setInkForm({ ...inkForm, foodContact: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded"
                />
                <label htmlFor="foodContact" className="font-semibold text-slate-700">
                  Contact alimentaire indirect requis (Norme CE 1935/2004)
                </label>
              </div>

              <button
                type="submit"
                disabled={isInkLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                {isInkLoading ? 'Analyse chimique...' : 'Recommander la Formulation Idéale'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            {inkResult ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Technologie Recommandée
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{inkResult.recommendedTechnology}</h3>
                </div>

                {/* Primary Ink Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-base font-bold text-videojet-blue">{inkResult.primaryInk.partNumber}</span>
                      <h4 className="font-bold text-slate-800 text-xs">{inkResult.primaryInk.name}</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold">
                      Séchage: {inkResult.primaryInk.dryingTimeSeconds}s
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    <strong>Formulation :</strong> {inkResult.primaryInk.chemistry}
                  </p>

                  <div className="space-y-1">
                    {inkResult.primaryInk.features.map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Associated Makeup */}
                {inkResult.associatedMakeUp && (
                  <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-cyan-900 block text-xs">Solvant Associé : {inkResult.associatedMakeUp.name}</span>
                      <span className="font-mono text-[11px] text-cyan-700">Réf: {inkResult.associatedMakeUp.partNumber}</span>
                    </div>
                    <span className="text-[10px] text-cyan-800 font-semibold bg-white px-2 py-1 rounded-lg border border-cyan-200">
                      {inkResult.associatedMakeUp.consumptionRatio}
                    </span>
                  </div>
                )}

                {/* Regulatory */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-1.5">Conformités Réglementaires & Sécurité :</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {inkResult.regulatoryCompliance.map((r: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <FlaskConical className="w-12 h-12 text-slate-300 mb-2 stroke-1" />
                <p className="font-bold text-slate-600">Aucune formulation analysée</p>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                  Sélectionnez vos critères de ligne pour obtenir la référence d'encre et solvant homologuée Videojet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SALES BATTLECARD */}
      {activeTab === 'pitch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Swords className="w-5 h-5 text-indigo-500" />
              Générateur de Battlecard Vente
            </h2>
            <p className="text-slate-500 text-[11px]">
              Générez un pitch commercial personnalisé face à un concurrent présent chez le client industriel.
            </p>

            <form onSubmit={handlePitchSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Marque ou Modèle Concurrent *</label>
                <select
                  value={pitchForm.competitor}
                  onChange={(e) => setPitchForm({ ...pitchForm, competitor: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
                >
                  <option value="Markem-Imaje 9450">Markem-Imaje 9450 / 9040</option>
                  <option value="Domino Ax-Series">Domino Ax-Series (Ax150i / Ax350i)</option>
                  <option value="Linx 8900">Linx 8900 / 7900</option>
                  <option value="Hitachi UX Series">Hitachi UX Series</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client & Secteur Industriel</label>
                <input
                  type="text"
                  value={pitchForm.targetIndustry}
                  onChange={(e) => setPitchForm({ ...pitchForm, targetIndustry: e.target.value })}
                  placeholder="Ex: Agroalimentaire, Pharma, Câblage..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Préoccupations / Points de Douleur Client</label>
                <textarea
                  rows={3}
                  value={pitchForm.clientConcerns}
                  onChange={(e) => setPitchForm({ ...pitchForm, clientConcerns: e.target.value })}
                  placeholder="Ex: Coût des solvants trop élevé, pannes fréquentes l'été, formation des équipes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPitchLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                {isPitchLoading ? 'Génération de l\'argumentaire...' : 'Générer la Battlecard Commerciale'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            {pitchResult ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      Cible Concurrentielle
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{pitchResult.targetCompetitor}</h3>
                  </div>
                  <button
                    onClick={() => handleCopy(pitchResult.executivePitch)}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 border-l-4 border-videojet-blue rounded-r-xl">
                  <p className="italic text-slate-700 font-medium">"{pitchResult.executivePitch}"</p>
                </div>

                {/* Differentiators */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Points Clés de Différenciation :</h4>
                  <div className="space-y-2">
                    {pitchResult.keyDifferentiators.map((d: any, i: number) => (
                      <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block">{d.feature}</span>
                        <p className="text-emerald-700 font-medium">
                          <strong>Avantage Videojet :</strong> {d.videojetAdvantage}
                        </p>
                        <p className="text-rose-600 text-[11px]">
                          <strong>Point faible concurrent :</strong> {d.competitorWeakness}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Objections */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Traitement des Objections Clientes :</h4>
                  <div className="space-y-2">
                    {pitchResult.objectionHandling.map((o: any, i: number) => (
                      <div key={i} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80">
                        <span className="font-semibold text-amber-900 block mb-1">Client : "{o.objection}"</span>
                        <p className="text-slate-800 font-medium text-[11px]">👉 <strong>Réponse Videojet :</strong> {o.counterArgument}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-200 font-medium">
                  <strong>Proposition de Valeur :</strong> {pitchResult.tcoImpact}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <Swords className="w-12 h-12 text-slate-300 mb-2 stroke-1" />
                <p className="font-bold text-slate-600">Aucune battlecard générée</p>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                  Renseignez le nom du constructeur concurrent pour générer les arguments décisifs Videojet Maroc.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
