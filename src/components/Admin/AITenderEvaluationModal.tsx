import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Award,
  Clock,
  TrendingDown,
  ShieldCheck,
  Leaf,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  BadgeCheck,
  Lock,
} from 'lucide-react';
import { Tender, Bid, User, AITenderEvaluationReport, AIBidEvaluationSummary } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/crypto';
import { evaluateTenderWithAIEngine } from '../../services/aiService';
import { saveStoredTender, saveStoredBid, addStoredAuditLog, addStoredNotification } from '../../utils/storage';

interface AITenderEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tender: Tender;
  bids: Bid[];
  currentUser: User;
  onEvaluationCompleted: () => void;
}

export const AITenderEvaluationModal: React.FC<AITenderEvaluationModalProps> = ({
  isOpen,
  onClose,
  tender,
  bids,
  currentUser,
  onEvaluationCompleted,
}) => {
  const tenderBids = bids.filter((b) => b.tenderId === tender.id);

  // Weights state: Technical, Financial, Benefits
  const [techWeight, setTechWeight] = useState<number>(40);
  const [finWeight, setFinWeight] = useState<number>(35);
  const [benefitsWeight, setBenefitsWeight] = useState<number>(25);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AITenderEvaluationReport | null>(null);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [awardingBidId, setAwardingBidId] = useState<string | null>(null);
  const [awardSuccessMsg, setAwardSuccessMsg] = useState<string | null>(null);
  const [awardNotes, setAwardNotes] = useState<string>('');

  // Fetch or calculate AI evaluation
  const runEvaluation = async (weightsOverride?: { technical: number; financial: number; benefits: number }) => {
    if (tenderBids.length === 0) return;
    setIsLoading(true);
    try {
      const activeWeights = weightsOverride || {
        technical: techWeight,
        financial: finWeight,
        benefits: benefitsWeight,
      };
      const result = await evaluateTenderWithAIEngine(tender, tenderBids, activeWeights);
      setReport(result);
      if (result.recommendedWinner) {
        setSelectedBidId(result.recommendedWinner.bidId);
      } else if (result.rankings.length > 0) {
        setSelectedBidId(result.rankings[0].bidId);
      }
    } catch (err) {
      console.error('Failed to run AI evaluation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tenderBids.length > 0) {
      runEvaluation();
    }
  }, [isOpen, tender.id]);

  if (!isOpen) return null;

  // Handle slider weight changes ensuring sum to 100
  const handleTechChange = (val: number) => {
    setTechWeight(val);
    const rem = 100 - val;
    const newFin = Math.round(rem * (finWeight / (finWeight + benefitsWeight || 1)));
    const newBen = rem - newFin;
    setFinWeight(newFin);
    setBenefitsWeight(newBen);
    runEvaluation({ technical: val, financial: newFin, benefits: newBen });
  };

  const handleFinChange = (val: number) => {
    setFinWeight(val);
    const rem = 100 - val;
    const newTech = Math.round(rem * (techWeight / (techWeight + benefitsWeight || 1)));
    const newBen = rem - newTech;
    setTechWeight(newTech);
    setBenefitsWeight(newBen);
    runEvaluation({ technical: newTech, financial: val, benefits: newBen });
  };

  const handleBenefitsChange = (val: number) => {
    setBenefitsWeight(val);
    const rem = 100 - val;
    const newTech = Math.round(rem * (techWeight / (techWeight + finWeight || 1)));
    const newFin = rem - newTech;
    setTechWeight(newTech);
    setFinWeight(newFin);
    runEvaluation({ technical: newTech, financial: newFin, benefits: val });
  };

  const selectedEvaluation = report?.rankings.find((r) => r.bidId === selectedBidId);
  const selectedBid = tenderBids.find((b) => b.id === selectedBidId);

  // Execute contract award to the winning bidder
  const handleExecuteAward = (bidToAward: AIBidEvaluationSummary) => {
    setAwardingBidId(bidToAward.bidId);

    // 1. Update the winning bid
    const targetBid = tenderBids.find((b) => b.id === bidToAward.bidId);
    if (!targetBid) return;

    const updatedWinningBid: Bid = {
      ...targetBid,
      status: 'accepted',
      evaluationNotes: awardNotes || bidToAward.aiRationale,
      scores: {
        technicalScore: bidToAward.technicalScore,
        financialScore: bidToAward.financialScore,
        benefitScore: bidToAward.benefitScore,
        combinedScore: bidToAward.combinedScore,
        evaluatorRemarks: `AI Benefit-QCBS Committee award: ${bidToAward.aiRationale}`,
      },
    };
    saveStoredBid(updatedWinningBid);

    // 2. Reject other bids
    tenderBids.forEach((other) => {
      if (other.id !== bidToAward.bidId) {
        saveStoredBid({
          ...other,
          status: 'rejected',
          evaluationNotes: 'Proposal ranked below optimal multi-benefit QCBS threshold.',
        });
      }
    });

    // 3. Mark tender as awarded
    const updatedTender: Tender = {
      ...tender,
      status: 'awarded',
      awardedBidId: bidToAward.bidId,
      awardedVendorId: targetBid.vendorId,
      awardedAmount: bidToAward.bidAmount,
      awardedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveStoredTender(updatedTender);

    // 4. Audit logging & Notifications
    addStoredAuditLog(
      currentUser.name,
      'admin',
      'Digital Contract Award Executed',
      'tender',
      tender.id,
      `Tender awarded to ${bidToAward.vendorName} at ${formatCurrency(bidToAward.bidAmount)} based on AI Multi-Benefit Evaluation (Score: ${bidToAward.combinedScore}/100).`
    );

    addStoredNotification({
      title: `Tender Awarded: ${tender.referenceNo}`,
      message: `Contract officially awarded to ${bidToAward.vendorName} (${formatCurrency(bidToAward.bidAmount)}) following AI benefit qualification.`,
      type: 'award',
      tenderId: tender.id,
    });

    setAwardSuccessMsg(`Contract successfully awarded to ${bidToAward.vendorName}!`);
    setTimeout(() => {
      setAwardSuccessMsg(null);
      setAwardingBidId(null);
      onEvaluationCompleted();
      onClose();
    }, 2000);
  };

  const targetBenefits = tender.targetBenefits || {
    costOptimization: 'Maximized capital efficiency within sanctioned budget with low lifecycle TCO',
    technicalExcellence: 'Full compliance with engineering standards, reliability, and security frameworks',
    timelineVelocity: 'Accelerated project milestones and early operational handover',
    sustainabilityESG: 'Green footprint compliance, energy efficiency, and resource conservation',
    warrantyAndSLA: 'Comprehensive warranty coverage with rapid SLA emergency response',
    requiredBenefitsList: [
      'Total budget optimization and taxpayer value',
      'Turnkey engineering specifications and quality standard compliance',
      'Guaranteed project delivery timeline without critical delay',
      'Sustainable and environmental ESG commitment',
      'Long-term multi-year warranty support and SLA terms',
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#001F3F]/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white dark:bg-[#071426] rounded-3xl shadow-2xl border border-[#E5DFD5] dark:border-white/15 overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="px-6 py-4.5 border-b border-[#E5DFD5] dark:border-white/10 bg-[#FAF6EE] dark:bg-[#001730] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#001F3F] text-white dark:bg-white dark:text-[#001F3F] shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#001F3F] dark:text-white tracking-tight">
                  AI Tender Benefit Evaluation Engine
                </h2>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {report?.source === 'gemini' ? 'Gemini 2.5 Flash' : 'Algorithmic QCBS Engine'}
                </span>
              </div>
              <p className="text-xs text-[#001F3F]/75 dark:text-[#CBD5E1]">
                {tender.referenceNo} • {tender.title} ({formatCurrency(tender.budget)} Budget)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runEvaluation()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#001F3F] hover:bg-[#EAE5DB] dark:text-white dark:hover:bg-white/10 border border-[#D5CFC5] dark:border-white/20 transition"
              title="Re-run AI evaluation"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Recalculate</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#001F3F]/70 hover:text-[#001F3F] hover:bg-black/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Award Toast Banner */}
        {awardSuccessMsg && (
          <div className="bg-emerald-500 text-white px-6 py-3 text-xs font-bold flex items-center justify-between animate-fade-in shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{awardSuccessMsg}</span>
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider">Syncing Ledger...</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#001F3F] dark:text-[#E2E8F0]">
          
          {/* Target Benefits of the Tender Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F3EDE2] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#001F3F] dark:text-blue-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white">
                  Required Tender Benefits & Criteria Assessment
                </h3>
              </div>
              <span className="text-[11px] text-[#736F68] dark:text-[#94A3B8]">
                {tenderBids.length} Submissions Qualified for Benefit Audit
              </span>
            </div>

            <p className="text-xs text-[#001F3F]/80 dark:text-[#CBD5E1] leading-relaxed">
              The AI Evaluator audits each bid against the tender's mandatory target benefits: Capital Cost Optimization, Technical Architecture, Turnkey Delivery Velocity, Sustainability/ESG Standards, and Long-Term Warranty & SLA.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-400 mb-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Cost Benefit</span>
                </div>
                <p className="text-[11px] text-[#001F3F]/75 dark:text-[#CBD5E1] line-clamp-2" title={targetBenefits.costOptimization}>
                  {targetBenefits.costOptimization}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-800 dark:text-blue-400 mb-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>Technical Quality</span>
                </div>
                <p className="text-[11px] text-[#001F3F]/75 dark:text-[#CBD5E1] line-clamp-2" title={targetBenefits.technicalExcellence}>
                  {targetBenefits.technicalExcellence}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-400 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Timeline Velocity</span>
                </div>
                <p className="text-[11px] text-[#001F3F]/75 dark:text-[#CBD5E1] line-clamp-2" title={targetBenefits.timelineVelocity}>
                  {targetBenefits.timelineVelocity}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-400 mb-1">
                  <Leaf className="w-3.5 h-3.5" />
                  <span>ESG Sustainability</span>
                </div>
                <p className="text-[11px] text-[#001F3F]/75 dark:text-[#CBD5E1] line-clamp-2" title={targetBenefits.sustainabilityESG}>
                  {targetBenefits.sustainabilityESG}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-800 dark:text-purple-400 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Warranty & SLA</span>
                </div>
                <p className="text-[11px] text-[#001F3F]/75 dark:text-[#CBD5E1] line-clamp-2" title={targetBenefits.warrantyAndSLA}>
                  {targetBenefits.warrantyAndSLA}
                </p>
              </div>
            </div>
          </div>

          {/* AI Committee Executive Summary */}
          {report && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#001F3F] text-white dark:bg-white/10 border border-[#001F3F]/20 dark:border-white/20 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    AI Committee Executive Summary
                  </span>
                </div>
                <span className="text-[11px] text-white/70 font-mono">
                  Assessed on {new Date(report.evaluatedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/90 dark:text-[#F1F5F9] leading-relaxed">
                {report.executiveSummary}
              </p>
            </div>
          )}

          {/* QCBS Multi-Benefit Weight Sensitivity Controls */}
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#001F3F] dark:text-blue-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white">
                  QCBS Weight Sensitivity Matrix (Sum: 100%)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-blue-700 dark:text-blue-300 font-bold">Tech: {techWeight}%</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">Cost: {finWeight}%</span>
                <span className="text-amber-700 dark:text-amber-300 font-bold">Benefits/ESG: {benefitsWeight}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="flex justify-between mb-1 text-[11px] font-bold">
                  <span>Technical Quality Weight</span>
                  <span>{techWeight}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={techWeight}
                  onChange={(e) => handleTechChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E5DFD5] dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#001F3F] dark:accent-white"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[11px] font-bold">
                  <span>Financial / Cost Weight</span>
                  <span>{finWeight}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={finWeight}
                  onChange={(e) => handleFinChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E5DFD5] dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#001F3F] dark:accent-white"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[11px] font-bold">
                  <span>Target Benefits & ESG Weight</span>
                  <span>{benefitsWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={benefitsWeight}
                  onChange={(e) => handleBenefitsChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E5DFD5] dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#001F3F] dark:accent-white"
                />
              </div>
            </div>
          </div>

          {/* Bids Benefit Comparison & Rankings Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white">
              Comparative Benefit Rankings & Compliance Matrix
            </h3>

            {isLoading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#001F3F] border-t-transparent dark:border-white dark:border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#736F68] dark:text-[#CBD5E1]">
                  AI Evaluator analyzing bids against all target benefits & statutory thresholds...
                </p>
              </div>
            ) : report && report.rankings.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {report.rankings.map((rank) => {
                  const isSelected = selectedBidId === rank.bidId;
                  const isWinner = rank.rank === 1;

                  return (
                    <div
                      key={rank.bidId}
                      onClick={() => setSelectedBidId(rank.bidId)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white dark:bg-white/10 border-[#001F3F] dark:border-white shadow-md ring-2 ring-[#001F3F]/10 dark:ring-white/20'
                          : 'bg-white dark:bg-white/5 border-[#E5DFD5] dark:border-white/10 hover:border-[#001F3F]/40'
                      }`}
                    >
                      {/* Top Rank Badge & Vendor */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                                isWinner
                                  ? 'bg-amber-400 text-[#001F3F]'
                                  : rank.rank === 2
                                  ? 'bg-slate-200 text-slate-700 dark:bg-white/20 dark:text-white'
                                  : 'bg-[#E5DFD5] text-[#736F68] dark:bg-white/10 dark:text-white/70'
                              }`}
                            >
                              {rank.rank}
                            </span>
                            <span className="font-mono text-[10px] uppercase font-bold text-[#736F68] dark:text-[#94A3B8]">
                              RANK {rank.rank} {isWinner ? '• RECOMMENDED' : ''}
                            </span>
                          </div>

                          {isWinner && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700 flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              L1+Benefit Leader
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-sm text-[#001F3F] dark:text-white leading-tight">
                          {rank.vendorName}
                        </div>
                        <div className="text-xs text-[#736F68] dark:text-[#94A3B8] font-mono mt-0.5">
                          Offered: {formatCurrency(rank.bidAmount)}
                        </div>

                        {/* Composite QCBS Score Banner */}
                        <div className="mt-3 p-2.5 rounded-xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#736F68] dark:text-[#CBD5E1]">
                            Composite Benefit Score
                          </span>
                          <span className="text-base font-black font-mono text-[#001F3F] dark:text-white">
                            {rank.combinedScore}
                            <span className="text-[10px] text-[#736F68] dark:text-[#94A3B8] font-normal">/100</span>
                          </span>
                        </div>

                        {/* 5-Benefit Progress Meters */}
                        <div className="space-y-1.5 mt-3 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-[#736F68] dark:text-[#CBD5E1]">Cost Optimization:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {rank.benefitsBreakdown.costBenefitScore}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#736F68] dark:text-[#CBD5E1]">Technical Quality:</span>
                            <span className="font-bold text-blue-700 dark:text-blue-400">
                              {rank.benefitsBreakdown.technicalBenefitScore}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#736F68] dark:text-[#CBD5E1]">Timeline Velocity:</span>
                            <span className="font-bold text-amber-700 dark:text-amber-400">
                              {rank.benefitsBreakdown.timelineBenefitScore}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#736F68] dark:text-[#CBD5E1]">ESG Sustainability:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {rank.benefitsBreakdown.sustainabilityBenefitScore}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#736F68] dark:text-[#CBD5E1]">Warranty & SLA:</span>
                            <span className="font-bold text-purple-700 dark:text-purple-400">
                              {rank.benefitsBreakdown.warrantyBenefitScore}/100
                            </span>
                          </div>
                        </div>

                        {/* Required Benefits Checked */}
                        <div className="mt-3 pt-3 border-t border-[#E5DFD5] dark:border-white/10">
                          <div className="text-[10px] uppercase font-bold text-[#736F68] dark:text-[#94A3B8] mb-1.5">
                            Benefits Compliance Checked
                          </div>
                          <div className="space-y-1">
                            {rank.benefitsDelivered.map((benefit, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px]">
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-1 text-[#001F3F] dark:text-[#CBD5E1]" title={benefit}>
                                  {benefit}
                                </span>
                              </div>
                            ))}
                            {rank.unmetRequirements.map((unmet, i) => (
                              <div key={`unmet-${i}`} className="flex items-start gap-1.5 text-[11px]">
                                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-1 text-rose-600 dark:text-rose-400" title={unmet}>
                                  {unmet}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Select Indicator */}
                      <div className="mt-4 pt-2 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-[#001F3F] dark:text-white">
                          {isSelected ? 'Viewing Detailed Audit ↓' : 'Click to View Audit'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#736F68]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#736F68] dark:text-[#CBD5E1] bg-white dark:bg-white/5 rounded-2xl border border-[#E5DFD5] dark:border-white/10">
                No bid submissions available to evaluate for this tender.
              </div>
            )}
          </div>

          {/* Selected Bid Deep-Dive Audit & Award Confirmation Section */}
          {selectedEvaluation && (
            <div className="p-5 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-[#001F3F] text-white dark:bg-white dark:text-[#001F3F]">
                    Detailed Benefit Audit
                  </span>
                  <h4 className="text-base font-bold text-[#001F3F] dark:text-white mt-1">
                    {selectedEvaluation.vendorName} (Rank #{selectedEvaluation.rank})
                  </h4>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black font-mono text-[#001F3F] dark:text-white">
                    {formatCurrency(selectedEvaluation.bidAmount)}
                  </div>
                  <div className="text-[11px] text-[#736F68] dark:text-[#94A3B8]">
                    {tender.budget > selectedEvaluation.bidAmount
                      ? `Saves ${Math.round(((tender.budget - selectedEvaluation.bidAmount) / tender.budget) * 100)}% (${formatCurrency(tender.budget - selectedEvaluation.bidAmount)}) vs Budget`
                      : 'Compliant with sanctioned budget'}
                  </div>
                </div>
              </div>

              {/* Justification & Strengths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 block mb-1">
                    Verified Strengths & Value Add
                  </span>
                  <ul className="space-y-1">
                    {(selectedEvaluation.keyAdvantages.length > 0
                      ? selectedEvaluation.keyAdvantages
                      : selectedEvaluation.benefitsDelivered
                    ).map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px] text-[#001F3F]/80 dark:text-[#CBD5E1]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10">
                  <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400 block mb-1">
                    Technical Specifications & SLA Deliverables
                  </span>
                  <div className="space-y-1 text-[11px] text-[#001F3F]/80 dark:text-[#CBD5E1]">
                    <div>
                      <span className="font-semibold">Turnkey Delivery: </span>
                      {selectedBid?.offeredBenefits?.timelineWeeksProposed || selectedBid?.proposedTimelineWeeks || 12} Weeks
                      {selectedBid?.offeredBenefits?.timelineAdvantageWeeks
                        ? ` (${selectedBid.offeredBenefits.timelineAdvantageWeeks} wks ahead of schedule)`
                        : ''}
                    </div>
                    <div>
                      <span className="font-semibold">Warranty & Maintenance: </span>
                      {selectedBid?.offeredBenefits?.warrantyMonths || 36} Months with{' '}
                      {selectedBid?.offeredBenefits?.slaResponseHours || 4}-Hour emergency SLA
                    </div>
                    <div>
                      <span className="font-semibold">Local Content / ESG: </span>
                      {selectedBid?.offeredBenefits?.localContentPercent || 80}% domestic value-add
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation Justification */}
              <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 text-xs">
                <span className="text-[10px] uppercase font-bold text-[#736F68] dark:text-[#94A3B8] block mb-0.5">
                  AI Recommendation Rationalization
                </span>
                <p className="text-[11px] text-[#001F3F]/80 dark:text-[#CBD5E1] leading-relaxed">
                  {selectedEvaluation.aiRationale}
                </p>
              </div>

              {/* Award Execution Box */}
              {tender.status !== 'awarded' ? (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E5DFD5] dark:border-white/10">
                  <div className="text-xs text-[#736F68] dark:text-[#94A3B8]">
                    Awarding this tender will finalize the contract, seal cryptographic logs, and notify all bidders.
                  </div>
                  <button
                    onClick={() => handleExecuteAward(selectedEvaluation)}
                    disabled={awardingBidId === selectedEvaluation.bidId}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] dark:hover:bg-slate-100 text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4 text-amber-300 dark:text-[#001F3F]" />
                    <span>
                      {awardingBidId === selectedEvaluation.bidId
                        ? 'Sealing Contract Award...'
                        : `Award Contract to ${selectedEvaluation.vendorName}`}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tender Officially Awarded</span>
                  </div>
                  <span className="font-mono text-[11px]">Contract Active</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FAF6EE] dark:bg-[#001730] border-t border-[#E5DFD5] dark:border-white/10 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#736F68] dark:text-[#94A3B8]">
            Automated QCBS AI Benefit Engine • Version 2.4-INR
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EAE5DB] hover:bg-[#D5CFC5] text-[#001F3F] dark:bg-white/10 dark:text-white dark:hover:bg-white/20 transition"
          >
            Close Evaluator
          </button>
        </div>

      </div>
    </div>
  );
};
