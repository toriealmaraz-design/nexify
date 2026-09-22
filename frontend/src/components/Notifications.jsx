/**
 * Notifications — Bell dropdown component for all layouts.
 * Render inside each authenticated layout's header via `isHeader` prop.
 *
 * Usage:
 *   <Notifications />         — inline relative dropdown
 *   <Notifications isHeader /> — fixed top-right, inside portal header
 *
 * GET  /api/v1/notifications
 * PUT  /api/v1/notifications/:id/read
 * PUT  /api/v1/notifications/read-all
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, CheckCheck, Package, Award, XCircle, DollarSign,
  ShoppingBag, Star, Loader2, ChevronRight, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TYPE_CONFIG = {
  ORDER_COMPLETE: {
    Icon: Package,
    color: 'text-emerald-400 bg-emerald-500/20',
    label: 'Order Complete',
  },
  COURSE_APPROVED: {
    Icon: Award,
    color: 'text-amber-400 bg-amber-500/20',
    label: 'Course Approved',
  },
  COURSE_REJECTED: {
    Icon: XCircle,
    color: 'text-red-400 bg-red-500/20',
    label: 'Course Rejected',
  },
  PAYOUT_PROCESSED: {
    Icon: DollarSign,
    color: 'text-emerald-400 bg-emerald-500/20',
    label: 'Payout Processed',
  },
  AFFILIATE_SALE: {
    Icon: ShoppingBag,
    color: 'text-purple-400 bg-purple-500/20',
    label: 'Affiliate Sale',
  },
  NEW_REVIEW: {
    Icon: Star,
    color: 'text-amber-400 bg-amber-500/20',
    label: 'New Review',
  },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationItem({ notification, onMarkRead }) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.ORDER_COMPLETE;
  const { Icon } = config;

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-[#7C3AED]/5 border-l-2 border-[#7C3AED]' : 'border-l-2 border-transparent'
      }`}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold truncate ${notification.isRead ? 'text-white/50' : 'text-white'}`}>
            {notification.title || config.label}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 bg-[#7C3AED] rounded-full flex-shrink-0 mt-1" />
          )}
        </div>
        {notification.message && (
          <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{notification.message}</p>
        )}
        <p className="text-[10px] text-white/30 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>

      {/* Arrow */}
      {notification.linkUrl && (
        <Link
          to={notification.linkUrl}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 text-white/20 hover:text-white/60 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <Bell className="w-10 h-10 text-white/20 mb-3" />
      <p className="text-sm text-white/50 font-medium">No notifications yet</p>
      <p className="text-xs text-white/30 mt-1">We'll notify you when something important happens</p>
    </div>
  );
}

export default function Notifications({ isHeader = false }) {
  const { api, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [token, api]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  // Fixed header positioning — dropdown opens at top-right
  const dropdownContent = open && (
    <div className={isHeader ? 'fixed top-16 right-4 w-80' : 'absolute right-0 top-full mt-2 w-80'}>
      <div className="bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-medium">{unreadCount} new</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] text-[#7C3AED] hover:text-[#9D5EF0] transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            <button onClick={() => setOpen(false)} className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-white/20 animate-spin" /></div>
          ) : notifications.length === 0 ? (
            <EmptyNotifications />
          ) : (
            notifications.map(n => <NotificationItem key={n.id} notification={n} onMarkRead={markOneRead} />)
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-2 border-t border-white/5">
            <button onClick={() => setOpen(false)} className="w-full text-center text-[11px] text-white/30 hover:text-white/60 transition-colors py-1.5 rounded-lg hover:bg-white/5">Close</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {dropdownContent}
    </div>
  );
}
