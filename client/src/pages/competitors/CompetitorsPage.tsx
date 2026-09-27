import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Swords,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useCurrency } from '../../contexts/CurrencyContext.js';

export const CompetitorsPage: React.FC = () => {
  const { token } = useAuth();
  const { formatMoney } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState<string>('ALL');

  const { data: competitorsData, isLoading } = useQuery({
    queryKey: ['competitors'],
    queryFn: async () => {
      const res = await axios.get('/api/competitors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.competitors;
    },
  });

  const competitors = competitorsData || [];
  const filteredCompetitors = competitors.filter((c: any) => {
    const matchesSearch =
      c.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.technicalPoints?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTech = selectedTech === 'ALL' || c.technology === selectedTech;
    return matchesSearch && matchesTech;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-cyan-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Veille Concurrentielle & Argumentaires Différenciateurs
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analyse comparative des marques concurrentes (Markem-Imaje, Domino, Linx) et argumentaires gagnants Videojet
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par marque (Markem, Domino, Linx), modèle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'CIJ', 'LASER_CO2', 'TTO', 'TIJ'].map((tech) => (
            <button
              key={tech}
              onClick={() => setSelectedTech(tech)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedTech === tech
                  ? 'bg-videojet-blue text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tech === 'ALL' ? 'Toutes' : tech.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Competitor Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Chargement de la base concurrentielle...</div>
      ) : filteredCompetitors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <Swords className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">Aucun concurrent trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {filteredCompetitors.map((comp: any) => (
            <div
              key={comp.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between hover:border-cyan-500/50 transition-all"
            >
              <div>
                {/* Brand & Model Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {comp.technology}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      {comp.brand} <span className="text-cyan-600 font-mono">{comp.modelName}</span>
                    </h2>
                  </div>
                  {comp.indicativePrice && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-medium">Prix Indicatif</span>
                      <p className="text-xs font-mono font-bold text-slate-700">
                        {formatMoney(comp.indicativePrice, comp.currency)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Points forts déclarés */}
                <div className="mt-3.5 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Forces Commerciales :</span>
                  </p>
                  <p className="text-[11px] text-slate-600 pl-5 leading-relaxed">
                    {comp.commercialStrengths || 'Implantation établie sur le marché marocain.'}
                  </p>
                </div>

                {/* Faiblesses signalées */}
                <div className="mt-3 space-y-1.5 p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                  <p className="text-[11px] font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Faiblesses Signalées par les Clients :</span>
                  </p>
                  <p className="text-[11px] text-rose-900/90 leading-relaxed">
                    {comp.reportedWeaknesses || 'Bouchage buse lors des arrêts, consommation élevée de solvant.'}
                  </p>
                </div>

                {/* Objections clients courantes */}
                {comp.clientObjections && (
                  <div className="mt-3 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Objection Client Fréquente :</span>
                    <p className="text-[11px] italic text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {comp.clientObjections}
                    </p>
                  </div>
                )}
              </div>

              {/* Videojet Winning Pitch Banner */}
              <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-cyan-950 text-white shadow-sm border border-cyan-500/20">
                <div className="flex items-center gap-1.5 mb-1.5 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    Argumentaire Gagnant Videojet
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  {comp.videojetWinningPitch || 'Mettre en avant la buse CleanFlow™ et le contrat SLA garanti.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
