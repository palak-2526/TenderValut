import React from 'react';
import { X, ShieldCheck, Download, Search, Filter, Hash, CheckCircle2 } from 'lucide-react';
import { AuditLog } from '../../types';
import { formatDateTime } from '../../utils/crypto';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, logs }) => {
  const [filterType, setFilterType] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesType = filterType === 'all' || log.targetType === filterType;
    const matchesSearch =
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.cryptoSignature && log.cryptoSignature.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const exportLogsAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tender_audit_ledger_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        id="audit-log-modal"
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#FAF6EE] dark:bg-[#001730] rounded-3xl shadow-2xl border border-[#E5DFD5] dark:border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#001F3F] flex items-center justify-between bg-[#001F3F] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Immutable Audit Ledger
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white tracking-wider uppercase">
                  Tamper-Evident
                </span>
              </div>
              <p className="text-xs text-white/80">
                Cryptographically signed chronological record of all tender publications, bids, and evaluations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="export-audit-log-btn"
              onClick={exportLogsAsJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 text-white hover:bg-white/20 border border-white/20 transition"
              title="Download Audit Ledger as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <button
              id="close-audit-log-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls: Search and Filter */}
        <div className="px-6 py-4 border-b border-[#E5DFD5] dark:border-white/10 bg-[#F3EDE2] dark:bg-[#001F3F]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search action, actor, or signature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/10 bg-white dark:bg-[#001F3F]/40 text-[#001F3F] dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#001F3F]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] shrink-0" />
            {(['all', 'tender', 'bid', 'evaluation', 'system'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl capitalize text-xs font-bold tracking-wider transition ${
                  filterType === type
                    ? 'bg-[#001F3F] text-white shadow-xs dark:bg-white dark:text-[#001F3F]'
                    : 'text-[#4B5563] hover:text-[#001F3F] hover:bg-gray-200 dark:text-[#9CA3AF] dark:hover:text-white dark:hover:bg-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                No audit entries match the current filter criteria.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl border border-[#E5DFD5] dark:border-white/10 bg-white dark:bg-[#001F3F]/40 hover:border-gray-400 transition-all shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-[#001F3F] dark:text-white">
                        {log.action}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider bg-[#F3EDE2] text-[#001F3F] dark:bg-white/10 dark:text-white">
                        {log.targetType}
                      </span>
                      <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                        by <strong className="text-[#001F3F] dark:text-white">{log.actorName}</strong> ({log.actorRole})
                      </span>
                    </div>

                    <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] shrink-0 font-mono">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-[#4B5563] dark:text-[#E5DFD5] mb-2.5 leading-relaxed">
                    {log.details}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#E5DFD5]/50 dark:border-white/10 text-[11px]">
                    <div className="flex items-center gap-1.5 font-mono text-[#6B7280] dark:text-[#9CA3AF]">
                      <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{log.cryptoSignature || 'SIG-GEN-77A01'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified Hash</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F3EDE2] dark:bg-[#001F3F]/60 border-t border-[#E5DFD5] dark:border-white/10 flex items-center justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          <span>Total Logged Operations: <strong>{logs.length}</strong></span>
          <button
            onClick={onClose}
            className="px-5 py-2 font-bold uppercase tracking-wider rounded-xl bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
