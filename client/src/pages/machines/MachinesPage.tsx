import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Printer,
  QrCode,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  AlertOctagon,
  Clock,
  Layers,
  Wrench,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../../services/api.js';
import { Machine, MachineModel, Client } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { Modal } from '../../components/common/Modal.js';
import { QRCodeModal } from '../../components/common/QRCodeModal.js';
import { PermissionGate } from '../../components/common/PermissionGate.js';
import { downloadExport } from '../../utils/download.js';

export const MachinesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [qrMachine, setQrMachine] = useState<Machine | null>(null);
  const [detailMachine, setDetailMachine] = useState<Machine | null>(null);

  // New Machine Form State
  const [formData, setFormData] = useState({
    serialNumber: '',
    modelId: '',
    clientId: '',
    siteId: '',
    lineId: '',
    installDate: new Date().toISOString().split('T')[0],
    totalOperatingHours: 0,
    totalPrintsCount: 0,
    notes: '',
  });

  // Queries
  const { data: machinesData, isLoading } = useQuery({
    queryKey: ['machines', search, selectedFamily, selectedStatus],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (selectedFamily) params.family = selectedFamily;
      if (selectedStatus) params.status = selectedStatus;
      const res = await api.get('/machines', { params });
      return res.data.machines as Machine[];
    },
  });

  const { data: modelsData } = useQuery({
    queryKey: ['machine-models'],
    queryFn: async () => {
      const res = await api.get('/machines/models');
      return res.data.models as MachineModel[];
    },
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-summary'],
    queryFn: async () => {
      const res = await api.get('/clients');
      return res.data.clients as Client[];
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/machines', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsAddModalOpen(false);
      setFormData({
        serialNumber: '',
        modelId: '',
        clientId: '',
        siteId: '',
        lineId: '',
        installDate: new Date().toISOString().split('T')[0],
        totalOperatingHours: 0,
        totalPrintsCount: 0,
        notes: '',
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      siteId: formData.siteId || null,
      lineId: formData.lineId || null,
      totalOperatingHours: Number(formData.totalOperatingHours),
      totalPrintsCount: Number(formData.totalPrintsCount),
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('machines.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('machines.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadExport('/exports/machines/excel', 'Parc_Machines_Videojet.xlsx')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exporter Excel
          </button>
          <button
            onClick={() => downloadExport('/exports/machines/qr-labels/pdf', 'Planche_Etiquettes_QR_Videojet.pdf')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            Planche QR Codes PDF
          </button>
          <PermissionGate roles={['SUPER_ADMIN', 'ADMIN', 'RESPONSABLE_SAV', 'COMMERCIAL']}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-videojet-blue hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('machines.addMachine')}
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par N° Série, Client ou Modèle..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Toutes technologies</option>
            <option value="CIJ">Jet Continu (CIJ)</option>
            <option value="LASER_CO2">Laser CO2</option>
            <option value="LASER_FIBRE">Laser Fibre</option>
            <option value="TTO">Transfert Thermique (TTO)</option>
            <option value="TIJ">Jet Thermique (TIJ)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Tous les statuts</option>
            <option value="OPERATIONNELLE">Opérationnelle</option>
            <option value="EN_PANNE">En Panne</option>
            <option value="EN_MAINTENANCE">En Maintenance</option>
            <option value="ARRETEE">Arrêtée</option>
          </select>
        </div>
      </div>

      {/* Machines Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">{t('machines.serialNumber')}</th>
                <th className="py-3 px-4">{t('machines.model')}</th>
                <th className="py-3 px-4">{t('machines.client')}</th>
                <th className="py-3 px-4">{t('machines.hours')}</th>
                <th className="py-3 px-4">{t('machines.prints')}</th>
                <th className="py-3 px-4">{t('machines.status')}</th>
                <th className="py-3 px-4 text-center">{t('machines.qrCode')}</th>
                <th className="py-3 px-4 text-right">{t('machines.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Chargement du parc machines...
                  </td>
                </tr>
              ) : machinesData && machinesData.length > 0 ? (
                machinesData.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Printer className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span>{m.serialNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{m.model.name}</span>
                      <span className="block text-[10px] text-slate-500 font-medium">
                        {m.model.family} — {m.model.maxSpeed || 'Standard'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{m.client.name}</span>
                      <span className="block text-[10px] text-slate-500">
                        {m.site?.name || m.client.city} {m.line ? `— ${m.line.name}` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {m.totalOperatingHours.toFixed(1)} h
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {Number(m.totalPrintsCount).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setQrMachine(m)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-videojet-blue hover:border-videojet-blue hover:bg-cyan-50/50 transition-colors"
                        title="Voir QR Code SAV"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/machines/${m.id}/360`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors"
                          title="Vue 360°, garantie et score de remplacement"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          360°
                        </button>
                        <button
                          onClick={() => setDetailMachine(m)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Fiche
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Aucune machine ne correspond aux critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Machine Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enregistrer une nouvelle machine dans le parc"
        subtitle="Un QR code SAV unique sera automatiquement généré"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Numéro de Série Unique *
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="Ex: VJ1880-MA-2024-0512"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Modèle Videojet Officiel *
              </label>
              <select
                value={formData.modelId}
                onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              >
                <option value="">Sélectionner un modèle...</option>
                {modelsData?.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.name} ({mod.family})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Industriel *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              >
                <option value="">Sélectionner un client...</option>
                {clientsData?.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.name} ({cli.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date d'installation
              </label>
              <input
                type="date"
                value={formData.installDate}
                onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relevé initial compteur heures
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.totalOperatingHours}
                onChange={(e) => setFormData({ ...formData, totalOperatingHours: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relevé initial compteur prints
              </label>
              <input
                type="number"
                value={formData.totalPrintsCount}
                onChange={(e) => setFormData({ ...formData, totalPrintsCount: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes & Caractéristiques d'intégration
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Tête d'impression montée à 90° sur convoyeur de sortie..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-xs font-semibold bg-videojet-blue text-white hover:bg-slate-800 rounded-xl shadow-xs"
            >
              {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer la machine'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Machine Details Modal */}
      {detailMachine && (
        <Modal
          isOpen={!!detailMachine}
          onClose={() => setDetailMachine(null)}
          title={`Fiche Machine : ${detailMachine.serialNumber}`}
          subtitle={`${detailMachine.model.name} — ${detailMachine.client.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl">
              <div>
                <span className="text-slate-400 block font-medium">Technologie</span>
                <span className="font-bold text-slate-800">{detailMachine.model.family}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Compteur Heures</span>
                <span className="font-bold text-slate-800">{detailMachine.totalOperatingHours.toFixed(1)} h</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Nombre d'impressions</span>
                <span className="font-bold text-slate-800">{Number(detailMachine.totalPrintsCount).toLocaleString('fr-FR')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Statut Actuel</span>
                <div className="mt-0.5"><StatusBadge status={detailMachine.status} /></div>
              </div>
            </div>

            <div className="p-4 border border-slate-100 rounded-xl">
              <h4 className="font-bold text-slate-800 mb-2">Spécifications constructeur Videojet</h4>
              <p className="text-slate-600 mb-1">{detailMachine.model.description}</p>
              <div className="flex gap-4 text-slate-500 text-[11px] pt-2 border-t border-slate-100">
                <span>Vitesse max: <strong>{detailMachine.model.maxSpeed}</strong></span>
                <span>Résolution: <strong>{detailMachine.model.resolution}</strong></span>
                <span>Protection: <strong>{detailMachine.model.ipRating}</strong></span>
              </div>
            </div>

            {detailMachine.notes && (
              <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-slate-700">
                <strong>Notes d'installation :</strong> {detailMachine.notes}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const m = detailMachine;
                  setDetailMachine(null);
                  setQrMachine(m);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
              >
                <QrCode className="w-4 h-4" />
                Imprimer QR Code SAV
              </button>

              <button
                onClick={() => setDetailMachine(null)}
                className="px-4 py-2 bg-videojet-blue text-white rounded-lg font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        machine={qrMachine}
        isOpen={!!qrMachine}
        onClose={() => setQrMachine(null)}
      />
    </div>
  );
};
