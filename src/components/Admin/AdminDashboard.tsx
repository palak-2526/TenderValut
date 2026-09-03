import React from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  IndianRupee,
  Calendar,
  Lock,
  Unlock,
  Eye,
  Trash2,
  Clock,
  Award,
  FileCheck,
  Building,
  Sparkles,
  Bell,
  Send,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { Tender, Bid, User } from '../../types';
import { formatCurrency, getTimeRemaining, formatDateTime } from '../../utils/crypto';
import { saveStoredTender, addStoredAuditLog, addStoredNotification } from '../../utils/storage';
import { CreateTenderModal } from './CreateTenderModal';
import { AITenderEvaluationModal } from './AITenderEvaluationModal';

interface AdminDashboardProps {
  currentUser: User;
  tenders: Tender[];
  bids: Bid[];
  onRefresh: () => void;
  onNavigateToEvaluator?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  tenders,
  bids,
  onRefresh,
  onNavigateToEvaluator,
}) => {
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [viewingBidsTender, setViewingBidsTender] = React.useState<Tender | null>(null);
  const [evaluatingTender, setEvaluatingTender] = React.useState<Tender | null>(null);
  const [adminAlertSuccess, setAdminAlertSuccess] = React.useState<string | null>(null);

  const handleBroadcastReminders = (tender: Tender) => {
    addStoredNotification({
      title: `Official Reminder: ${tender.referenceNo} Closing Soon`,
      message: `Committee broadcast: ${tender.title} deadline is ${formatDateTime(tender.deadline)}. Ensure all ${tender.requiredDocuments.length} mandatory documents are sealed.`,
      type: 'status_change',
      tenderId: tender.id,
    });
    setAdminAlertSuccess(`Deadline & requirement reminders dispatched for ${tender.referenceNo}!`);
    setTimeout(() => setAdminAlertSuccess(null), 3500);
  };

  const totalBudget = tenders.reduce((acc, t) => acc + t.budget, 0);
  const openTenders = tenders.filter((t) => t.status === 'open');
  const awardedTenders = tenders.filter((t) => t.status === 'awarded');

  const filteredTenders = tenders.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleToggleTenderLock = (tender: Tender) => {
    const newStatus = tender.status === 'open' ? 'closed' : 'open';
    const updated: Tender = {
      ...tender,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    saveStoredTender(updated);
    addStoredAuditLog(
      currentUser.name,
      currentUser.role,
      newStatus === 'closed' ? 'Tender Submissions Closed Early' : 'Tender Submissions Reopened',
      'tender',
      tender.id,
      `Administrator manually set status to ${newStatus} for ${tender.referenceNo}.`
    );
    addStoredNotification({
      title: `Tender Status Changed: ${tender.referenceNo}`,
      message: `Tender was set to '${newStatus}' by ${currentUser.name}.`,
      type: 'status_change',
      tenderId: tender.id,
    });
    onRefresh();
  };

  return (
    <div className="space-y-8">
      {/* Top 4-Column Aggregates Banner: 2x2 on Mobile, 4-col on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white dark:bg-[#001F3F]/60 p-4 sm:p-5 rounded-2xl shadow-xs border border-[#E5E7EB] dark:border-white/10 transition">
          <p className="text-[11px] sm:text-xs text-[#6B7280] dark:text-[#D1D5DB] font-bold uppercase tracking-wider mb-1">
            Open Tenders
          </p>
          <p className="text-2xl sm:text-3xl font-light text-[#001F3F] dark:text-white">
            {openTenders.length}
          </p>
          <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#001F3F] dark:bg-white rounded-full transition-all"
              style={{
                width: `${Math.max(15, Math.min(100, (openTenders.length / (tenders.length || 1)) * 100))}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#001F3F]/60 p-4 sm:p-5 rounded-2xl shadow-xs border border-[#E5E7EB] dark:border-white/10 transition">
          <p className="text-[11px] sm:text-xs text-[#6B7280] dark:text-[#D1D5DB] font-bold uppercase tracking-wider mb-1">
            Active Bids
          </p>
          <p className="text-2xl sm:text-3xl font-light text-[#001F3F] dark:text-white">
            {bids.length}
          </p>
          <p className="text-[10px] text-[#4B5563] dark:text-[#9CA3AF] mt-2 font-medium truncate">
            SHA-256 sealed hashes
          </p>
        </div>

        <div className="bg-white dark:bg-[#001F3F]/60 p-4 sm:p-5 rounded-2xl shadow-xs border border-[#E5E7EB] dark:border-white/10 transition">
          <p className="text-[11px] sm:text-xs text-[#6B7280] dark:text-[#D1D5DB] font-bold uppercase tracking-wider mb-1">
            Total Budget
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-light text-[#001F3F] dark:text-white truncate" title={formatCurrency(totalBudget)}>
            {formatCurrency(totalBudget)}
          </p>
          <p className="text-[10px] text-[#4B5563] dark:text-[#9CA3AF] mt-2 font-medium truncate">
            {awardedTenders.length} Awarded contracts
          </p>
        </div>

        {/* Create Tender Quick Action Card */}
        <div
          id="admin-create-tender-card-btn"
          onClick={() => setCreateModalOpen(true)}
          className="bg-[#FAF6EE] dark:bg-white/5 p-4 sm:p-5 rounded-2xl shadow-xs border border-dashed border-[#D5CFC5] dark:border-white/20 flex flex-col justify-center items-center cursor-pointer hover:bg-white dark:hover:bg-white/10 hover:border-[#001F3F] dark:hover:border-white/40 transition-colors group"
        >
          <span className="text-2xl text-[#001F3F] dark:text-white leading-none mb-1 group-hover:scale-125 transition-transform">
            +
          </span>
          <p className="text-[11px] sm:text-xs text-[#001F3F] dark:text-[#D1D5DB] font-bold uppercase tracking-wider text-center">
            Create Tender
          </p>
        </div>
      </div>

      {/* Broadcast Toast Notification */}
      {adminAlertSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{adminAlertSuccess}</span>
          </div>
          <button
            onClick={() => setAdminAlertSuccess(null)}
            className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PROCESS SECTION: Admin Procurement Lifecycle */}
      <div className="bg-[#FAF6EE] dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DFD5] dark:border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#736F68] dark:text-[#D1D5DB] px-2 py-0.5 rounded-md bg-white dark:bg-white/10 border border-[#E5DFD5] dark:border-white/10">
                Governance
              </span>
              <h2 className="text-sm sm:text-base font-bold text-[#001F3F] dark:text-white">
                Procurement Administration Process
              </h2>
            </div>
            <p className="text-xs text-[#5E5B56] dark:text-[#D1D5DB]">
              Structured administrative stages governing fair, transparent, and auditable tender delivery.
            </p>
          </div>
          <div className="text-[11px] font-mono text-[#736F68] dark:text-[#9CA3AF] self-start sm:self-auto">
            Statutory AI Protocol
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Step 1 */}
          <div
            onClick={() => setCreateModalOpen(true)}
            className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 hover:border-[#001F3F]/40 dark:hover:border-white/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF6EE] dark:bg-white/10 text-[#001F3F] dark:text-white">
                Step 01
              </span>
              <Plus className="w-3.5 h-3.5 text-[#736F68] group-hover:text-[#001F3F] transition-colors" />
            </div>
            <h3 className="text-xs font-bold text-[#001F3F] dark:text-white mb-1">
              Author Tender
            </h3>
            <p className="text-[11px] text-[#5E5B56] dark:text-[#9CA3AF] leading-relaxed">
              Define technical scope, budget threshold, and required statutory compliance documents.
            </p>
          </div>

          {/* Step 2: Tender Eligibility Prediction */}
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 hover:border-[#001F3F]/40 dark:hover:border-white/30 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF6EE] dark:bg-white/10 text-[#001F3F] dark:text-white">
                Step 02
              </span>
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xs font-bold text-[#001F3F] dark:text-white mb-1">
              Tender Eligibility Prediction
            </h3>
            <p className="text-[11px] text-[#5E5B56] dark:text-[#9CA3AF] leading-relaxed">
              AI checks whether applicants are likely eligible by auditing turnover, experience tenure, and certifications.
            </p>
          </div>

          {/* Step 3: Deadline & Requirement Alerts */}
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 hover:border-[#001F3F]/40 dark:hover:border-white/30 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF6EE] dark:bg-white/10 text-[#001F3F] dark:text-white">
                Step 03
              </span>
              <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xs font-bold text-[#001F3F] dark:text-white mb-1">
              Deadline & Requirement Alerts
            </h3>
            <p className="text-[11px] text-[#5E5B56] dark:text-[#9CA3AF] leading-relaxed">
              AI tracks submission cutoffs and missing requirements, sending automated reminders to prospective bidders.
            </p>
          </div>

          {/* Step 4 */}
          <div
            onClick={onNavigateToEvaluator}
            className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 hover:border-[#001F3F]/40 dark:hover:border-white/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF6EE] dark:bg-white/10 text-[#001F3F] dark:text-white">
                Step 04
              </span>
              <Award className="w-3.5 h-3.5 text-[#736F68] group-hover:text-[#001F3F] transition-colors" />
            </div>
            <h3 className="text-xs font-bold text-[#001F3F] dark:text-white mb-1">
              Evaluate & Award
            </h3>
            <p className="text-[11px] text-[#5E5B56] dark:text-[#9CA3AF] leading-relaxed">
              Multi-signature committee decryption, blinded technical scoring, and immutable contract award.
            </p>
          </div>
        </div>
      </div>

      {/* CAPABILITY SECTION: AI Administrative Suite */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Capability 1: Tender Eligibility Prediction */}
        <div className="bg-white dark:bg-[#001F3F]/50 p-5 sm:p-6 rounded-3xl border border-[#E5DFD5] dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-white/10 text-blue-700 dark:text-blue-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300">
                  Capability 01
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 94.2% AI Pass Rate
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-[#001F3F] dark:text-white">
              Tender Eligibility Prediction
            </h3>
            <p className="text-xs text-[#5E5B56] dark:text-[#D1D5DB] leading-relaxed mt-1">
              AI checks whether a company is likely eligible to apply. It audits applicant turnover against tender minimums, operating tenure, and technical ISO accreditations to prevent non-responsive bids.
            </p>

            <div className="mt-3 p-3.5 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#001F3F] dark:text-white">
                <span>Predictive Criteria Auditing:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">Active</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-[#E5DFD5] dark:border-white/10">
                <div>
                  <span className="text-[#736F68] dark:text-[#9CA3AF] block">Min Turnover</span>
                  <span className="font-semibold text-[#001F3F] dark:text-white">Verified</span>
                </div>
                <div>
                  <span className="text-[#736F68] dark:text-[#9CA3AF] block">Operating Tenure</span>
                  <span className="font-semibold text-[#001F3F] dark:text-white">&gt; 5 Yrs</span>
                </div>
                <div>
                  <span className="text-[#736F68] dark:text-[#9CA3AF] block">ISO Standard</span>
                  <span className="font-semibold text-[#001F3F] dark:text-white">Required</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {onNavigateToEvaluator && (
              <button
                onClick={onNavigateToEvaluator}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#001F3F] hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Committee Evaluation Matrix</span>
              </button>
            )}
          </div>
        </div>

        {/* Capability 2: Deadline & Requirement Alerts */}
        <div className="bg-white dark:bg-[#001F3F]/50 p-5 sm:p-6 rounded-3xl border border-[#E5DFD5] dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-white/10 text-amber-700 dark:text-amber-300">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
                  Capability 02
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-[#001F3F] dark:text-white flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> {openTenders.length} Active Deadlines
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-[#001F3F] dark:text-white">
              Deadline & Requirement Alerts
            </h3>
            <p className="text-xs text-[#5E5B56] dark:text-[#D1D5DB] leading-relaxed mt-1">
              AI identifies critical dates, statutory submission windows, and mandatory document requirements, issuing proactive reminders to ensure compliant bid submission.
            </p>

            <div className="mt-3 p-3.5 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5E5B56] dark:text-[#D1D5DB]">Earliest Deadline:</span>
                <span className="font-bold font-mono text-[#001F3F] dark:text-white">
                  {openTenders[0]?.referenceNo || 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E5DFD5] dark:border-white/10">
                <span className="text-[#736F68] dark:text-[#9CA3AF]">
                  Broadcast Reminder Protocol:
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  24h & 48h Automated Triggers
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {openTenders[0] && (
              <button
                onClick={() => handleBroadcastReminders(openTenders[0])}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#001F3F] bg-[#FAF6EE] hover:bg-[#EAE3D6] border border-[#E5DFD5] dark:bg-white/10 dark:text-white dark:border-white/10 transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast Deadline Reminder ({openTenders[0].referenceNo})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: 2-Column Tender Table + 1-Column AI & Alerts Aside */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Cols: Tenders Activity */}
        <section className="lg:col-span-2 bg-white dark:bg-[#001F3F]/40 rounded-3xl border border-[#E5E7EB] dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
          {/* Header toolbar */}
          <div className="px-5 sm:px-6 py-4 border-b border-[#E5E7EB] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] dark:bg-[#001730]">
            <div>
              <h2 className="text-sm font-bold text-[#001F3F] dark:text-white uppercase tracking-tight">
                Recent Tender Activity
              </h2>
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                {filteredTenders.length} of {tenders.length} recorded tenders
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Filter ref, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-44 pl-8 pr-3 py-1.5 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/80 text-xs text-[#001F3F] dark:text-white placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#001F3F]"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#F3EDE2] dark:bg-white/10 p-1 rounded-xl border border-[#E5DFD5] dark:border-white/10 overflow-x-auto">
                {(['all', 'open', 'closed', 'awarded'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition ${
                      statusFilter === st
                        ? 'bg-[#001F3F] text-white dark:bg-white dark:text-[#001F3F] shadow-xs'
                        : 'text-[#001F3F]/75 dark:text-[#D1D5DB] hover:text-[#001F3F] dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Responsive Mobile / Tablet Card View */}
          <div className="block lg:hidden divide-y divide-[#E5E7EB] dark:divide-white/10">
            {filteredTenders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                No tenders found matching your filter criteria.
              </div>
            ) : (
              filteredTenders.map((tender) => {
                const tenderBids = bids.filter((b) => b.tenderId === tender.id);
                const timeInfo = getTimeRemaining(tender.deadline);

                return (
                  <div key={tender.id} className="p-4 sm:p-5 space-y-3 hover:bg-[#FAF8F5] dark:hover:bg-white/5 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-[#F3F4F6] text-[#001F3F] dark:bg-white/10 dark:text-white">
                            {tender.referenceNo}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              tender.status === 'open'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                                : tender.status === 'awarded'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800'
                                : 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10'
                            }`}
                          >
                            {tender.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-[#001F3F] dark:text-white leading-snug">
                          {tender.title}
                        </h3>
                        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                          {tender.department}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                          Budget
                        </span>
                        <span className="font-bold text-sm text-[#001F3F] dark:text-white">
                          {formatCurrency(tender.budget)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-[#E5E7EB]/60 dark:border-white/10">
                      <div
                        className={`flex items-center gap-1 font-medium ${
                          timeInfo.isExpired
                            ? 'text-rose-600 dark:text-rose-400'
                            : timeInfo.totalHours <= 48
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[#4B5563] dark:text-[#D1D5DB]'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{timeInfo.text}</span>
                      </div>

                      <button
                        onClick={() => setViewingBidsTender(tender)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F3F4F6] text-[#001F3F] hover:bg-[#E5E7EB] dark:bg-white/10 dark:text-white font-semibold text-xs transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{tenderBids.length} Bids</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {tender.status !== 'awarded' && (
                        <button
                          onClick={() => handleToggleTenderLock(tender)}
                          className="p-2 rounded-xl text-[#4B5563] hover:text-[#001F3F] hover:bg-[#F3F4F6] border border-[#E5E7EB] dark:border-white/10 dark:text-[#D1D5DB] dark:hover:text-white transition"
                          title={tender.status === 'open' ? 'Lock Submissions Early' : 'Reopen Submissions'}
                        >
                          {tender.status === 'open' ? (
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => setEvaluatingTender(tender)}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-amber-500" />
                        <span>AI Evaluate</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (lg and above) */}
          <div className="hidden lg:block p-0 overflow-x-auto">
            {filteredTenders.length === 0 ? (
              <div className="p-12 text-center text-sm text-[#4B5563] dark:text-[#D1D5DB]">
                No tenders found matching your filter criteria.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-[#FAF8F5] dark:bg-[#001730] text-[#6B7280] dark:text-[#D1D5DB] text-[10px] uppercase font-bold tracking-widest border-b border-[#E5E7EB] dark:border-white/10">
                  <tr>
                    <th className="px-6 py-3">Reference ID</th>
                    <th className="px-6 py-3">Tender Title</th>
                    <th className="px-6 py-3">Deadline</th>
                    <th className="px-6 py-3">Bids</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#E5E7EB] dark:divide-white/10">
                  {filteredTenders.map((tender) => {
                    const tenderBids = bids.filter((b) => b.tenderId === tender.id);
                    const timeInfo = getTimeRemaining(tender.deadline);

                    return (
                      <tr
                        key={tender.id}
                        className="hover:bg-[#FDFBF7] dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        {/* Reference ID */}
                        <td className="px-6 py-4 font-mono font-bold text-xs text-[#001F3F] dark:text-white">
                          {tender.referenceNo}
                        </td>

                        {/* Title & Department */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-xs text-[#001F3F] dark:text-white line-clamp-1 max-w-xs">
                            {tender.title}
                          </p>
                          <p className="text-[11px] text-[#4B5563] dark:text-[#D1D5DB]">
                            {tender.department} • {formatCurrency(tender.budget)}
                          </p>
                        </td>

                        {/* Deadline */}
                        <td className="px-6 py-4">
                          <div
                            className={`font-semibold text-xs flex items-center gap-1 ${
                              timeInfo.isExpired
                                ? 'text-rose-600 dark:text-rose-400'
                                : timeInfo.totalHours <= 48
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-[#001F3F] dark:text-white'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeInfo.text}</span>
                          </div>
                          <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                            {new Date(tender.deadline).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Bids */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setViewingBidsTender(tender)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F3F4F6] text-[#001F3F] hover:bg-[#D1D5DB] dark:bg-white/10 dark:text-white dark:hover:bg-white/20 text-xs font-semibold transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{tenderBids.length} Bids</span>
                          </button>
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              tender.status === 'open'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : tender.status === 'awarded'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300'
                            }`}
                          >
                            {tender.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {tender.status !== 'awarded' && (
                              <button
                                onClick={() => handleToggleTenderLock(tender)}
                                className="p-1.5 rounded-lg text-[#4B5563] hover:text-[#001F3F] hover:bg-[#F3F4F6] dark:text-[#D1D5DB] dark:hover:text-white dark:hover:bg-white/10 transition"
                                title={tender.status === 'open' ? 'Lock Submissions Early' : 'Reopen Submissions'}
                              >
                                {tender.status === 'open' ? (
                                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                                ) : (
                                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                              </button>
                            )}

                            <button
                              onClick={() => setEvaluatingTender(tender)}
                              className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300 dark:text-amber-500" />
                              <span>AI Evaluate</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Right 1 Col: AI Assistant Predictor & System Alerts */}
        <aside className="flex flex-col gap-6">
          {/* AI Intelligence Box */}
          <div className="bg-[#001F3F] text-white p-6 rounded-3xl shadow-sm flex flex-col border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#D1D5DB]">
                AI Benefit Evaluator Engine
              </h3>
            </div>
            <p className="text-xs text-[#D1D5DB] leading-relaxed mb-4">
              Autonomous neural evaluator automatically audits all sealed bids against target benefits: Capital Savings, Engineering Architecture, Delivery Speed, ESG Standards, and Warranty SLAs.
            </p>

            <div className="bg-white/10 p-3.5 rounded-2xl mb-4 border border-white/10">
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-[#D1D5DB]">Target Benefits Assessed</span>
                <span className="font-bold text-white">5 Dimensions (100%)</span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white h-full w-[100%]" />
              </div>
            </div>

            <button
              onClick={() => {
                const target =
                  tenders.find((t) => t.status === 'closed' && bids.some((b) => b.tenderId === t.id)) ||
                  tenders.find((t) => bids.some((b) => b.tenderId === t.id)) ||
                  tenders[0];
                if (target) setEvaluatingTender(target);
              }}
              className="w-full py-2.5 bg-white text-[#001F3F] rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Launch AI Benefit Evaluator</span>
            </button>
          </div>

          {/* System Alerts Container */}
          <div className="bg-white dark:bg-[#001F3F]/40 p-6 rounded-3xl border border-[#E5E7EB] dark:border-white/10 shadow-sm">
            <h3 className="text-[10px] text-[#6B7280] dark:text-[#D1D5DB] font-bold uppercase mb-4 tracking-[0.2em]">
              System Alerts
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10">
                <Clock className="w-4 h-4 text-[#001F3F] dark:text-blue-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#001F3F] dark:text-white">
                    Submission Lock Imminent
                  </p>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#D1D5DB] mt-0.5">
                    Tenders expiring in &lt; 48 hours seal automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10">
                <Award className="w-4 h-4 text-[#001F3F] dark:text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#001F3F] dark:text-white">
                    Cryptographic Integrity
                  </p>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#D1D5DB] mt-0.5">
                    All submitted bids have valid SHA-256 seal records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Modal: View Sealed Bids for a Tender */}
      {viewingBidsTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001F3F]/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-[#001F3F] rounded-3xl shadow-xl border border-[#E5E7EB] dark:border-white/15 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-white/10 flex items-center justify-between bg-[#FAF8F5] dark:bg-[#001730]">
              <div>
                <h3 className="text-base font-bold text-[#001F3F] dark:text-white">
                  Sealed Bids for {viewingBidsTender.referenceNo}
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#D1D5DB] line-clamp-1">
                  {viewingBidsTender.title}
                </p>
              </div>
              <button
                onClick={() => setViewingBidsTender(null)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#001F3F] dark:hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {bids.filter((b) => b.tenderId === viewingBidsTender.id).length === 0 ? (
                <div className="py-8 text-center text-xs text-[#6B7280] dark:text-[#D1D5DB]">
                  No vendor submissions received for this tender yet.
                </div>
              ) : (
                bids
                  .filter((b) => b.tenderId === viewingBidsTender.id)
                  .map((bid) => (
                    <div
                      key={bid.id}
                      className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#001F3F] dark:text-white">
                          {bid.vendorName}
                        </div>
                        <div className="font-mono text-[11px] text-[#6B7280] dark:text-[#D1D5DB] truncate max-w-[200px] sm:max-w-xs">
                          Seal: {bid.cryptoHash}
                        </div>
                        <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                          Submitted: {formatDateTime(bid.submittedAt)} • {bid.documents.length} Sealed Docs
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-[#001F3F] dark:text-white">
                          {formatCurrency(bid.bidAmount)}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3F4F6] dark:bg-white/10 text-[#4B5563] dark:text-[#D1D5DB] font-bold uppercase">
                          {bid.status}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="px-6 py-3 bg-[#FAF8F5] dark:bg-[#001730] border-t border-[#E5E7EB] dark:border-white/10 flex items-center justify-between">
              <button
                onClick={() => {
                  const target = viewingBidsTender;
                  setViewingBidsTender(null);
                  setEvaluatingTender(target);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-amber-500" />
                <span>Run AI Benefit Evaluation</span>
              </button>
              <button
                onClick={() => setViewingBidsTender(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#EAE5DB] text-[#001F3F] hover:bg-[#D5CFC5] dark:bg-white/10 dark:text-white dark:hover:bg-white/20 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: AI Multi-Benefit Evaluation */}
      {evaluatingTender && (
        <AITenderEvaluationModal
          isOpen={!!evaluatingTender}
          onClose={() => setEvaluatingTender(null)}
          tender={evaluatingTender}
          bids={bids}
          currentUser={currentUser}
          onEvaluationCompleted={onRefresh}
        />
      )}

      {/* Modal: Create Tender */}
      <CreateTenderModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        currentUser={currentUser}
        onTenderCreated={onRefresh}
      />
    </div>
  );
};
