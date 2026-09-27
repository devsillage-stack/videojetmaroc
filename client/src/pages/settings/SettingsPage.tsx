import React, { useState, useEffect } from 'react';
import {
  Building2,
  Sliders,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  RotateCcw,
  Palette,
  CreditCard,
  Hash,
  Globe,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Database,
  Trash2,
  ShieldAlert,
  RefreshCw,
  Users,
  Printer,
  Boxes,
  Receipt,
  FileSpreadsheet,
  PackageCheck,
  Wrench,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { CompanySettings } from '../../types/index.js';

interface DatabaseStats {
  clients: number;
  machines: number;
  quotes: number;
  orders: number;
  invoices: number;
  tickets: number;
  interventions: number;
  products: number;
  stockBatches: number;
  stockMovements: number;
  purchaseOrders: number;
  audits: number;
  tcoCalculations: number;
  contracts: number;
  users: number;
  totalRecords: number;
}

export const SettingsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('SUPER_ADMIN', 'ADMIN');

  const [activeTab, setActiveTab] = useState<'info' | 'studio' | 'database'>('info');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExportingSpecimen, setIsExportingSpecimen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Database Purge state
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);
  const [purgeMode, setPurgeMode] = useState<'TRANSACTIONAL' | 'ALL'>('TRANSACTIONAL');
  const [confirmationInput, setConfirmationInput] = useState<string>('');

  const [formData, setFormData] = useState<CompanySettings>({
    companyName: 'VIDEOJET MAROC SARL',
    tagline: 'Solutions Professionnelles de Codage, Marquage et Traçabilité Industrielle',
    formJuridique: 'SARL',
    capitalSocial: '1 000 000 DH',
    address: 'Boulevard Ahl Loghlam, Z.I. Sidi Bernoussi',
    city: 'Casablanca',
    postalCode: '20600',
    country: 'Maroc',
    phone: '+212 522 75 40 00',
    email: 'contact@videojet.ma',
    website: 'www.videojet.ma',
    ice: '001892847000082',
    ifTax: '24890123',
    rc: '412098 Casablanca',
    patente: '34120987',
    cnss: '8901234',
    bankName: 'Attijariwafa Bank Maroc',
    bankAgency: 'Agence Sidi Bernoussi Casablanca',
    rib: '007 780 0001234567890123 45',
    swift: 'BCMAMAMC',
    logoUrl: '',
    logoWidth: 140,
    primaryColor: '#002b49',
    accentColor: '#ff5c00',
    headerStyle: 'MODERN',
    termsTemplate: 'Conditions : Règlement à 30 jours fin de mois. Matériel neuf garanti 12 mois pièces et main-d\'œuvre.',
  });

  useEffect(() => {
    fetchSettings();
    if (isAdmin) {
      fetchDatabaseStats();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/settings/company');
      if (res.data?.settings) {
        setFormData((prev) => ({
          ...prev,
          ...res.data.settings,
        }));
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Erreur lors du chargement des paramètres',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDatabaseStats = async () => {
    try {
      setIsLoadingStats(true);
      const res = await api.get('/settings/database-stats');
      if (res.data?.stats) {
        setDbStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load DB stats', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'logoWidth' ? Number(value) : value,
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        logoUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: '',
      logoWidth: 140,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setFeedback(null);
      await api.put('/settings/company', formData);
      setFeedback({
        type: 'success',
        message: 'Paramètres et mise en page enregistrés avec succès !',
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Erreur lors de l\'enregistrement',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadSpecimen = async () => {
    try {
      setIsExportingSpecimen(true);
      const res = await api.get('/exports/specimen-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Specimen_Mise_En_Page_Videojet.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert('Erreur lors du téléchargement du spécimen PDF.');
    } finally {
      setIsExportingSpecimen(false);
    }
  };

  const handleExecutePurge = async () => {
    if (confirmationInput !== 'PURGE') {
      alert('Veuillez taper "PURGE" en majuscules pour confirmer.');
      return;
    }

    try {
      setIsPurging(true);
      setFeedback(null);
      const res = await api.post('/settings/purge-database', {
        mode: purgeMode,
        confirmation: 'PURGE',
        keepAdminUsers: true,
      });

      setShowPurgeModal(false);
      setConfirmationInput('');
      setFeedback({
        type: 'success',
        message: 'Base de données purgée avec succès ! Les données de test ont été vidées.',
      });

      // Refresh DB stats
      await fetchDatabaseStats();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Erreur lors de la purge de la base de données',
      });
    } finally {
      setIsPurging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mr-3" />
        Chargement des paramètres d'entreprise...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-7 h-7 text-cyan-600" />
            Paramètres, Studio & Maintenance
          </h1>
          <p className="text-sm text-slate-500">
            Personnalisez l'identité de l'entreprise, les coordonnées bancaires, le modèle de document PDF et la maintenance de la base.
          </p>
        </div>

        <button
          onClick={handleDownloadSpecimen}
          disabled={isExportingSpecimen}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>{isExportingSpecimen ? 'Génération...' : 'Télécharger Spécimen PDF (Test A4)'}</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 bg-white px-6 pt-3 rounded-t-2xl shadow-sm">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'info'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Informations Entreprise & Banque
        </button>
        <button
          onClick={() => setActiveTab('studio')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'studio'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          Studio de Mise en Page Documents (Libre Choix)
        </button>
        {isAdmin && (
          <button
            onClick={() => {
              setActiveTab('database');
              fetchDatabaseStats();
            }}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'database'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Base de Données & Purge
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INFORMATIONS ENTREPRISE & BANQUE */}
      {/* ========================================================================= */}
      {activeTab === 'info' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Coordonnées Générales */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-5 h-5 text-cyan-600" />
                Coordonnées Générales & Siège Social
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Raison Sociale</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Slogan / Sous-titre</label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Forme Juridique</label>
                    <input
                      type="text"
                      name="formJuridique"
                      value={formData.formJuridique || ''}
                      onChange={handleInputChange}
                      placeholder="SARL, SA, etc."
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Capital Social</label>
                    <input
                      type="text"
                      name="capitalSocial"
                      value={formData.capitalSocial || ''}
                      onChange={handleInputChange}
                      placeholder="1 000 000 DH"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse Siège Social</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ville</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Code Postal</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode || ''}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pays</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country || ''}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Tél
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" /> Site Web
                    </label>
                    <input
                      type="text"
                      name="website"
                      value={formData.website || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Fiscalité Marocaine & Coordonnées Bancaires */}
            <div className="space-y-6">
              {/* Identifiants Fiscaux */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Hash className="w-5 h-5 text-amber-600" />
                  Identifiants Fiscaux Marocains (Obligatoires sur Factures)
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ICE (Identifiant Commun de l'Entreprise — 15 chiffres)
                    </label>
                    <input
                      type="text"
                      name="ice"
                      value={formData.ice || ''}
                      onChange={handleInputChange}
                      placeholder="001892847000082"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-amber-50/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Identifiant Fiscal (IF)</label>
                      <input
                        type="text"
                        name="ifTax"
                        value={formData.ifTax || ''}
                        onChange={handleInputChange}
                        placeholder="24890123"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Registre de Commerce (RC)</label>
                      <input
                        type="text"
                        name="rc"
                        value={formData.rc || ''}
                        onChange={handleInputChange}
                        placeholder="412098 Casablanca"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Taxe Professionnelle / Patente</label>
                      <input
                        type="text"
                        name="patente"
                        value={formData.patente || ''}
                        onChange={handleInputChange}
                        placeholder="34120987"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Numéro CNSS</label>
                      <input
                        type="text"
                        name="cnss"
                        value={formData.cnss || ''}
                        onChange={handleInputChange}
                        placeholder="8901234"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Coordonnées Bancaires */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Coordonnées Bancaires pour Virement
                </h2>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de la Banque</label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName || ''}
                        onChange={handleInputChange}
                        placeholder="Attijariwafa Bank Maroc"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Agence Bancaire</label>
                      <input
                        type="text"
                        name="bankAgency"
                        value={formData.bankAgency || ''}
                        onChange={handleInputChange}
                        placeholder="Agence Sidi Bernoussi Casablanca"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      RIB Bancaire (Relevé d'Identité Bancaire — 24 chiffres)
                    </label>
                    <input
                      type="text"
                      name="rib"
                      value={formData.rib || ''}
                      onChange={handleInputChange}
                      placeholder="007 780 0001234567890123 45"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-800 bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Code SWIFT / BIC</label>
                    <input
                      type="text"
                      name="swift"
                      value={formData.swift || ''}
                      onChange={handleInputChange}
                      placeholder="BCMAMAMC"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSaving ? 'Enregistrement en cours...' : 'Enregistrer les Informations'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STUDIO DE MISE EN PAGE DOCUMENTS (LIBRE CHOIX) */}
      {/* ========================================================================= */}
      {activeTab === 'studio' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Logo Management */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-cyan-600" />
                    Logo Entreprise & Dimensionnement
                  </span>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Réinitialiser au logo Videojet
                    </button>
                  )}
                </h2>

                <div className="space-y-4">
                  {/* File Upload Box */}
                  <div className="border-2 border-dashed border-slate-200 hover:border-cyan-500 rounded-2xl p-5 text-center transition-all bg-slate-50/50">
                    {formData.logoUrl ? (
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden"
                          style={{ maxWidth: '280px' }}
                        >
                          <img
                            src={formData.logoUrl}
                            alt="Logo Document"
                            style={{ width: `${formData.logoWidth || 140}px`, maxHeight: '80px', objectFit: 'contain' }}
                          />
                        </div>
                        <label className="cursor-pointer text-xs font-bold text-cyan-600 hover:text-cyan-800">
                          Changer l'image du logo
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">
                          Téléversez le logo de votre entreprise (PNG, JPG, SVG)
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Recommandé : image transparente haute définition (ex: 400x120 px)
                        </p>
                        <label className="mt-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all">
                          Parcourir les fichiers
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Logo Size Range Slider */}
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span>Largeur d'affichage du logo sur le document :</span>
                      <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-md font-mono font-bold">
                        {formData.logoWidth || 140} px / pt
                      </span>
                    </div>
                    <input
                      type="range"
                      name="logoWidth"
                      min="70"
                      max="220"
                      step="5"
                      value={formData.logoWidth || 140}
                      onChange={handleInputChange}
                      className="w-full accent-cyan-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Discret (70 px)</span>
                      <span>Standard (140 px)</span>
                      <span>Grand format (220 px)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Scheme */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Palette className="w-5 h-5 text-indigo-600" />
                  Couleurs de la Charte Documentaire
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Color */}
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">Couleur Principale (En-têtes, Tableaux)</label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        name="primaryColor"
                        value={formData.primaryColor || '#002b49'}
                        onChange={handleInputChange}
                        className="w-9 h-9 rounded-lg border-0 cursor-pointer p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        name="primaryColor"
                        value={formData.primaryColor || '#002b49'}
                        onChange={handleInputChange}
                        className="w-28 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase text-slate-900"
                      />
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      {['#002b49', '#1e3a8a', '#0f172a', '#1e293b', '#065f46'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, primaryColor: col }))}
                          style={{ backgroundColor: col }}
                          className="w-5 h-5 rounded-full border border-white shadow-sm hover:scale-110 transition-transform"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">Couleur d'Accentuation (Bandeaux, Badges)</label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        name="accentColor"
                        value={formData.accentColor || '#ff5c00'}
                        onChange={handleInputChange}
                        className="w-9 h-9 rounded-lg border-0 cursor-pointer p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        name="accentColor"
                        value={formData.accentColor || '#ff5c00'}
                        onChange={handleInputChange}
                        className="w-28 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase text-slate-900"
                      />
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      {['#ff5c00', '#0284c7', '#059669', '#dc2626', '#d97706'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, accentColor: col }))}
                          style={{ backgroundColor: col }}
                          className="w-5 h-5 rounded-full border border-white shadow-sm hover:scale-110 transition-transform"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Default Terms Template */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <label className="block text-xs font-bold text-slate-900">
                  Conditions Commerciales Générales par Défaut (Pied des Devis et Factures)
                </label>
                <textarea
                  name="termsTemplate"
                  rows={2}
                  value={formData.termsTemplate || ''}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Live Document Preview Card (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  Aperçu Dynamique Document A4
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  1 Page Garantie
                </span>
              </div>

              {/* Realistic A4 Mini Sheet */}
              <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden text-slate-800 text-[10px] select-none p-5 flex flex-col justify-between min-h-[560px]">
                {/* Top Section */}
                <div>
                  <div
                    className="h-1.5 w-full rounded-full mb-3"
                    style={{ backgroundColor: formData.accentColor || '#ff5c00' }}
                  />

                  {/* Header Row */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-3">
                    <div>
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Logo"
                          style={{ width: `${Math.min(130, (formData.logoWidth || 140) * 0.7)}px`, maxHeight: '40px', objectFit: 'contain' }}
                          className="mb-1"
                        />
                      ) : (
                        <div className="font-extrabold text-sm tracking-tight" style={{ color: formData.primaryColor || '#002b49' }}>
                          {formData.companyName.split(' ')[0] || 'VIDEOJET'}
                          <span style={{ color: formData.accentColor || '#ff5c00' }}> MAROC</span>
                        </div>
                      )}
                      <p className="text-[8px] text-slate-400 font-medium max-w-[170px] truncate">
                        {formData.tagline}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-xs" style={{ color: formData.primaryColor || '#002b49' }}>
                        FACTURE OFFICIELLE
                      </div>
                      <div className="text-[9px] font-bold text-slate-700">N° FAC-2024-001</div>
                      <div className="text-[8px] text-slate-400">Date : 26/09/2026</div>
                    </div>
                  </div>

                  {/* 2 Boxes: Client & Meta */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-[7.5px] font-bold uppercase" style={{ color: formData.primaryColor || '#002b49' }}>
                        Client Facturé
                      </div>
                      <div className="font-bold text-[9px] text-slate-900">Centrale Danone Maroc</div>
                      <div className="text-[7.5px] text-slate-500">Casablanca — Maroc</div>
                      <div className="text-[7.5px] font-semibold text-slate-600">ICE : 001524889000045</div>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-[7.5px] font-bold uppercase" style={{ color: formData.primaryColor || '#002b49' }}>
                        Modalités
                      </div>
                      <div className="text-[7.5px] text-slate-600 flex justify-between">
                        <span>Échéance :</span>
                        <span className="font-bold text-slate-900">30 jours net</span>
                      </div>
                      <div className="text-[7.5px] text-slate-600 flex justify-between">
                        <span>Règlement :</span>
                        <span className="font-bold text-slate-900">Virement bancaire</span>
                      </div>
                      <div className="text-[7.5px] text-slate-600 flex justify-between">
                        <span>Statut :</span>
                        <span className="font-bold text-emerald-600">Soldée</span>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden mb-3">
                    <div
                      className="px-2 py-1 text-[8px] font-bold text-white flex justify-between"
                      style={{ backgroundColor: formData.primaryColor || '#002b49' }}
                    >
                      <span>Désignation des Prestations</span>
                      <span>Total HT</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 text-[8px] flex justify-between border-b border-slate-100">
                      <div>
                        <div className="font-bold text-slate-800">Imprimante Jet d'Encre Videojet 1880 CIJ</div>
                        <div className="text-[7px] text-slate-400">Garantie 12 mois constructeur incluse</div>
                      </div>
                      <div className="font-bold text-slate-900">137 750.00 MAD</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Pinned Blocks: Wire info & Totals + Footer */}
                <div className="space-y-3 pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[7px] space-y-0.5">
                      <div className="font-bold uppercase text-[7.5px]" style={{ color: formData.primaryColor || '#002b49' }}>
                        Coordonnées Virement
                      </div>
                      <div>Banque : {formData.bankName}</div>
                      <div>Agence : {formData.bankAgency}</div>
                      <div className="font-mono font-bold text-slate-900 truncate">
                        RIB : {formData.rib}
                      </div>
                      <div className="font-mono">SWIFT : {formData.swift}</div>
                    </div>

                    <div className="p-2 bg-white border border-slate-200 rounded-lg text-[8px] space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Total HT :</span>
                        <span className="font-bold text-slate-800">137 750.00 MAD</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>TVA (20%) :</span>
                        <span className="font-bold text-slate-800">27 550.00 MAD</span>
                      </div>
                      <div
                        className="flex justify-between pt-1 border-t border-slate-100 text-[10px] font-extrabold"
                        style={{ color: formData.primaryColor || '#002b49' }}
                      >
                        <span>TOTAL TTC :</span>
                        <span>165 300.00 MAD</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-slate-200 pt-2 text-[6.5px] text-center text-slate-400 space-y-0.5">
                    <div className="font-bold text-slate-700">
                      {formData.companyName} — {formData.formJuridique} au capital de {formData.capitalSocial} — Siège : {formData.address}, {formData.city}
                    </div>
                    <div>
                      ICE: {formData.ice} | IF: {formData.ifTax} | RC: {formData.rc} | Patente: {formData.patente} | Tél: {formData.phone}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSaving ? 'Enregistrement en cours...' : 'Enregistrer la Charte Documentaire'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BASE DE DONNÉES & PURGE (ADMINISTRATEUR SEULEMENT) */}
      {/* ========================================================================= */}
      {activeTab === 'database' && isAdmin && (
        <div className="space-y-6">
          {/* Warning banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900">
                Zone Critique — Nettoyage & Purge avant Mise en Production
              </h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                Cette fonctionnalité permet de supprimer l'ensemble des données de test et de démonstration créées lors des phases de développement (clients fictifs, devis, factures, interventions, mouvements de stock).
                Le compte Super Administrateur et vos paramètres d'entreprise seront préservés afin de garantir votre accès.
              </p>
            </div>
          </div>

          {/* Database Live Stats Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-600" />
                Statistiques Actuelles de la Base de Données
              </h2>
              <button
                type="button"
                onClick={fetchDatabaseStats}
                disabled={isLoadingStats}
                className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-500" /> Clients
                </span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{dbStats?.clients ?? '—'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5 text-cyan-500" /> Machines
                </span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{dbStats?.machines ?? '—'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" /> Devis
                </span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{dbStats?.quotes ?? '—'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-emerald-500" /> Factures
                </span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{dbStats?.invoices ?? '—'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                  <PackageCheck className="w-3.5 h-3.5 text-indigo-500" /> Commandes
                </span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{dbStats?.orders ?? '—'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-rose-500" /> Tickets SAV
                </span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{dbStats?.tickets ?? '—'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                  <Boxes className="w-3.5 h-3.5 text-purple-500" /> Lots & Stock
                </span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{dbStats?.stockBatches ?? '—'}</p>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-emerald-600" /> Total Données
                </span>
                <p className="text-xl font-extrabold text-emerald-900 mt-1">{dbStats?.totalRecords ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Purge Options Box */}
          <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Sélection du Mode de Purge
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setPurgeMode('TRANSACTIONAL')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  purgeMode === 'TRANSACTIONAL'
                    ? 'border-cyan-600 bg-cyan-50/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    checked={purgeMode === 'TRANSACTIONAL'}
                    onChange={() => setPurgeMode('TRANSACTIONAL')}
                    className="accent-cyan-600"
                  />
                  <span className="font-bold text-xs text-slate-900">
                    Mode A : Vider les Données Opérationnelles & Clients (Recommandé)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pl-5">
                  Supprime tous les clients, machines clientes, devis, factures, tickets SAV, interventions et mouvements de stock.
                  <strong> Conserve intacts</strong> le catalogue des imprimantes Videojet, les devises, la configuration d'entreprise et les utilisateurs.
                </p>
              </div>

              <div
                onClick={() => setPurgeMode('ALL')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  purgeMode === 'ALL'
                    ? 'border-rose-600 bg-rose-50/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    checked={purgeMode === 'ALL'}
                    onChange={() => setPurgeMode('ALL')}
                    className="accent-rose-600"
                  />
                  <span className="font-bold text-xs text-rose-900">
                    Mode B : Purge Totale d'Usine (Remise à Zéro)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pl-5">
                  Supprime la totalité des données enregistrées dans la base de données. Conserve uniquement le compte Super Administrateur pour préserver votre connexion.
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setConfirmationInput('');
                  setShowPurgeModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Lancer la Purge de la Base de Données...</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge Confirmation Security Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Confirmer la Purge de la Base</h3>
              <p className="text-xs text-slate-500">
                Vous êtes sur le point de supprimer définitivement les données de la base en mode :{' '}
                <strong className="text-rose-600 font-mono">
                  {purgeMode === 'TRANSACTIONAL' ? 'OPÉRATIONNEL (Clients, Devis, Factures)' : 'PURGE TOTALE'}
                </strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-700">
              <p>• Cette opération est <strong>irréversible</strong>.</p>
              <p>• Le compte administrateur <strong>superadmin@videojet.ma</strong> restera actif.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Pour confirmer, veuillez saisir <span className="text-rose-600 font-mono font-extrabold">PURGE</span> ci-dessous :
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Tapez PURGE"
                className="w-full px-3.5 py-2.5 border-2 border-slate-300 focus:border-rose-600 rounded-xl text-center text-sm font-mono font-extrabold uppercase text-slate-900 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isPurging}
                onClick={() => setShowPurgeModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={confirmationInput !== 'PURGE' || isPurging}
                onClick={handleExecutePurge}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                {isPurging ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Purge en cours...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Exécuter la Purge</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
