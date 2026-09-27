import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  PackageCheck,
  Search,
  Truck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useCurrency } from '../../contexts/CurrencyContext.js';

export const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await axios.get('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.orders;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, trackingNumber }: any) => {
      const res = await axios.patch(
        `/api/orders/${id}/status`,
        { status, trackingNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrder(null);
    },
  });

  const orders = ordersData || [];
  const filteredOrders = orders.filter(
    (o: any) =>
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMEE':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">Confirmée</span>;
      case 'EN_PREPARATION':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">En Préparation</span>;
      case 'EXPEDIEE':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-50 text-purple-700 border border-purple-200">Expédiée</span>;
      case 'LIVREE':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Livrée</span>;
      case 'ANNULEE':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200">Annulée</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-50 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-cyan-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Commandes Clients & Expéditions
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Suivi des commandes fermes issues de devis acceptés, préparation en magasin et suivi de livraison
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par n° de commande, client, tracking..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">N° Commande</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Devis Source</th>
                <th className="py-3.5 px-4">Date Prévue</th>
                <th className="py-3.5 px-4">Montant TTC</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Chargement des commandes...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-700">{order.orderNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{order.client?.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{order.quote?.quoteNumber || 'Direct'}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {order.estimatedDeliveryDate
                        ? new Date(order.estimatedDeliveryDate).toLocaleDateString('fr-FR')
                        : 'À définir'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {formatMoney(order.totalTtc, order.currency)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setNewStatus(order.status);
                          setTrackingNumber(order.trackingNumber || '');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Détails & Suivi</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Order Details & Status Update */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Suivi Commande ${selectedOrder.orderNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900">{selectedOrder.client?.name}</p>
              <p className="text-slate-500">
                Adresse de livraison : <span className="text-slate-800">{selectedOrder.deliveryAddress || 'Adresse siège client'}</span>
              </p>
              <p className="text-slate-500">
                Montant Total : <span className="font-mono font-bold text-slate-900">{formatMoney(selectedOrder.totalTtc, selectedOrder.currency)}</span>
              </p>
            </div>

            {/* Items list */}
            <div>
              <p className="font-bold text-slate-800 mb-2">Articles Commandés :</p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="p-2.5 bg-white flex justify-between items-center text-xs">
                    <div>
                      <p className="font-medium text-slate-800">{item.description}</p>
                      <p className="text-[11px] text-slate-400">Quantité : {item.quantity}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-700">
                      {formatMoney(item.totalLineHt, selectedOrder.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Update Form */}
            <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-100 space-y-3">
              <p className="font-bold text-cyan-900">Mise à jour du statut logistique</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Statut Commande</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2 focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="CONFIRMEE">Confirmée</option>
                    <option value="EN_PREPARATION">En Préparation</option>
                    <option value="EXPEDIEE">Expédiée</option>
                    <option value="LIVREE">Livrée</option>
                    <option value="ANNULEE">Annulée</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">N° Suivi Transporteur</label>
                  <input
                    type="text"
                    placeholder="Ex: TRK-MA-8891"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: selectedOrder.id,
                    status: newStatus,
                    trackingNumber,
                  })
                }
                disabled={updateStatusMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-videojet-blue hover:bg-slate-800 rounded-xl"
              >
                {updateStatusMutation.isPending ? 'Mise à jour...' : 'Enregistrer le Statut'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
