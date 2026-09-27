import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getPendingActions, syncPendingActions } from '../../utils/offlineQueue.js';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(() => getPendingActions().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueUpdate = (e: any) => {
      setPendingCount(e.detail?.count ?? getPendingActions().length);
    };

    const handleSyncCompleted = (e: any) => {
      const { synced, errors } = e.detail;
      setSyncToast(`${synced} opération(s) synchronisée(s) avec succès !`);
      setTimeout(() => setSyncToast(null), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('vj_offline_queue_updated', handleQueueUpdate);
    window.addEventListener('vj_sync_completed', handleSyncCompleted);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('vj_offline_queue_updated', handleQueueUpdate);
      window.removeEventListener('vj_sync_completed', handleSyncCompleted);
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncPendingActions();
      if (result.synced > 0) {
        setSyncToast(`${result.synced} opération(s) synchronisée(s) !`);
        setTimeout(() => setSyncToast(null), 4000);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Sync Toast */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-white rounded-xl shadow-lg border border-emerald-500 animate-in fade-in slide-in-from-bottom-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{syncToast}</span>
        </div>
      )}

      {isOnline ? (
        pendingCount > 0 ? (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors shadow-xs"
            title="Cliquez pour forcer la synchronisation avec le serveur"
          >
            <RefreshCw className={`w-3 h-3 text-amber-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronisation...' : `${pendingCount} à synchroniser`}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi className="w-3 h-3 text-emerald-600" />
            <span>En ligne</span>
          </span>
        )
      ) : (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse"
          title="Mode hors-ligne : Les fiches SAV et signatures sont enregistrées localement et envoyées dès le retour du réseau."
        >
          <WifiOff className="w-3.5 h-3.5 text-rose-600" />
          <span>Hors-ligne {pendingCount > 0 ? `(${pendingCount} en attente)` : ''}</span>
        </span>
      )}
    </div>
  );
};
