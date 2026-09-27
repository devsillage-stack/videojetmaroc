import api from '../services/api.js';

export interface OfflineAction {
  id: string;
  type: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  timestamp: string;
  description: string;
}

const STORAGE_KEY = 'vj_offline_queue';

export const getPendingActions = (): OfflineAction[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const savePendingActions = (actions: OfflineAction[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  window.dispatchEvent(new CustomEvent('vj_offline_queue_updated', { detail: { count: actions.length } }));
};

export const enqueueOfflineAction = (
  action: Omit<OfflineAction, 'id' | 'timestamp'>
): OfflineAction => {
  const actions = getPendingActions();
  const newAction: OfflineAction = {
    ...action,
    id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  actions.push(newAction);
  savePendingActions(actions);
  return newAction;
};

export const syncPendingActions = async (): Promise<{ synced: number; errors: number }> => {
  const actions = getPendingActions();
  if (actions.length === 0) return { synced: 0, errors: 0 };

  let synced = 0;
  let errors = 0;
  const remainingActions: OfflineAction[] = [];

  for (const action of actions) {
    try {
      if (action.method === 'POST') {
        await api.post(action.endpoint, action.payload);
      } else if (action.method === 'PUT') {
        await api.put(action.endpoint, action.payload);
      } else if (action.method === 'PATCH') {
        await api.patch(action.endpoint, action.payload);
      } else if (action.method === 'DELETE') {
        await api.delete(action.endpoint);
      }
      synced++;
    } catch (err) {
      console.error(`Failed to sync offline action ${action.id}:`, err);
      errors++;
      remainingActions.push(action);
    }
  }

  savePendingActions(remainingActions);
  return { synced, errors };
};

// Auto-sync listener on reconnection
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('[OfflineQueue] Network reconnected. Processing pending queue...');
    const result = await syncPendingActions();
    if (result.synced > 0) {
      window.dispatchEvent(
        new CustomEvent('vj_sync_completed', {
          detail: { synced: result.synced, errors: result.errors },
        })
      );
    }
  });
}
