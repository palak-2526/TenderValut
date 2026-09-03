import React from 'react';
import {
  X,
  PlusCircle,
  Building2,
  IndianRupee,
  Calendar,
  Award,
  CheckCircle,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Tender, User, TenderEligibilityCriteria } from '../../types';
import { formatCurrency, generateCryptoHash } from '../../utils/crypto';
import { saveStoredTender, addStoredAuditLog, addStoredNotification } from '../../utils/storage';

interface CreateTenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onTenderCreated: () => void;
}

const COMMON_DOCS = [
  'Valid Business Registration Certificate',
  'Audited Financial Statements (Last 3 Years)',
  'Tax Compliance Clearance Certificate',
  'Technical Methodology & Execution Plan',
  'Key Personnel & Professional CVs',
  'Equipment & Machinery Schedule',
  'ISO 9001 Quality Management Certification',
  'Bid Security / Bank Guarantee (2%)',
];

export const CreateTenderModal: React.FC<CreateTenderModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onTenderCreated,
}) => {
  const [title, setTitle] = React.useState('');
  const [department, setDepartment] = React.useState('Ministry of Digital Infrastructure');
  const [category, setCategory] = React.useState('IT & Cloud Infrastructure');
  const [budget, setBudget] = React.useState(3500000);
  const [deadline, setDeadline] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 16);
  });
  const [description, setDescription] = React.useState('');
  const [minTurnover, setMinTurnover] = React.useState(5000000);
  const [minExperience, setMinExperience] = React.useState(5);
  const [requiresTaxClearance, setRequiresTaxClearance] = React.useState(true);
  const [requiredCerts, setRequiredCerts] = React.useState<string[]>([
    'ISO 9001:2015',
    'ISO 27001',
  ]);
  const [requiredDocs, setRequiredDocs] = React.useState<string[]>([
    'Valid Business Registration Certificate',
    'Audited Financial Statements (Last 3 Years)',
    'Tax Compliance Clearance Certificate',
    'Technical Methodology & Execution Plan',
  ]);
  const [customDocInput, setCustomDocInput] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  if (!isOpen) return null;

  const handleToggleDoc = (doc: string) => {
    setRequiredDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  };

  const handleAddCustomDoc = () => {
    if (customDocInput.trim() && !requiredDocs.includes(customDocInput.trim())) {
      setRequiredDocs([...requiredDocs, customDocInput.trim()]);
      setCustomDocInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const refNo = `TND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const tenderId = 'tnd-' + Date.now();

    const eligibility: TenderEligibilityCriteria = {
      minTurnover,
      minExperienceYears: minExperience,
      requiredCertifications: requiredCerts,
      minTechnicalScore: 70,
      requiresTaxClearance,
    };

    const newTender: Tender = {
      id: tenderId,
      referenceNo: refNo,
      title,
      department,
      category,
      budget,
      currency: 'INR',
      publishedDate: new Date().toISOString(),
      deadline: new Date(deadline).toISOString(),
      description:
        description ||
        `Official competitive tender procurement exercise for ${title} under standard National Public Procurement procedures.`,
      eligibilityCriteria: eligibility,
      requiredDocuments: requiredDocs,
      assignedEvaluators: ['usr-eval-1'],
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedBy: currentUser.name,
    };

    saveStoredTender(newTender);

    addStoredAuditLog(
      currentUser.name,
      currentUser.role,
      'Tender Created & Published',
      'tender',
      tenderId,
      `Published new tender ${refNo} with budget ${formatCurrency(budget)} and deadline ${new Date(
        deadline
      ).toLocaleDateString()}.`
    );

    addStoredNotification({
      title: `New Tender Published: ${refNo}`,
      message: `${title} by ${department}. Budget: ${formatCurrency(budget)}. Open for vendor submissions.`,
      type: 'status_change',
      tenderId,
    });

    setSubmitting(false);
    onTenderCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        id="create-tender-modal"
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#FAF6EE] dark:bg-[#001730] rounded-3xl shadow-2xl border border-[#E5DFD5] dark:border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#001F3F] flex items-center justify-between bg-[#001F3F] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Publish New Competitive Tender
              </h2>
              <p className="text-xs text-white/80">
                Define scope, financial budget, statutory deadline, and AI eligibility criteria
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {/* General Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                Tender Title / Project Scope *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. National High-Speed Rail Signaling System Modernization"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/60 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                  Procuring Department / Authority *
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/60 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                  Procurement Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/60 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
                >
                  <option value="IT & Cloud Infrastructure">IT & Cloud Infrastructure</option>
                  <option value="Civil Infrastructure & Construction">
                    Civil Infrastructure & Construction
                  </option>
                  <option value="Renewable Energy & Solar">Renewable Energy & Solar</option>
                  <option value="Medical Equipment & Supplies">Medical Equipment & Supplies</option>
                  <option value="Public Transportation">Public Transportation</option>
                  <option value="Security & Surveillance">Security & Surveillance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] mb-1">
                  Estimated Financial Budget (₹ INR) *
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
                  <input
                    type="number"
                    required
                    min="10000"
                    step="50000"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#D8CEBA] dark:border-[#223150] bg-white dark:bg-[#131D31] text-[#0F172A] dark:text-[#F8F6F0] focus:ring-1 focus:ring-[#0F172A]"
                  />
                </div>
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  {formatCurrency(budget)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                  Sealed Submission Deadline (Locks Automatically) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/60 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                Detailed Scope of Work / Technical Specifications
              </label>
              <textarea
                rows={3}
                placeholder="Describe deliverables, technical specs, milestones, testing protocols..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/60 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
              />
            </div>
          </div>

          {/* Eligibility Criteria Section */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#001F3F] dark:text-white" />
              <span>Vendor Eligibility Criteria (AI Verified)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B5563] dark:text-[#E5DFD5] mb-1">
                  Minimum Annual Turnover Required (₹ INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={minTurnover}
                  onChange={(e) => setMinTurnover(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/60 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5563] dark:text-[#E5DFD5] mb-1">
                  Minimum Experience Required (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={minExperience}
                  onChange={(e) => setMinExperience(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/60 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="tender-tax-clearance-check"
                checked={requiresTaxClearance}
                onChange={(e) => setRequiresTaxClearance(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#001F3F] focus:ring-[#001F3F]"
              />
              <label
                htmlFor="tender-tax-clearance-check"
                className="text-xs font-medium text-[#4B5563] dark:text-[#E5DFD5]"
              >
                Statutory Tax Clearance certificate is mandatory for bid consideration
              </label>
            </div>
          </div>

          {/* Mandatory Documents Required */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white">
                Required Submission Documents ({requiredDocs.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_DOCS.map((doc) => {
                const checked = requiredDocs.includes(doc);
                return (
                  <button
                    type="button"
                    key={doc}
                    onClick={() => handleToggleDoc(doc)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition ${
                      checked
                        ? 'bg-[#001F3F] text-white border-[#001F3F] dark:bg-white dark:text-[#001F3F]'
                        : 'bg-[#FAF6EE] text-[#4B5563] border-[#E5DFD5] dark:bg-white/5 dark:text-[#E5DFD5] dark:border-white/10'
                    }`}
                  >
                    <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${checked ? 'text-emerald-400' : 'text-gray-400'}`} />
                    <span className="truncate font-medium">{doc}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add custom required document requirement..."
                value={customDocInput}
                onChange={(e) => setCustomDocInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/60 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
              />
              <button
                type="button"
                onClick={handleAddCustomDoc}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#F3EDE2] text-[#001F3F] hover:bg-[#E5DFD5] border border-[#E5DFD5] dark:bg-white/10 dark:text-white dark:border-white/10 transition"
              >
                Add Document
              </button>
            </div>
          </div>

          {/* Form Actions */}
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
              disabled={submitting}
              className="px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs"
            >
              {submitting ? 'Publishing...' : 'Publish Tender to Portal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
