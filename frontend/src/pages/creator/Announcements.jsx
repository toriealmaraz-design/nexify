/**
 * Creator Announcements — Manage announcements for own courses.
 * Creators can view, create, edit, and delete their announcements.
 */

import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Plus, ChevronDown, ChevronUp, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SkeletonRow } from '../../components/Skeleton';
import axios from 'axios';

function getToken() {
  return localStorage.getItem('nexify_token');
}

export default function CreatorAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ courseId: '', title: '', body: '', priority: 0 });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const [announceRes, coursesRes] = await Promise.all([
        axios.get('/api/v1/announcements/admin/creator', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/v1/courses/stats/creator', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setAnnouncements(announceRes.data.data || []);
      setCourses(coursesRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!form.courseId || !form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      const token = getToken();
      const res = await axios.post('/api/v1/announcements', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(prev => [res.data.data, ...prev]);
      setForm({ courseId: '', title: '', body: '', priority: 0 });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create:', err.message);
    } finally {
      setSubmitting(false);
    }
  };

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

  const getPriorityLabel = (p) => {
    if (p >= 2) return { text: 'Urgent', color: 'bg-red-500/20 text-red-400' };
    if (p === 1) return { text: 'Important', color: 'bg-amber-500/20 text-amber-400' };
    return { text: 'Normal', color: 'bg-white/10 text-white/50' };
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#7C3AED]" />
            My Announcements
          </h1>
          <p className="text-white/40 text-sm mt-1">Post updates to your enrolled students.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7C3AED] hover:bg-[#8b5cf6] rounded-lg text-xs font-medium text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Announcement</h3>
          <select
            value={form.courseId}
            onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          >
            <option value="" className="bg-[#1E293B]">Select course...</option>
            {courses.map(c => (
              <option key={c.id} value={c.id} className="bg-[#1E293B]">{c.title}</option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Announcement title..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Write your announcement..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none"
          />
          <div className="flex items-center gap-3">
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) }))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              <option value={0} className="bg-[#1E293B]">Normal</option>
              <option value={1} className="bg-[#1E293B]">Important</option>
              <option value={2} className="bg-[#1E293B]">Urgent</option>
            </select>
            <button
              onClick={handleCreate}
              disabled={!form.courseId || !form.title.trim() || !form.body.trim() || submitting}
              className="flex-1 bg-[#7C3AED] hover:bg-[#8b5cf6] disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
            >
              {submitting ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <SkeletonRow />
      ) : announcements.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No announcements yet.</p>
          <p className="text-white/20 text-xs mt-1">Click "New" to post your first announcement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const prio = getPriorityLabel(a.priority);
            return (
              <div key={a.id} className="bg-[#1E293B] border border-white/10 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">{a.title}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${prio.color}`}>{prio.text}</span>
                    </div>
                    <p className="text-xs text-white/50 line-clamp-2 mb-2">{a.body}</p>
                    <div className="flex items-center gap-4 text-[10px] text-white/30">
                      <span>{a.course?.title || 'Course'}</span>
                      <span>Reads: {a._count?.reads || 0}</span>
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
