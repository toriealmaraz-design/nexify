/**
 * LinkGenerator — Affiliate Link Management
 * Generate tracking links, view created links, copy to clipboard.
 *
 * Design: Nexify dark theme — bg-[#0F172A], cards bg-[#1E1B4B] border-white/10, accent #7C3AED
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MousePointer, ShoppingCart, TrendingUp, Copy, Link2, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SkeletonStats, SkeletonRow } from '../../components/Skeleton';

const API_BASE = '/api/v1';

function authHeaders() {
  const token = localStorage.getItem('nexify_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handle401() {
  localStorage.removeItem('nexify_token');
  window.location.href = '/login';
}

// ─── Mini Stat Card ───────────────────────────────────────────
function MiniStatCard({ label, value, icon: Icon, accent = false }) {
  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-white/60">
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xl font-bold ${accent ? 'text-[#7C3AED]' : 'text-white'}`}>{value}</p>
    </div>
  );
}

// ─── Copy Button ──────────────────────────────────────────────
function CopyButton({ text, successMsg = 'Copied!' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="text-white/40 hover:text-[#7C3AED] transition-colors p-1 rounded"
    >
      {copied ? (
        <span className="text-xs text-emerald-400">{successMsg}</span>
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function LinkGenerator() {
  const { user } = useAuth();

  // Dashboard stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Course dropdown
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [generating, setGenerating] = useState(false);

  // Result
  const [generatedLink, setGeneratedLink] = useState(null);

  // Links table
  const [links, setLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(true);

  // Prefill slug with user first name
  useEffect(() => {
    if (user?.firstName) {
      setCustomSlug(user.firstName.toLowerCase().replace(/\s+/g, '-'));
    }
  }, [user]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/affiliates/dashboard`, { headers: authHeaders() });
      if (res.status === 401) { handle401(); return; }
      const json = await res.json();
      setStats(json.data);
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch published courses
  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/courses?status=published`, { headers: authHeaders() });
      if (res.status === 401) { handle401(); return; }
      const json = await res.json();
      setCourses(json.data || []);
    } catch {
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  // Fetch affiliate links
  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/affiliates/links`, { headers: authHeaders() });
      if (res.status === 401) { handle401(); return; }
      const json = await res.json();
      setLinks(json.data || []);
    } catch {
      setLinks([]);
    } finally {
      setLinksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCourses();
    fetchLinks();
  }, [fetchStats, fetchCourses, fetchLinks]);

  // Generate link
  const handleGenerate = async () => {
    if (!selectedCourseId) return;
    setGenerating(true);
    setGeneratedLink(null);
    try {
      const res = await fetch(`${API_BASE}/affiliates/links`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourseId, slug: customSlug || undefined }),
      });
      if (res.status === 401) { handle401(); return; }
      if (!res.ok) throw new Error('Failed to generate link');
      const json = await res.json();
      setGeneratedLink(json.data);
      // Refresh links table
      fetchLinks();
      // Reset form
      setSelectedCourseId('');
      setCustomSlug(user?.firstName ? user.firstName.toLowerCase().replace(/\s+/g, '-') : '');
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const conversionRate = stats
    ? stats.totalClicks > 0
      ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(1)
      : '0.0'
    : null;

  const sortedLinks = [...links].sort(
    (a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
  );

  return (
    <div data-tour="affiliate-link-generator" className="max-w-4xl">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Link Generator</h1>
          <p className="text-white/40 text-sm mt-1">Create tracking links for any course and start promoting.</p>
        </div>
        <Link2 className="w-5 h-5 text-[#7C3AED]" />
      </div>

      {/* ── Section 1: Stats row ── */}
      <section className="mb-6">
        {!stats && statsLoading ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <MiniStatCard
              label="Total Clicks"
              value={stats?.totalClicks?.toLocaleString() ?? '0'}
              icon={MousePointer}
            />
            <MiniStatCard
              label="Conversions"
              value={stats?.totalConversions?.toString() ?? '0'}
              icon={ShoppingCart}
            />
            <MiniStatCard
              label="Conversion Rate"
              value={`${conversionRate}%`}
              icon={TrendingUp}
              accent
            />
          </div>
        )}
      </section>

      {/* ── Section 2: Link Generator Form ── */}
      <section className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#7C3AED]" />
          Create New Link
        </h2>

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          {/* Course dropdown */}
          <div className="flex-1">
            {coursesLoading ? (
              <div className="h-[42px] bg-white/10 border border-white/10 rounded-xl animate-pulse" />
            ) : (
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#1E1B4B]">Select a course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id} className="bg-[#1E1B4B]">
                    {course.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Custom slug input */}
          <input
            type="text"
            value={customSlug}
            onChange={e => setCustomSlug(e.target.value)}
            placeholder="Custom slug (optional)"
            className="md:w-56 px-4 py-2.5 bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
          />

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedCourseId}
            className="bg-[#7C3AED] text-black px-5 py-2.5 rounded-xl font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {generating ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Generate
          </button>
        </div>

        {/* Generated link result */}
        {generatedLink && (
          <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-xl p-4 mt-4">
            <p className="text-xs font-medium text-[#7C3AED] uppercase tracking-wider mb-2">Your Tracking Link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={generatedLink.shortUrl || generatedLink.trackingUrl || ''}
                readOnly
                className="flex-1 bg-[#0F172A] border border-white/10 text-white text-sm px-3 py-2 rounded-xl focus:outline-none"
              />
              <CopyButton text={generatedLink.shortUrl || generatedLink.trackingUrl || ''} />
            </div>
            {generatedLink.affiliateCode && (
              <p className="text-xs text-white/40 mt-2">
                Code: <span className="font-mono font-medium text-[#7C3AED]">{generatedLink.affiliateCode}</span>
                {generatedLink.affiliateRate != null && (
                  <span className="ml-3">Rate: {(generatedLink.affiliateRate * 100).toFixed(0)}%</span>
                )}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Section 3: Links Table ── */}
      <section>
        <h2 className="text-base font-bold text-white mb-4">My Links</h2>

        {!links && linksLoading ? (
          <SkeletonRow count={4} />
        ) : sortedLinks.length === 0 ? (
          <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-8 text-center">
            <div className="mb-3 flex justify-center">
              <Link2 className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">No links yet</h3>
            <p className="text-xs text-white/40">Generate your first tracking link above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs font-medium text-white/40 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Course</th>
                  <th className="text-left px-4 py-3">Custom Slug</th>
                  <th className="text-left px-4 py-3">Short URL</th>
                  <th className="text-center px-4 py-3">Clicks</th>
                  <th className="text-center px-4 py-3">Conversions</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedLinks.map(link => (
                  <tr key={link.id} className="bg-[#1E1B4B] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      {link.course?.title || link.courseTitle || '—'}
                    </td>
                    <td className="px-4 py-3 text-white/60 font-mono text-xs">
                      {link.slug || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/50 text-xs truncate max-w-[160px]">
                          {link.shortUrl || link.trackingUrl || '—'}
                        </span>
                        <CopyButton
                          text={link.shortUrl || link.trackingUrl || ''}
                          successMsg="Copied"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      {link.clickCount ?? link.clicks ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-emerald-400 font-medium">
                        {link.conversions ?? link.orders?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {link.createdAt
                        ? new Date(link.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : link.created_at
                        ? new Date(link.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <CopyButton text={link.shortUrl || link.trackingUrl || ''} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
