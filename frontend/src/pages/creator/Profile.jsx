/**
 * Creator Profile — Course Analytics & Instructor Settings
 * Published courses, revenue breakdown, payout settings, instructor bio.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  DollarSign,
  TrendingUp,
  Users,
  PlusCircle,
  Star,
  Settings,
  Camera,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'courses', label: 'My Courses' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'payout', label: 'Payout Settings' },
  { id: 'instructor', label: 'Instructor Profile' },
];



function Skeleton({ className }) {
  return <div className={`bg-white/5 rounded-lg animate-pulse ${className}`} />;
}

export default function CreatorProfile() {
  const { user, api } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses/stats/creator')
      .then(res => setCourses(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = courses.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
  const publishedCount = courses.filter(c => c.status === 'PUBLISHED').length;
  const pendingCount = courses.filter(c => c.status === 'PENDING').length;

  return (
    <div className="max-w-5xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Creator Studio</h1>
        <p className="text-white/40 text-sm mt-1">Manage your courses and earnings</p>
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
      <div data-tour="creator-profile-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Published</span>
          </div>
          <p className="text-2xl font-bold text-white">{publishedCount}</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl font-bold text-white">{pendingCount}</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Students</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalStudents}</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
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
                ? 'border-emerald-500 text-white'
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
      ) : activeTab === 'courses' ? (
        <CoursesTab courses={courses} />
      ) : activeTab === 'revenue' ? (
        <RevenueTab courses={courses} totalRevenue={totalRevenue} />
      ) : activeTab === 'payout' ? (
        <PayoutTab />
      ) : (
        <InstructorTab user={user} />
      )}
    </div>
  );
}

function CoursesTab({ courses }) {
  if (!courses.length) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm">No courses yet</p>
        <Link to="/creator/course/new" className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300">
          <PlusCircle className="w-4 h-4" /> Create your first course
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {courses.map(course => (
        <div key={course.id} className="bg-[#1E293B] border border-white/5 rounded-xl p-4 flex gap-4">
          <div className="w-16 h-16 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-medium text-white truncate">{course.title || 'Untitled Course'}</h3>
              <span className={`flex-shrink-0 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                course.status === 'PUBLISHED'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : course.status === 'PENDING'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-white/10 text-white/50'
              }`}>
                {course.status === 'PUBLISHED' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {course.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/40 mb-2">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {course.enrolledCount || 0} students
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${(course.revenue || 0).toFixed(2)}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {course.rating || '0.0'}
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/creator/course/${course.id}/edit`}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Edit
              </Link>
              <Link
                to={`/course/${course.id}`}
                className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1"
              >
                View <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenueTab({ courses, totalRevenue }) {
  const published = courses.filter(c => c.status === 'PUBLISHED');
  const pending = courses.filter(c => c.status !== 'PUBLISHED');

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-[#1E293B] border border-white/5 rounded-xl p-6">
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">Revenue Summary</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-white/40 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Platform Fee ({DEFAULT_FEE}%)</p>
            <p className="text-3xl font-bold text-amber-400">-${(totalRevenue * DEFAULT_FEE / 100).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Per-course breakdown */}
      <div>
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">By Course</h3>
        {published.length === 0 ? (
          <p className="text-white/40 text-sm">No published courses yet</p>
        ) : (
          <div className="space-y-2">
            {published.map(course => (
              <div key={course.id} className="bg-[#1E293B] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-white truncate mr-4">{course.title}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-white/40">{course.enrolledCount || 0} sales</span>
                  <span className="text-emerald-400 font-medium">${(course.revenue || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PayoutTab() {
  const [payoutInfo, setPayoutInfo] = useState({ bankName: '', accountNumber: '', routingNumber: '' });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-md">
      <div className="bg-[#1E293B] border border-white/5 rounded-xl p-6">
        <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">Bank Details</h3>
        <p className="text-xs text-white/40 mb-4">Receive payouts directly to your bank account. Payouts are processed on the 1st and 15th of each month.</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Bank Name</label>
            <input
              type="text"
              value={payoutInfo.bankName}
              onChange={e => setPayoutInfo(p => ({ ...p, bankName: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Ecobank"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Account Number</label>
            <input
              type="text"
              value={payoutInfo.accountNumber}
              onChange={e => setPayoutInfo(p => ({ ...p, accountNumber: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
              placeholder="Account number"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Routing Number / Sort Code</label>
            <input
              type="text"
              value={payoutInfo.routingNumber}
              onChange={e => setPayoutInfo(p => ({ ...p, routingNumber: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
              placeholder="e.g. 000000"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {saved ? 'Saved!' : 'Save Bank Details'}
          </button>
        </form>
      </div>
    </div>
  );
}

function InstructorTab({ user }) {
  const [bio, setBio] = useState(user?.bio || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('nexify_token');
      await axios.patch('/api/v1/auth/profile', {
        headline,
        website,
        // bio is not yet supported by the auth profile endpoint
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="bg-[#1E293B] border border-white/5 rounded-xl p-6">
        <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">Public Instructor Profile</h3>
        <p className="text-xs text-white/40 mb-4">This appears on your course pages and in the instructor directory.</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Professional Headline</label>
            <input
              type="text"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              maxLength={100}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Digital Marketing Expert with 10+ years experience"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 resize-none"
              placeholder="Tell students about your background and expertise..."
            />
            <p className="text-xs text-white/30 mt-1 text-right">{bio.length}/500</p>
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Website</label>
            <input
              type="url"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
              placeholder="https://yourwebsite.com"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}


