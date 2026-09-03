import React from 'react';
import { X, Building, CheckCircle, ShieldCheck, IndianRupee, Award } from 'lucide-react';
import { User, VendorCompanyProfile } from '../../types';
import { setStoredCurrentUser } from '../../utils/storage';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
}

const COMMON_CERTIFICATIONS = [
  'ISO 9001:2015',
  'ISO 27001',
  'ISO 14001',
  'CMMI Level 3',
  'CMMI Level 5',
  'LEED Gold Certified',
  'SOC 2 Type II',
  'OSHA Safety Compliant',
];

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const profile = currentUser.companyProfile || {
    name: currentUser.organization || 'My Contracting Enterprise',
    registrationNumber: 'REG-2021-99201',
    annualTurnover: 4000000,
    yearsInBusiness: 6,
    certifications: ['ISO 9001:2015', 'ISO 27001'],
    pastProjectsCount: 15,
    rating: 4.6,
    hasTaxClearance: true,
    contactPerson: currentUser.name,
    phone: '+1 (555) 300-1122',
  };

  const [formData, setFormData] = React.useState<VendorCompanyProfile>(profile);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    if (currentUser.companyProfile) {
      setFormData(currentUser.companyProfile);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleToggleCert = (cert: string) => {
    setFormData((prev) => {
      const exists = prev.certifications.includes(cert);
      return {
        ...prev,
        certifications: exists
          ? prev.certifications.filter((c) => c !== cert)
          : [...prev.certifications, cert],
      };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...currentUser,
      companyProfile: formData,
    };
    setStoredCurrentUser(updatedUser);
    onUpdateUser(updatedUser);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        id="company-profile-modal"
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-[#FAF6EE] dark:bg-[#001730] rounded-3xl shadow-2xl border border-[#E5DFD5] dark:border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#001F3F] flex items-center justify-between bg-[#001F3F] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Building className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Vendor Enterprise Credentials
              </h2>
              <p className="text-xs text-white/80">
                Used by the AI Tender Eligibility Prediction Engine to assess bid qualification
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

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {saveSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Company credentials updated successfully! AI predictions will reflect changes.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                Company Legal Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/10 bg-white dark:bg-[#001F3F]/40 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                Corporate Registry / Tax ID
              </label>
              <input
                type="text"
                required
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/10 bg-white dark:bg-[#001F3F]/40 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                Annual Financial Turnover (₹ INR)
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  required
                  min="0"
                  step="50000"
                  value={formData.annualTurnover}
                  onChange={(e) => setFormData({ ...formData, annualTurnover: Number(e.target.value) })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/10 bg-white dark:bg-[#001F3F]/40 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
                />
              </div>
              <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-1 block">
                Current: ₹{formData.annualTurnover.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                Years Operating in Business
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={formData.yearsInBusiness}
                onChange={(e) => setFormData({ ...formData, yearsInBusiness: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/10 bg-white dark:bg-[#001F3F]/40 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                Past Completed Projects Count
              </label>
              <input
                type="number"
                min="0"
                value={formData.pastProjectsCount}
                onChange={(e) => setFormData({ ...formData, pastProjectsCount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/10 bg-white dark:bg-[#001F3F]/40 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                Past Performance Rating (0 - 5.0)
              </label>
              <input
                type="number"
                min="1.0"
                max="5.0"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/10 bg-white dark:bg-[#001F3F]/40 text-[#001F3F] dark:text-white focus:ring-1 focus:ring-[#001F3F]"
              />
            </div>
          </div>

          {/* Certifications Checklist */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-2">
              Recognized Technical & Regulatory Certifications
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_CERTIFICATIONS.map((cert) => {
                const checked = formData.certifications.includes(cert);
                return (
                  <button
                    type="button"
                    key={cert}
                    onClick={() => handleToggleCert(cert)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition ${
                      checked
                        ? 'bg-[#001F3F] text-white border-[#001F3F] shadow-xs dark:bg-white dark:text-[#001F3F] dark:border-white'
                        : 'bg-white text-[#4B5563] border-[#E5DFD5] dark:bg-[#001F3F]/40 dark:text-[#E5DFD5] dark:border-white/10 hover:border-[#001F3F]'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cert}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tax Clearance Checkbox */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#001F3F]/40 border border-[#E5DFD5] dark:border-white/10 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-bold text-xs text-[#001F3F] dark:text-white block">
                  Valid Tax Compliance Clearance
                </span>
                <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                  Verified for current statutory taxation period
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.hasTaxClearance}
              onChange={(e) => setFormData({ ...formData, hasTaxClearance: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#001F3F] focus:ring-[#001F3F]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E5DFD5]/50 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#F3EDE2] text-[#001F3F] hover:bg-[#E5DFD5] border border-[#E5DFD5] dark:bg-white/10 dark:text-white dark:border-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs"
            >
              Save Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
