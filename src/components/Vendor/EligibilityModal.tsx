import React from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  FileCheck,
  Building,
  RefreshCw,
} from 'lucide-react';
import { Tender, VendorCompanyProfile, EligibilityPrediction } from '../../types';
import { predictTenderEligibility } from '../../services/aiService';

interface EligibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  tender: Tender;
  companyProfile: VendorCompanyProfile;
  onProceedToBid: (tender: Tender) => void;
}

export const EligibilityModal: React.FC<EligibilityModalProps> = ({
  isOpen,
  onClose,
  tender,
  companyProfile,
  onProceedToBid,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [prediction, setPrediction] = React.useState<EligibilityPrediction | null>(null);

  const runPrediction = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await predictTenderEligibility(companyProfile, tender);
      setPrediction(res);
    } catch (err) {
      console.error('Eligibility prediction error:', err);
    } finally {
      setLoading(false);
    }
  }, [companyProfile, tender]);

  React.useEffect(() => {
    if (isOpen) {
      runPrediction();
    }
  }, [isOpen, runPrediction]);

  if (!isOpen) return null;

  const score = prediction?.eligibilityScore ?? 0;
  const isHigh = score >= 75;
  const isModerate = score >= 50 && score < 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        id="eligibility-prediction-modal"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#FAF6EE] dark:bg-[#001730] rounded-3xl shadow-2xl border border-[#E5DFD5] dark:border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#001F3F] flex items-center justify-between bg-[#001F3F] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  AI Tender Eligibility Prediction
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white tracking-wider uppercase">
                  CSE AI Module
                </span>
              </div>
              <p className="text-xs text-white/80 truncate max-w-md">
                Auditing {companyProfile.name} against {tender.referenceNo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="reanalyze-eligibility-btn"
              onClick={runPrediction}
              disabled={loading}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Re-run AI Audit"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-eligibility-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-3 border-[#001F3F] border-t-transparent animate-spin dark:border-white" />
              <p className="text-sm font-bold text-[#001F3F] dark:text-white">
                Running AI Compliance & Eligibility Audit...
              </p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Benchmarking annual turnover, experience requirements, and ISO standards
              </p>
            </div>
          ) : prediction ? (
            <>
              {/* Score Metric Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-gray-100 dark:text-slate-800"
                        fill="transparent"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeDasharray={201}
                        strokeDashoffset={201 - (201 * score) / 100}
                        strokeLinecap="round"
                        className={`${
                          isHigh
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isModerate
                            ? 'text-amber-500'
                            : 'text-rose-500'
                        } transition-all duration-1000`}
                        fill="transparent"
                      />
                    </svg>
                    <span className="absolute text-lg font-black text-[#001F3F] dark:text-white">
                      {score}%
                    </span>
                  </div>

                  <div>
                    <span
                      className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 ${
                        isHigh
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isModerate
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {prediction.status}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#001F3F] dark:text-white">
                      {isHigh
                        ? 'High Likelihood of Bid Qualification'
                        : isModerate
                        ? 'Conditional Eligibility — Attention Required'
                        : 'Substantial Compliance Risks Detected'}
                    </h3>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      {prediction.source === 'gemini' ? 'Evaluated with Gemini Flash' : 'Algorithmic Compliance Auditor'}
                    </p>
                  </div>
                </div>

                {tender.status === 'open' && (
                  <button
                    id="proceed-to-bid-from-eligibility-btn"
                    onClick={() => {
                      onClose();
                      onProceedToBid(tender);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shrink-0 shadow-xs"
                  >
                    Proceed to Bid
                  </button>
                )}
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 text-xs leading-relaxed text-[#4B5563] dark:text-[#E5DFD5] shadow-xs">
                <strong className="text-[#001F3F] dark:text-white block mb-1 font-bold uppercase tracking-wider">
                  AI Auditor Assessment:
                </strong>
                {prediction.executiveSummary}
              </div>

              {/* Met Criteria vs Unmet Criteria Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Met Criteria */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="uppercase tracking-wider">Satisfied Criteria ({prediction.metCriteria.length})</span>
                  </div>
                  {prediction.metCriteria.length === 0 ? (
                    <p className="text-xs text-gray-400">No verified criteria satisfied.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-[#4B5563] dark:text-[#E5DFD5]">
                      {prediction.metCriteria.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Unmet Criteria */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400 mb-2">
                    <XCircle className="w-4 h-4" />
                    <span className="uppercase tracking-wider">Compliance Gaps ({prediction.unmetCriteria.length})</span>
                  </div>
                  {prediction.unmetCriteria.length === 0 ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Zero gaps detected! Company exceeds baseline prerequisites.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-[#4B5563] dark:text-[#E5DFD5]">
                      {prediction.unmetCriteria.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-600 dark:text-rose-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Gap Analysis & Actionable Recommendations */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Risk & Gap Analysis</span>
                  </div>
                  <p className="text-xs text-[#4B5563] dark:text-[#E5DFD5] leading-relaxed">
                    {prediction.gapAnalysis}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>Actionable Recommendations to Strengthen Proposal</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#4B5563] dark:text-[#E5DFD5]">
                    {prediction.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F3EDE2] dark:bg-[#001F3F]/60 border-t border-[#E5DFD5] dark:border-white/10 flex items-center justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          <span>AI predictions serve as guidance; official scoring is finalized by the committee.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold rounded-xl bg-[#F3EDE2] text-[#001F3F] hover:bg-[#E5DFD5] border border-[#E5DFD5] dark:bg-white/10 dark:text-white dark:border-white/10 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
