import React from 'react';
import {
  Briefcase,
  Search,
  Filter,
  Sparkles,
  Lock,
  Clock,
  IndianRupee,
  Building,
  CheckCircle2,
  FileText,
  AlertCircle,
  Award,
  ChevronRight,
  ShieldCheck,
  Bell,
  Calendar,
  Send,
  ArrowRight,
  Check,
  Sliders,
} from 'lucide-react';
import { Tender, Bid, User } from '../../types';
import { formatCurrency, getTimeRemaining, formatDateTime } from '../../utils/crypto';
import { addStoredNotification } from '../../utils/storage';
import { EligibilityModal } from './EligibilityModal';
import { BidSubmissionModal } from './BidSubmissionModal';

interface VendorDashboardProps {
  currentUser: User;
  tenders: Tender[];
  bids: Bid[];
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onRefresh: () => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  currentUser,
  tenders,
  bids,
  isOnline,
  isSimulatedOffline,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = React.useState<'browse' | 'eligibility' | 'alerts' | 'my-bids'>('browse');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [selectedTenderForEligibility, setSelectedTenderForEligibility] = React.useState<Tender | null>(null);
  const [selectedTenderForBidding, setSelectedTenderForBidding] = React.useState<Tender | null>(null);
  
  const [selectedPredictTenderId, setSelectedPredictTenderId] = React.useState<string>(tenders[0]?.id || '');
  const [remindedTenderIds, setRemindedTenderIds] = React.useState<string[]>([]);
  const [alertFeedback, setAlertFeedback] = React.useState<string | null>(null);

  const vendorCompany = currentUser.companyProfile || {
    name: currentUser.organization || 'BuildCorp Infrastructure Ltd',
    registrationNumber: 'REG-2018-882194',
    annualTurnover: 5200000,
    yearsInBusiness: 8,
    certifications: ['ISO 9001:2015', 'ISO 27001', 'CMMI Level 3'],
    pastProjectsCount: 24,
    rating: 4.8,
    hasTaxClearance: true,
    contactPerson: currentUser.name,
    phone: '+1 (555) 234-8901',
  };

  const [eligSimTurnover, setEligSimTurnover] = React.useState<number>(vendorCompany.annualTurnover);
  const [eligSimYears, setEligSimYears] = React.useState<number>(vendorCompany.yearsInBusiness);
  const [eligSimIso, setEligSimIso] = React.useState<boolean>(true);

  const handleSetReminder = (tender: Tender) => {
    if (!remindedTenderIds.includes(tender.id)) {
      setRemindedTenderIds((prev) => [...prev, tender.id]);
      addStoredNotification({
        title: `Deadline Alert Set: ${tender.referenceNo}`,
        message: `AI Alert active for ${tender.title}. Cutoff: ${formatDateTime(tender.deadline)}. Mandatory docs: ${tender.requiredDocuments.join(', ')}.`,
        type: 'status_change',
        tenderId: tender.id,
      });
      setAlertFeedback(`Alert reminder active for ${tender.referenceNo}! Notification queued.`);
      setTimeout(() => setAlertFeedback(null), 3500);
    }
  };

  const myBids = bids.filter(
    (b) =>
      b.vendorId === currentUser.id ||
      b.vendorName.toLowerCase().includes(vendorCompany.name.toLowerCase())
  );

  const categories = ['all', ...Array.from(new Set(tenders.map((t) => t.category)))];

  const filteredTenders = tenders.filter((t) => {
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openCount = tenders.filter((t) => t.status === 'open').length;
  const wonCount = myBids.filter((b) => b.status === 'awarded').length;

  return (
    <div className="space-y-8">
      {/* Top Banner Stats: 2x2 on Mobile, 4-col on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white dark:bg-[#001F3F]/60 p-4 sm:p-5 rounded-2xl shadow-xs border border-[#E5E7EB] dark:border-white/10 transition">
          <p className="text-[11px] sm:text-xs text-[#6B7280] dark:text-[#E5DFD5] font-bold uppercase tracking-wider mb-1">
            Open Tenders
          </p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-light text-[#001F3F] dark:text-white">
              {openCount}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#001F3F] dark:bg-white/10 dark:text-slate-300">
              Active
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#001F3F]/60 p-4 sm:p-5 rounded-2xl shadow-xs border border-[#E5E7EB] dark:border-white/10 transition">
          <p className="text-[11px] sm:text-xs text-[#6B7280] dark:text-[#E5DFD5] font-bold uppercase tracking-wider mb-1">
            My Submitted Bids
          </p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-light text-[#001F3F] dark:text-white">
              {myBids.length}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#001F3F] dark:bg-white/10 dark:text-slate-300">
              Encrypted
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#001F3F]/60 p-4 sm:p-5 rounded-2xl shadow-xs border border-[#E5E7EB] dark:border-white/10 transition">
          <p className="text-[11px] sm:text-xs text-[#6B7280] dark:text-[#E5DFD5] font-bold uppercase tracking-wider mb-1">
            Contracts Won
          </p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-light text-[#001F3F] dark:text-white">
              {wonCount}
            </p>
            <Award className="w-5 h-5 text-[#001F3F] dark:text-amber-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#001F3F]/60 p-4 sm:p-5 rounded-2xl shadow-xs border border-[#E5E7EB] dark:border-white/10 transition">
          <p className="text-[11px] sm:text-xs text-[#6B7280] dark:text-[#E5DFD5] font-bold uppercase tracking-wider mb-1">
            Prime Entity
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-xs sm:text-sm font-bold text-[#001F3F] dark:text-white truncate">
              {vendorCompany.name}
            </span>
            <span className="text-xs font-mono text-[#6B7280] dark:text-[#E5DFD5]">
              ★ {vendorCompany.rating}
            </span>
          </div>
          <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] block mt-1 truncate">
            Turnover: {formatCurrency(vendorCompany.annualTurnover)}
          </span>
        </div>
      </div>

      {/* Alert Notification Toast */}
      {alertFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{alertFeedback}</span>
          </div>
          <button
            onClick={() => setAlertFeedback(null)}
            className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PROCESS SECTION: 4-Step Procurement Pipeline */}
      <div className="bg-[#FAF6EE] dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DFD5] dark:border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#736F68] dark:text-[#E5DFD5] px-2 py-0.5 rounded-md bg-white dark:bg-white/10 border border-[#E5DFD5] dark:border-white/10">
                Workflow
              </span>
              <h2 className="text-sm sm:text-base font-bold text-[#001F3F] dark:text-white">
                Bidding Process Flow
              </h2>
            </div>
            <p className="text-xs text-[#5E5B56] dark:text-[#E5DFD5]">
              Four structured stages from opportunity discovery to sealed submission.
            </p>
          </div>
          <div className="text-[11px] font-mono text-[#736F68] dark:text-[#9CA3AF] self-start sm:self-auto">
            AI-Assisted Protocol
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Step 1 */}
          <div
            onClick={() => setActiveTab('browse')}
            className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 hover:border-[#001F3F]/40 dark:hover:border-white/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF6EE] dark:bg-white/10 text-[#001F3F] dark:text-white">
                Step 01
              </span>
              <Search className="w-3.5 h-3.5 text-[#736F68] group-hover:text-[#001F3F] transition-colors" />
            </div>
            <h3 className="text-xs font-bold text-[#001F3F] dark:text-white mb-1">
              Browse Tenders
            </h3>
            <p className="text-[11px] text-[#5E5B56] dark:text-[#9CA3AF] leading-relaxed">
              Explore open tenders, review scope of work, budget allocations, and categories.
            </p>
          </div>

          {/* Step 2: Tender Eligibility Prediction */}
          <div
            onClick={() => setActiveTab('eligibility')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
              activeTab === 'eligibility'
                ? 'bg-[#001F3F] text-white border-[#001F3F] shadow-sm'
                : 'bg-white dark:bg-white/5 border-[#E5DFD5] dark:border-white/10 hover:border-[#001F3F]/40 dark:hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  activeTab === 'eligibility'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#FAF6EE] dark:bg-white/10 text-[#001F3F] dark:text-white'
                }`}
              >
                Step 02
              </span>
              <Sparkles
                className={`w-3.5 h-3.5 ${
                  activeTab === 'eligibility' ? 'text-amber-300' : 'text-blue-600 dark:text-blue-400'
                }`}
              />
            </div>
            <h3
              className={`text-xs font-bold mb-1 ${
                activeTab === 'eligibility' ? 'text-white' : 'text-[#001F3F] dark:text-white'
              }`}
            >
              Tender Eligibility Prediction
            </h3>
            <p
              className={`text-[11px] leading-relaxed ${
                activeTab === 'eligibility' ? 'text-white/80' : 'text-[#5E5B56] dark:text-[#9CA3AF]'
              }`}
            >
              AI checks whether your company is likely eligible based on financials, turnover, and certifications.
            </p>
          </div>

          {/* Step 3: Deadline & Requirement Alerts */}
          <div
            onClick={() => setActiveTab('alerts')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
              activeTab === 'alerts'
                ? 'bg-[#001F3F] text-white border-[#001F3F] shadow-sm'
                : 'bg-white dark:bg-white/5 border-[#E5DFD5] dark:border-white/10 hover:border-[#001F3F]/40 dark:hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  activeTab === 'alerts'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#FAF6EE] dark:bg-white/10 text-[#001F3F] dark:text-white'
                }`}
              >
                Step 03
              </span>
              <Bell
                className={`w-3.5 h-3.5 ${
                  activeTab === 'alerts' ? 'text-amber-300' : 'text-amber-600 dark:text-amber-400'
                }`}
              />
            </div>
            <h3
              className={`text-xs font-bold mb-1 ${
                activeTab === 'alerts' ? 'text-white' : 'text-[#001F3F] dark:text-white'
              }`}
            >
              Deadline & Requirement Alerts
            </h3>
            <p
              className={`text-[11px] leading-relaxed ${
                activeTab === 'alerts' ? 'text-white/80' : 'text-[#5E5B56] dark:text-[#9CA3AF]'
              }`}
            >
              AI identifies important dates and mandatory requirements, issuing automated alerts and reminders.
            </p>
          </div>

          {/* Step 4 */}
          <div
            onClick={() => setActiveTab('my-bids')}
            className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 hover:border-[#001F3F]/40 dark:hover:border-white/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF6EE] dark:bg-white/10 text-[#001F3F] dark:text-white">
                Step 04
              </span>
              <Lock className="w-3.5 h-3.5 text-[#736F68] group-hover:text-[#001F3F] transition-colors" />
            </div>
            <h3 className="text-xs font-bold text-[#001F3F] dark:text-white mb-1">
              Deposit Sealed Bid
            </h3>
            <p className="text-[11px] text-[#5E5B56] dark:text-[#9CA3AF] leading-relaxed">
              Seal proposal with SHA-256 hash. Locked until official committee decryption.
            </p>
          </div>
        </div>
      </div>

      {/* CAPABILITY SECTION: AI Features Suite */}
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
                <Check className="w-3.5 h-3.5" /> 94% Avg Eligibility
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-[#001F3F] dark:text-white">
              Tender Eligibility Prediction
            </h3>
            <p className="text-xs text-[#5E5B56] dark:text-[#E5DFD5] leading-relaxed mt-1">
              AI checks whether your company is likely eligible to apply before committing preparation costs. Evaluates annual turnover, experience tenure, and certified standards against criteria.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5E5B56] dark:text-[#E5DFD5]">Profile Tested:</span>
                <span className="font-bold text-[#001F3F] dark:text-white">{vendorCompany.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E5DFD5] dark:border-white/10 text-[11px]">
                <div>
                  <span className="text-[#736F68] dark:text-[#9CA3AF] block">Turnover</span>
                  <span className="font-semibold text-[#001F3F] dark:text-white">
                    {formatCurrency(vendorCompany.annualTurnover)}
                  </span>
                </div>
                <div>
                  <span className="text-[#736F68] dark:text-[#9CA3AF] block">Experience</span>
                  <span className="font-semibold text-[#001F3F] dark:text-white">
                    {vendorCompany.yearsInBusiness} Years
                  </span>
                </div>
                <div>
                  <span className="text-[#736F68] dark:text-[#9CA3AF] block">Certifications</span>
                  <span className="font-semibold text-[#001F3F] dark:text-white">
                    {vendorCompany.certifications.length} Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setActiveTab('eligibility')}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#001F3F] hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Eligibility Matrix</span>
            </button>
            <button
              onClick={() => {
                if (tenders[0]) setSelectedTenderForEligibility(tenders[0]);
              }}
              className="py-2.5 px-3 rounded-xl text-xs font-semibold text-[#001F3F] bg-[#FAF6EE] hover:bg-[#EAE3D6] border border-[#E5DFD5] dark:bg-white/10 dark:text-white dark:border-white/10 transition-all"
              title="Quick scan next tender"
            >
              Quick Scan
            </button>
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
                <Clock className="w-3.5 h-3.5 text-amber-500" /> {openCount} Live Deadlines
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-[#001F3F] dark:text-white">
              Deadline & Requirement Alerts
            </h3>
            <p className="text-xs text-[#5E5B56] dark:text-[#E5DFD5] leading-relaxed mt-1">
              AI identifies important dates, mandatory document requirements, and submission windows, sending automated reminders so your team never misses a cutoff.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5E5B56] dark:text-[#E5DFD5]">Next Cutoff:</span>
                <span className="font-bold text-[#001F3F] dark:text-white">
                  {tenders[0]?.referenceNo || 'HWY-2025-01'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E5DFD5] dark:border-white/10">
                <span className="text-[#736F68] dark:text-[#9CA3AF]">
                  Mandatory Documents:
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {tenders[0]?.requiredDocuments.length || 3} Verified Requirements
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setActiveTab('alerts')}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#001F3F] hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>View Deadline Radar</span>
            </button>
            {tenders[0] && (
              <button
                onClick={() => handleSetReminder(tenders[0])}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold text-[#001F3F] bg-[#FAF6EE] hover:bg-[#EAE3D6] border border-[#E5DFD5] dark:bg-white/10 dark:text-white dark:border-white/10 transition-all flex items-center gap-1"
                title="Schedule proactive reminder"
              >
                <Send className="w-3 h-3" />
                <span>Alert Me</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-white/10 pb-4">
        <div className="flex items-center gap-1.5 bg-[#F3EDE2] dark:bg-white/10 p-1 rounded-xl border border-[#E5E7EB] dark:border-white/10 w-full sm:w-auto overflow-x-auto">
          <button
            id="vendor-tab-browse-tenders"
            onClick={() => setActiveTab('browse')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-center whitespace-nowrap ${
              activeTab === 'browse'
                ? 'bg-[#001F3F] text-white shadow-xs dark:bg-white dark:text-[#001F3F]'
                : 'text-[#6B7280] hover:text-[#001F3F] dark:text-[#E5DFD5] dark:hover:text-white'
            }`}
          >
            Explore Tenders ({tenders.length})
          </button>
          <button
            id="vendor-tab-eligibility"
            onClick={() => setActiveTab('eligibility')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'eligibility'
                ? 'bg-[#001F3F] text-white shadow-xs dark:bg-white dark:text-[#001F3F]'
                : 'text-[#6B7280] hover:text-[#001F3F] dark:text-[#E5DFD5] dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Eligibility AI</span>
          </button>
          <button
            id="vendor-tab-alerts"
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'bg-[#001F3F] text-white shadow-xs dark:bg-white dark:text-[#001F3F]'
                : 'text-[#6B7280] hover:text-[#001F3F] dark:text-[#E5DFD5] dark:hover:text-white'
            }`}
          >
            <Bell className="w-3 h-3" />
            <span>Deadline Alerts ({openCount})</span>
          </button>
          <button
            id="vendor-tab-my-bids"
            onClick={() => setActiveTab('my-bids')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-center whitespace-nowrap ${
              activeTab === 'my-bids'
                ? 'bg-[#001F3F] text-white shadow-xs dark:bg-white dark:text-[#001F3F]'
                : 'text-[#6B7280] hover:text-[#001F3F] dark:text-[#E5DFD5] dark:hover:text-white'
            }`}
          >
            My Bids ({myBids.length})
          </button>
        </div>

        {activeTab === 'browse' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search ref, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/80 text-xs text-[#001F3F] dark:text-white placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#001F3F]"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter tenders by category"
              className="px-3 py-1.5 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/80 text-xs font-semibold text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Browse Tenders */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          {filteredTenders.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#4B5563] dark:text-[#E5DFD5] bg-white dark:bg-[#001F3F]/40 rounded-3xl border border-dashed border-[#E5DFD5] dark:border-white/20">
              No tenders matched your search filter.
            </div>
          ) : (
            filteredTenders.map((tender) => {
              const timeInfo = getTimeRemaining(tender.deadline);
              const isOpen = tender.status === 'open' && !timeInfo.isExpired;
              const hasSubmitted = myBids.some((b) => b.tenderId === tender.id);

              return (
                <div
                  key={tender.id}
                  className="p-6 rounded-3xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 hover:border-[#001F3F]/30 dark:hover:border-white/30 transition-all shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-[#F3EDE2] text-[#001F3F] dark:bg-white/10 dark:text-white">
                          {tender.referenceNo}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300">
                          {tender.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isOpen
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : tender.status === 'awarded'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          }`}
                        >
                          {isOpen ? 'Open for Bids' : tender.status === 'awarded' ? 'Awarded' : 'Submissions Closed'}
                        </span>
                        {hasSubmitted && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Bid Deposited
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#001F3F] dark:text-white">
                        {tender.title}
                      </h3>
                      <p className="text-xs text-[#4B5563] dark:text-[#E5DFD5]">
                        Issuing Department: <span className="font-semibold text-[#001F3F] dark:text-white">{tender.department}</span>
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-xs uppercase font-bold text-[#6B7280] dark:text-[#9CA3AF]">
                        Official Budget
                      </div>
                      <div className="text-lg sm:text-xl font-black text-[#001F3F] dark:text-white">
                        {formatCurrency(tender.budget)}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#E5DFD5] leading-relaxed">
                    {tender.description}
                  </p>

                  {/* Requirements & Deadlines Box */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#9CA3AF] block mb-1">
                        Mandatory Requirements
                      </span>
                      <div className="space-y-0.5 text-[#001F3F] dark:text-white font-medium">
                        <div>Min Experience: {tender.eligibilityCriteria.minExperienceYears} years</div>
                        <div>Min Annual Turnover: {formatCurrency(tender.eligibilityCriteria.minTurnover)}</div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#9CA3AF] block mb-1">
                        Required Documents ({tender.requiredDocuments.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {tender.requiredDocuments.map((doc, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-white dark:bg-white/10 text-[10px] text-[#001F3F] dark:text-white border border-[#E5DFD5] dark:border-white/10"
                          >
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#9CA3AF] block mb-1">
                        Submission Deadline
                      </span>
                      <div
                        className={`font-semibold flex items-center gap-1.5 ${
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
                        Locks: {formatDateTime(tender.deadline)}
                      </span>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    <button
                      onClick={() => setSelectedTenderForEligibility(tender)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F3EDE2] text-[#001F3F] hover:bg-[#E5DFD5] border border-[#E5DFD5] dark:bg-white/10 dark:text-white dark:border-white/10 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Run AI Eligibility Check</span>
                    </button>

                    {isOpen ? (
                      <button
                        onClick={() => setSelectedTenderForBidding(tender)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{hasSubmitted ? 'Update / Resubmit Sealed Bid' : 'Deposit Sealed Bid'}</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500 cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Submissions Locked</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Tender Eligibility Prediction Matrix */}
      {activeTab === 'eligibility' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#001F3F]/50 border border-[#E5DFD5] dark:border-white/10 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DFD5] dark:border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-white/10 text-blue-800 dark:text-blue-300">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#001F3F] dark:text-white">
                    Tender Eligibility Prediction Engine
                  </h3>
                </div>
                <p className="text-xs text-[#5E5B56] dark:text-[#E5DFD5]">
                  AI predicts your company's probability of meeting pre-qualification criteria before you invest time into technical proposal drafting.
                </p>
              </div>

              {/* Tender Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#5E5B56] dark:text-[#E5DFD5] shrink-0">
                  Target Tender:
                </span>
                <select
                  value={selectedPredictTenderId}
                  onChange={(e) => setSelectedPredictTenderId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/80 text-xs font-semibold text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
                >
                  {tenders.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.referenceNo} — {t.title.slice(0, 32)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const activeTender = tenders.find((t) => t.id === selectedPredictTenderId) || tenders[0];
              if (!activeTender) return null;

              const meetsTurnover = eligSimTurnover >= activeTender.eligibilityCriteria.minTurnover;
              const meetsExperience = eligSimYears >= activeTender.eligibilityCriteria.minExperienceYears;
              const meetsCert = eligSimIso;

              let score = 30; // base score for registration & tax
              if (meetsTurnover) score += 30;
              else if (eligSimTurnover >= activeTender.eligibilityCriteria.minTurnover * 0.8) score += 15;

              if (meetsExperience) score += 20;
              else if (eligSimYears >= activeTender.eligibilityCriteria.minExperienceYears - 1) score += 10;

              if (meetsCert) score += 20;

              const isHighlyEligible = score >= 85;
              const isModerate = score >= 60 && score < 85;

              return (
                <div className="mt-6 space-y-6">
                  {/* Score & Verdict Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#736F68] dark:text-[#9CA3AF]">
                        AI Likelihood Score
                      </span>
                      <div className="my-2">
                        <span className="text-4xl font-black text-[#001F3F] dark:text-white">
                          {score}%
                        </span>
                        <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHighlyEligible ? 'bg-emerald-600' : isModerate ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-[#5E5B56] dark:text-[#E5DFD5]">
                        {isHighlyEligible
                          ? 'High probability of passing pre-qualification.'
                          : isModerate
                          ? 'Marginal qualification; consider consortium bidding.'
                          : 'High disqualification risk based on criteria thresholds.'}
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#736F68] dark:text-[#9CA3AF]">
                        Tender Specifications
                      </span>
                      <div className="space-y-1 my-2">
                        <div className="text-xs font-bold text-[#001F3F] dark:text-white line-clamp-1">
                          {activeTender.title}
                        </div>
                        <div className="text-xs text-[#5E5B56] dark:text-[#E5DFD5]">
                          Department: {activeTender.department}
                        </div>
                        <div className="text-xs text-[#5E5B56] dark:text-[#E5DFD5]">
                          Budget: {formatCurrency(activeTender.budget)}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#001F3F] dark:text-white">
                        Deadline: {formatDateTime(activeTender.deadline)}
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#001F3F] text-white flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#E5DFD5]">
                          Recommended Action
                        </span>
                        <h4 className="text-sm font-bold mt-1 mb-2">
                          {isHighlyEligible
                            ? 'Submit Bid with Confidence'
                            : isModerate
                            ? 'Address Missing Factors'
                            : 'Review Subcontracting Terms'}
                        </h4>
                        <p className="text-xs text-[#E5DFD5] leading-relaxed">
                          {isHighlyEligible
                            ? 'Your credentials comfortably exceed the mandatory baseline requirements.'
                            : 'Upload supplemental ISO accreditation or partner with a qualified prime contractor.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedTenderForBidding(activeTender)}
                        className="w-full mt-3 py-2 px-3 rounded-xl bg-white text-[#001F3F] text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition shadow-xs"
                      >
                        Prepare Proposal
                      </button>
                    </div>
                  </div>

                  {/* Criteria Checklist & Interactive Parameters */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                    {/* Left: Criteria Breakdown */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#736F68] dark:text-[#9CA3AF]">
                        Mandatory Compliance Audit
                      </h4>

                      <div className="space-y-2.5">
                        {/* Turnover */}
                        <div className="p-3.5 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-[#001F3F] dark:text-white block">
                              Annual Turnover Threshold
                            </span>
                            <span className="text-[11px] text-[#5E5B56] dark:text-[#9CA3AF]">
                              Required: {formatCurrency(activeTender.eligibilityCriteria.minTurnover)} | Your Profile: {formatCurrency(eligSimTurnover)}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                              meetsTurnover
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                            }`}
                          >
                            {meetsTurnover ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {meetsTurnover ? 'Qualified' : 'Deficit'}
                          </span>
                        </div>

                        {/* Experience */}
                        <div className="p-3.5 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-[#001F3F] dark:text-white block">
                              Industry Operating Experience
                            </span>
                            <span className="text-[11px] text-[#5E5B56] dark:text-[#9CA3AF]">
                              Required: {activeTender.eligibilityCriteria.minExperienceYears} Years | Your Profile: {eligSimYears} Years
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                              meetsExperience
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                            }`}
                          >
                            {meetsExperience ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {meetsExperience ? 'Qualified' : 'Deficit'}
                          </span>
                        </div>

                        {/* Certifications */}
                        <div className="p-3.5 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-[#001F3F] dark:text-white block">
                              Technical & Quality Certifications
                            </span>
                            <span className="text-[11px] text-[#5E5B56] dark:text-[#9CA3AF]">
                              Mandatory: ISO 9001:2015 & CMMI | Active in Profile: {meetsCert ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                              meetsCert
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                            }`}
                          >
                            {meetsCert ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {meetsCert ? 'Verified' : 'Missing'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Interactive Simulator Controls */}
                    <div className="p-5 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white">
                          Profile Parameter Sandbox
                        </h4>
                        <span className="text-[10px] text-[#736F68] dark:text-[#9CA3AF]">
                          Test hypothetical scenarios
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#5E5B56] dark:text-[#E5DFD5]">Annual Turnover</span>
                            <span className="font-mono font-bold text-[#001F3F] dark:text-white">
                              {formatCurrency(eligSimTurnover)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1000000"
                            max="15000000"
                            step="500000"
                            value={eligSimTurnover}
                            onChange={(e) => setEligSimTurnover(Number(e.target.value))}
                            className="w-full accent-[#001F3F] cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#5E5B56] dark:text-[#E5DFD5]">Operating Years</span>
                            <span className="font-mono font-bold text-[#001F3F] dark:text-white">
                              {eligSimYears} Years
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            value={eligSimYears}
                            onChange={(e) => setEligSimYears(Number(e.target.value))}
                            className="w-full accent-[#001F3F] cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#E5DFD5] dark:border-white/10">
                          <span className="text-xs text-[#5E5B56] dark:text-[#E5DFD5]">
                            ISO 9001 Certification Enforced
                          </span>
                          <button
                            onClick={() => setEligSimIso(!eligSimIso)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              eligSimIso
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white'
                            }`}
                          >
                            {eligSimIso ? 'Certified' : 'Not Certified'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab 3: Deadline & Requirement Alerts Radar */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#001F3F]/50 border border-[#E5DFD5] dark:border-white/10 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DFD5] dark:border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-white/10 text-amber-800 dark:text-amber-300">
                    <Bell className="w-4 h-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#001F3F] dark:text-white">
                    Deadline & Requirement Alerts Radar
                  </h3>
                </div>
                <p className="text-xs text-[#5E5B56] dark:text-[#E5DFD5]">
                  AI continuously tracks all statutory submission deadlines, mandatory affidavit documents, and closing windows.
                </p>
              </div>

              <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#FAF6EE] dark:bg-white/10 border border-[#E5DFD5] dark:border-white/10 text-[#001F3F] dark:text-white font-semibold">
                {openCount} Active Submission Windows
              </div>
            </div>

            {/* Radar Table / Cards */}
            <div className="mt-6 space-y-4">
              {tenders.map((tender) => {
                const timeInfo = getTimeRemaining(tender.deadline);
                const isReminded = remindedTenderIds.includes(tender.id);

                return (
                  <div
                    key={tender.id}
                    className="p-5 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 space-y-4 hover:border-[#001F3F]/30 dark:hover:border-white/30 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-white dark:bg-white/10 text-[#001F3F] dark:text-white border border-[#E5DFD5] dark:border-white/10">
                            {tender.referenceNo}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-[#5E5B56] dark:text-[#E5DFD5]">
                            {tender.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              timeInfo.isExpired
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                : timeInfo.totalHours <= 48
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            }`}
                          >
                            {timeInfo.isExpired ? 'Submissions Closed' : `Closing: ${timeInfo.text}`}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-[#001F3F] dark:text-white">
                          {tender.title}
                        </h4>
                        <p className="text-xs text-[#5E5B56] dark:text-[#E5DFD5]">
                          Issuing Authority: <span className="font-semibold">{tender.department}</span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#736F68] dark:text-[#9CA3AF] block">
                          Hard Cutoff
                        </span>
                        <span className="font-mono text-xs font-bold text-[#001F3F] dark:text-white">
                          {formatDateTime(tender.deadline)}
                        </span>
                      </div>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#736F68] dark:text-[#9CA3AF] block">
                        Mandatory Required Documents ({tender.requiredDocuments.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {tender.requiredDocuments.map((doc, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[#FAF6EE] dark:bg-white/10 text-[#001F3F] dark:text-white border border-[#E5DFD5] dark:border-white/10 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{doc}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                      <div className="text-xs text-[#5E5B56] dark:text-[#E5DFD5]">
                        {isReminded ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> AI Reminder Active (In-App & Email Alert Scheduled)
                          </span>
                        ) : (
                          <span>Proactive reminders issue alerts 48h and 24h before tender seal cutoff.</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSetReminder(tender)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            isReminded
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 cursor-default'
                              : 'bg-white hover:bg-slate-50 text-[#001F3F] border border-[#E5DFD5] dark:bg-white/10 dark:text-white dark:border-white/10 shadow-xs'
                          }`}
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>{isReminded ? 'Reminder Scheduled' : 'Set Smart Reminder'}</span>
                        </button>
                        <button
                          onClick={() => setSelectedTenderForBidding(tender)}
                          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs"
                        >
                          Deposit Bid
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: My Submitted Bids */}
      {activeTab === 'my-bids' && (
        <div className="space-y-4">
          {myBids.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#6B7280] dark:text-[#E5DFD5] bg-white dark:bg-[#001F3F]/40 rounded-3xl border border-dashed border-[#E5DFD5] dark:border-white/20">
              You haven't submitted any sealed bids yet. Explore open tenders above to apply.
            </div>
          ) : (
            <div className="rounded-3xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#001F3F]/40 shadow-sm overflow-hidden">
              {/* Responsive Mobile / Tablet Card View */}
              <div className="block lg:hidden divide-y divide-[#E5E7EB] dark:divide-white/10">
                {myBids.map((bid) => {
                  const tender = tenders.find((t) => t.id === bid.tenderId);
                  return (
                    <div key={bid.id} className="p-4 sm:p-5 space-y-3 hover:bg-[#FAF8F5] dark:hover:bg-white/5 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-[#F3EDE2] text-[#001F3F] dark:bg-white/10 dark:text-white">
                              {tender?.referenceNo || bid.tenderId}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                bid.status === 'awarded'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300'
                                  : bid.status === 'under_review'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-300'
                                  : bid.status === 'disqualified'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300'
                                  : 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-white/10 dark:text-gray-300'
                              }`}
                            >
                              {bid.offlineQueued ? 'Queued (Offline)' : bid.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-[#001F3F] dark:text-white">
                            {tender?.title || 'Tender Proposal'}
                          </h3>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">
                            Bid Amount
                          </span>
                          <span className="font-black text-base text-[#001F3F] dark:text-white">
                            {formatCurrency(bid.bidAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[#6B7280] dark:text-[#E5DFD5]">
                          <span>Timeline:</span>
                          <span className="font-semibold text-[#001F3F] dark:text-white">{bid.proposedTimelineWeeks} Weeks</span>
                        </div>
                        <div className="flex items-center justify-between text-[#6B7280] dark:text-[#E5DFD5]">
                          <span>Cryptographic Seal:</span>
                          <span className="font-mono text-[11px] truncate max-w-[160px] text-[#001F3F] dark:text-white" title={bid.cryptoHash}>
                            {bid.cryptoHash}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[#6B7280] dark:text-[#E5DFD5]">
                          <span>Submitted:</span>
                          <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{formatDateTime(bid.submittedAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF8F5] dark:bg-[#001730] text-[#6B7280] dark:text-[#E5DFD5] text-[10px] uppercase font-bold tracking-widest border-b border-[#E5E7EB] dark:border-white/10">
                    <tr>
                      <th className="px-6 py-3">Tender Ref & Project</th>
                      <th className="px-6 py-3">Bid Amount</th>
                      <th className="px-6 py-3">Timeline</th>
                      <th className="px-6 py-3">Sealed Hash (SHA-256)</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] dark:divide-white/10 text-xs">
                    {myBids.map((bid) => {
                      const tender = tenders.find((t) => t.id === bid.tenderId);
                      return (
                        <tr key={bid.id} className="hover:bg-[#FAF8F5] dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold block text-[#001F3F] dark:text-white">
                              {tender?.referenceNo || bid.tenderId}
                            </span>
                            <span className="text-[11px] text-[#6B7280] dark:text-[#E5DFD5] truncate max-w-xs block font-medium">
                              {tender?.title || 'Tender Proposal'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-sm text-[#001F3F] dark:text-white">
                            {formatCurrency(bid.bidAmount)}
                          </td>
                          <td className="px-6 py-4 text-[#6B7280] dark:text-[#E5DFD5]">
                            {bid.proposedTimelineWeeks} Weeks
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] text-[#6B7280] dark:text-[#E5DFD5]">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="truncate max-w-[140px]" title={bid.cryptoHash}>
                                {bid.cryptoHash}
                              </span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                bid.status === 'awarded'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                  : bid.status === 'under_review'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                  : bid.status === 'disqualified'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300'
                              }`}
                            >
                              {bid.offlineQueued ? 'Queued (Offline)' : bid.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#6B7280] dark:text-[#9CA3AF] font-mono text-[11px]">
                            {formatDateTime(bid.submittedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Eligibility Prediction Modal */}
      {selectedTenderForEligibility && (
        <EligibilityModal
          isOpen={Boolean(selectedTenderForEligibility)}
          onClose={() => setSelectedTenderForEligibility(null)}
          tender={selectedTenderForEligibility}
          companyProfile={vendorCompany}
          onProceedToBid={(tender) => {
            setSelectedTenderForEligibility(null);
            setSelectedTenderForBidding(tender);
          }}
        />
      )}

      {/* Sealed Bid Submission Modal */}
      {selectedTenderForBidding && (
        <BidSubmissionModal
          isOpen={Boolean(selectedTenderForBidding)}
          onClose={() => setSelectedTenderForBidding(null)}
          tender={selectedTenderForBidding}
          currentUser={currentUser}
          isOnline={isOnline}
          isSimulatedOffline={isSimulatedOffline}
          onBidSubmitted={onRefresh}
        />
      )}
    </div>
  );
};
