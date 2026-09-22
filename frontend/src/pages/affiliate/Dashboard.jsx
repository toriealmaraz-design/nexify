/**
 * Affiliate Dashboard — Full-featured Partner Hub
 * Performance analytics, commission tracking, AI insights, top picks, promo banners.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MousePointer,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  ExternalLink,
  Trophy,
  Star,
  Zap,
  Lightbulb,
  ChevronRight,
  Copy,
  Check,
  BarChart3,
  Gift,
  Target,
  BookOpen,
  Users,
  TrendingDown,
  Link as LinkIcon,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Skeleton, SkeletonStats, SkeletonRow } from '../../components/Skeleton';
import axios from 'axios';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function SkeletonChart() {
  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 h-[280px] flex items-center justify-center">
      <div className="w-full h-full bg-white/5 rounded-lg animate-pulse" />
    </div>
  );
}

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

// ─── Performance Chart ──────────────────────────────────────────────
function PerformanceChart({ data }) {
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-xs">
        <p className="text-white/60">{payload[0]?.payload?.label}</p>
        <p className="text-white font-medium">GH₵ {payload[0]?.value?.toFixed(2) || '0.00'}</p>
      </div>
    );
  };

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 h-[280px]">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="Sales Performance" badge="LIVE" badgeColor="bg-emerald-500/20 text-emerald-400" />
        <BarChart3 className="w-4 h-4 text-white/20" />
      </div>
      {data?.some(d => d.sales > 0) ? (
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `GH₵${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="sales" stroke="#7C3AED" strokeWidth={2} fill="url(#salesGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex flex-col items-center justify-center gap-2">
          <BarChart3 className="w-10 h-10 text-white/10" />
          <p className="text-white/30 text-xs">No sales data yet — promote courses to see performance</p>
        </div>
      )}
    </div>
  );
}

// ─── AI Insights Card ─────────────────────────────────────────────
function AIInsightsCard({ totalEarned, conversionRate, totalClicks }) {
  const status = totalClicks === 0 ? 'ready' : totalEarned > 0 ? 'growing' : 'dormant';
  const messages = {
    ready: { status: 'Ready to start', subtext: 'Begin promoting products to see AI-powered insights here', color: 'text-sky-400', bg: 'border-sky-500/20 bg-sky-500/10' },
    growing: { status: 'Gaining momentum', subtext: `${totalClicks} clicks — ${conversionRate}% conversion. Keep promoting consistently.`, color: 'text-amber-400', bg: 'border-amber-500/20 bg-amber-500/10' },
    dormant: { status: 'Paused', subtext: 'No clicks in the last 7 days. Share your links again to reactivate.', color: 'text-red-400', bg: 'border-red-500/20 bg-red-500/10' },
  };
  const msg = messages[status];

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-amber-500/20 rounded-lg flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">AI Performance Insights</h3>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
            AI ENABLED
          </p>
        </div>
      </div>
      <div className={`border rounded-xl p-3 mb-3 ${msg.bg}`}>
        <p className={`text-xs font-medium ${msg.color} mb-0.5`}>Current status: {msg.status}</p>
        <p className="text-[11px] text-white/40">{msg.subtext}</p>
      </div>
      <div className="border border-white/5 rounded-xl p-3 bg-[#0F172A]/50">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
          <p className="text-xs font-medium text-white">AI Recommendation</p>
        </div>
        <p className="text-[11px] text-white/50">
          Share your affiliate link on social media or WhatsApp groups related to your niche for best results.
        </p>
      </div>
    </div>
  );
}

// ─── Actionable Tips ──────────────────────────────────────────────
function TipsCard() {
  const tips = [
    { label: 'Get Started', text: 'Begin with products you believe in', icon: Target, color: 'bg-emerald-500/20 text-emerald-400' },
    { label: 'Stay Consistent', text: 'Promote products regularly for best results', icon: TrendingUp, color: 'bg-amber-500/20 text-amber-400' },
    { label: 'Learn & Grow', text: 'Study successful affiliate strategies', icon: BookOpen, color: 'bg-sky-500/20 text-sky-400' },
  ];
  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
      <SectionHeader title="Actionable Tips" badge={null} />
      <div className="space-y-2">
        {tips.map(tip => (
          <div key={tip.label} className="border border-white/5 rounded-xl p-3 flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tip.color}`}>
              <tip.icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">{tip.label}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{tip.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────
function LeaderboardCard({ rank }) {
  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
      <SectionHeader title="General Leaderboard" badge={null} />
      <div className="flex items-center justify-center gap-3 py-4 text-center">
        <Trophy className="w-8 h-8 text-amber-400" />
        <div>
          <p className="text-white font-bold text-lg">#{rank || '—'}</p>
          <p className="text-white/40 text-xs">Your ranking</p>
        </div>
      </div>
      <p className="text-center text-[11px] text-white/30">Start promoting to climb the leaderboard</p>
    </div>
  );
}

// ─── Promotional Banner ───────────────────────────────────────────
function PromoBanner() {
  const [timeLeft, setTimeLeft] = useState({ days: 14, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.mins },
    { label: 'Secs', value: timeLeft.secs },
  ];

  return (
    <div className="bg-gradient-to-r from-[#7C3AED]/30 to-[#1E1B4B] border border-purple-500/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-1">
        <p className="text-[11px] text-purple-400 uppercase tracking-widest font-medium mb-1">Coming Up</p>
        <h3 className="text-white font-bold text-base mb-1">The Next Digital Wealth Summit</h3>
        <p className="text-white/50 text-xs">Exclusive affiliate webinar — learn strategies from top earners</p>
      </div>
      <div className="flex gap-2">
        {units.map(u => (
          <div key={u.label} className="text-center bg-black/30 rounded-lg px-3 py-2 min-w-[48px]">
            <p className="text-white font-bold text-lg">{String(u.value).padStart(2, '0')}</p>
            <p className="text-white/40 text-[10px] uppercase">{u.label}</p>
          </div>
        ))}
      </div>
      <button onClick={() => {}} className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex-shrink-0">
        Reserve Seat
      </button>
    </div>
  );
}

// ─── Onboarding Tracker ────────────────────────────────────────────
function OnboardingTracker({ totalClicks }) {
  const steps = [
    { label: 'Create account', done: true },
    { label: 'Generate link', done: totalClicks > 0 || false },
    { label: 'Make first click', done: totalClicks > 0 || false },
    { label: 'First sale', done: false },
  ];
  const progress = (steps.filter(s => s.done).length / steps.length) * 100;

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-white">Onboarding Progress</p>
        <span className="text-[11px] text-purple-400 font-medium">
          {steps.filter(s => s.done).length}/{steps.length}
        </span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-500' : 'bg-white/10'}`}>
              {step.done && <Check className="w-2.5 h-2.5 text-black" />}
            </div>
            <span className={`text-[11px] ${step.done ? 'text-white/60' : 'text-white/30'}`}>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────
function MetricCard({ label, value, subtext, icon: Icon, color, bgClass }) {
  return (
    <div className={bgClass}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[11px] text-white/40 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-[11px] text-white/30">{subtext}</p>
    </div>
  );
}

// ─── Top Products ─────────────────────────────────────────────────
function TopProductsCard({ products }) {
  const top = products.slice(0, 3);
  const labels = ['#1 Trending', '#2 Trending', '#3 Trending'];

  if (!top.length) {
    return (
      <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
        <SectionHeader title="Top Product Picks" badge="HOT" badgeColor="bg-red-500/20 text-red-400" />
        <div className="text-center py-8">
          <Gift className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-xs">No products available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
      <SectionHeader title="Top Product Picks" badge="HOT" badgeColor="bg-red-500/20 text-red-400" />
      <div className="space-y-1">
        {top.map((p, i) => (
          <div key={p.courseId || i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-amber-400 w-16">{labels[i]}</span>
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-white font-medium">{p.courseTitle || 'Course'}</p>
                <p className="text-[11px] text-white/40">{p.affiliateRate}% commission</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [links, setLinks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('WhatsApp Scripts');
  const [generatedLink, setGeneratedLink] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios.all([
    axios.get('/api/v1/affiliates/dashboard'),
    axios.get('/api/v1/affiliates/links'),
    axios.get('/api/v1/courses'),
    ]).then(axios.spread((dashRes, linksRes, coursesRes) => {
      setDashboard(dashRes.data.data || {});
      setLinks(linksRes.data.data || []);
      setCourses(coursesRes.data.data || []);
    })).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleGenerateLink = async () => {
    if (!courseId) return;
    setGenerating(true);
    try {
      const res = await axios.post('/api/v1/affiliates/links', { courseId });
      setGeneratedLink(res.data.data);
      setLinks(prev => [res.data.data, ...prev]);
    } catch {
      // handled silently — UI shows error state via generatedLink staying null
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = (code) => {
    navigator.clipboard.writeText(`${window.location.origin}/ref/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalEarned = dashboard?.totalEarnedGhs || 0;
  const totalClicks = dashboard?.totalClicks || 0;
  const conversionRate = dashboard?.conversionRate || 0;
  const clearedBalance = dashboard?.clearedBalanceGhs || 0;
  const pendingBalance = dashboard?.pendingBalanceGhs || 0;
  const courseBreakdown = dashboard?.courseBreakdown || [];

  // Weekly chart data — in production comes from backend analytics endpoint
  const weeklyData = [
    { label: 'Mon', sales: 0 }, { label: 'Tue', sales: 0 },
    { label: 'Wed', sales: 0 }, { label: 'Thu', sales: 0 },
    { label: 'Fri', sales: 0 }, { label: 'Sat', sales: 0 }, { label: 'Sun', sales: 0 },
  ];

  return (
    <div className="max-w-6xl">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Affiliate Hub</h1>
          <p className="text-white/40 text-sm mt-1">Promote courses, earn commissions, grow your network.</p>
        </div>
        <span className="text-xs bg-[#7C3AED]/20 text-[#7C3AED] font-medium px-2.5 py-1 rounded-full border border-[#7C3AED]/30">
          {user?.role}
        </span>
      </div>

      {/* Promotional banner */}
      <PromoBanner />

      {/* Stats row */}
      {loading ? (
        <SkeletonStats />
      ) : (
        <div data-tour="affiliate-stats-row" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Total Clicks" value={totalClicks.toLocaleString()} subtext="All time" icon={MousePointer} color="bg-blue-500/20 text-blue-400" bgClass="bg-[#1E293B] border border-white/5 rounded-xl p-4" />
          <MetricCard label="Conversions" value={dashboard?.totalConversions || 0} subtext={`${conversionRate}% rate`} icon={ShoppingCart} color="bg-emerald-500/20 text-emerald-400" bgClass="bg-[#1E293B] border border-white/5 rounded-xl p-4" />
          <MetricCard label="Pending Balance" value={`GH₵ ${pendingBalance.toFixed(2)}`} subtext="Next payout" icon={TrendingUp} color="bg-amber-500/20 text-amber-400" bgClass="bg-[#1E293B] border border-white/5 rounded-xl p-4" />
          <MetricCard label="Cleared Balance" value={`GH₵ ${clearedBalance.toFixed(2)}`} subtext="Available" icon={DollarSign} color="bg-emerald-500/20 text-emerald-400" bgClass="bg-[#1E293B] border border-white/5 rounded-xl p-4" />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: chart + AI insights */}
        <div className="lg:col-span-2 space-y-6">
          <PerformanceChart data={weeklyData} />
          <AIInsightsCard totalEarned={totalEarned} conversionRate={conversionRate} totalClicks={totalClicks} />
        </div>

        {/* Right: tips + leaderboard + onboarding + top products */}
        <div className="space-y-4">
          <Link
            to="/affiliate/courses"
            className="group block bg-gradient-to-r from-[#1E1B4B] to-[#0F172A] border border-white/10 rounded-xl p-5 hover:border-[#7C3AED]/40 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#7C3AED]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-[#7C3AED] transition-colors">Browse Courses</h3>
                <p className="text-[11px] text-white/40">Explore all available courses</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 text-[#7C3AED]">
              <span className="text-xs font-medium">View Courses</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          <TipsCard />
          <LeaderboardCard rank={null} />
          <OnboardingTracker totalClicks={totalClicks} />
          <TopProductsCard products={courseBreakdown} />
        </div>
      </div>

      {/* Commission breakdown by course */}
      {loading ? (
        <SkeletonRow count={3} />
      ) : courseBreakdown.length > 0 && (
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 mb-6">
          <SectionHeader title="Commission by Course" badge={null} />
          <div className="space-y-2">
            {courseBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Link className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{item.courseTitle}</p>
                    <p className="text-[11px] text-white/40">{item.clicks} clicks · {item.conversions} sales · {item.affiliateRate}% commission</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">GH₵ {item.revenue?.toFixed(2) || '0.00'}</p>
                  <Link to={`/course/${item.courseSlug}`} className="text-[11px] text-white/30 hover:text-white/60 flex items-center justify-end gap-1">
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link Generator */}
      <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Generate Referral Link</h2>
          <Link to="/affiliate/links" className="text-xs text-[#7C3AED] hover:text-[#9D5EF0] transition-colors font-medium flex items-center gap-1">
            Open Link Generator <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-2">
          <select
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white appearance-none cursor-pointer"
          >
            <option value="">Select a course...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <button
            onClick={handleGenerateLink}
            disabled={!courseId || generating}
            className="bg-[#7C3AED] hover:bg-[#8b5cf6] disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
        {generatedLink && (
          <div className="mt-3 flex gap-2">
            <input readOnly value={`${window.location.origin}/ref/${generatedLink.affiliateCode}`} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 font-mono" />
            <button onClick={() => copyLink(generatedLink.affiliateCode)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-1.5">
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
        )}
      </div>

      {/* My Links */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-white mb-4">My Affiliate Links</h2>
        {!loading && links.length === 0 ? (
          <div className="bg-[#1E293B] border border-white/5 rounded-xl p-8 text-center">
            <BarChart3 className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No links yet — generate your first tracking link above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {links.map(link => (
              <div key={link.id} className="bg-[#1E293B] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white font-medium">{link.course?.title || 'Unknown Course'}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Code: <span className="font-mono font-medium text-[#7C3AED]">{link.affiliateCode}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-white/40"><strong className="text-white">{link.clickCount || 0}</strong> clicks</span>
                  <span className="text-white/40"><strong className="text-emerald-400">{link.orders?.length || 0}</strong> sales</span>
                  <button onClick={() => copyLink(link.affiliateCode)} className="text-[#7C3AED] hover:text-[#9D5EF0] transition-colors font-medium flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sub-Affiliate + Asset Vault */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div data-tour="affiliate-onboarding-tracker" className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
          <SectionHeader title="Sub-Affiliate Network" badge="NEW" badgeColor="bg-amber-500/20 text-amber-400" />
          <p className="text-xs text-white/40 mb-3">Recruit other affiliates and earn override commissions on their sales.</p>
          <div className="flex gap-2">
            <button onClick={() => {}} className="bg-[#7C3AED] hover:bg-[#8b5cf6] text-white px-4 py-2 rounded-xl text-xs font-medium transition-colors">
              + Recruit
            </button>
            <button onClick={() => {}} className="border border-white/10 text-white/60 px-4 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors">
              Override Earnings
            </button>
          </div>
        </div>
        <div data-tour="affiliate-tools-vault" className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
          <SectionHeader title="Promoter Asset Vault" badge={null} />
          <p className="text-xs text-white/40 mb-3">Copy-paste scripts, TikTok hooks, and banners from course creators.</p>
          <div className="flex flex-wrap gap-2">
            {['WhatsApp Scripts', 'TikTok Scripts', 'Email Copy', 'Banners'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
                  activeTab === tab
                    ? 'bg-[#7C3AED] text-black font-medium'
                    : 'border border-white/10 text-white/60 hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
