/**
 * Gamification Hub — Points, Levels, Leaderboard, Rewards
 * Skool-style gamification for student engagement
 */
import React, { useState, useEffect } from 'react';
import { Trophy, Star, Zap, Gift, Lock, ChevronRight, Medal, Crown, Flame, BookOpen, CheckCircle, Award, MessageSquare, RotateCw } from 'lucide-react';

const LEVELS = [
  { name: 'Newcomer', min: 0, max: 99, color: 'text-gray-400', bg: 'bg-gray-500/20', icon: Star },
  { name: 'Explorer', min: 100, max: 299, color: 'text-sky-400', bg: 'bg-sky-500/20', icon: Zap },
  { name: 'Achiever', min: 300, max: 599, color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: Medal },
  { name: 'Expert', min: 600, max: 999, color: 'text-purple-400', bg: 'bg-purple-500/20', icon: Crown },
  { name: 'Master', min: 1000, max: Infinity, color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Flame },
];

const POINTS_LOG = [
  { action: 'Enroll in a course', points: '+10', icon: BookOpen },
  { action: 'Complete a lesson', points: '+5', icon: CheckCircle },
  { action: 'Complete a course', points: '+50', icon: Award },
  { action: 'Leave a review', points: '+15', icon: Star },
  { action: 'Daily login streak', points: '+5', icon: Flame },
  { action: 'Community post', points: '+3', icon: MessageSquare },
  { action: 'Community reply', points: '+2', icon: RotateCw },
];

export default function Gamification() {
  const [stats, setStats] = useState({ totalPoints: 0, level: 'Newcomer', rank: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStats();
    fetchLeaderboard();
    fetchRewards();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/v1/gamification/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('nexify_token')}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/v1/gamification/leaderboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('nexify_token')}` },
      });
      const data = await res.json();
      if (data.success) setLeaderboard(data.data.leaderboard || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchRewards() {
    try {
      const res = await fetch('/api/v1/gamification/rewards', {
        headers: { Authorization: `Bearer ${localStorage.getItem('nexify_token')}` },
      });
      const data = await res.json();
      if (data.success) setRewards(data.data);
    } catch (err) {
      console.error(err);
    }
  }

  const currentLevel = LEVELS.find(l => l.name === stats.level) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progressToNext = nextLevel
    ? ((stats.totalPoints - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-16 h-16 ${currentLevel.bg} rounded-2xl flex items-center justify-center`}>
            <currentLevel.icon className={`w-8 h-8 ${currentLevel.color}`} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{stats.level}</h1>
            <p className="text-white/50 text-sm">{stats.totalPoints} points total</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">Rank</p>
            <p className="text-xl font-bold text-[#7C3AED]">#{stats.rank || '—'}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {nextLevel && (
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>{currentLevel.name}</span>
              <span>{nextLevel.name} ({nextLevel.min} pts)</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] to-[#c4b5fd] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['overview', 'leaderboard', 'rewards'].map(tab => (
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* How to earn */}
          <div className="bg-[#1E293B] border border-white/10 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#7C3AED]" />
              How to Earn Points
            </h2>
            <div className="space-y-3">
              {POINTS_LOG.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-[#7C3AED] flex-shrink-0" />
                    <span className="text-sm text-white/80">{item.action}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{item.points}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Levels */}
          <div className="bg-[#1E293B] border border-white/10 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#7C3AED]" />
              Level System
            </h2>
            <div className="space-y-3">
              {LEVELS.map((level, i) => {
                const isCurrentLevel = level.name === stats.level;
                const isUnlocked = stats.totalPoints >= level.min;
                const LevelIcon = level.icon;
                return (
                  <div
                    key={level.name}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCurrentLevel ? 'bg-[#7C3AED]/10 border border-[#7C3AED]/30' : 'bg-white/5'
                    }`}
                  >
                    <div className={`w-10 h-10 ${level.bg} rounded-xl flex items-center justify-center`}>
                      <LevelIcon className={`w-5 h-5 ${isUnlocked ? level.color : 'text-white/20'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isUnlocked ? 'text-white' : 'text-white/30'}`}>
                        {level.name}
                      </p>
                      <p className="text-xs text-white/40">
                        {level.max === Infinity ? `${level.min}+ pts` : `${level.min} - ${level.max} pts`}
                      </p>
                    </div>
                    {isCurrentLevel && (
                      <span className="text-xs px-2 py-1 bg-[#7C3AED] text-white rounded-full">Current</span>
                    )}
                    {!isUnlocked && <Lock className="w-4 h-4 text-white/20" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Top Learners
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No leaderboard data yet. Start earning points!</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.id || i}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    i < 3 ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-white/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-amber-500 text-black' :
                    i === 1 ? 'bg-gray-300 text-black' :
                    i === 2 ? 'bg-amber-700 text-white' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="w-8 h-8 bg-[#7C3AED]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#7C3AED] text-xs font-bold">
                      {entry.fullName?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{entry.fullName}</p>
                    <p className="text-xs text-white/40">{entry.levelName}</p>
                  </div>
                  <span className="text-sm font-bold text-[#7C3AED]">{entry.totalPoints} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8 col-span-2">No rewards available yet.</p>
          ) : (
            rewards.map((reward, i) => (
              <div
                key={reward.id || i}
                className={`bg-[#1E293B] border border-white/10 rounded-xl p-4 ${
                  reward.isClaimed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-[#7C3AED]/20 rounded-xl flex items-center justify-center">
                    <Gift className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  {reward.isClaimed && (
                    <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">Claimed</span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{reward.name}</h3>
                <p className="text-xs text-white/50 mb-3">{reward.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Requires: Level {reward.unlockLevel}</span>
                  {!reward.isClaimed && (
                    <button className="text-xs px-3 py-1 bg-[#7C3AED] text-white rounded-lg hover:brightness-110">
                      Claim
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
