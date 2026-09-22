/**
 * Affiliate Profile — Partner Dashboard Settings
 * Performance stats, payout history, referral link management, payment details.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Link2,
  DollarSign,
  TrendingUp,
  Users,
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Settings,
  Gift,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'links', label: 'Referral Links' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'payment', label: 'Payment Details' },
];

function Skeleton({ className }) {
  return <div className={`bg-white/5 rounded-lg animate-pulse ${className}`} />;
}

export default function AffiliateProfile() {
  const { user, api } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/affiliates/dashboard'),
      api.get('/affiliates/links'),
    ]).then(([dashRes, linksRes]) => {
      setDashboard(dashRes.data.data || {});
      setLinks(linksRes.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalEarned = dashboard?.totalEarned || 0;
  const pendingPayout = dashboard?.pendingPayout || 0;
  const totalClicks = dashboard?.totalClicks || 0;
  const totalConversions = dashboard?.totalConversions || 0;
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0';

  return (
    <div className="max-w-5xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Affiliate Partner Hub</h1>
        <p className="text-white/40 text-sm mt-1">Track your referrals and earnings</p>
      </div>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('nexa:restart-tour'))}
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
          title="Replay the onboarding tour"
        >
          <RotateCw className="w-3.5 h-3.5" /> Restart Tour
        </button>
      </div>

      {/* Stats row */}
      <div data-tour="affiliate-profile-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-white">${totalEarned.toFixed(2)}</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">${pendingPayout.toFixed(2)}</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Clicks</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalClicks}</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Conversions</span>
          </div>
          <p className="text-2xl font-bold text-white">{conversionRate}%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-sky-500 text-white'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : activeTab === 'overview' ? (
        <OverviewTab dashboard={dashboard} links={links} />
      ) : activeTab === 'links' ? (
        <LinksTab links={links} />
      ) : activeTab === 'payouts' ? (
        <PayoutsTab dashboard={dashboard} />
      ) : (
        <PaymentTab />
      )}
    </div>
  );
}

function OverviewTab({ dashboard, links }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/ref/${dashboard?.affiliateCode || 'CODE'}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Quick link */}
      <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-medium text-white">Your Affiliate Link</h3>
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            value={`${window.location.origin}/ref/${dashboard?.affiliateCode || 'CODE'}`}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 font-mono"
          />
          <button
            onClick={handleCopy}
            className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5"
          >
            <Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Top performing links */}
      <div>
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">Top Performing Links</h3>
        {links.length === 0 ? (
          <div className="text-center py-10 bg-[#1E293B] border border-white/5 rounded-xl">
            <Link2 className="w-10 h-10 text-white/20 mx-auto mb-2" />
            <p className="text-white/50 text-sm">No referral links yet</p>
            <Link to="/affiliate/links" className="mt-2 inline-block text-xs text-sky-400 hover:text-sky-300">
              Generate your first link
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {links.slice(0, 5).map(link => (
              <div key={link.id} className="bg-[#1E293B] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <div className="min-w-0 mr-4">
                  <p className="text-sm text-white truncate font-mono">{link.referralCode}</p>
                  <p className="text-xs text-white/40">{link.course?.title || 'Course'}</p>
                </div>
                <div className="flex items-center gap-4 text-xs flex-shrink-0">
                  <span className="text-white/40">{link.clicks || 0} clicks</span>
                  <span className="text-sky-400 font-medium">${(link.earnings || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LinksTab({ links }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-white/40">All your referral links</p>
        <Link
          to="/affiliate/links"
          className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
        >
          + New Link
        </Link>
      </div>
      {links.length === 0 ? (
        <div className="text-center py-16 bg-[#1E293B] border border-white/5 rounded-xl">
          <Link2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">No referral links yet</p>
          <Link to="/affiliate/links" className="mt-3 inline-block text-sm text-sky-400 hover:text-sky-300">
            Generate your first link
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map(link => (
            <div key={link.id} className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate mb-0.5">{link.course?.title || 'Course'}</p>
                  <p className="text-xs text-white/40 font-mono">{window.location.origin}/ref/{link.referralCode}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/ref/${link.referralCode}`)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    to={`/course/${link.courseId}`}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-white/40">
                <span>{link.clicks || 0} clicks</span>
                <span>{link.swipes || 0} swipes</span>
                <span className="text-sky-400 font-medium">${(link.earnings || 0).toFixed(2)} earned</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PayoutsTab({ dashboard }) {
  const payoutHistory = dashboard?.payoutHistory || [];

  return (
    <div className="space-y-4">
      {/* Payout schedule info */}
      <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4 flex items-start gap-3">
        <Clock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-white font-medium mb-0.5">Payout Schedule</p>
          <p className="text-xs text-white/40">Payouts are processed on the 1st and 15th of every month. Minimum payout threshold: $10.00.</p>
        </div>
      </div>

      {payoutHistory.length === 0 ? (
        <div className="text-center py-16 bg-[#1E293B] border border-white/5 rounded-xl">
          <DollarSign className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">No payout history yet</p>
          <p className="text-white/30 text-xs mt-1">Reach $10 to request your first payout</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payoutHistory.map((payout, i) => (
            <div key={i} className="bg-[#1E293B] border border-white/5 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">${payout.amount.toFixed(2)}</p>
                <p className="text-xs text-white/40">{new Date(payout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                payout.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {payout.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentTab() {
  const [paymentInfo, setPaymentInfo] = useState({ method: 'bank', bankName: '', accountNumber: '', mobileMoney: '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // TODO: wire up to /api/v1/affiliate/profile/payment when endpoint is available
    await new Promise(r => setTimeout(r, 800));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-md">
      <div className="bg-[#1E293B] border border-white/5 rounded-xl p-6">
        <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">Payment Method</h3>
        <p className="text-xs text-white/40 mb-4">Choose how you want to receive your affiliate commissions.</p>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Method selector */}
          <div className="grid grid-cols-2 gap-2">
            {['bank', 'mobile'].map(method => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentInfo(p => ({ ...p, method }))}
                className={`p-3 rounded-lg border text-sm text-center transition-colors ${
                  paymentInfo.method === method
                    ? 'border-sky-500 bg-sky-500/10 text-white'
                    : 'border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                {method === 'bank' ? 'Bank Transfer' : 'Mobile Money'}
              </button>
            ))}
          </div>

          {paymentInfo.method === 'bank' ? (
            <>
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Bank Name</label>
                <input
                  type="text"
                  value={paymentInfo.bankName}
                  onChange={e => setPaymentInfo(p => ({ ...p, bankName: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Ecobank, UBA"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Account Number</label>
                <input
                  type="text"
                  value={paymentInfo.accountNumber}
                  onChange={e => setPaymentInfo(p => ({ ...p, accountNumber: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-500"
                  placeholder="Account number"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Mobile Money Number</label>
              <input
                type="text"
                value={paymentInfo.mobileMoney}
                onChange={e => setPaymentInfo(p => ({ ...p, mobileMoney: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-500"
                placeholder="e.g. +233 XX XXX XXXX"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Payment Details'}
          </button>
        </form>
      </div>
    </div>
  );
}
