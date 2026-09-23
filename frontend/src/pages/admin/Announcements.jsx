/**
 * Admin Announcements — Manage all platform announcements.
 * Admins can view, activate/deactivate, and delete any announcement.
 */

import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Eye, EyeOff, Search, ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SkeletonRow } from '../../components/Skeleton';
import axios from 'axios';

function getToken() {
  return localStorage.getItem('nexify_token');
}

export default function AdminAnnouncements() {
  const { logout } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | inactive

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = { page, limit: 15 };
      if (filter === 'active') params.active = 'true';
      if (filter === 'inactive') params.active = 'false';
      const res = await axios.get('/api/v1/announcements/admin/all', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setAnnouncements(res.data.data || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch announcements:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      const token = getToken();
      await axios.delete(`/api/v1/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err.message);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      const token = getToken();
      await axios.put(`/api/v1/announcements/${id}`, { active: !currentActive }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active: !currentActive } : a));
    } catch (err) {
      console.error('Failed to toggle:', err.message);
    }
  };

  const filtered = announcements.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.course?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityLabel = (p) => {
    if (p >= 2) return { text: 'Urgent', color: 'bg-red-500/20 text-red-400' };
    if (p === 1) return { text: 'Important', color: 'bg-amber-500/20 text-amber-400' };
    return { text: 'Normal', color: 'bg-white/10 text-white/50' };
  };

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#7C3AED]" />
            Announcements
          </h1>
          <p className="text-white/40 text-sm mt-1">Manage all platform announcements.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search announcements..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
        </div>
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {['all', 'active', 'inactive'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? 'bg-[#7C3AED] text-white' : 'text-white/50 hover:text-white'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <SkeletonRow />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No announcements found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const prio = getPriorityLabel(a.priority);
            return (
              <div key={a.id} className={`bg-[#1E293B] border rounded-xl p-4 transition-colors ${a.active ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white truncate">{a.title}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${prio.color}`}>{prio.text}</span>
                      {!a.active && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/5 text-white/30">Inactive</span>}
                    </div>
                    <p className="text-xs text-white/50 line-clamp-2 mb-2">{a.body}</p>
                    <div className="flex items-center gap-4 text-[10px] text-white/30">
                      <span>Course: {a.course?.title || 'Unknown'}</span>
                      <span>By: {a.user?.fullName || 'Unknown'}</span>
                      <span>Reads: {a._count?.reads || 0}</span>
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(a.id, a.active)}
                      className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                      title={a.active ? 'Deactivate' : 'Activate'}
                    >
                      {a.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-white/50">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
