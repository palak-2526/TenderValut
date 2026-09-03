import React from 'react';
import {
  Building2,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Bell,
  Sun,
  Moon,
  History,
  FileBadge,
  Sparkles,
  Wifi,
  WifiOff,
  Menu,
  X,
  RotateCcw,
  LogIn,
} from 'lucide-react';
import { User, Role } from '../types';
import { DEMO_USERS } from '../data/mockData';

interface HeaderProps {
  currentUser: User;
  onSelectRole: (role: Role) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenAlerts: () => void;
  onOpenAuditLogs: () => void;
  onOpenCompanyProfile?: () => void;
  onResetData: () => void;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  onBackToLanding?: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectRole,
  theme,
  onToggleTheme,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenAlerts,
  onOpenAuditLogs,
  onOpenCompanyProfile,
  onResetData,
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  onBackToLanding,
  onOpenAuth,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const roles: { role: Role; label: string; icon: any; subtitle: string }[] = [
    {
      role: 'admin',
      label: 'Procurement Authority',
      icon: ShieldCheck,
      subtitle: 'Tender Authority',
    },
    {
      role: 'vendor',
      label: 'Bidder / Vendor',
      icon: Briefcase,
      subtitle: 'Contractor Portal',
    },
  ];

  const effectiveOffline = !isOnline || isSimulatedOffline;

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 bg-[#FAF6EE] text-[#001F3F] border-b border-[#E5DFD5] shadow-xs dark:bg-[#071326] dark:text-[#F8FAFC] dark:border-white/10 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#FFFFFF] hover:bg-[#F3EDE2] text-[#001F3F] border border-[#D5CFC5] transition shadow-xs dark:bg-white/10 dark:text-white dark:border-white/20"
                title="Back to Landing Page"
              >
                <span>←</span>
                <span className="hidden sm:inline">Overview</span>
              </button>
            )}

            <div
              onClick={onBackToLanding}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: "#001F3F",
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-[#001F3F] dark:text-white">
                    TENDER<span className="text-[#736F68] dark:text-[#9CA3AF]">VAULT</span>
                  </span>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#EAE5DB] text-[#001F3F] border border-[#DDD7CD] dark:bg-white/10 dark:text-white dark:border-white/20">
                    Live Suite
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Role Switcher */}
          <nav
            id="role-switcher-nav"
            className="hidden md:flex items-center bg-[#F3EDE2] dark:bg-white/10 p-1 rounded-xl border border-[#E5DFD5] dark:border-white/10"
          >
            {roles.map((item) => {
              const Icon = item.icon;
              const isActive = currentUser.role === item.role;
              return (
                <button
                  key={item.role}
                  id={`role-btn-${item.role}`}
                  onClick={() => onSelectRole(item.role)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#001F3F] text-white shadow-xs font-bold dark:bg-white dark:text-[#001F3F]'
                      : 'text-[#6C6963] hover:text-[#001F3F] hover:bg-black/5 dark:text-[#D1D5DB] dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <div className="text-left">
                    <div>{item.label}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cloud Sync Pulse indicator */}
            <div className="hidden xl:flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
              <span className="font-mono text-[11px]">{effectiveOffline ? 'LOCAL QUEUED' : 'CLOUD SYNCED'}</span>
            </div>

            <div className="hidden xl:block h-6 w-px bg-[#E5DFD5] dark:bg-white/10" />

            {/* Online / Offline status toggle pill */}
            <button
              id="header-network-status-btn"
              onClick={onToggleSimulatedOffline}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                effectiveOffline
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
              }`}
              title={effectiveOffline ? 'Working offline. Click to reconnect.' : 'Connected. Click to simulate offline.'}
            >
              {effectiveOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{effectiveOffline ? 'Offline' : 'Online'}</span>
            </button>

            {/* AI Deadline & Requirement Alerts */}
            <button
              id="open-ai-deadline-alerts-btn"
              onClick={onOpenAlerts}
              className="relative p-2 rounded-lg text-[#001F3F]/75 hover:text-[#001F3F] hover:bg-[#F3EDE2] dark:text-[#D1D5DB] dark:hover:text-white dark:hover:bg-white/10 transition"
              title="AI Deadline & Requirement Alerts"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-300" />
            </button>

            {/* Notifications Bell */}
            <button
              id="open-notifications-btn"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-[#001F3F]/75 hover:text-[#001F3F] hover:bg-[#F3EDE2] dark:text-[#D1D5DB] dark:hover:text-white dark:hover:bg-white/10 transition"
              title="System Alerts & Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              )}
            </button>

            {/* Audit Log Modal Trigger */}
            <button
              id="open-audit-logs-btn"
              onClick={onOpenAuditLogs}
              className="p-2 rounded-lg text-[#001F3F]/75 hover:text-[#001F3F] hover:bg-[#F3EDE2] dark:text-[#D1D5DB] dark:hover:text-white dark:hover:bg-white/10 transition"
              title="Tamper-evident Audit Ledger"
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Vendor Profile Modifier (only when vendor) */}
            {currentUser.role === 'vendor' && onOpenCompanyProfile && (
              <button
                id="open-company-profile-btn"
                onClick={onOpenCompanyProfile}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFFFFF] text-[#001F3F] hover:bg-[#F3EDE2] border border-[#D5CFC5] dark:bg-white/10 dark:text-white dark:border-white/20 transition"
                title="Edit Company Profile & Certifications for AI Eligibility Check"
              >
                <FileBadge className="w-3.5 h-3.5" />
                <span>My Profile</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-2 rounded-lg border border-[#D5CFC5] dark:border-white/20 bg-white/70 hover:bg-[#F3EDE2] text-[#001F3F] dark:bg-white/10 dark:text-amber-300 dark:hover:bg-white/20 transition flex items-center gap-1"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle visual theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-300" />
                  <span className="text-[11px] font-bold text-white hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#001F3F]" />
                  <span className="text-[11px] font-bold text-[#001F3F] hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* Reset Seed Data */}
            <button
              id="reset-seed-data-btn"
              onClick={onResetData}
              className="p-2 rounded-lg text-[#736F68] hover:text-[#001F3F] hover:bg-[#F3EDE2] dark:text-[#D1D5DB]/70 dark:hover:text-white dark:hover:bg-white/10 transition"
              title="Reset initial seed tenders and bids"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* User Persona Capsule & Auth trigger */}
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-[#E5DFD5] dark:border-white/10">
              {onOpenAuth && (
                <button
                  id="auth-switch-btn"
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#001F3F] bg-[#FAF6EE] hover:bg-[#F3EDE2] border border-[#D5CFC5] dark:bg-white/10 dark:text-white dark:border-white/15 dark:hover:bg-white/20 transition shadow-xs"
                  title="Switch or Register Account"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Account</span>
                </button>
              )}
              <div className="text-right">
                <p className="text-xs font-bold text-[#001F3F] dark:text-white leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-[#736F68] dark:text-[#D1D5DB] uppercase font-bold tracking-wider">
                  {currentUser.role === 'admin' ? 'Contractor Authority' : currentUser.role === 'vendor' ? 'Prime Bidder' : 'Evaluator Board'}
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#001F3F] text-[#FAF6EE] dark:bg-white dark:text-[#001F3F] flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs select-none">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#6C6963] hover:text-[#001F3F] hover:bg-[#F3EDE2] dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Current User Persona Banner / Sub-bar */}
        <div className="py-2 flex items-center justify-between border-t border-[#E5DFD5] dark:border-white/10 text-xs text-[#736F68] dark:text-[#D1D5DB]">
          <div className="flex items-center gap-2">
            <span>Entity:</span>
            <span className="font-semibold text-[#001F3F] dark:text-white">
              {currentUser.organization}
            </span>
            <span>•</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                currentUser.role === 'admin'
                  ? 'bg-blue-100 text-[#001F3F] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                  : currentUser.role === 'vendor'
                  ? 'bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {currentUser.role}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#736F68]">
            <span>TENDERVAULT PLATFORM</span>
            <span>•</span>
            <span>AES-256 SEALED LEDGER</span>
          </div>
        </div>

        {/* Mobile Dropdown Menu for Roles */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#E5DFD5] space-y-2 bg-[#FAF6EE] dark:bg-[#001833] -mx-4 px-4 rounded-b-xl">
            <p className="text-[10px] font-bold text-[#736F68] uppercase tracking-wider px-1">
              Switch Workspace Role
            </p>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((item) => {
                const Icon = item.icon;
                const isActive = currentUser.role === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => {
                      onSelectRole(item.role);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#001F3F] text-white font-bold'
                        : 'bg-white text-[#6C6963] border border-[#E5DFD5] hover:bg-[#F3EDE2]'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {onOpenAuth && (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Switch / Register User Account</span>
              </button>
            )}

            {currentUser.role === 'vendor' && onOpenCompanyProfile && (
              <button
                onClick={() => {
                  onOpenCompanyProfile();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg bg-white text-[#001F3F] border border-[#E5DFD5]"
              >
                <FileBadge className="w-4 h-4" />
                Configure Vendor Company Profile
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
