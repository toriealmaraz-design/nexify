/**
 * CreatorEarnings — Financial Dashboard
 * Displays creator earnings, payout history, and withdrawal requests.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Clock,
  TrendingUp,
  ShoppingCart,
  ArrowDownRight,
  CreditCard,
  Building2,
  Smartphone,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import axios from 'axios';

const API = '/api/v1';

// ─── Skeleton Components ───────────────────────────────────────

function SkeletonEarningsStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {['', '', '', ''].map((_, i) => (
        <div key={i} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4">
          <div className="h-3 w-24 bg-white/5 rounded-lg mb-3 animate-pulse" />
          <div className="h-7 w-28 bg-white/5 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function SkeletonTable({ rows = 4 }) {
  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/5 space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
            <div className="h-5 w-16 bg-white/5 rounded-full animate-pulse" />
            <div className="h-3 w-24 bg-white/5 rounded animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonTransactionList({ count = 5 }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/5 rounded-lg animate-pulse" />
            <div>
              <div className="h-3 w-32 bg-white/5 rounded animate-pulse mb-2" />
              <div className="h-2 w-20 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    PAID: { label: 'Paid', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: CheckCircle2 },
    PENDING: { label: 'Pending', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Clock },
    FAILED: { label: 'Failed', className: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
    COMPLETED: { label: 'Completed', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: CheckCircle2 },
    PROCESSING: { label: 'Processing', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  };
  const cfg = map[status] || { label: status, className: 'bg-white/10 text-white/60 border-white/10', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Mock Data ────────────────────────────────────────────────

const MOCK_PAYOUT_HISTORY = [
  { id: 1, period: 'August 2025', amount: 1250.00, status: 'PAID', date: 'Sep 1, 2025' },
  { id: 2, period: 'July 2025', amount: 875.50, status: 'PAID', date: 'Aug 1, 2025' },
  { id: 3, period: 'June 2025', amount: 2100.00, status: 'PAID', date: 'Jul 1, 2025' },
  { id: 4, period: 'May 2025', amount: 340.00, status: 'FAILED', date: 'Jun 1, 2025' },
  { id: 5, period: 'April 2025', amount: 780.25, status: 'PAID', date: 'May 1, 2025' },
];

const MOCK_TRANSACTIONS = [
  { id: 1, date: 'Sep 18, 2025', courseName: 'Figma for Beginners', amount: 149.00, status: 'COMPLETED' },
  { id: 2, date: 'Sep 15, 2025', courseName: 'Advanced React Patterns', amount: 299.00, status: 'COMPLETED' },
  { id: 3, date: 'Sep 12, 2025', courseName: 'Figma for Beginners', amount: 149.00, status: 'COMPLETED' },
  { id: 4, date: 'Sep 8, 2025', courseName: 'UI/UX Design Fundamentals', amount: 199.00, status: 'PROCESSING' },
  { id: 5, date: 'Sep 5, 2025', courseName: 'Advanced React Patterns', amount: 299.00, status: 'COMPLETED' },
  { id: 6, date: 'Sep 2, 2025', courseName: 'Figma for Beginners', amount: 149.00, status: 'COMPLETED' },
  { id: 7, date: 'Aug 28, 2025', courseName: 'UI/UX Design Fundamentals', amount: 199.00, status: 'COMPLETED' },
  { id: 8, date: 'Aug 22, 2025', courseName: 'Advanced React Patterns', amount: 299.00, status: 'COMPLETED' },
  { id: 9, date: 'Aug 18, 2025', courseName: 'Figma for Beginners', amount: 149.00, status: 'REFUNDED' },
  { id: 10, date: 'Aug 12, 2025', courseName: 'UI/UX Design Fundamentals', amount: 199.00, status: 'COMPLETED' },
];

// ─── Main Component ───────────────────────────────────────────

export default function CreatorEarnings() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [payoutHistory] = useState(MOCK_PAYOUT_HISTORY);
  const [transactions] = useState(MOCK_TRANSACTIONS);

  // Payout form state
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('mobile_money');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('nexify_token');
    axios.get(`${API}/courses/stats/creator`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        const d = res.data?.data || {};
        setStats({
          totalEarned: d.totalEarned || 0,
          pendingPayout: d.pendingPayout || 0,
          thisMonth: d.thisMonth || 0,
          coursesSold: d.coursesSold || 0,
        });
      })
      .catch(() => {
        setStats({ totalEarned: 0, pendingPayout: 0, thisMonth: 0, coursesSold: 0 });
      })
      .finally(() => setStatsLoading(false));
  }, []);

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    setPayoutError('');
    setPayoutSuccess('');

    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      setPayoutError('Enter a valid amount greater than zero.');
      return;
    }
    if (stats && amount > stats.pendingPayout) {
      setPayoutError('Amount exceeds your available balance.');
      return;
    }

    setPayoutLoading(true);
    try {
      const token = localStorage.getItem('nexify_token');
      await axios.post(`${API}/payouts/request`, {
        amount,
        method: payoutMethod,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayoutSuccess('Payout request submitted successfully.');
      setPayoutAmount('');
    } catch {
      setPayoutError('Failed to submit payout request. Please try again.');
    } finally {
      setPayoutLoading(false);
    }
  };

  const sortedPayoutHistory = [...payoutHistory].sort((a, b) => b.id - a.id);

  return (
    <div className="max-w-6xl">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Earnings</h1>
          <p className="text-white/40 text-sm mt-1">Track your revenue, payouts, and transaction history.</p>
        </div>
        <Link
          to="/creator"
          className="text-sm text-white/40 hover:text-white flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Creator Studio
        </Link>
      </div>

      {/* ── 1. Earnings Summary Stats ── */}
      {statsLoading ? (
        <SkeletonEarningsStats />
      ) : (
        <div data-tour="creator-earnings-summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Earned"
            value={`GH₵ ${(stats?.totalEarned || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            color="text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            label="Pending Payout"
            value={`GH₵ ${(stats?.pendingPayout || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={Clock}
            color="text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            label="This Month"
            value={`GH₵ ${(stats?.thisMonth || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
            color="text-[#7C3AED]"
            bg="bg-[#7C3AED]/10"
          />
          <StatCard
            label="Courses Sold"
            value={(stats?.coursesSold || 0).toLocaleString()}
            icon={ShoppingCart}
            color="text-blue-400"
            bg="bg-blue-500/10"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ── 2. Payout History ── */}
        <div className="lg:col-span-2">
          <div className="bg-[#1E1B4B] border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Payout History</h2>
              <span className="text-xs text-white/30">Sample data</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Period</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPayoutHistory.map(row => (
                    <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white/80">{row.period}</td>
                      <td className="px-4 py-3 text-white font-medium">GH₵ {row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3 text-white/40">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── 3. Payout Request Form ── */}
        <div>
          <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-5">
            <h2 className="text-base font-semibold text-white mb-1">Request Payout</h2>
            <p className="text-xs text-white/40 mb-4">Withdraw your available balance.</p>

            <div className="bg-[#0F172A] border border-white/10 rounded-xl p-4 mb-4">
              <p className="text-xs text-white/40 mb-1">Available Balance</p>
              <p className="text-xl font-bold text-white">
                GH₵ {(stats?.pendingPayout || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <form onSubmit={handlePayoutRequest} className="space-y-3">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Amount (GH₵)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={payoutAmount}
                  onChange={e => { setPayoutAmount(e.target.value); setPayoutError(''); setPayoutSuccess(''); }}
                  placeholder="0.00"
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Payout Method</label>
                <div className="space-y-2">
                  <MethodOption
                    selected={payoutMethod === 'mobile_money'}
                    onClick={() => setPayoutMethod('mobile_money')}
                    icon={Smartphone}
                    label="Mobile Money"
                    sub="MoMo / AirtelTigo"
                  />
                  <MethodOption
                    selected={payoutMethod === 'bank_transfer'}
                    onClick={() => setPayoutMethod('bank_transfer')}
                    icon={Building2}
                    label="Bank Transfer"
                    sub="Ghana Bank"
                  />
                </div>
              </div>

              {payoutError && (
                <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {payoutError}
                </div>
              )}

              {payoutSuccess && (
                <div className="flex items-start gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {payoutSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={payoutLoading}
                className="w-full bg-[#7C3AED] text-black font-semibold py-2.5 rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {payoutLoading ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Request Payout
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── 4. Recent Transactions ── */}
      <div className="bg-[#1E1B4B] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Recent Transactions</h2>
          <span className="text-xs text-white/30">Last 10 earnings</span>
        </div>
        <div className="divide-y divide-white/5">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{tx.courseName}</p>
                  <p className="text-xs text-white/40">{tx.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-white">
                  + GH₵ {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className={`${bg} rounded-lg p-1.5`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </span>
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function MethodOption({ selected, onClick, icon: Icon, label, sub }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150
        ${selected
          ? 'border-[#7C3AED] bg-[#7C3AED]/10'
          : 'border-white/10 bg-[#0F172A] hover:border-white/20'
        }`}
    >
      <Icon className={`w-4 h-4 ${selected ? 'text-[#7C3AED]' : 'text-white/40'}`} />
      <div>
        <p className={`text-sm font-medium ${selected ? 'text-white' : 'text-white/60'}`}>{label}</p>
        <p className="text-xs text-white/30">{sub}</p>
      </div>
      {selected && (
        <CheckCircle2 className="w-4 h-4 text-[#7C3AED] ml-auto" />
      )}
    </button>
  );
}
