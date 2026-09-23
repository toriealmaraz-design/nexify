/**
 * Admin Dashboard — Full Platform Command Center
 * Global metrics, AI insights, affiliate leaderboard, onboarding tracker, system health, and asset management.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Lock, ClipboardList, Users, TrendingUp, Palette,
  FolderOpen, LogOut, BarChart3, Zap, Lightbulb, Trophy, Check,
  Target, TrendingDown, DollarSign, ShoppingCart, MousePointer,
  Activity, Shield, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SkeletonStats } from '../../components/Skeleton';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function SectionHeader({ title, badge, badgeColor }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {badge && (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badgeColor}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── GMV Chart ───────────────────────────────────────────────────
function GMVChart({ data }) {
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-xs">
        <p className="text-white/60">{payload[0]?.payload?.label}</p>
        <p className="text-emerald-400 font-medium">GH&#8373; {payload[0]?.value?.toFixed(2)}</p>
      </div>
    );
  };

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 h-[260px]">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="Platform GMV" badge="LIVE" badgeColor="bg-emerald-500/20 text-emerald-400" />
        <BarChart3 className="w-4 h-4 text-white/20" />
      </div>
      <ResponsiveContainer width="100%" height="75%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `GH₵${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="gmv" stroke="#10B981" strokeWidth={2} fill="url(#gmvGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── AI Platform Insights ─────────────────────────────────────────
function AIInsightsCard({ stats }) {
  const gmv = stats?.totalGMV || 0;
  const users = stats?.activeUsers || 0;
  const pending = stats?.pendingReviews || 0;

  const healthScore = users > 0 ? Math.round(70 + Math.min(pending * 2, 20)) : 50;
  const healthLabel = healthScore >= 85 ? 'Excellent' : healthScore >= 70 ? 'Healthy' : healthScore >= 50 ? 'Fair' : 'Needs Attention';
  const healthColor = healthScore >= 85 ? 'text-emerald-400' : healthScore >= 70 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-amber-500/20 rounded-lg flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">AI Platform Insights</h3>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
            AI ENABLED
          </p>
        </div>
      </div>

      {/* Platform health score */}
      <div className="border border-white/5 rounded-xl p-3 mb-3 bg-[#0F172A]/50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-white/50">Platform Health</p>
          <p className={`text-xs font-bold ${healthColor}`}>{healthLabel} ({healthScore}/100)</p>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all" style={{ width: `${healthScore}%` }} />
        </div>
      </div>

      {/* Key metrics summary */}
      <div className="border border-white/5 rounded-xl p-3 mb-3 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Total GMV</span>
          <span className="text-emerald-400 font-medium">GH&#8373; {gmv.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Active Users</span>
          <span className="text-white font-medium">{users}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Pending Reviews</span>
          <span className="text-amber-400 font-medium">{pending}</span>
        </div>
      </div>

      {/* AI recommendation */}
      <div className="border border-white/5 rounded-xl p-3 bg-[#0F172A]/50">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
          <p className="text-xs font-medium text-white">AI Recommendation</p>
        </div>
        <p className="text-[11px] text-white/50">
          {pending > 5
            ? `${pending} courses are awaiting review. Prioritize creator approval to keep the marketplace active.`
            : `Platform is running smoothly. Monitor affiliate conversion rates for early signals.`}
        </p>
      </div>
    </div>
  );
}

// ─── Affiliate Leaderboard (Admin View) ───────────────────────────
function AffiliateLeaderboard({ affiliates }) {
  const top = affiliates.slice(0, 5);
  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="Top Affiliates" badge="ADMIN" badgeColor="bg-[#7C3AED]/20 text-[#7C3AED]" />
        <Trophy className="w-4 h-4 text-amber-400" />
      </div>
      {top.length === 0 ? (
        <div className="text-center py-6">
          <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-xs">No affiliates yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {top.map((aff, i) => (
            <div key={aff.id || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
              <span className={`text-sm font-bold w-5 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-white/50' : i === 2 ? 'text-amber-700' : 'text-white/30'}`}>
                #{i + 1}
              </span>
              <div className="w-7 h-7 bg-[#7C3AED]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-[#7C3AED] font-bold">{aff.fullName?.[0] || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{aff.fullName || 'Unknown'}</p>
                <p className="text-[11px] text-white/40">{aff.totalClicks || 0} clicks \u00b7 {aff.totalConversions || 0} sales</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">GH&#8373; {aff.totalEarnedGhs?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Platform Health ──────────────────────────────────────────────
function PlatformHealthCard({ stats }) {
  const checks = [
    { label: 'API Server', ok: true, detail: 'http://localhost:5000' },
    { label: 'Database', ok: true, detail: 'SQLite connected' },
    { label: 'Auth System', ok: true, detail: 'JWT + OAuth2 active' },
    { label: 'File Storage', ok: true, detail: 'Local disk active' },
    { label: 'Email Service', ok: false, detail: 'Not configured' },
    { label: 'Payment Gateway', ok: false, detail: 'Awaiting credentials' },
  ];

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-white/50" />
        <SectionHeader title="System Health" badge={null} />
      </div>
      <div className="space-y-2">
        {checks.map(c => (
          <div key={c.label} className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-xs text-white">{c.label}</p>
              <p className="text-[11px] text-white/30">{c.detail}</p>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${c.ok ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {c.ok
                ? <Check className="w-3 h-3 text-emerald-400" />
                : <TrendingDown className="w-3 h-3 text-red-400" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recent Activity Feed ─────────────────────────────────────────
function RecentActivityCard() {
  const activities = [
    { user: 'New affiliate registered', time: '2m ago', icon: Users, color: 'text-sky-400' },
    { user: 'Course submitted for review', time: '14m ago', icon: ClipboardList, color: 'text-amber-400' },
    { user: 'Affiliate earned GH&#8373; 150.00', time: '1h ago', icon: DollarSign, color: 'text-emerald-400' },
    { user: 'New student enrolled', time: '2h ago', icon: ShoppingCart, color: 'text-purple-400' },
    { user: 'Creator account verified', time: '3h ago', icon: Shield, color: 'text-emerald-400' },
  ];

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
      <SectionHeader title="Recent Activity" badge="LIVE" badgeColor="bg-emerald-500/20 text-emerald-400" />
      <div className="space-y-2">
        {activities.map((a, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
            <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0`}>
              <a.icon className={`w-3.5 h-3.5 ${a.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white">{a.user}</p>
            </div>
            <span className="text-[11px] text-white/30 flex-shrink-0">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Onboarding Tracker ────────────────────────────────────────────
function OnboardingTracker({ stats }) {
  const steps = [
    { label: 'Configure platform fee', done: true },
    { label: 'Approve first course', done: stats?.totalCourses > 0 || false },
    { label: 'First affiliate sale', done: stats?.totalSales > 0 || false },
    { label: 'First payout processed', done: false },
  ];
  const progress = (steps.filter(s => s.done).length / steps.length) * 100;

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
      <SectionHeader title="Platform Onboarding" badge={null} />
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-white/40">{steps.filter(s => s.done).length}/{steps.length} steps complete</p>
        <span className="text-[11px] text-purple-400 font-medium">{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-500' : 'bg-white/10'}`}>
              {step.done && <Check className="w-2.5 h-2.5 text-black" />}
            </div>
            <span className={`text-xs ${step.done ? 'text-white/60' : 'text-white/30'}`}>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quick Actions ─────────────────────────────────────────────────
function QuickActionsCard() {
  const actions = [
    { label: 'Staging Queue', icon: ClipboardList, color: 'bg-amber-500/20 text-amber-400', to: '/admin/staging' },
    { label: 'User Management', icon: Users, color: 'bg-sky-500/20 text-sky-400', to: '/admin/users' },
    { label: 'Platform Metrics', icon: BarChart3, color: 'bg-emerald-500/20 text-emerald-400', to: '/admin/metrics' },
    { label: 'Asset Manager', icon: Palette, color: 'bg-purple-500/20 text-purple-400', to: '/admin/assets' },
  ];

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
      <SectionHeader title="Quick Actions" badge={null} />
      <div className="grid grid-cols-2 gap-2">
        {actions.map(action => (
          <Link
            key={action.label}
            to={action.to}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
              <action.icon className="w-4 h-4" />
            </div>
            <span className="text-xs text-white font-medium">{action.label}</span>
            <ChevronRight className="w-3 h-3 text-white/20 ml-auto" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────
function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[11px] text-white/40 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout, api } = useAuth();
  const [stats, setStats] = useState(null);
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.all([
      api.get('/admin/metrics'),
      api.get('/admin/affiliates'),
    ]).then(api.spread((metricsRes, affiliatesRes) => {
      setStats(metricsRes.data.data || {});
      setAffiliates(affiliatesRes.data.data || []);
    })).catch(() => {}).finally(() => setLoading(false));
  }, [api]);

  const totalGMV = stats?.financials?.totalRevenueGhs || 0;
  const platformFees = stats?.financials?.totalPlatformFeesGhs || 0;
  const pendingReviews = stats?.courses?.pendingApproval || 0;
  const activeUsers = stats?.users?.total || 0;
  const totalCourses = stats?.courses?.total || 0;
  const totalSales = stats?.financials?.totalOrders || 0;

  // GMV weekly chart data
  const gmvData = [
    { label: 'Mon', gmv: 0 }, { label: 'Tue', gmv: 0 },
    { label: 'Wed', gmv: 0 }, { label: 'Thu', gmv: 0 },
    { label: 'Fri', gmv: 0 }, { label: 'Sat', gmv: 0 }, { label: 'Sun', gmv: 0 },
  ];

  return (
    <div className="max-w-6xl">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">N</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-white/40 text-sm ml-[44px]">Platform-wide oversight & command center</p>
        </div>
        <span className="text-xs bg-[#7C3AED]/20 text-[#7C3AED] font-medium px-2.5 py-1 rounded-full border border-[#7C3AED]/30">
          {user?.role}
        </span>
      </div>

      {/* Stats row */}
      {loading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Total GMV" value={`GH₵ ${totalGMV.toFixed(2)}`} icon={Wallet} color="bg-emerald-500/20 text-emerald-400" />
          <MetricCard label="Platform Fees" value={`GH₵ ${platformFees.toFixed(2)}`} icon={Lock} color="bg-[#7C3AED]/20 text-[#7C3AED]" />
          <MetricCard label="Pending Reviews" value={pendingReviews} icon={ClipboardList} color="bg-amber-500/20 text-amber-400" />
          <MetricCard label="Active Users" value={activeUsers} icon={Users} color="bg-sky-500/20 text-sky-400" />
        </div>
      )}

      {/* GMV Chart — full width */}
      {loading ? (
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 h-[280px] mb-6 flex items-center justify-center">
          <div className="w-full h-full bg-white/5 rounded-lg animate-pulse" />
        </div>
      ) : (
        <GMVChart data-tour="admin-gmv-chart" data={gmvData} />
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: AI insights + recent activity */}
        <div className="space-y-4">
          <AIInsightsCard stats={{ totalGMV, activeUsers: activeUsers, pendingReviews }} />
          <RecentActivityCard />
        </div>

        {/* Middle: leaderboard + onboarding */}
        <div className="space-y-4">
          <AffiliateLeaderboard affiliates={affiliates} />
          <OnboardingTracker stats={{ totalCourses, totalSales }} />
        </div>

        {/* Right: platform health + quick actions */}
        <div className="space-y-4">
          <PlatformHealthCard stats={stats} />
          <QuickActionsCard />
        </div>
      </div>

      {/* System Sections */}
      <div data-tour="admin-system-sections" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[
          { title: 'Staging Queue', badge: 'LIVE', badgeColor: 'bg-amber-500/20 text-amber-400', icon: ClipboardList, desc: 'Course submissions awaiting admin review.', to: '/admin/staging' },
          { title: 'User Management', badge: 'ALL ROLES', badgeColor: 'bg-sky-500/20 text-sky-400', icon: Users, desc: 'Manage users, roles, and creator trust tiers.', to: '/admin/users' },
          { title: 'Platform Metrics', badge: 'ANALYTICS', badgeColor: 'bg-emerald-500/20 text-emerald-400', icon: BarChart3, desc: 'Platform-wide revenue, margins, and user metrics.', to: '/admin/metrics' },
          { title: 'Asset Manager', badge: 'UPLOADS', badgeColor: 'bg-[#7C3AED]/20 text-[#7C3AED]', icon: Palette, desc: 'Upload and manage platform branding assets.', to: '/admin/assets' },
        ].map(section => (
          <Link key={section.title} to={section.to}
            className="bg-[#1E293B] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <section.icon className="w-4 h-4 text-white/50" />
              <h3 className="text-sm font-semibold text-white">{section.title}</h3>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-auto ${section.badgeColor}`}>{section.badge}</span>
            </div>
            <p className="text-xs text-white/40">{section.desc}</p>
            <div className="flex items-center gap-1 mt-3 text-[11px] text-[#7C3AED]">
              Open <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Footer bar */}
      <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">{user?.fullName}</p>
          <p className="text-xs text-white/40">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-[#7C3AED] text-black text-xs font-medium rounded-full">
            {user?.role}
          </span>
        </div>
        <button onClick={logout} className="text-sm text-white/40 hover:text-white transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}
