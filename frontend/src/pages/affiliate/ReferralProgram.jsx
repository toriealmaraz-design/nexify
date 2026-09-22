/**
 * ReferralProgram — Affiliate Referral Leaderboard & Stats
 * Route: /affiliate/referral
 * Protected: AFFILIATE role
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  DollarSign,
  Loader2,
  Award,
  Crown,
  Medal,
} from 'lucide-react';
import axios from 'axios';

const API = '/api/v1';

// Mock leaderboard data for development
const MOCK_LEADERBOARD = [
  { rank: 1, affiliateName: 'Ama Serwaa', totalReferrals: 142, conversions: 38, earnings: 2840.00, rankChange: 0 },
  { rank: 2, affiliateName: 'Kwame Mensah', totalReferrals: 118, conversions: 29, earnings: 2310.00, rankChange: 2 },
  { rank: 3, affiliateName: 'Akosua Baah', totalReferrals: 97, conversions: 24, earnings: 1890.00, rankChange: -1 },
  { rank: 4, affiliateName: 'Yaw Boateng', totalReferrals: 85, conversions: 19, earnings: 1540.00, rankChange: 1 },
  { rank: 5, affiliateName: 'Efua Okonkwo', totalReferrals: 71, conversions: 15, earnings: 1125.00, rankChange: -2 },
  { rank: 6, affiliateName: 'Kofi Addo', totalReferrals: 63, conversions: 12, earnings: 945.00, rankChange: 0 },
  { rank: 7, affiliateName: 'Aba Asante', totalReferrals: 48, conversions: 9, earnings: 720.00, rankChange: 3 },
  { rank: 8, affiliateName: 'Kojo Tetteh', totalReferrals: 39, conversions: 7, earnings: 545.00, rankChange: -1 },
];

const MOCK_MY_STATS = {
  rank: 12,
  totalReferrals: 24,
  conversions: 5,
  earnings: 380.00,
  conversionRate: 20.8,
  rankChange: 2,
};

function RankChangeIndicator({ change }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400 text-xs font-medium">
        <TrendingUp className="w-3 h-3" />+{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-400 text-xs font-medium">
        <TrendingDown className="w-3 h-3" />{change}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-white/30 text-xs">
      <Minus className="w-3 h-3" />0
    </span>
  );
}

function TopThreeRow({ rank, affiliateName, totalReferrals, conversions, earnings, rankChange }) {
  const medals = { 1: Crown, 2: Medal, 3: Award };
  const medalColors = {
    1: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    2: 'text-slate-300 bg-slate-300/10 border-slate-300/30',
    3: 'text-amber-700 bg-amber-700/10 border-amber-700/30',
  };
  const MedalIcon = medals[rank] || Trophy;
  const colorClass = medalColors[rank] || 'text-white/60';

  return (
    <tr className={`border-b border-white/5 hover:bg-white/5 transition-colors ${rank === 1 ? 'bg-amber-500/5' : ''}`}>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorClass.split(' ').map(c => c === 'text-amber-400' ? 'border-amber-400/30' : c === 'text-slate-300' ? 'border-slate-300/30' : c === 'text-amber-700' ? 'border-amber-700/30' : '').join(' ')}`}>
            <MedalIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{affiliateName}</p>
            <RankChangeIndicator change={rankChange} />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-center text-sm text-white/80">{totalReferrals}</td>
      <td className="px-4 py-3.5 text-center text-sm text-white/80">{conversions}</td>
      <td className="px-4 py-3.5 text-right">
        <span className="text-sm font-bold text-emerald-400">
          GH₵ {earnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </td>
    </tr>
  );
}

function LeaderboardRow({ rank, affiliateName, totalReferrals, conversions, earnings, rankChange, isCurrentUser }) {
  return (
    <tr className={`border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${isCurrentUser ? 'bg-[#7C3AED]/10' : ''}`}>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white/40 w-6 text-center">{rank}</span>
          <div>
            <p className={`text-sm font-medium ${isCurrentUser ? 'text-[#7C3AED]' : 'text-white/80'}`}>
              {affiliateName} {isCurrentUser && <span className="text-xs text-white/40">(you)</span>}
            </p>
            <RankChangeIndicator change={rankChange} />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-sm text-white/60">{totalReferrals}</td>
      <td className="px-4 py-3 text-center text-sm text-white/60">{conversions}</td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-medium text-white">
          GH₵ {earnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </td>
    </tr>
  );
}

function MyStatsCard({ stats, loading }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-[#1E1B4B] to-[#0F172A] border border-[#7C3AED]/30 rounded-2xl p-6">
        <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#1E1B4B] to-[#0F172A] border border-[#7C3AED]/30 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-[#7C3AED]" />
        <h2 className="text-sm font-semibold text-white">My Referral Stats</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Your Rank</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-white">#{stats?.rank || '—'}</p>
            <RankChangeIndicator change={stats?.rankChange || 0} />
          </div>
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Referrals</p>
          <p className="text-2xl font-bold text-white">{stats?.totalReferrals || 0}</p>
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Conversions</p>
          <p className="text-2xl font-bold text-white">{stats?.conversions || 0}</p>
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Earnings</p>
          <p className="text-2xl font-bold text-emerald-400">
            GH₵ {(stats?.earnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReferralStats({ stats, loading }) {
  const statItems = [
    { label: 'Total Referrals', value: stats?.totalReferrals || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Conversion Rate', value: `${(stats?.conversionRate || 0).toFixed(1)}%`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Top Performer Badge', value: stats?.rank <= 3 ? '🏆 Yes' : '—', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Earnings This Month', value: `GH₵ ${(stats?.monthlyEarnings || 0).toFixed(2)}`, icon: DollarSign, color: 'text-[#7C3AED]', bg: 'bg-[#7C3AED]/10' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4">
            <div className="h-3 w-24 bg-white/5 rounded mb-3 animate-pulse" />
            <div className="h-7 w-20 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map(item => (
        <div key={item.label} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className={`${item.bg} rounded-lg p-1.5`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </span>
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{item.label}</span>
          </div>
          <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function ReferralProgram() {
  const [myStats, setMyStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nexify_token');

    const fetchData = async () => {
      try {
        const [statsRes, leaderboardRes] = await Promise.all([
          axios.get(`${API}/affiliates/referral-stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API}/affiliates/leaderboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setMyStats(statsRes.data?.data);
        setLeaderboard(leaderboardRes.data?.data || []);
      } catch {
        // Use mock data when API not available
        setMyStats(MOCK_MY_STATS);
        setLeaderboard(MOCK_LEADERBOARD);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const topThree = leaderboard.filter(r => r.rank <= 3);
  const rest = leaderboard.filter(r => r.rank > 3);

  return (
    <div className="max-w-6xl">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Referral Program</h1>
          <p className="text-white/40 text-sm mt-1">Track your referrals and compete on the leaderboard.</p>
        </div>
        <span className="text-xs bg-[#7C3AED]/20 text-[#7C3AED] font-medium px-2.5 py-1 rounded-full border border-[#7C3AED]/30">
          Affiliate
        </span>
      </div>

      {/* My stats highlight */}
      <MyStatsCard stats={myStats} loading={loading} />

      {/* Referral stats */}
      <ReferralStats stats={myStats} loading={loading} />

      {/* Leaderboard */}
      <div className="bg-[#1E1B4B] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            General Leaderboard
          </h2>
          <span className="text-xs text-white/30">{leaderboard.length} affiliates</span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-white/20 animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No referral data yet — start promoting to appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Affiliate</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Referrals</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Conversions</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {/* Top 3 with special styling */}
                {topThree.map(row => (
                  <TopThreeRow key={row.rank} {...row} />
                ))}
                {/* Rest of leaderboard */}
                {rest.map(row => (
                  <LeaderboardRow key={row.rank} {...row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
