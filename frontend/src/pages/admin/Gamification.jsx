/**
 * Admin Gamification Settings — manage points, badges, rewards
 */
import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Star, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const LEVELS = [
  { name: 'Newcomer', min: 0, max: 99, color: 'text-gray-400' },
  { name: 'Explorer', min: 100, max: 299, color: 'text-sky-400' },
  { name: 'Achiever', min: 300, max: 599, color: 'text-emerald-400' },
  { name: 'Expert', min: 600, max: 999, color: 'text-purple-400' },
  { name: 'Master', min: 1000, max: null, color: 'text-amber-400' },
];

export default function AdminGamification() {
  const [badges, setBadges] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const token = localStorage.getItem('nexify_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [badgesRes, rewardsRes, leaderboardRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/gamification/badges', { headers }),
        fetch('http://localhost:5000/api/v1/gamification/rewards', { headers }),
        fetch('http://localhost:5000/api/v1/gamification/leaderboard', { headers }),
      ]);

      const badgesData = await badgesRes.json();
      const rewardsData = await rewardsRes.json();

      if (badgesData.success) setBadges(badgesData.data);
      if (rewardsData.success) setRewards(rewardsData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Gamification</h1>
        <p className="text-white/50 text-sm">Manage points, badges, levels, and rewards</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['overview', 'badges', 'rewards', 'levels'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-[#7C3AED] text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Badges" value={badges.length} icon={Star} color="text-amber-400" />
          <StatCard label="Total Rewards" value={rewards.length} icon={Gift} color="text-emerald-400" />
          <StatCard label="Levels" value={5} icon={Trophy} color="text-[#7C3AED]" />
          <StatCard label="Point Actions" value={7} icon={Star} color="text-sky-400" />
        </div>
      )}

      {/* Badges */}
      {activeTab === 'badges' && (
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Badges</h2>
          </div>
          {badges.length === 0 ? (
            <p className="text-white/40 text-sm">No badges found. Seed defaults from the backend.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge, i) => (
                <div key={badge.id || i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#7C3AED]/20 rounded-xl flex items-center justify-center">
                      <Star className="w-5 h-5 text-[#7C3AED]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{badge.name}</p>
                      <p className="text-xs text-white/40">{badge.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rewards */}
      {activeTab === 'rewards' && (
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Rewards</h2>
          </div>
          {rewards.length === 0 ? (
            <p className="text-white/40 text-sm">No rewards found. Seed defaults from the backend.</p>
          ) : (
            <div className="space-y-3">
              {rewards.map((reward, i) => (
                <div key={reward.id || i} className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Gift className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{reward.title}</p>
                      <p className="text-xs text-white/40">{reward.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40">Requires</p>
                    <p className="text-sm font-medium text-[#7C3AED]">{reward.requiredLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Levels */}
      {activeTab === 'levels' && (
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Level Thresholds</h2>
          <div className="space-y-3">
            {LEVELS.map((level, i) => (
              <div key={level.name} className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="w-10 h-10 bg-[#7C3AED]/20 rounded-xl flex items-center justify-center">
                  <Trophy className={`w-5 h-5 ${level.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{level.name}</p>
                  <p className="text-xs text-white/40">
                    Level {i + 1} · {level.max ? `${level.min} - ${level.max} points` : `${level.min}+ points`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${level.color}`}>
                  {level.min}+ pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-[#1E293B] border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-white/40">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
