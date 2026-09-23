/**
 * Student Announcements — Feed of all announcements from enrolled courses.
 * Shows unread indicators, mark-as-read, and mark-all-read.
 */

import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SkeletonRow } from '../../components/Skeleton';
import axios from 'axios';

export default function StudentAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nexify_token');
      const res = await axios.get('/api/v1/announcements/student/feed', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch feed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem('nexify_token');
      await axios.post(`/api/v1/announcements/${id}/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('nexify_token');
      await axios.post('/api/v1/announcements/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err.message);
    }
  };

  const getPriorityStyles = (p) => {
    if (p >= 2) return { border: 'border-red-500/30', badge: 'bg-red-500/20 text-red-400', label: 'Urgent' };
    if (p === 1) return { border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-400', label: 'Important' };
    return { border: 'border-white/10', badge: 'bg-white/10 text-white/50', label: 'Normal' };
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#7C3AED]" />
            Announcements
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Updates from your enrolled courses.
            {unreadCount > 0 && <span className="text-[#7C3AED] ml-1">({unreadCount} unread)</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Feed */}
      {loading ? (
        <SkeletonRow />
      ) : announcements.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No announcements yet.</p>
          <p className="text-white/20 text-xs mt-1">Enroll in courses to see updates here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const styles = getPriorityStyles(a.priority);
            return (
              <div key={a.id} className={`bg-[#1E293B] border rounded-xl p-4 transition-all ${styles.border} ${!a.isRead ? 'ring-1 ring-[#7C3AED]/30' : ''}`}>
                <div className="flex items-start gap-3">
                  {!a.isRead && (
                    <div className="w-2 h-2 rounded-full bg-[#7C3AED] flex-shrink-0 mt-2" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">{a.title}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${styles.badge}`}>{styles.label}</span>
                    </div>
                    <p className="text-xs text-white/60 mb-2">{a.body}</p>
                    <div className="flex items-center gap-3 text-[10px] text-white/30">
                      <span>{a.course?.title || 'Course'}</span>
                      <span>·</span>
                      <span>{a.user?.fullName || 'Creator'}</span>
                      <span>·</span>
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {!a.isRead && (
                    <button
                      onClick={() => handleMarkRead(a.id)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-[#7C3AED] transition-colors flex-shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
