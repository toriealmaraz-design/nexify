/**
 * Payout — Creator Payout History & Request Page
 * Route: /creator/payout
 * Protected: CREATOR role
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  DollarSign,
  Clock,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowDownRight,
  CreditCard,
  Building2,
  Smartphone,
} from 'lucide-react';
import axios from 'axios';

const API = '/api/v1';
const MIN_PAYOUT = 100;

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

function StatusBadge({ status }) {
  const map = {
    PROCESSING: { label: 'Processing', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
    COMPLETED:  { label: 'Completed',  className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
    FAILED:    { label: 'Failed',     className: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
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

function SkeletonStats() {
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

// Mock payout history for development
const MOCK_PAYOUTS = [
  { id: 1, amount: 1250.00, status: 'COMPLETED', reference: 'PYT-2025-001', createdAt: 'Sep 18, 2025' },
  { id: 2, amount: 875.50,  status: 'COMPLETED', reference: 'PYT-2025-002', createdAt: 'Sep 10, 2025' },
  { id: 3, amount: 340.00,  status: 'PROCESSING', reference: 'PYT-2025-003', createdAt: 'Sep 25, 2025' },
  { id: 4, amount: 2100.00, status: 'FAILED',     reference: 'PYT-2025-004', createdAt: 'Aug 28, 2025' },
  { id: 5, amount: 780.25,  status: 'COMPLETED', reference: 'PYT-2025-005', createdAt: 'Aug 15, 2025' },
];

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
      {selected && <CheckCircle2 className="w-4 h-4 text-[#7C3AED] ml-auto" />}
    </button>
  );
}

export default function Payout() {
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Payout request form
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('mobile_money');
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  const fetchPayouts = () => {
    const token = localStorage.getItem('nexify_token');
    return axios.get(`${API}/payouts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const fetchStats = () => {
    const token = localStorage.getItem('nexify_token');
    return axios.get(`${API}/courses/stats/creator`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  useEffect(() => {
    axios.all([fetchStats(), fetchPayouts()])
      .then(axios.spread((statsRes, payoutsRes) => {
        const d = statsRes.data?.data || {};
        setStats({
          availableBalance: d.pendingPayout || 0,
          pendingPayouts: d.pendingPayout || 0, // reuse pending as available for now
          totalPaidOut: d.totalEarned || 0,
          nextPayoutDate: 'Oct 1, 2025',
        });
        setPayouts(payoutsRes.data?.data || []);
      }))
      .catch(() => {
        // Fallback to mock data if API not ready
        setStats({
          availableBalance: 3472.50,
          pendingPayouts: 892.00,
          totalPaidOut: 12450.00,
          nextPayoutDate: 'Oct 1, 2025',
        });
        setPayouts(MOCK_PAYOUTS);
      })
      .finally(() => {
        setStatsLoading(false);
        setPayoutsLoading(false);
      });
  }, []);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    setRequestError('');
    setRequestSuccess('');

    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      setRequestError('Enter a valid amount greater than zero.');
      return;
    }
    if (stats && amount > stats.availableBalance) {
      setRequestError('Amount exceeds your available balance.');
      return;
    }
    if (amount < MIN_PAYOUT) {
      setRequestError(`Minimum payout is GH₵ ${MIN_PAYOUT}.`);
      return;
    }

    setRequesting(true);
    try {
      const token = localStorage.getItem('nexify_token');
      await axios.post(`${API}/payouts/request`, {
        amount,
        method: payoutMethod,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequestSuccess('Payout request submitted successfully.');
      setPayoutAmount('');
      // Refresh
      const [, payoutsRes] = await axios.all([fetchStats(), fetchPayouts()]);
      setPayouts(payoutsRes.data?.data || MOCK_PAYOUTS);
    } catch (err) {
      setRequestError(err.response?.data?.message || 'Failed to submit payout request. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  const canRequestPayout = stats && stats.availableBalance >= MIN_PAYOUT;

  return (
    <div className="max-w-6xl">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payouts</h1>
          <p className="text-white/40 text-sm mt-1">View your payout history and withdraw earnings.</p>
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

      {/* Stats row */}
      {statsLoading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Available Balance"
            value={`GH₵ ${(stats?.availableBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            color="text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            label="Pending Payouts"
            value={`GH₵ ${(stats?.pendingPayouts || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={Clock}
            color="text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            label="Total Paid Out"
            value={`GH₵ ${(stats?.totalPaidOut || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={ChevronUp}
            color="text-[#7C3AED]"
            bg="bg-[#7C3AED]/10"
          />
          <StatCard
            label="Next Payout Date"
            value={stats?.nextPayoutDate || '—'}
            icon={Banknote}
            color="text-blue-400"
            bg="bg-blue-500/10"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Payout history table */}
        <div className="lg:col-span-2">
          <div className="bg-[#1E1B4B] border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Payout History</h2>
              <span className="text-xs text-white/30">
                {payouts.length > 0 ? `${payouts.length} payouts` : 'No payouts yet'}
              </span>
            </div>

            {payoutsLoading ? (
              <SkeletonTable rows={4} />
            ) : payouts.length === 0 ? (
              <div className="p-8 text-center">
                <Banknote className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 text-sm">No payouts yet — earnings will appear here after your first payout.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map(row => (
                      <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white/60">{row.createdAt || row.date}</td>
                        <td className="px-4 py-3 text-white font-medium">
                          GH₵ {(row.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                        <td className="px-4 py-3 text-white/40 font-mono text-xs">{row.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Request Payout form */}
        <div>
          <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-5">
            <h2 className="text-base font-semibold text-white mb-1">Request Payout</h2>
            <p className="text-xs text-white/40 mb-4">Withdraw your available balance (min GH₵ {MIN_PAYOUT}).</p>

            {/* Available balance display */}
            <div className="bg-[#0F172A] border border-white/10 rounded-xl p-4 mb-4">
              <p className="text-xs text-white/40 mb-1">Available Balance</p>
              <p className="text-xl font-bold text-white">
                GH₵ {(stats?.availableBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              {stats?.availableBalance < MIN_PAYOUT && (
                <p className="text-xs text-amber-400 mt-1">Minimum payout: GH₵ {MIN_PAYOUT}</p>
              )}
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-3">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Amount (GH₵)</label>
                <input
                  type="number"
                  step="0.01"
                  min={MIN_PAYOUT}
                  value={payoutAmount}
                  onChange={e => { setPayoutAmount(e.target.value); setRequestError(''); setRequestSuccess(''); }}
                  placeholder={`Min ${MIN_PAYOUT}`}
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

              {requestError && (
                <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {requestError}
                </div>
              )}

              {requestSuccess && (
                <div className="flex items-start gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {requestSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={requesting || !canRequestPayout}
                className="w-full bg-[#7C3AED] text-black font-semibold py-2.5 rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {requesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Request Payout
                  </>
                )}
              </button>

              {!canRequestPayout && !statsLoading && (
                <p className="text-xs text-white/30 text-center">
                  Balance below minimum (GH₵ {MIN_PAYOUT})
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
