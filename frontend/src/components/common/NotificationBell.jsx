/**
 * Notification Bell — Nexify
 * Bell icon with badge + dropdown. Works for logged-in and logged-out users.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, ShoppingBag, DollarSign, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Mock notifications ──────────────────────────────────────
const LOGGED_IN_NOTIFICATIONS = [
  {
    id: 1,
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
    message: 'Your course "Intro to React" was approved',
    time: '2h ago',
  },
  {
    id: 2,
    icon: ShoppingBag,
    iconColor: 'text-[#7C3AED]',
    message: 'New order received: GHs 299.00',
    time: '5h ago',
  },
  {
    id: 3,
    icon: DollarSign,
    iconColor: 'text-emerald-400',
    message: 'Payout of GHs 1,200.00 processed',
    time: '1d ago',
  },
];

const LOGGED_OUT_NOTIFICATIONS = [
  {
    id: 1,
    icon: Bell,
    iconColor: 'text-[#7C3AED]',
    message: 'Sign in to see your personalized notifications',
    time: 'Just now',
  },
];

// ─── NotificationBell ────────────────────────────────────────
export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [readCount] = useState(3);
  const dropdownRef = useRef(null);

  const notifications = isAuthenticated ? LOGGED_IN_NOTIFICATIONS : LOGGED_OUT_NOTIFICATIONS;
  const showBadge = isAuthenticated && readCount > 0;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-white/70 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {/* Badge */}
        {showBadge && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {readCount > 9 ? '9+' : readCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#1E1B4B] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white font-semibold text-sm">Notifications</span>
            {isAuthenticated && (
              <button
                onClick={() => {}}
                className="flex items-center gap-1.5 text-xs text-[#7C3AED] hover:text-[#6D28D9] transition-colors font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-sm">No notifications</div>
            ) : (
              notifications.map(notif => {
                const Icon = notif.icon;
                return (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${notif.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm leading-snug">{notif.message}</p>
                      <p className="text-white/40 text-xs mt-0.5">{notif.time}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
