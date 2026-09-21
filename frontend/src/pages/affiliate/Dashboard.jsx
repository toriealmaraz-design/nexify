/**
 * Affiliate Dashboard — Portal Shell
 * Offer marketplace, link generator, commission ledger, sub-affiliate tracker, promo vault.
 *
 * Design: Grodital dark theme (deep black + gold accents)
 * Reference: PRD 6.4, SRS Persona C
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SkeletonStats, SkeletonRow } from '../../components/Skeleton';
import axios from 'axios';

export default function AffiliateDashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [links, setLinks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [courseId, setCourseId] = useState('');

  useState(() => {
    axios.get('http://localhost:5000/api/v1/affiliates/dashboard')
      .then(res => setDashboard(res.data.data))
      .catch(() => {});
    axios.get('http://localhost:5000/api/v1/affiliates/links')
      .then(res => setLinks(res.data.data))
      .catch(() => {});
  }, []);

  const handleGenerateLink = async () => {
    if (!courseId) return;
    setGenerating(true);
    try {
      const res = await axios.post('http://localhost:5000/api/v1/affiliates/links', { courseId });
      setGeneratedLink(res.data.data);
    } catch {
      alert('Failed to generate link.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Affiliate Hub</h1>
          <p className="text-white/40 text-sm mt-1">Promote courses, earn commissions, grow your network.</p>
        </div>
        <span className="text-xs bg-[#7C3AED]/20 text-[#7C3AED] font-medium px-2 py-1 rounded-full">
          {user?.role}
        </span>
      </div>

      {/* Stats cards */}
      {!dashboard ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Clicks', value: dashboard.totalClicks?.toLocaleString() || '0', icon: '👆', color: 'text-blue-400' },
            { label: 'Conversions', value: dashboard.totalConversions?.toString() || '0', icon: '✅', color: 'text-emerald-400' },
            { label: 'Conversion Rate', value: `${dashboard.conversionRate || 0}%`, icon: '📊', color: 'text-[#7C3AED]' },
            { label: 'Total Earned', value: `GH₵ ${dashboard.totalEarnedGhs?.toFixed(2) || '0.00'}`, icon: '💰', color: 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{stat.icon}</span>
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className={`text-xl font-bold text-white ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Commission summary */}
      {!dashboard ? (
        <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 mb-8">
          <Skeleton height="16px" width="40%" className="mb-3" />
          <Skeleton height="60px" width="100%" />
        </div>
      ) : (
        <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Commission Ledger</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">Cleared</p>
              <p className="text-2xl font-bold text-emerald-400">
                GH₵ {dashboard.clearedBalanceGhs?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
              <p className="text-xs text-amber-400 font-medium uppercase tracking-wider mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-400">
                GH₵ {dashboard.pendingBalanceGhs?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-white">
                GH₵ {dashboard.totalEarnedGhs?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          <p className="text-xs text-white/30 mt-4">
            Commissions marked PENDING clear automatically after the 7-day refund window (PRD 3.3).
          </p>
        </div>
      )}

      {/* Link Generator */}
      <section className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Generate Tracking Link</h2>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input
            type="text"
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            placeholder="Enter course ID or slug..."
            className="flex-1 px-4 py-2.5 bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
          />
          <button
            onClick={handleGenerateLink}
            disabled={generating || !courseId}
            className="bg-[#7C3AED] text-black px-5 py-2.5 rounded-xl font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
            Generate Link
          </button>
        </div>
        {generatedLink && (
          <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-xl p-4 mt-4">
            <p className="text-xs font-medium text-[#7C3AED] uppercase tracking-wider mb-1">Your Tracking Link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={generatedLink.trackingUrl}
                readOnly
                className="flex-1 bg-white border-0 text-sm text-black px-3 py-2 rounded-xl focus:outline-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(generatedLink.trackingUrl)}
                className="bg-[#7C3AED] text-black px-3 py-2 rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition-all duration-150"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2">
              Affiliate rate: {generatedLink.affiliateRate * 100}% · Code: <span className="font-mono font-medium text-white">{generatedLink.affiliateCode}</span>
            </p>
          </div>
        )}
        <p className="text-xs text-white/30 mt-3">
          Add <code className="bg-white/10 px-1 rounded text-xs text-white/50">&src=tiktok</code> or{' '}
          <code className="bg-white/10 px-1 rounded text-xs text-white/50">&src=whatsapp</code> to track which channel converts (PRD 5.5).
        </p>
      </section>

      {/* My Links */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">My Affiliate Links</h2>
        {!dashboard ? (
          <SkeletonRow count={3} />
        ) : links.length === 0 ? (
          <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🔗</div>
            <h3 className="text-base font-semibold text-white mb-1">No links yet</h3>
            <p className="text-sm text-white/40">Generate your first tracking link above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map(link => (
              <div key={link.id} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:border-white/20 transition-colors">
                <div>
                  <h3 className="text-base font-bold text-white">{link.course?.title || 'Unknown Course'}</h3>
                  <p className="text-sm text-white/40 mt-1">
                    Code: <span className="font-mono font-medium text-[#7C3AED]">{link.affiliateCode}</span>
                    {link.sourceTag && <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded-full">{link.sourceTag}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-white/40">
                    <strong className="text-white">{link.clickCount}</strong> clicks
                  </span>
                  <span className="text-white/40">
                    <strong className="text-emerald-400">{link.orders?.length || 0}</strong> sales
                  </span>
                  <button className="text-[#7C3AED] font-medium text-sm hover:underline">
                    View Analytics
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sub-Affiliate Recruitment */}
      <section className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-2">Sub-Affiliate Recruitment</h2>
        <p className="text-sm text-white/40 mb-4">Recruit other affiliates and earn override commissions on their sales (PRD 3.3).</p>
        <div className="flex gap-2">
          <button className="bg-[#7C3AED] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150">
            + Recruit Sub-Affiliate
          </button>
          <button className="border border-white/10 text-white/60 px-4 py-2 rounded-xl text-sm hover:bg-white/5 transition-colors">
            View Override Earnings
          </button>
        </div>
      </section>

      {/* Promoter Asset Vault */}
      <section className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-2">Promoter Asset Vault</h2>
        <p className="text-sm text-white/40 mb-4">Copy-paste promotional scripts, TikTok hooks, and banners from course creators.</p>
        <div className="flex flex-wrap gap-2">
          {['WhatsApp Scripts', 'TikTok Scripts', 'Email Copy', 'Banners'].map(tab => (
            <button key={tab} className="border border-white/10 text-white/60 px-3 py-1.5 rounded-xl text-sm hover:bg-white/5 transition-colors">
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* Nexa Analytics */}
      <section className="bg-[#1E1B4B] border border-white/10 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#7C3AED] rounded-full flex items-center justify-center text-black text-sm font-bold">N</div>
            <h2 className="text-lg font-bold">Nexa Analytics</h2>
          </div>
          <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full">AFFILIATE SCOPE</span>
        </div>
        <p className="text-sm text-white/50">
          Get real-time conversion breakdowns by channel, commission status updates, and
          promotional copy suggestions. Nexa is scoped strictly to your affiliate data.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Nexa, which channel is converting best?"
            className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
          <button className="bg-[#7C3AED] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150">
            Ask
          </button>
        </div>
      </section>

      {/* User info */}
      <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
        <div>
          <p className="text-sm font-medium text-white">{user?.fullName}</p>
          <p className="text-xs text-white/40">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-[#7C3AED] text-black text-xs font-medium rounded-full">
            {user?.role}
          </span>
        </div>
        <button className="text-sm text-white/40 hover:text-white transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}
