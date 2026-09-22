/**
 * Affiliate Leaderboard — Gamified ranking of top affiliate earners
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Medal, TrendingUp, Users, Gift } from 'lucide-react';

function RankBadge({ rank }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-xs font-bold text-black shadow-lg shadow-amber-500/30"><Trophy className="w-4 h-4" /></div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-xs font-bold text-black shadow-lg shadow-gray-400/30"><Medal className="w-4 h-4" /></div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-amber-700/30"><Medal className="w-4 h-4" /></div>;
  return <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">{rank}</div>;
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-white/40">{label}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
      </div>
      {sub && <p className="text-xs text-white/30">{sub}</p>}
    </div>
  );
}

export default function AffiliateLeaderboard() {
  const { api, user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated leaderboard data — in production, aggregate from Commission table
    const mock = [
      { rank: 1, fullName: 'Ama Serwaa', email: 'ama.s@example.com', totalSales: 47, totalEarned: 9400, avatarUrl: null },
      { rank: 2, fullName: 'Kojo Mensah', email: 'kojo.m@example.com', totalSales: 38, totalEarned: 7600, avatarUrl: null },
      { rank: 3, fullName: 'Efua Owusu', email: 'efua.o@example.com', totalSales: 31, totalEarned: 6200, avatarUrl: null },
      { rank: 4, fullName: 'Yaw Boateng', email: 'yaw.b@example.com', totalSales: 24, totalEarned: 4800, avatarUrl: null },
      { rank: 5, fullName: 'Akua Diallo', email: 'akua.d@example.com', totalSales: 19, totalEarned: 3800, avatarUrl: null },
    ];
    setLeaderboard(mock);
    setLoading(false);
  }, []);

  const myRank = leaderboard.findIndex(l => l.email === user?.email) + 1 || null;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-400" />Affiliate Leaderboard</h1>
        <p className="text-sm text-white/40 mt-1">Top earners in the Nexify affiliate program</p>
      </div>

      {/* My rank card */}
      {myRank && (
        <div className="bg-gradient-to-r from-[#7C3AED]/20 to-purple-900/20 border border-[#7C3AED]/30 rounded-2xl p-5 flex items-center gap-4">
          <RankBadge rank={myRank} />
          <div>
            <p className="text-sm font-semibold text-white">Your Rank</p>
            <p className="text-2xl font-bold text-[#7C3AED]">#{myRank}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-white/40">Keep going!</p>
            <p className="text-sm text-white/60">Top 3 earn bonus commissions</p>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 items-end">
          {/* 2nd */}
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-4 text-center order-first">
            <div className="flex justify-center mb-2"><RankBadge rank={2} /></div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 mx-auto mb-2 flex items-center justify-center text-lg font-bold text-black">2</div>
            <p className="text-sm font-semibold text-white truncate">{leaderboard[1].fullName}</p>
            <p className="text-xs text-white/40 mt-1">{leaderboard[1].totalSales} sales</p>
            <p className="text-sm font-bold text-gray-300 mt-1">GH₵{leaderboard[1].totalEarned.toLocaleString()}</p>
          </div>
          {/* 1st */}
          <div className="bg-gradient-to-b from-[#7C3AED]/20 to-transparent border border-amber-500/30 rounded-2xl p-5 text-center order-2">
            <div className="flex justify-center mb-2"><RankBadge rank={1} /></div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 mx-auto mb-2 flex items-center justify-center text-xl font-bold text-black shadow-lg shadow-amber-500/40">1</div>
            <p className="text-sm font-bold text-white truncate">{leaderboard[0].fullName}</p>
            <p className="text-xs text-white/40 mt-1">{leaderboard[0].totalSales} sales</p>
            <p className="text-base font-bold text-amber-400 mt-1">GH₵{leaderboard[0].totalEarned.toLocaleString()}</p>
          </div>
          {/* 3rd */}
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-4 text-center order-last">
            <div className="flex justify-center mb-2"><RankBadge rank={3} /></div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 mx-auto mb-2 flex items-center justify-center text-lg font-bold text-white">3</div>
            <p className="text-sm font-semibold text-white truncate">{leaderboard[2].fullName}</p>
            <p className="text-xs text-white/40 mt-1">{leaderboard[2].totalSales} sales</p>
            <p className="text-sm font-bold text-amber-600 mt-1">GH₵{leaderboard[2].totalEarned.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Full ranking table */}
      <div className="bg-[#1E293B] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
          <h3 className="text-sm font-semibold text-white">Full Rankings</h3>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="divide-y divide-white/5">
            {leaderboard.map((entry) => (
              <div key={entry.rank} className={`flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors ${entry.email === user?.email ? 'bg-[#7C3AED]/10' : ''}`}>
                <RankBadge rank={entry.rank} />
                <div className="w-9 h-9 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-sm font-semibold text-[#7C3AED] flex-shrink-0">
                  {entry.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{entry.fullName}</p>
                  <p className="text-xs text-white/30">{entry.totalSales} successful sales</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-400">GH₵{entry.totalEarned.toLocaleString()}</p>
                  <p className="text-[10px] text-white/30">total earned</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Users} label="Active Affiliates" value={leaderboard.length} color="bg-blue-500/20 text-blue-400" />
        <StatCard icon={Gift} label="Total Paid Out" value={`GH₵${leaderboard.reduce((s, l) => s + l.totalEarned, 0).toLocaleString()}`} color="bg-emerald-500/20 text-emerald-400" />
      </div>
    </div>
  );
}
