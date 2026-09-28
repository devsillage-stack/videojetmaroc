import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { NexoraLogo } from '../../components/common/NexoraLogo.js';

const DEMO_ACCOUNTS = [
  { role: 'Super Admin', email: 'superadmin@videojet.ma', desc: 'Accès absolu système & audit' },
  { role: 'Direction', email: 'direction@videojet.ma', desc: 'KPI, CA, marges protégées' },
  { role: 'Commercial', email: 'commercial@videojet.ma', desc: 'Clients, devis, opportunités' },
  { role: 'Responsable SAV', email: 'sav.manager@videojet.ma', desc: 'Planning & interventions' },
  { role: 'Technicien SAV', email: 'technicien@videojet.ma', desc: 'Rapports & signature terrain' },
  { role: 'Magasinier', email: 'magasinier@videojet.ma', desc: 'Stocks & péremption encres' },
  { role: 'Comptabilité', email: 'comptabilite@videojet.ma', desc: 'Factures, règlements, TVA' },
];

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('superadmin@videojet.ma');
  const [password, setPassword] = useState('Videojet2026!');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de connexion. Vérifiez vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Videojet2026!');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background industrial decoration */}
      <div className="absolute inset-0 bg-radial-gradient from-videojet-blue/40 to-slate-950 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center flex flex-col items-center">
        <NexoraLogo size="xl" variant="glow" showText={false} className="mb-4" />
        <h2 className="text-3xl font-black text-white tracking-wider flex items-center justify-center gap-2">
          <span>NEXORA</span>
          <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs">
            OS
          </span>
        </h2>
        <p className="mt-1.5 text-xs text-cyan-300 font-semibold tracking-widest uppercase">
          Plateforme Industrielle & Système d'Exploitation B2B
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Adresse Email Professionnelle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                  placeholder="nom@videojet.ma"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mot de Passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-videojet-blue hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-70"
            >
              {isLoading ? (
                'Connexion en cours...'
              ) : (
                <>
                  <span>Accéder à la plateforme</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Comptes Démo Multi-Rôles (Sélection rapide en 1 clic) :
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectDemo(acc.email)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                    email === acc.email
                      ? 'border-videojet-blue bg-cyan-50/60 font-bold text-videojet-blue'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{acc.role}</span>
                    {email === acc.email && <CheckCircle2 className="w-3.5 h-3.5 text-videojet-blue" />}
                  </div>
                  <span className="block text-[10px] text-slate-500 font-normal truncate mt-0.5">
                    {acc.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
