import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Plus,
  Search,
  Eye,
  Briefcase,
  Layers,
  Printer,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api.js';
import { Client } from '../../types/index.js';
import { Modal } from '../../components/common/Modal.js';
import { PermissionGate } from '../../components/common/PermissionGate.js';

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    industrySector: 'AGROALIMENTAIRE',
    ice: '',
    rc: '',
    ifTax: '',
    city: 'Casablanca',
    address: '',
    phone: '',
    email: '',
  });

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', search, selectedSector],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (selectedSector) params.sector = selectedSector;
      const res = await api.get('/clients', { params });
      return res.data.clients as Client[];
    },
  });

  const { data: clientDetails } = useQuery({
    queryKey: ['client-details', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return null;
      const res = await api.get(`/clients/${selectedClient.id}`);
      return res.data.client as Client;
    },
    enabled: !!selectedClient?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/clients', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsAddModalOpen(false);
      setFormData({
        code: '',
        name: '',
        industrySector: 'AGROALIMENTAIRE',
        ice: '',
        rc: '',
        ifTax: '',
        city: 'Casablanca',
        address: '',
        phone: '',
        email: '',
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Clients Industriels & Prospects
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Répertoire des usines, sites de production et interlocuteurs techniques au Maroc
          </p>
        </div>

        <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL', 'DIRECTION']}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-videojet-blue hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau Client / Prospect
          </button>
        </PermissionGate>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom d'entreprise, ICE ou ville..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Tous les secteurs</option>
            <option value="AGROALIMENTAIRE">Agroalimentaire</option>
            <option value="PHARMACEUTIQUE">Pharmaceutique</option>
            <option value="COSMETIQUE">Cosmétique</option>
            <option value="BOISSONS">Boissons</option>
            <option value="AUTOMOBILE_CABLE">Automobile & Câblage</option>
            <option value="CHIMIE">Chimie</option>
          </select>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Chargement des comptes clients...
          </div>
        ) : clients && clients.length > 0 ? (
          clients.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-videojet-blue/5 text-videojet-blue flex items-center justify-center font-bold text-sm shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">
                        {c.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.code}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/50">
                    {c.industrySector}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.city}, Maroc</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.ice && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Briefcase className="w-3.5 h-3.5 shrink-0" />
                      <span>ICE : {c.ice}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Printer className="w-3.5 h-3.5 text-cyan-600" />
                    {c._count?.machines || 0}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                    {c._count?.contracts || 0} contrat(s)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => navigate(`/quotes?new=true&clientId=${c.id}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors cursor-pointer"
                    title="Créer un devis pour ce client"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Devis
                  </button>
                  <button
                    onClick={() => navigate(`/clients/${c.id}/360`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-xl transition-colors cursor-pointer"
                    title="Vue Customer 360° & Timeline"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    360°
                  </button>
                  <button
                    onClick={() => setSelectedClient(c)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-videojet-blue rounded-xl transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Détails
                  </button>
                </div>
              </div>
            </div>

          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400">
            Aucun client trouvé.
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Créer un nouveau compte client ou prospect"
        subtitle="Renseignez les données légales et coordonnées de l'usine"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Code Client / Réf Interne *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: CLI-2024-009"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Raison Sociale / Nom *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Fromagerie Bel Maroc"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Secteur d'activité *
              </label>
              <select
                value={formData.industrySector}
                onChange={(e) => setFormData({ ...formData, industrySector: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="AGROALIMENTAIRE">Agroalimentaire</option>
                <option value="PHARMACEUTIQUE">Pharmaceutique</option>
                <option value="COSMETIQUE">Cosmétique</option>
                <option value="BOISSONS">Boissons</option>
                <option value="AUTOMOBILE_CABLE">Automobile & Câblage</option>
                <option value="CHIMIE">Chimie</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ville principale *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Casablanca, Tanger, Agadir..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Identifiant Commun Entreprise (ICE Maroc)
              </label>
              <input
                type="text"
                value={formData.ice}
                onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                placeholder="15 chiffres"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Téléphone standard
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+212 5..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Adresse du site industriel
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Zone Industrielle..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 font-semibold bg-videojet-blue text-white hover:bg-slate-800 rounded-xl shadow-xs"
            >
              {createMutation.isPending ? 'Enregistrement...' : 'Créer le compte client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Client Full Details Modal */}
      {selectedClient && (
        <Modal
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          title={`Compte Client : ${selectedClient.name}`}
          subtitle={`${selectedClient.code} — Secteur ${selectedClient.industrySector}`}
          maxWidth="3xl"
        >
          {clientDetails ? (
            <div className="space-y-6 text-xs">
              {/* Top Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block font-medium">Ville</span>
                  <span className="font-bold text-slate-800">{clientDetails.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">ICE</span>
                  <span className="font-bold text-slate-800">{clientDetails.ice || 'Non renseigné'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Devise par défaut</span>
                  <span className="font-bold text-slate-800">{clientDetails.defaultCurrency}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Statut</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    {clientDetails.status}
                  </span>
                </div>
              </div>

              {/* Sites & Production Lines */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-600" />
                  Sites de production & Lignes d'embouteillage
                </h4>
                <div className="space-y-2">
                  {clientDetails.sites && clientDetails.sites.length > 0 ? (
                    clientDetails.sites.map((s) => (
                      <div key={s.id} className="p-3 border border-slate-100 rounded-xl bg-white shadow-2xs">
                        <div className="font-bold text-slate-800 flex items-center justify-between">
                          <span>{s.name} ({s.city})</span>
                          <span className="text-[10px] text-slate-400 font-normal">{s.address}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {s.productionLines?.map((line) => (
                            <span
                              key={line.id}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-medium"
                            >
                              ⚡ {line.name} ({line.speedUnitsPerHour || 0} u/h)
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400">Aucun site configuré.</p>
                  )}
                </div>
              </div>

              {/* Installed Machines */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-videojet-blue" />
                  Parc Machines Installé chez le Client ({clientDetails.machines?.length || 0})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clientDetails.machines?.map((m) => (
                    <div key={m.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                      <div className="font-bold text-slate-900">{m.serialNumber}</div>
                      <div className="text-slate-600 text-[11px]">{m.model.name}</div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-500">{m.totalOperatingHours.toFixed(1)} h</span>
                        <span className="font-semibold text-emerald-600">{m.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">Chargement des données...</div>
          )}
        </Modal>
      )}
    </div>
  );
};
