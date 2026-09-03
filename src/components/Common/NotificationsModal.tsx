import React from 'react';
import { X, Bell, CheckCheck, Clock, Award, FileText, Info } from 'lucide-react';
import { SystemNotification } from '../../types';
import { formatDateTime } from '../../utils/crypto';
import { markNotificationsRead } from '../../utils/storage';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
}) => {
  if (!isOpen) return null;

  const handleMarkRead = () => {
    markNotificationsRead();
  };

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'deadline':
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'award':
        return <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'bid_received':
        return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        id="system-notifications-modal"
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-[#FAF6EE] dark:bg-[#001730] rounded-3xl shadow-2xl border border-[#E5DFD5] dark:border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#001F3F] flex items-center justify-between bg-[#001F3F] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Notifications & Broadcasts
              </h2>
              <p className="text-xs text-white/80">
                Real-time alerts, deadline warnings and tender status updates
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

        {/* Action bar */}
        <div className="px-6 py-3 bg-[#F3EDE2] dark:bg-[#001F3F]/60 border-b border-[#E5DFD5] dark:border-white/10 flex items-center justify-between text-xs">
          <span className="text-[#6B7280] dark:text-[#9CA3AF]">
            <strong>{notifications.length}</strong> Total Alerts
          </span>
          <button
            onClick={handleMarkRead}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#001F3F] dark:text-white hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              No notifications at this time.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all shadow-xs ${
                  !notif.read
                    ? 'bg-blue-50/50 border-[#001F3F]/30 dark:bg-[#001F3F]/80 dark:border-white/20'
                    : 'bg-white border-[#E5DFD5] dark:bg-[#001F3F]/40 dark:border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/10 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs sm:text-sm font-bold text-[#001F3F] dark:text-white truncate">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#4B5563] dark:text-[#E5DFD5] leading-relaxed mb-2">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-mono">
                      {formatDateTime(notif.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F3EDE2] dark:bg-[#001F3F]/60 border-t border-[#E5DFD5] dark:border-white/10 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 font-bold uppercase tracking-wider text-xs rounded-xl bg-[#001F3F] text-white hover:bg-[#002f5e] dark:bg-white dark:text-[#001F3F] transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
