import React from 'react';
import { X, Sparkles, AlertTriangle, Clock, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { Tender, DeadlineAlert, VendorCompanyProfile } from '../../types';
import { fetchDeadlineAlerts } from '../../services/aiService';

interface DeadlineAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenders: Tender[];
  vendorProfile?: VendorCompanyProfile;
  onSelectTender?: (tender: Tender) => void;
}

export const DeadlineAlertsDrawer: React.FC<DeadlineAlertsDrawerProps> = ({
  isOpen,
  onClose,
  tenders,
  vendorProfile,
  onSelectTender,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [alerts, setAlerts] = React.useState<DeadlineAlert[]>([]);
  const [summary, setSummary] = React.useState<string>('');

  const loadAlerts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDeadlineAlerts(tenders, vendorProfile);
      setAlerts(res.alerts);
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to load deadline alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [tenders, vendorProfile]);

  React.useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen, loadAlerts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        id="deadline-alerts-modal"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#FAF6EE] dark:bg-[#001730] rounded-3xl shadow-2xl border border-[#E5DFD5] dark:border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#001F3F] flex items-center justify-between bg-[#001F3F] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                AI Deadline & Requirement Intelligence
              </h2>
              <p className="text-xs text-white/80">
                Proactive compliance monitoring, milestone countdowns & risk alerts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="refresh-deadline-alerts-btn"
              onClick={loadAlerts}
              disabled={loading}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Re-run AI Analysis"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-deadline-alerts-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#001F3F] border-t-transparent animate-spin dark:border-white" />
              <p className="text-sm font-semibold text-[#001F3F] dark:text-white">
                AI is scanning active tenders and compliance schedules...
              </p>
            </div>
          ) : (
            <>
              {summary && (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 text-xs text-[#4B5563] dark:text-[#E5DFD5] flex items-start gap-3 shadow-xs">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block text-[#001F3F] dark:text-white mb-1">
                      Executive Brief:
                    </span>
                    {summary}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#6B7280] dark:text-[#9CA3AF] bg-white dark:bg-[#001F3F]/40 rounded-2xl border border-dashed border-[#E5DFD5] dark:border-white/10">
                    <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                    All active tenders are operating well within standard timeline thresholds.
                  </div>
                ) : (
                  alerts.map((alert, idx) => {
                    const tender = tenders.find((t) => t.id === alert.tenderId);
                    const isCritical = alert.severity === 'CRITICAL';
                    const isWarning = alert.severity === 'WARNING';

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all shadow-xs ${
                          isCritical
                            ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/60'
                            : isWarning
                            ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/60'
                            : 'bg-white border-[#E5DFD5] dark:bg-[#001F3F]/40 dark:border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-xl mt-0.5 ${
                                isCritical
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                                  : isWarning
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {isCritical ? (
                                <ShieldAlert className="w-4 h-4" />
                              ) : isWarning ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                    isCritical
                                      ? 'bg-rose-600 text-white'
                                      : isWarning
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-[#001F3F] text-white'
                                  }`}
                                >
                                  {alert.severity}
                                </span>
                                <h3 className="text-sm font-bold text-[#001F3F] dark:text-white">
                                  {alert.title}
                                </h3>
                              </div>

                              <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF] mb-2 leading-relaxed">
                                {alert.message}
                              </p>

                              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] text-[#334155] dark:text-[#CBD5E1]">
                                <span className="font-bold text-[#001F3F] dark:text-white">
                                  Recommended Action:{' '}
                                </span>
                                {alert.suggestedAction}
                              </div>
                            </div>
                          </div>

                          {tender && onSelectTender && (
                            <button
                              onClick={() => {
                                onSelectTender(tender);
                                onClose();
                              }}
                              className="shrink-0 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs"
                            >
                              View Tender
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F3EDE2] dark:bg-[#001F3F]/60 border-t border-[#E5DFD5] dark:border-white/10 flex items-center justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          <span>Deadline locks automatically when submission window expires.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 font-bold uppercase tracking-wider text-xs rounded-xl bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
