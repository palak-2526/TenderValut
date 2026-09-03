import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Cloud } from 'lucide-react';
import { OfflineAction, syncOfflineQueue } from '../utils/storage';

interface OfflineBannerProps {
  isOnline: boolean;
  offlineQueue?: OfflineAction[];
  offlineQueueCount?: number;
  onToggleSimulatedOffline: () => void;
  isSimulatedOffline: boolean;
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  offlineQueue = [],
  offlineQueueCount,
  onToggleSimulatedOffline,
  isSimulatedOffline,
  onSyncNow,
  isSyncing = false,
}) => {
  const [localSyncing, setLocalSyncing] = React.useState(false);
  const [lastSyncMsg, setLastSyncMsg] = React.useState<string | null>(null);

  const pendingCount = offlineQueueCount !== undefined ? offlineQueueCount : offlineQueue.length;

  const handleManualSync = () => {
    if (onSyncNow) {
      onSyncNow();
      return;
    }
    setLocalSyncing(true);
    setTimeout(() => {
      const result = syncOfflineQueue();
      setLocalSyncing(false);
      setLastSyncMsg(`Synchronized ${result.count} transaction(s) with Central Ledger`);
      setTimeout(() => setLastSyncMsg(null), 4000);
    }, 600);
  };

  const syncing = isSyncing || localSyncing;
  const hasPending = pendingCount > 0;
  const isTrulyOffline = !isOnline || isSimulatedOffline;

  if (!isTrulyOffline && !hasPending && !lastSyncMsg) {
    return null;
  }

  return (
    <div
      id="offline-status-banner"
      className={`border-b px-4 sm:px-6 py-2 transition-colors ${
        isTrulyOffline
          ? 'bg-[#001F3F] text-white border-white/20'
          : hasPending
          ? 'bg-amber-50 text-amber-950 border-[#D1D5DB] dark:bg-[#001F3F] dark:text-amber-300 dark:border-white/10'
          : 'bg-[#F0FDF4] text-[#166534] border-[#D1D5DB] dark:bg-[#001F3F] dark:text-emerald-300 dark:border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          {isTrulyOffline ? (
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          ) : hasPending ? (
            <Cloud className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>CLOUD SYNCED</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 font-medium">
            {isTrulyOffline ? (
              <>
                <span className="font-bold uppercase tracking-wider text-amber-300 text-[10px]">Offline Mode:</span>
                <span className="text-[#D1D5DB]">Operations queue locally into cryptographic storage.</span>
                {isSimulatedOffline && (
                  <span className="bg-white/10 text-amber-200 text-[10px] px-1.5 py-0.5 rounded border border-white/20 uppercase font-bold tracking-widest">
                    SIMULATION
                  </span>
                )}
              </>
            ) : hasPending ? (
              <>
                <span className="font-bold uppercase text-[10px] tracking-wider text-amber-700 dark:text-amber-400">Sync Pending:</span>
                <span>{pendingCount} offline transaction(s) ready to commit.</span>
              </>
            ) : (
              <span className="text-xs">{lastSyncMsg}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasPending && (
            <button
              id="sync-offline-queue-btn"
              onClick={handleManualSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-white text-[#001F3F] hover:bg-[#D1D5DB] transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : `Sync Now (${pendingCount})`}
            </button>
          )}

          <button
            id="toggle-offline-simulation-btn"
            onClick={onToggleSimulatedOffline}
            className="text-[11px] font-semibold text-[#D1D5DB] hover:text-white transition underline"
            title="Toggle offline state to verify offline queueing and auto-sync"
          >
            {isSimulatedOffline ? 'Go Online' : 'Simulate Offline'}
          </button>
        </div>
      </div>
    </div>
  );
};
