import React, { useState } from 'react';
import {
  Shield,
  Briefcase,
  Scale,
  ArrowLeft,
  Sun,
  Moon,
  Lock,
  Mail,
  User as UserIcon,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Award,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { Role, User } from '../../types';
import { DEMO_USERS } from '../../data/mockData';
import { authenticateUser, registerUser } from '../../utils/storage';

interface AuthPageProps {
  initialRole?: Role;
  initialMode?: 'signin' | 'signup';
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSuccess: (user: User) => void;
  onBackToLanding: () => void;
}

interface RoleConfig {
  role: 'admin' | 'vendor';
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  defaultEmail: string;
  demoUser: (typeof DEMO_USERS)[0];
}

const ROLE_CONFIGS: Record<'admin' | 'vendor', RoleConfig> = {
  admin: {
    role: 'admin',
    title: 'Procurement Authority',
    badge: 'Authority & Issuing Gateway',
    description: 'Post tenders, configure eligibility thresholds, run automated AI QCBS evaluations, and execute digital contract awards.',
    icon: Shield,
    accentColor: '#001F3F',
    defaultEmail: 'sarah.jenkins@procurement.gov',
    demoUser: DEMO_USERS[0],
  },
  vendor: {
    role: 'vendor',
    title: 'Bidder & Contractor',
    badge: 'Sealed Bid & Vendor Portal',
    description: 'Verify tender eligibility, model profit margins, submit cryptographic sealed bids, and track awards.',
    icon: Briefcase,
    accentColor: '#001F3F',
    defaultEmail: 'm.vance@buildcorp.com',
    demoUser: DEMO_USERS[1],
  },
};

export function AuthPage({
  initialRole = 'admin',
  initialMode = 'signin',
  theme,
  onToggleTheme,
  onSuccess,
  onBackToLanding,
}: AuthPageProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'vendor'>(
    initialRole === 'vendor' ? 'vendor' : 'admin'
  );
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up common state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpOrganization, setSignUpOrganization] = useState('');

  // Role specific sign up fields
  // Admin
  const [adminDepartment, setAdminDepartment] = useState('Ministry of Infrastructure & Public Works');
  const [adminClearanceId, setAdminClearanceId] = useState('');
  const [adminDesignation, setAdminDesignation] = useState('Procurement Officer');

  // Vendor
  const [vendorRegNo, setVendorRegNo] = useState('');
  const [vendorTurnover, setVendorTurnover] = useState('3500000');
  const [vendorYears, setVendorYears] = useState('5');
  const [vendorCertifications, setVendorCertifications] = useState('ISO 9001:2015, ISO 27001');
  const [vendorIndustry, setVendorIndustry] = useState('Civil Engineering & Infrastructure');
  const [vendorTaxClearance, setVendorTaxClearance] = useState(true);

  const [complianceAgreed, setComplianceAgreed] = useState(false);

  const currentConfig = ROLE_CONFIGS[selectedRole];

  // Quick fill demo credentials
  const handleQuickFillDemo = () => {
    setErrorMsg(null);
    setSignInEmail(currentConfig.defaultEmail);
    setSignInPassword(`${selectedRole}123`);
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const email = signInEmail.trim() || currentConfig.defaultEmail;
    const pwd = signInPassword || `${selectedRole}123`;

    const result = authenticateUser(email, pwd, selectedRole);
    if (result.success && result.user) {
      setSuccessMsg(`Authenticated successfully as ${result.user.name}`);
      setTimeout(() => {
        onSuccess(result.user!);
      }, 400);
    } else {
      setErrorMsg(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!signUpName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!signUpEmail.trim()) {
      setErrorMsg('Work email address is required.');
      return;
    }
    if (!signUpPassword) {
      setErrorMsg('Please specify a password.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMsg('Passwords do not match. Please retype carefully.');
      return;
    }
    if (!complianceAgreed) {
      setErrorMsg('You must certify procurement compliance and authority.');
      return;
    }

    const newUserId = `usr-${selectedRole}-${Date.now().toString(36)}`;
    const orgName = signUpOrganization.trim() || (selectedRole === 'admin' ? adminDepartment : selectedRole === 'vendor' ? `${signUpName} Contractors Ltd` : 'Procurement Review Panel');

    let newUser: User = {
      id: newUserId,
      name: signUpName.trim(),
      email: signUpEmail.trim().toLowerCase(),
      role: selectedRole,
      organization: orgName,
    };

    if (selectedRole === 'vendor') {
      const certs = vendorCertifications
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      newUser.companyProfile = {
        name: orgName,
        registrationNumber: vendorRegNo.trim() || `REG-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        annualTurnover: Number(vendorTurnover) || 2000000,
        yearsInBusiness: Number(vendorYears) || 3,
        certifications: certs.length > 0 ? certs : ['ISO 9001:2015'],
        pastProjectsCount: 12,
        rating: 4.8,
        hasTaxClearance: vendorTaxClearance,
        contactPerson: signUpName.trim(),
        phone: '+1 (555) 019-2831',
      };
    }

    const regResult = registerUser(newUser, signUpPassword);
    if (regResult.success && regResult.user) {
      setSuccessMsg(`Account created successfully for ${regResult.user.name}! Accessing portal...`);
      setTimeout(() => {
        onSuccess(regResult.user!);
      }, 500);
    } else {
      setErrorMsg(regResult.error || 'Failed to create account.');
    }
  };

  const RoleIcon = currentConfig.icon;

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#001F3F] dark:bg-[#001730] dark:text-[#FAF6EE] flex flex-col font-sans transition-colors">
      {/* Top Bar Header */}
      <header className="border-b border-[#E5DFD5] dark:border-white/10 bg-[#FAF6EE]/90 dark:bg-[#001730]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-30 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F3EDE2] text-[#001F3F] hover:bg-[#E5DFD5] border border-[#E5DFD5] dark:bg-white/10 dark:text-white dark:border-white/10 transition"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>

            <div
              onClick={onBackToLanding}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  background: theme === 'dark' ? '#FAF6EE' : '#001F3F',
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                }}
              />
              <span className="font-extrabold text-base tracking-tight text-[#001F3F] dark:text-white">
                TENDER<span className="text-[#736F68] dark:text-[#9CA3AF]">VAULT</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-[#D5CFC5] dark:border-white/20 bg-white/70 hover:bg-[#F3EDE2] text-[#001F3F] dark:bg-white/10 dark:text-amber-300 dark:hover:bg-white/20 transition flex items-center gap-1.5 text-xs font-bold"
              aria-label="Toggle visual theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-300" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#001F3F]" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Centerpiece */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
        {/* Role Selector Tabs */}
        <div className="w-full max-w-2xl mb-8">
          <div className="text-center mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#EAE5DB] text-[#001F3F] border border-[#DDD7CD] dark:bg-white/10 dark:text-white dark:border-white/20 inline-block mb-2">
              Role-Based Access Control (RBAC)
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#001F3F] dark:text-white tracking-tight">
              TenderVault Portal Authentication
            </h1>
            <p className="text-xs sm:text-sm text-[#001F3F]/75 dark:text-[#D1D5DB] mt-1 max-w-md mx-auto">
              Select your procurement role below to sign in or register an accredited account.
            </p>
          </div>

          {/* 2 Role Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['admin', 'vendor'] as const).map((r) => {
              const cfg = ROLE_CONFIGS[r];
              const Icon = cfg.icon;
              const isSelected = selectedRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-[#001F3F] text-white border-[#001F3F] dark:bg-white dark:text-[#001F3F] dark:border-white shadow-md'
                      : 'bg-white text-[#001F3F] border-[#E5DFD5] hover:border-[#001F3F]/40 dark:bg-[#001F3F]/60 dark:text-white dark:border-white/10 dark:hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-xl ${
                        isSelected
                          ? 'bg-white/15 text-white dark:bg-[#001F3F]/15 dark:text-[#001F3F]'
                          : 'bg-[#F3EDE2] text-[#001F3F] dark:bg-white/10 dark:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white dark:bg-[#001F3F]/20 dark:text-[#001F3F]">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-sm leading-tight">{cfg.title}</div>
                  <div
                    className={`text-[11px] mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-white/80 dark:text-[#001F3F]/80' : 'text-[#001F3F]/70 dark:text-[#D1D5DB]'
                    }`}
                  >
                    {cfg.badge}
                  </div>
                </button>
              );
            })}
          </div>

          {/* AI Evaluator Feature Callout */}
          <div className="mt-3.5 p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-xl bg-[#001F3F]/10 dark:bg-white/10 text-[#001F3F] dark:text-white shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#001F3F] dark:text-white">AI Tender Evaluator: </span>
              <span className="text-[#001F3F]/80 dark:text-[#D1D5DB]">
                Tender evaluation is an autonomous AI intelligence system, not a human account. It automatically scores bids against all target benefits and criteria directly inside the Procurement Authority Portal.
              </span>
            </div>
          </div>
        </div>

        {/* Auth Container Card */}
        <div className="w-full max-w-2xl bg-white dark:bg-[#001F3F]/60 rounded-3xl border border-[#E5DFD5] dark:border-white/10 shadow-xl overflow-hidden transition-all">
          {/* Active Role Header Banner */}
          <div className="px-6 py-4 bg-[#F3EDE2] dark:bg-white/5 border-b border-[#E5DFD5] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#001F3F] text-white dark:bg-white dark:text-[#001F3F] shadow-xs">
                <RoleIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-[#001F3F] dark:text-white leading-tight">
                    {currentConfig.title} Portal
                  </h2>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                    Encrypted
                  </span>
                </div>
                <p className="text-xs text-[#001F3F]/70 dark:text-[#D1D5DB] mt-0.5">
                  {currentConfig.description}
                </p>
              </div>
            </div>

            {/* Mode Switcher Pill */}
            <div className="flex items-center bg-[#EAE5DB] dark:bg-black/20 p-1 rounded-xl shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition ${
                  mode === 'signin'
                    ? 'bg-[#001F3F] text-white dark:bg-white dark:text-[#001F3F] shadow-xs'
                    : 'text-[#001F3F]/70 dark:text-[#D1D5DB] hover:text-[#001F3F] dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition ${
                  mode === 'signup'
                    ? 'bg-[#001F3F] text-white dark:bg-white dark:text-[#001F3F] shadow-xs'
                    : 'text-[#001F3F]/70 dark:text-[#D1D5DB] hover:text-[#001F3F] dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mx-6 mt-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mx-6 mt-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300 flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {mode === 'signin' ? (
              /* SIGN IN FORM */
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                {/* One Click Demo Card */}
                <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#001F3F] dark:text-white">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Instant Demo Access</span>
                    </div>
                    <p className="text-[11px] text-[#001F3F]/70 dark:text-[#D1D5DB]">
                      Sign in directly with seeded account: <strong>{currentConfig.demoUser.name}</strong> ({currentConfig.demoUser.email})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickFillDemo}
                    className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs"
                  >
                    Quick Fill
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                    Official Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#736F68] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder={currentConfig.defaultEmail}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/80 text-[#001F3F] dark:text-white text-xs placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#001F3F]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white">
                      Security Password
                    </label>
                    <span className="text-[10px] text-[#001F3F]/60 dark:text-[#9CA3AF]">
                      Demo password: <strong className="font-mono">{selectedRole}123</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#736F68] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/80 text-[#001F3F] dark:text-white text-xs placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#001F3F]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#736F68] dark:text-[#9CA3AF] hover:text-[#001F3F] dark:hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Sign In to {currentConfig.title}</span>
                  </button>
                </div>

                <div className="pt-2 text-center text-xs text-[#001F3F]/75 dark:text-[#D1D5DB]">
                  Need a new accredited account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                    }}
                    className="font-bold underline text-[#001F3F] dark:text-white hover:opacity-80"
                  >
                    Register as {currentConfig.title}
                  </button>
                </div>
              </form>
            ) : (
              /* SIGN UP FORM */
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[#736F68] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="e.g. Jonathan Mercer"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/80 text-[#001F3F] dark:text-white text-xs placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#001F3F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                      Official Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#736F68] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="e.g. j.mercer@enterprise.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/80 text-[#001F3F] dark:text-white text-xs placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#001F3F]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                    Organization / Enterprise Name
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-[#736F68] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={signUpOrganization}
                      onChange={(e) => setSignUpOrganization(e.target.value)}
                      placeholder={selectedRole === 'admin' ? 'Procurement Board / Department' : selectedRole === 'vendor' ? 'Prime Contracting Ltd' : 'Technical Review Panel'}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/80 text-[#001F3F] dark:text-white text-xs placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#001F3F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#736F68] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create strong password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/80 text-[#001F3F] dark:text-white text-xs placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#001F3F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] dark:text-white mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#736F68] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F]/80 text-[#001F3F] dark:text-white text-xs placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#001F3F]"
                      />
                    </div>
                  </div>
                </div>

                {/* ROLE-SPECIFIC REGISTRATION DETAILS */}
                {selectedRole === 'admin' && (
                  <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#001F3F] dark:text-white">
                      <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Authority Regulatory Verification</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-[#001F3F] dark:text-white mb-1">
                          Department / Ministry
                        </label>
                        <input
                          type="text"
                          value={adminDepartment}
                          onChange={(e) => setAdminDepartment(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F] text-[#001F3F] dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#001F3F] dark:text-white mb-1">
                          Officer Clearance ID
                        </label>
                        <input
                          type="text"
                          value={adminClearanceId}
                          onChange={(e) => setAdminClearanceId(e.target.value)}
                          placeholder="e.g. AUTH-CPPB-2026"
                          className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F] text-[#001F3F] dark:text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedRole === 'vendor' && (
                  <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-white/5 border border-[#E5DFD5] dark:border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#001F3F] dark:text-white">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Bidder Profile & AI Eligibility Baseline</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-[#001F3F] dark:text-white mb-1">
                          Registration / Tax ID
                        </label>
                        <input
                          type="text"
                          value={vendorRegNo}
                          onChange={(e) => setVendorRegNo(e.target.value)}
                          placeholder="REG-2026-XXXX"
                          className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F] text-[#001F3F] dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#001F3F] dark:text-white mb-1">
                          Annual Turnover (₹ INR)
                        </label>
                        <input
                          type="number"
                          value={vendorTurnover}
                          onChange={(e) => setVendorTurnover(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F] text-[#001F3F] dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#001F3F] dark:text-white mb-1">
                          Years in Business
                        </label>
                        <input
                          type="number"
                          value={vendorYears}
                          onChange={(e) => setVendorYears(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F] text-[#001F3F] dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#001F3F] dark:text-white mb-1">
                        Active Quality / Industry Certifications
                      </label>
                      <input
                        type="text"
                        value={vendorCertifications}
                        onChange={(e) => setVendorCertifications(e.target.value)}
                        placeholder="ISO 9001:2015, ISO 27001, CMMI Level 3"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] dark:border-white/20 bg-white dark:bg-[#001F3F] text-[#001F3F] dark:text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <label className="flex items-start gap-2 text-xs text-[#001F3F]/80 dark:text-[#D1D5DB] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={complianceAgreed}
                      onChange={(e) => setComplianceAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-[#E5DFD5] text-[#001F3F] focus:ring-[#001F3F]"
                    />
                    <span>
                      I certify that all information submitted is true, verifiable, and complies with statutory procurement oversight.
                    </span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create {currentConfig.title} Account</span>
                  </button>
                </div>

                <div className="pt-2 text-center text-xs text-[#001F3F]/75 dark:text-[#D1D5DB]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                    }}
                    className="font-bold underline text-[#001F3F] dark:text-white hover:opacity-80"
                  >
                    Sign in to portal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
