import React from 'react';
import {
  X,
  Lock,
  UploadCloud,
  FileText,
  IndianRupee,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
  Hash,
  Trash2,
} from 'lucide-react';
import { Tender, User, Bid, BidDocument } from '../../types';
import { generateCryptoHash, getTimeRemaining, formatCurrency } from '../../utils/crypto';
import { saveStoredBid, addStoredAuditLog, addStoredNotification } from '../../utils/storage';

interface BidSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tender: Tender;
  currentUser: User;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onBidSubmitted: () => void;
}

export const BidSubmissionModal: React.FC<BidSubmissionModalProps> = ({
  isOpen,
  onClose,
  tender,
  currentUser,
  isOnline,
  isSimulatedOffline,
  onBidSubmitted,
}) => {
  const timeInfo = getTimeRemaining(tender.deadline);
  const isLocked = timeInfo.isExpired || tender.status !== 'open';

  const [bidAmount, setBidAmount] = React.useState<number>(Math.round(tender.budget * 0.94));
  const [proposedWeeks, setProposedWeeks] = React.useState<number>(24);
  const [technicalSummary, setTechnicalSummary] = React.useState<string>('');
  const [documents, setDocuments] = React.useState<BidDocument[]>([
    {
      id: 'doc-pre-1',
      name: 'Technical_Methodology_Proposal.pdf',
      sizeBytes: 3420000,
      mimeType: 'application/pdf',
      uploadDate: new Date().toISOString(),
      fileHash: 'SHA256:4a8b1c4d7e0f3a6b9c2d5e8f1a4b7c0d3e6f9a2bb5a2c91d4e8f7a0b3c6d9e2f',
    },
    {
      id: 'doc-pre-2',
      name: 'Audited_Financial_Statement_FY25.pdf',
      sizeBytes: 5120000,
      mimeType: 'application/pdf',
      uploadDate: new Date().toISOString(),
      fileHash: 'SHA256:7c0d3e6f9a2bb5a2c91d4e8f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a4b',
    },
  ]);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [cryptoSeal, setCryptoSeal] = React.useState<string>('SHA256:GENERATING_ON_SUBMISSION');

  React.useEffect(() => {
    generateCryptoHash(`${tender.id}-${currentUser.id}-${bidAmount}`).then((hash) => {
      setCryptoSeal(hash);
    });
  }, [tender.id, currentUser.id, bidAmount]);

  if (!isOpen) return null;

  const budgetVariance = tender.budget > 0 ? ((bidAmount - tender.budget) / tender.budget) * 100 : 0;
  const isOverBudget = bidAmount > tender.budget;
  const isTrulyOffline = !isOnline || isSimulatedOffline;

  const handleFileUploadSimulation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    generateCryptoHash(file.name + file.size + Date.now()).then((hash) => {
      const newDoc: BidDocument = {
        id: 'doc-' + Date.now(),
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type || 'application/pdf',
        uploadDate: new Date().toISOString(),
        fileHash: hash,
      };
      setDocuments((prev) => [...prev, newDoc]);
    });
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setSubmitting(true);
    const finalHash = await generateCryptoHash(
      `${tender.id}:${currentUser.id}:${bidAmount}:${Date.now()}:${documents.length}`
    );

    const newBid: Bid = {
      id: 'bid-' + Date.now(),
      tenderId: tender.id,
      vendorId: currentUser.id,
      vendorName: currentUser.companyProfile?.name || currentUser.organization || currentUser.name,
      vendorProfile: currentUser.companyProfile || {
        name: currentUser.name,
        registrationNumber: 'REG-DEFAULT',
        annualTurnover: 3500000,
        yearsInBusiness: 5,
        certifications: ['ISO 9001:2015'],
        pastProjectsCount: 10,
        rating: 4.5,
        hasTaxClearance: true,
        contactPerson: currentUser.name,
        phone: '+1 555 0192',
      },
      bidAmount,
      proposedTimelineWeeks: proposedWeeks,
      technicalProposalSummary:
        technicalSummary ||
        `Comprehensive turnkey delivery addressing all specifications in ${tender.referenceNo} with ISO-compliant quality benchmarks.`,
      documents,
      cryptoHash: finalHash,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      offlineQueued: isTrulyOffline,
    };

    saveStoredBid(newBid, isTrulyOffline);

    addStoredAuditLog(
      currentUser.name,
      currentUser.role,
      'Sealed Bid Submitted',
      'bid',
      newBid.id,
      `Submitted sealed financial bid of ${formatCurrency(bidAmount)} for ${tender.referenceNo} with SHA-256 seal.`
    );

    addStoredNotification({
      title: 'Sealed Bid Submitted Successfully',
      message: `Your bid for ${tender.referenceNo} is securely registered. Cryptographic seal: ${finalHash.substring(0, 18)}...`,
      type: 'bid_received',
      tenderId: tender.id,
    });

    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onBidSubmitted();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        id="bid-submission-modal"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#FAF6EE] dark:bg-[#001730] rounded-3xl shadow-2xl border border-[#E5DFD5] dark:border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#001F3F] flex items-center justify-between bg-[#001F3F] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Submit Sealed Bid
                </h2>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/20 text-white font-semibold">
                  {tender.referenceNo}
                </span>
              </div>
              <p className="text-xs text-white/80 truncate max-w-md">
                {tender.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Deadline Locking Warning */}
        {isLocked ? (
          <div className="p-4 bg-rose-50 border-b border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60 flex items-center gap-3 text-rose-800 dark:text-rose-200 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <div>
              <span className="font-bold block">Submission Window Concluded & Locked</span>
              Official deadline has passed ({tender.deadline}). No further sealed bids can be uploaded according to statutory procurement regulations.
            </div>
          </div>
        ) : (
          <div className="px-6 py-3 bg-[#F3EDE2] dark:bg-[#001F3F]/60 border-b border-[#E5DFD5] dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#4B5563] dark:text-[#E5DFD5]">
              Estimated Budget: <strong className="text-[#001F3F] dark:text-white">{formatCurrency(tender.budget)}</strong>
            </span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              Deadline: {timeInfo.text}
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">Sealed Bid Successfully Registered!</span>
                Cryptographic hash confirmed. Your proposal is safely deposited into the tamper-proof procurement repository.
              </div>
            </div>
          )}

          {isTrulyOffline && (
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/60 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Offline Mode:</strong> Your bid will be sealed locally with SHA-256 fingerprint and auto-synchronized when back online.
              </span>
            </div>
          )}

          {/* Bid Amount & Budget Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                Your Total Bid Price (₹ INR) *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-[#9CA3AF]" />
                <input
                  type="number"
                  required
                  disabled={isLocked || submitting}
                  min="1"
                  step="1000"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/60 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F] disabled:opacity-50"
                />
              </div>

              <div className="mt-1 flex items-center gap-2 text-[11px]">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">
                  Variance vs Budget:
                </span>
                <span
                  className={`font-semibold ${
                    isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {budgetVariance >= 0 ? `+${budgetVariance.toFixed(1)}%` : `${budgetVariance.toFixed(1)}%`}
                </span>
                {isOverBudget && (
                  <span className="text-rose-600 text-[10px] font-medium">(Exceeds tender allocation)</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                Proposed Execution Timeline (Weeks) *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-[#9CA3AF]" />
                <input
                  type="number"
                  required
                  disabled={isLocked || submitting}
                  min="1"
                  max="520"
                  value={proposedWeeks}
                  onChange={(e) => setProposedWeeks(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/60 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F] disabled:opacity-50"
                />
              </div>
              <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                Estimated completion: ~{Math.round(proposedWeeks / 4.3)} months
              </span>
            </div>
          </div>

          {/* Technical Summary */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
              Executive Technical Proposal Summary
            </label>
            <textarea
              rows={3}
              disabled={isLocked || submitting}
              placeholder="Outline your engineering methodology, equipment availability, staffing structure, and adherence to tender criteria..."
              value={technicalSummary}
              onChange={(e) => setTechnicalSummary(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/60 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F] disabled:opacity-50"
            />
          </div>

          {/* Mandatory Documents Checklist Required by Tender */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 shadow-xs">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-2">
              Mandatory Tender Documents Checklist:
            </span>
            <ul className="space-y-1 text-xs text-[#4B5563] dark:text-[#E5DFD5]">
              {tender.requiredDocuments.map((doc, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#001F3F] dark:bg-white" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Attached Files & Real/Simulated Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white">
                Uploaded Sealed Documents ({documents.length})
              </label>

              {!isLocked && (
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Attach PDF</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileUploadSimulation}
                  />
                </label>
              )}
            </div>

            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold text-xs text-[#001F3F] dark:text-white truncate">
                        {doc.name}
                      </div>
                      <div className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-mono truncate">
                        {(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {doc.fileHash.substring(0, 24)}...
                      </div>
                    </div>
                  </div>

                  {!isLocked && documents.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic Seal Hash Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 text-xs space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#001F3F] dark:text-white flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Cryptographic SHA-256 Bid Seal</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Sealed & Encrypted
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#4B5563] dark:text-[#E5DFD5] break-all select-all">
              {cryptoSeal}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E5DFD5] dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#F3EDE2] text-[#001F3F] hover:bg-[#E5DFD5] border border-[#E5DFD5] dark:bg-white/10 dark:text-white dark:border-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLocked || submitting}
              className="px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {isLocked ? 'Submissions Locked' : submitting ? 'Encrypting & Depositing...' : 'Seal & Submit Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
