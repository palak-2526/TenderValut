import React from 'react';
import {
  Tender,
  Bid,
  User,
  Role,
  AuditLog,
  SystemNotification,
} from './types';
import { DEMO_USERS } from './data/mockData';
import {
  getStoredTenders,
  getStoredBids,
  getStoredAuditLogs,
  getStoredNotifications,
  getStoredCurrentUser,
  setStoredCurrentUser,
  getOfflineQueue,
  syncOfflineQueue,
  resetDemoData,
  getStoredTheme,
  setStoredTheme,
} from './utils/storage';
import { Header } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { VendorDashboard } from './components/Vendor/VendorDashboard';
import { DeadlineAlertsDrawer } from './components/Common/DeadlineAlertsDrawer';
import { AuditLogModal } from './components/Common/AuditLogModal';
import { NotificationsModal } from './components/Common/NotificationsModal';
import { CompanyProfileModal } from './components/Common/CompanyProfileModal';
import { TenderVaultLanding } from './components/Landing/TenderVaultLanding';
import { AuthPage } from './components/Auth/AuthPage';
import { Building2, Shield, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = React.useState<'landing' | 'platform' | 'auth'>('landing');
  const [authRole, setAuthRole] = React.useState<Role>('admin');
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');

  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    return getStoredTheme();
  });

  const [isOnline, setIsOnline] = React.useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = React.useState<boolean>(false);
  const [offlineQueueCount, setOfflineQueueCount] = React.useState<number>(0);
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);

  const [currentUser, setCurrentUser] = React.useState<User>(() => {
    return getStoredCurrentUser() || DEMO_USERS[0];
  });
  const [tenders, setTenders] = React.useState<Tender[]>(() => getStoredTenders());
  const [bids, setBids] = React.useState<Bid[]>(() => getStoredBids());
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>(() => getStoredAuditLogs());
  const [notifications, setNotifications] = React.useState<SystemNotification[]>(() =>
    getStoredNotifications()
  );

  const [alertsOpen, setAlertsOpen] = React.useState(false);
  const [auditLogsOpen, setAuditLogsOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [companyProfileOpen, setCompanyProfileOpen] = React.useState(false);

  React.useEffect(() => {
    setStoredTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setOfflineQueueCount(getOfflineQueue().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshAllData = React.useCallback(() => {
    setTenders(getStoredTenders());
    setBids(getStoredBids());
    setAuditLogs(getStoredAuditLogs());
    setNotifications(getStoredNotifications());
    setOfflineQueueCount(getOfflineQueue().length);
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const result = await syncOfflineQueue();
      if (result.count > 0) {
        refreshAllData();
      }
    } catch (err) {
      console.error('Failed to sync offline queue:', err);
    } finally {
      setIsSyncing(false);
      setOfflineQueueCount(getOfflineQueue().length);
    }
  };

  const handleSelectRole = (role: Role) => {
    const targetRole = role === ('evaluator' as any) ? 'admin' : role;
    const foundUser = DEMO_USERS.find((u) => u.role === targetRole) || {
      id: `usr-${targetRole}-custom`,
      name: targetRole === 'admin' ? 'Procurement Director' : 'Prime Contractor Lead',
      email: `${targetRole}@procure.gov`,
      role: targetRole,
      organization: targetRole === 'admin' ? 'National Procurement Board' : 'Infrastructure Group Ltd',
    };
    setCurrentUser(foundUser);
    setStoredCurrentUser(foundUser);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo tenders, bids, and audit ledger entries to initial seeds?')) {
      resetDemoData();
      refreshAllData();
    }
  };

  const handleLaunchPlatform = (initialRole?: Role) => {
    if (initialRole) {
      const foundUser = DEMO_USERS.find((u) => u.role === initialRole) || DEMO_USERS[0];
      setCurrentUser(foundUser);
      setStoredCurrentUser(foundUser);
    }
    setViewMode('platform');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (role?: Role, mode?: 'signin' | 'signup') => {
    if (role) setAuthRole(role);
    if (mode) setAuthMode(mode);
    setViewMode('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setCurrentUser(authenticatedUser);
    setStoredCurrentUser(authenticatedUser);
    refreshAllData();
    setViewMode('platform');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  if (viewMode === 'auth') {
    return (
      <AuthPage
        initialRole={authRole}
        initialMode={authMode}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onSuccess={handleAuthSuccess}
        onBackToLanding={() => setViewMode('landing')}
      />
    );
  }

  if (viewMode === 'landing') {
    return (
      <TenderVaultLanding
        onLaunchPlatform={handleLaunchPlatform}
        onOpenAuth={handleOpenAuth}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#001F3F] dark:bg-[#001730] dark:text-[#FAF6EE] flex flex-col font-sans transition-colors">
      {/* Offline Status Bar */}
      <OfflineBanner
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        offlineQueueCount={offlineQueueCount}
        onSyncNow={handleSyncNow}
        isSyncing={isSyncing}
        onToggleSimulatedOffline={() => setIsSimulatedOffline(!isSimulatedOffline)}
      />

      {/* Main Top Header Navigation */}
      <Header
        currentUser={currentUser}
        onSelectRole={handleSelectRole}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        unreadNotifsCount={unreadNotifsCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenAlerts={() => setAlertsOpen(true)}
        onOpenAuditLogs={() => setAuditLogsOpen(true)}
        onOpenCompanyProfile={() => setCompanyProfileOpen(true)}
        onResetData={handleResetData}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={() => setIsSimulatedOffline(!isSimulatedOffline)}
        onBackToLanding={() => setViewMode('landing')}
        onOpenAuth={() => handleOpenAuth(currentUser.role, 'signin')}
      />

      {/* Main Role-Specific Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentUser.role === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            tenders={tenders}
            bids={bids}
            onRefresh={refreshAllData}
          />
        )}

        {currentUser.role === 'vendor' && (
          <VendorDashboard
            currentUser={currentUser}
            tenders={tenders}
            bids={bids}
            isOnline={isOnline}
            isSimulatedOffline={isSimulatedOffline}
            onRefresh={refreshAllData}
          />
        )}
      </main>

      {/* Footer matching Professional Polish Design */}
      <footer className="bg-[#F3EDE2] border-t border-[#E5DFD5] dark:bg-[#001730] dark:border-white/10 px-4 sm:px-8 py-3.5 text-[10px] text-[#001F3F]/75 dark:text-[#9CA3AF] font-medium transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-mono tracking-wider text-[#001F3F] dark:text-white">VERSION 2.4.0-STABLE</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              OPERATIONAL
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#001F3F] dark:text-white font-semibold">
              <Building2 className="w-3 h-3" />
              tenderVault Enterprise Suite
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 font-mono uppercase tracking-wider text-[#001F3F] dark:text-white">
              <Shield className="w-3 h-3 text-[#001F3F] dark:text-blue-400" />
              SECURITY: AES-256 ENCRYPTED
            </span>
            <span className="text-[#001F3F] dark:text-white font-bold tracking-tight">
              © 2026 TENDERVAULT SYSTEMS
            </span>
          </div>
        </div>
      </footer>

      {/* Global Modals & Drawers */}
      <DeadlineAlertsDrawer
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        tenders={tenders}
        vendorProfile={currentUser.companyProfile}
        onSelectTender={() => {
          setAlertsOpen(false);
        }}
      />

      <AuditLogModal
        isOpen={auditLogsOpen}
        onClose={() => setAuditLogsOpen(false)}
        logs={auditLogs}
      />

      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => {
          setNotificationsOpen(false);
          refreshAllData();
        }}
        notifications={notifications}
      />

      <CompanyProfileModal
        isOpen={companyProfileOpen}
        onClose={() => setCompanyProfileOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          refreshAllData();
        }}
      />
    </div>
  );
}
