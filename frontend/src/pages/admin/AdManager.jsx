/**
 * AdManager — Admin page for managing advertisements
 * Route: /admin/ads
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../../components/Skeleton';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Megaphone,
  BarChart2,
  MousePointer,
  Eye,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';

const PLACEMENTS = [
  { value: 'LANDING_HERO', label: 'Landing — Hero' },
  { value: 'SIDEBAR', label: 'Sidebar' },
  { value: 'COURSE_CARD', label: 'Course Card' },
  { value: 'BANNER', label: 'Banner' },
  { value: 'FOOTER', label: 'Footer' },
];

const DEFAULT_FORM = {
  title: '',
  body: '',
  imageUrl: '',
  linkUrl: '',
  ctaText: '',
  placement: 'LANDING_HERO',
  targetRoles: '',
  priority: 1,
  active: true,
  startDate: '',
  endDate: '',
};

function AdModal({ form, setForm, saving, error, onSave, onClose, isEditing }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1E293B] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? 'Edit Ad' : 'Create New Ad'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="Ad headline"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Body</label>
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={3}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent resize-none"
                placeholder="Short ad copy (optional)"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Image URL</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Link URL</label>
              <input
                type="url"
                value={form.linkUrl}
                onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">CTA Button Text</label>
              <input
                type="text"
                value={form.ctaText}
                onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="Enroll Now"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Placement</label>
              <select
                value={form.placement}
                onChange={e => setForm(f => ({ ...f, placement: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              >
                {PLACEMENTS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Priority</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 1 }))}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Target Roles</label>
              <input
                type="text"
                value={form.targetRoles}
                onChange={e => setForm(f => ({ ...f, targetRoles: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="STUDENT,CREATOR (comma-sep)"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              />
            </div>

            <div className="col-span-2 flex items-center justify-between">
              <label className="text-xs text-white/50 font-medium uppercase tracking-wider">Active</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  form.active ? 'text-emerald-400' : 'text-white/30'
                }`}
              >
                {form.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {form.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-[#7C3AED] text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#6D28D9] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Ad'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdManager() {
  const { api } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/advertisements?limit=100');
      setAds(res.data.data || []);
    } catch {
      setError('Failed to load ads.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (ad) => {
    setForm({
      title: ad.title || '',
      body: ad.body || '',
      imageUrl: ad.imageUrl || '',
      linkUrl: ad.linkUrl || '',
      ctaText: ad.ctaText || '',
      placement: ad.placement || 'LANDING_HERO',
      targetRoles: ad.targetRoles || '',
      priority: ad.priority ?? 1,
      active: ad.active ?? true,
      startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
      endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
    });
    setEditingId(ad.id);
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form };
      if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString();
      if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString();
      if (editingId) {
        await api.put(`/advertisements/${editingId}`, payload);
      } else {
        await api.post('/advertisements', payload);
      }
      closeModal();
      fetchAds();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ad?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/advertisements/${id}`);
      setAds(prev => prev.filter(a => a.id !== id));
    } catch {
      setError('Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      await api.put(`/advertisements/${ad.id}`, { ...ad, active: !ad.active });
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, active: !a.active } : a));
    } catch {
      setError('Status update failed.');
    }
  };

  const seedAds = async () => {
    const seeds = [
      {
        title: 'Master High-Ticket Sales in Ghana',
        body: 'Join the definitive 6-week program. Limited seats available for Accra cohort.',
        imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80',
        linkUrl: 'https://nexify.io/courses/high-ticket-sales',
        ctaText: 'Enroll Now',
        placement: 'LANDING_HERO',
        targetRoles: '',
        priority: 10,
        active: true,
        startDate: '',
        endDate: '',
      },
      {
        title: 'Start Your Online Business Today',
        body: 'Learn how to build and scale a profitable digital business from scratch.',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
        linkUrl: 'https://nexify.io/courses/digital-business',
        ctaText: 'Get Started',
        placement: 'COURSE_CARD',
        targetRoles: '',
        priority: 5,
        active: true,
        startDate: '',
        endDate: '',
      },
      {
        title: 'Physical Coding Lab — Kumasi',
        body: 'Intensive 3-day in-person workshop. Laptops provided. Meals included.',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
        linkUrl: 'https://nexify.io/labs/kumasi',
        ctaText: 'Book Seat',
        placement: 'SIDEBAR',
        targetRoles: '',
        priority: 3,
        active: true,
        startDate: '',
        endDate: '',
      },
    ];

    setSaving(true);
    try {
      await api.post('/advertisements/seed', { ads: seeds });
      fetchAds();
    } catch {
      setError('Seeding failed.');
    } finally {
      setSaving(false);
    }
  };

  const placementLabel = (v) => PLACEMENTS.find(p => p.value === v)?.label || v;

  return (
    <div data-tour="admin-ad-manager-list" className="max-w-5xl">
      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Advertisements</h1>
          <p className="text-white/40 text-sm mt-1">Manage promotional banners and ad placements</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={seedAds}
            disabled={saving}
            className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/70 text-sm px-4 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Seed Sample Ads
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#7C3AED] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#6D28D9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Ad
          </button>
        </div>
      </div>

      {/* ─── Error banner ─── */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ─── Stats row ─── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Ads', value: ads.length, icon: Megaphone },
          { label: 'Active', value: ads.filter(a => a.active).length, icon: Eye },
          { label: 'Total Impressions', value: ads.reduce((s, a) => s + (a.impressions || 0), 0), icon: BarChart2 },
          { label: 'Total Clicks', value: ads.reduce((s, a) => s + (a.clicks || 0), 0), icon: MousePointer },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* ─── Ad Table ─── */}
      <div className="bg-[#1E293B] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} height="56px" />)}
          </div>
        ) : ads.length === 0 ? (
          <div className="p-12 text-center text-white/30 text-sm">
            No ads yet. Create one or seed sample ads.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                {['Title', 'Placement', 'Status', 'Impressions', 'Clicks', 'Priority', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ads.map(ad => (
                <tr key={ad.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {ad.imageUrl ? (
                        <img src={ad.imageUrl} alt="" className="w-12 h-8 object-cover rounded-lg bg-white/5 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-8 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Megaphone className="w-3 h-3 text-white/20" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{ad.title}</p>
                        <p className="text-white/30 text-xs truncate max-w-xs">{ad.body}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-block bg-[#7C3AED]/20 text-[#7C3AED] text-xs font-medium px-2.5 py-1 rounded-full border border-[#7C3AED]/30">
                      {placementLabel(ad.placement)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleActive(ad)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                        ad.active ? 'text-emerald-400' : 'text-white/30'
                      }`}
                    >
                      {ad.active
                        ? <ToggleRight className="w-4 h-4" />
                        : <ToggleLeft className="w-4 h-4" />}
                      {ad.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-white/60">{(ad.impressions || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 text-white/60">{(ad.clicks || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 text-white/60">{ad.priority ?? 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(ad)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        disabled={deletingId === ad.id}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Create / Edit Modal ─── */}
      {showModal && (
        <AdModal
          form={form}
          setForm={setForm}
          saving={saving}
          error={error}
          onSave={handleSave}
          onClose={closeModal}
          isEditing={!!editingId}
        />
      )}
    </div>
  );
}
