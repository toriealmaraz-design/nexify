/**
 * Admin Gamification — full management dashboard
 * Manage badges, rewards, levels, view leaderboard, seed defaults
 */
import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Star, Plus, Trash2, RefreshCw, Users, Zap, Crown, Medal, Flame } from 'lucide-react';

const LEVELS = [
  { name: 'Newcomer', min: 0, max: 99, color: 'text-gray-400', bg: 'bg-gray-500/20', icon: Star },
  { name: 'Explorer', min: 100, max: 299, color: 'text-sky-400', bg: 'bg-sky-500/20', icon: Zap },
  { name: 'Achiever', min: 300, max: 599, color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: Medal },
  { name: 'Expert', min: 600, max: 999, color: 'text-purple-400', bg: 'bg-purple-500/20', icon: Crown },
  { name: 'Master', min: 1000, max: null, color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Flame },
];

export default function AdminGamification() {
  const [badges, setBadges] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [badgeForm, setBadgeForm] = useState({ name: '', description: '', category: 'ACHIEVEMENT', requirement: 1, actionType: 'CUSTOM' });
  const [rewardForm, setRewardForm] = useState({ name: '', description: '', type: 'DISCOUNT_COUPON', pointsCost: 0, unlockLevel: 1, couponCode: '', discountPercent: 0 });
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchAll() {
    try {
      const token = localStorage.getItem('nexify_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [b, r, l] = await Promise.all([
        fetch('/api/v1/gamification/admin/badges', { headers }),
        fetch('/api/v1/gamification/admin/rewards', { headers }),
        fetch('/api/v1/gamification/admin/leaderboard', { headers }),
      ]);
      const bd = await b.json();
      const rd = await r.json();
      const ld = await l.json();
      if (bd.success) setBadges(bd.data);
      if (rd.success) setRewards(rd.data);
      if (ld.success) setLeaderboard(ld.data);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const token = localStorage.getItem('nexify_token');
      const res = await fetch('/api/v1/gamification/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Seeded ${data.data.badgesSeeded} badges & ${data.data.rewardsSeeded} rewards`);
        fetchAll();
      }
    } catch (err) {
      showToast('Seed failed', 'error');
    } finally {
      setSeeding(false);
    }
  }

  async function handleCreateBadge(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem('nexify_token');
      const res = await fetch('/api/v1/gamification/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(badgeForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Badge created');
        setShowBadgeForm(false);
        setBadgeForm({ name: '', description: '', category: 'ACHIEVEMENT', requirement: 1, actionType: 'CUSTOM' });
        fetchAll();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Failed to create badge', 'error');
    }
  }

  async function handleDeleteBadge(id) {
    if (!confirm('Delete this badge?')) return;
    try {
      const token = localStorage.getItem('nexify_token');
      await fetch(`/api/v1/gamification/admin/badges/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      showToast('Badge deleted');
      fetchAll();
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  }

  async function handleCreateReward(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem('nexify_token');
      const res = await fetch('/api/v1/gamification/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(rewardForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Reward created');
        setShowRewardForm(false);
        setRewardForm({ name: '', description: '', type: 'DISCOUNT_COUPON', pointsCost: 0, unlockLevel: 1, couponCode: '', discountPercent: 0 });
        fetchAll();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Failed to create reward', 'error');
    }
  }

  async function handleDeleteReward(id) {
    if (!confirm('Delete this reward?')) return;
    try {
      const token = localStorage.getItem('nexify_token');
      await fetch(`/api/v1/gamification/admin/rewards/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      showToast('Reward deleted');
      fetchAll();
    } catch (err) {
      showToast('Failed to delete', 'error');
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
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${toast.type === 'success' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gamification</h1>
          <p className="text-white/50 text-sm">Manage badges, rewards, levels & view leaderboard</p>
        </div>
        <button onClick={handleSeed} disabled={seeding} className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-medium hover:brightness-110 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
          {seeding ? 'Seeding...' : 'Seed Defaults'}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {['overview', 'leaderboard', 'badges', 'rewards', 'levels'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-[#7C3AED] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Badges" value={badges.length} icon={Star} color="text-amber-400" />
          <StatCard label="Total Rewards" value={rewards.length} icon={Gift} color="text-emerald-400" />
          <StatCard label="Leaderboard" value={leaderboard.length} icon={Users} color="text-[#7C3AED]" />
          <StatCard label="Levels" value={5} icon={Trophy} color="text-sky-400" />
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Full Leaderboard
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No users on the leaderboard yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs uppercase border-b border-white/5">
                    <th className="text-left py-2 px-3">Rank</th>
                    <th className="text-left py-2 px-3">User</th>
                    <th className="text-left py-2 px-3">Role</th>
                    <th className="text-left py-2 px-3">Level</th>
                    <th className="text-left py-2 px-3">Streak</th>
                    <th className="text-right py-2 px-3">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr key={entry.userId} className={`border-b border-white/5 ${i < 3 ? 'bg-amber-500/5' : ''}`}>
                      <td className="py-3 px-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white/60'
                        }`}>{i + 1}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[#7C3AED]/20 rounded-full flex items-center justify-center">
                            <span className="text-[#7C3AED] text-xs font-bold">{entry.fullName?.charAt(0) || '?'}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{entry.fullName}</p>
                            <p className="text-xs text-white/40">{entry.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3"><span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">{entry.role}</span></td>
                      <td className="py-3 px-3 text-white/60">{entry.levelName}</td>
                      <td className="py-3 px-3 text-amber-400">{entry.loginStreak || 0} days</td>
                      <td className="py-3 px-3 text-right font-bold text-[#7C3AED]">{entry.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Badges ({badges.length})</h2>
            <button onClick={() => setShowBadgeForm(!showBadgeForm)} className="flex items-center gap-1 px-3 py-1.5 bg-[#7C3AED] text-white rounded-lg text-xs font-medium">
              <Plus className="w-3 h-3" /> New Badge
            </button>
          </div>
          {showBadgeForm && (
            <form onSubmit={handleCreateBadge} className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input placeholder="Badge name *" value={badgeForm.name} onChange={e => setBadgeForm(f => ({ ...f, name: e.target.value }))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" required />
                <select value={badgeForm.category} onChange={e => setBadgeForm(f => ({ ...f, category: e.target.value }))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none">
                  <option value="ACHIEVEMENT">Achievement</option>
                  <option value="MILESTONE">Milestone</option>
                  <option value="STREAK">Streak</option>
                  <option value="SPECIAL">Special</option>
                </select>
                <input placeholder="Description" value={badgeForm.description} onChange={e => setBadgeForm(f => ({ ...f, description: e.target.value }))} className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
                <input type="number" placeholder="Requirement count" value={badgeForm.requirement} onChange={e => setBadgeForm(f => ({ ...f, requirement: parseInt(e.target.value) || 1 }))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
                <input placeholder="Action type" value={badgeForm.actionType} onChange={e => setBadgeForm(f => ({ ...f, actionType: e.target.value }))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowBadgeForm(false)} className="px-3 py-1.5 text-white/60 text-sm hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#7C3AED] text-white rounded-lg text-sm font-medium">Create</button>
              </div>
            </form>
          )}
          {badges.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No badges. Click &quot;Seed Defaults&quot; or create one above.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {badges.map(badge => (
                <div key={badge.id} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center"><Star className="w-4 h-4 text-[#7C3AED]" /></div>
                      <div><p className="text-sm font-medium text-white">{badge.name}</p><p className="text-xs text-white/40">{badge.category}</p></div>
                    </div>
                    <button onClick={() => handleDeleteBadge(badge.id)} className="text-white/20 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  {badge.description && <p className="text-xs text-white/50 mb-2">{badge.description}</p>}
                  <p className="text-xs text-white/30">Requires: {badge.requirement}x {badge.actionType}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Rewards ({rewards.length})</h2>
            <button onClick={() => setShowRewardForm(!showRewardForm)} className="flex items-center gap-1 px-3 py-1.5 bg-[#7C3AED] text-white rounded-lg text-xs font-medium">
              <Plus className="w-3 h-3" /> New Reward
            </button>
          </div>
          {showRewardForm && (
            <form onSubmit={handleCreateReward} className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input placeholder="Reward name *" value={rewardForm.name} onChange={e => setRewardForm(f => ({ ...f, name: e.target.value }))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" required />
                <select value={rewardForm.type} onChange={e => setRewardForm(f => ({ ...f, type: e.target.value }))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none">
                  <option value="DISCOUNT_COUPON">Discount Coupon</option>
                  <option value="EXCLUSIVE_BADGE">Exclusive Badge</option>
                  <option value="EARLY_ACCESS">Early Access</option>
                  <option value="FREE_COURSE">Free Course</option>
                </select>
                <input placeholder="Description" value={rewardForm.description} onChange={e => setRewardForm(f => ({ ...f, description: e.target.value }))} className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
                <input type="number" placeholder="Points cost" value={rewardForm.pointsCost} onChange={e => setRewardForm(f => ({ ...f, pointsCost: parseInt(e.target.value) || 0 }))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
                <input type="number" placeholder="Unlock level" value={rewardForm.unlockLevel} onChange={e => setRewardForm(f => ({ ...f, unlockLevel: parseInt(e.target.value) || 1 }))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
                <input placeholder="Coupon code" value={rewardForm.couponCode || ''} onChange={e => setRewardForm(f => ({ ...f, couponCode: e.target.value }))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
                <input type="number" placeholder="Discount %" value={rewardForm.discountPercent || 0} onChange={e => setRewardForm(f => ({ ...f, discountPercent: parseInt(e.target.value) || 0 }))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowRewardForm(false)} className="px-3 py-1.5 text-white/60 text-sm hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#7C3AED] text-white rounded-lg text-sm font-medium">Create</button>
              </div>
            </form>
          )}
          {rewards.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No rewards. Click &quot;Seed Defaults&quot; or create one above.</p>
          ) : (
            <div className="space-y-3">
              {rewards.map(reward => (
                <div key={reward.id} className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center"><Gift className="w-5 h-5 text-emerald-400" /></div>
                    <div><p className="text-sm font-medium text-white">{reward.name}</p><p className="text-xs text-white/40">{reward.description}</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right"><p className="text-xs text-white/40">Lvl {reward.unlockLevel} · {reward.pointsCost} pts</p><p className="text-xs text-white/30">{reward.type.replace('_', ' ')}</p></div>
                    <button onClick={() => handleDeleteReward(reward.id)} className="text-white/20 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'levels' && (
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Level Thresholds</h2>
          <p className="text-white/40 text-sm mb-4">Levels are based on total points earned. Users automatically level up when they reach the threshold.</p>
          <div className="space-y-3">
            {LEVELS.map((level, i) => {
              const LevelIcon = level.icon;
              return (
                <div key={level.name} className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className={`w-12 h-12 ${level.bg} rounded-xl flex items-center justify-center`}><LevelIcon className={`w-6 h-6 ${level.color}`} /></div>
                  <div className="flex-1"><p className="text-sm font-medium text-white">{level.name}</p><p className="text-xs text-white/40">Level {i + 1} · {level.max ? `${level.min} – ${level.max} points` : `${level.min}+ points`}</p></div>
                  <span className={`text-xs px-3 py-1 rounded-full bg-white/10 ${level.color}`}>{level.min}+ pts</span>
                </div>
              );
            })}
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
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center"><Icon className={`w-5 h-5 ${color}`} /></div>
        <div><p className="text-xs text-white/40">{label}</p><p className="text-xl font-bold text-white">{value}</p></div>
      </div>
    </div>
  );
}
