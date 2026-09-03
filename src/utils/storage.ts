import { Tender, Bid, AuditLog, SystemNotification, User, Role } from '../types';
import { INITIAL_TENDERS, INITIAL_BIDS, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS, DEMO_USERS } from '../data/mockData';

const STORAGE_KEYS = {
  TENDERS: 'tms_tenders_v1',
  BIDS: 'tms_bids_v1',
  AUDIT_LOGS: 'tms_audit_logs_v1',
  NOTIFICATIONS: 'tms_notifications_v1',
  CURRENT_USER: 'tms_current_user_v1',
  THEME: 'tms_theme_v1',
  OFFLINE_QUEUE: 'tms_offline_queue_v1',
  ACCOUNTS: 'tms_accounts_v1',
};

export interface StoredAccount {
  user: User;
  passwordHash?: string;
  createdAt: string;
}

export interface OfflineAction {
  id: string;
  type: 'SUBMIT_BID' | 'CREATE_TENDER' | 'EVALUATE_BID' | 'AWARD_TENDER';
  payload: any;
  timestamp: string;
  description: string;
}

function dispatchUpdateEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tms_state_updated'));
  }
}

export function getStoredTenders(): Tender[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TENDERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(INITIAL_TENDERS));
      return INITIAL_TENDERS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_TENDERS;
  }
}

export function saveStoredTender(tender: Tender, isOffline = false): void {
  const tenders = getStoredTenders();
  const existingIdx = tenders.findIndex((t) => t.id === tender.id);
  if (existingIdx >= 0) {
    tenders[existingIdx] = tender;
  } else {
    tenders.unshift(tender);
  }
  localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(tenders));

  if (isOffline) {
    queueOfflineAction({
      id: 'off-' + Date.now(),
      type: 'CREATE_TENDER',
      payload: tender,
      timestamp: new Date().toISOString(),
      description: `Created tender: ${tender.referenceNo} - ${tender.title}`,
    });
  }

  dispatchUpdateEvent();
}

export function deleteStoredTender(id: string): void {
  const tenders = getStoredTenders().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(tenders));
  dispatchUpdateEvent();
}

export function getStoredBids(): Bid[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BIDS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(INITIAL_BIDS));
      return INITIAL_BIDS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_BIDS;
  }
}

export function saveStoredBid(bid: Bid, isOffline = false): void {
  const bids = getStoredBids();
  const existingIdx = bids.findIndex((b) => b.id === bid.id);
  if (existingIdx >= 0) {
    bids[existingIdx] = bid;
  } else {
    bids.unshift(bid);
  }
  localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(bids));

  if (isOffline) {
    queueOfflineAction({
      id: 'off-' + Date.now(),
      type: 'SUBMIT_BID',
      payload: bid,
      timestamp: new Date().toISOString(),
      description: `Submitted sealed bid for tender ${bid.tenderId} (₹${bid.bidAmount.toLocaleString('en-IN')})`,
    });
  }

  dispatchUpdateEvent();
}

export function getStoredAuditLogs(): AuditLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function addStoredAuditLog(
  actorName: string,
  actorRole: Role,
  action: string,
  targetType: AuditLog['targetType'],
  targetId: string,
  details: string
): void {
  const logs = getStoredAuditLogs();
  const newLog: AuditLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    actorName,
    actorRole,
    action,
    targetType,
    targetId,
    details,
    cryptoSignature: 'SIG-VERIFIED-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
  };
  logs.unshift(newLog);
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));
  dispatchUpdateEvent();
}

export function getStoredNotifications(): SystemNotification[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function addStoredNotification(notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>): void {
  const notifs = getStoredNotifications();
  const newNotif: SystemNotification = {
    ...notif,
    id: 'notif-' + Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifs.unshift(newNotif);
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  dispatchUpdateEvent();
}

export function markNotificationsRead(): void {
  const notifs = getStoredNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  dispatchUpdateEvent();
}

export function getStoredCurrentUser(): User {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0])); // Sarah Jenkins Admin
      return DEMO_USERS[0];
    }
    return JSON.parse(data);
  } catch {
    return DEMO_USERS[0];
  }
}

export function setStoredCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  dispatchUpdateEvent();
}

export function getStoredAccounts(): StoredAccount[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!data) {
      const initialAccounts: StoredAccount[] = DEMO_USERS.map((u) => ({
        user: u,
        passwordHash: `${u.role}123`,
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(initialAccounts));
      return initialAccounts;
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveStoredAccount(account: StoredAccount): void {
  const accounts = getStoredAccounts();
  const existingIdx = accounts.findIndex((a) => a.user.id === account.user.id || a.user.email.toLowerCase() === account.user.email.toLowerCase());
  if (existingIdx >= 0) {
    accounts[existingIdx] = account;
  } else {
    accounts.push(account);
  }
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

export function authenticateUser(email: string, password?: string, role?: Role): { success: boolean; user?: User; error?: string } {
  const accounts = getStoredAccounts();
  const cleanEmail = email.trim().toLowerCase();

  const found = accounts.find((a) => {
    const matchesEmail = a.user.email.toLowerCase() === cleanEmail;
    const matchesRole = role ? a.user.role === role : true;
    return matchesEmail && matchesRole;
  });

  if (!found) {
    const demoFallback = DEMO_USERS.find((u) => (!role || u.role === role) && (u.email.toLowerCase() === cleanEmail || cleanEmail.includes(u.role)));
    if (demoFallback) {
      setStoredCurrentUser(demoFallback);
      return { success: true, user: demoFallback };
    }
    return { success: false, error: 'No account registered with this email address and role.' };
  }

  if (password && found.passwordHash && found.passwordHash !== password) {
    if (password !== `${found.user.role}123` && password !== 'demo123') {
      return { success: false, error: 'Incorrect security password. (Demo password: ' + (found.user.role + '123') + ')' };
    }
  }

  setStoredCurrentUser(found.user);
  return { success: true, user: found.user };
}

export function registerUser(newUser: User, password?: string): { success: boolean; user?: User; error?: string } {
  const accounts = getStoredAccounts();
  const cleanEmail = newUser.email.trim().toLowerCase();

  const existing = accounts.find((a) => a.user.email.toLowerCase() === cleanEmail && a.user.role === newUser.role);
  if (existing) {
    return { success: false, error: 'An account with this email already exists for this role. Please sign in instead.' };
  }

  const account: StoredAccount = {
    user: newUser,
    passwordHash: password || `${newUser.role}123`,
    createdAt: new Date().toISOString(),
  };

  saveStoredAccount(account);
  setStoredCurrentUser(newUser);

  addStoredAuditLog(
    newUser.name,
    newUser.role,
    'Account Registered',
    'system',
    newUser.id,
    `New ${newUser.role.toUpperCase()} account created for ${newUser.organization || 'Individual'}`
  );

  addStoredNotification({
    title: `Account Registered: ${newUser.role.toUpperCase()}`,
    message: `Welcome ${newUser.name}. Your ${newUser.role} portal profile has been registered and verified.`,
    type: 'system',
  });

  return { success: true, user: newUser };
}

export function getStoredTheme(): 'light' | 'dark' {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    return theme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setStoredTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  dispatchUpdateEvent();
}

export function getOfflineQueue(): OfflineAction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function queueOfflineAction(action: OfflineAction): void {
  const queue = getOfflineQueue();
  queue.push(action);
  localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  dispatchUpdateEvent();
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  dispatchUpdateEvent();
}

export function syncOfflineQueue(): { count: number; items: OfflineAction[] } {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { count: 0, items: [] };

  queue.forEach((action) => {
    addStoredAuditLog(
      'Offline Sync Manager',
      'system' as any,
      'Offline Data Synchronized',
      'system',
      action.id,
      `Replayed offline action: ${action.description}`
    );
  });

  const bids = getStoredBids();
  let bidsUpdated = false;
  bids.forEach((b) => {
    if (b.offlineQueued) {
      delete b.offlineQueued;
      bidsUpdated = true;
    }
  });
  if (bidsUpdated) {
    localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(bids));
  }

  addStoredNotification({
    title: 'Offline Data Successfully Synchronized',
    message: `${queue.length} offline operation(s) verified and committed to the electronic ledger.`,
    type: 'system',
  });

  clearOfflineQueue();
  return { count: queue.length, items: queue };
}

export function resetDemoData(): void {
  localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(INITIAL_TENDERS));
  localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(INITIAL_BIDS));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0]));
  clearOfflineQueue();
  dispatchUpdateEvent();
}
