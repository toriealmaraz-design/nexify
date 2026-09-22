/**
 * Shared MyCourses Page — STUDENT & AFFILIATE portals
 * Browse all published courses or enrolled courses with progress tracking.
 *
 * Design: Dark #0F172A body, white cards, purple #7C3AED accents, Inter font
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  BookOpen,
  ChevronDown,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';

// ─── API base ───────────────────────────────────────────────────
const API = '/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('nexify_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Skeleton card ──────────────────────────────────────────────
function CourseCardSkeleton() {
  return (
    <div className="bg-[#1E293B] border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-5">
        <div className="h-4 w-24 bg-white/5 rounded-full mb-3" />
        <div className="h-5 w-full bg-white/5 rounded-xl mb-2" />
        <div className="h-5 w-3/4 bg-white/5 rounded-xl mb-3" />
        <div className="h-3 w-32 bg-white/5 rounded-lg mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <div className="h-3 w-24 bg-white/5 rounded-lg" />
          <div className="h-3 w-16 bg-white/5 rounded-lg" />
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full mb-2" />
        <div className="h-3 w-20 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Course card ─────────────────────────────────────────────────
function CourseCard({ course, showProgress = false }) {
  const {
    id,
    title,
    coverImageUrl,
    creator,
    lessonsCount,
    progress = 0,
    lastActivityAt,
    order,
  } = course;

  const isComplete = progress >= 100;
  const hasImage = Boolean(coverImageUrl);

  const lastActivity = lastActivityAt
    ? new Date(lastActivityAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  return (
    <div className="bg-[#1E293B] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col">
      {/* Thumbnail */}
      <Link
        to={`/student/course/${id}`}
        className="block aspect-video bg-[#0F172A] relative overflow-hidden flex-shrink-0"
      >
        {hasImage ? (
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED]/20 to-[#1E293B]">
            <BookOpen className="w-10 h-10 text-white/20" />
          </div>
        )}
        {/* Complete badge */}
        {isComplete && (
          <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETE
          </span>
        )}
        {/* Lesson count */}
        <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {lessonsCount || 0} lesson{(lessonsCount || 0) === 1 ? '' : 's'}
        </span>
      </Link>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <Link to={`/student/course/${id}`}>
          <h3 className="font-bold text-white text-base leading-snug mb-1 line-clamp-2 hover:text-[#7C3AED] transition-colors">
            {title}
          </h3>
        </Link>

        {/* Creator */}
        <p className="text-white/40 text-sm mb-3">
          by {creator?.fullName || 'Unknown Instructor'}
        </p>

        {/* Progress bar */}
        {showProgress && (
          <>
            <div className="mt-auto">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/40">Progress</span>
                <span
                  className={`font-semibold ${
                    isComplete ? 'text-emerald-400' : 'text-[#7C3AED]'
                  }`}
                >
                  {isComplete ? '100% Complete' : `${progress}%`}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isComplete ? 'bg-emerald-500' : 'bg-[#7C3AED]'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
            {lastActivity && (
              <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last activity on {lastActivity}
              </p>
            )}
          </>
        )}

        {!showProgress && (
          <div className="mt-auto pt-3 border-t border-white/10">
            <Link
              to={`/student/course/${id}`}
              className="text-sm font-semibold text-[#7C3AED] hover:text-[#9D5EF0] transition-colors"
            >
              View Course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────
function EmptyState({ tab }) {
  const isMyCourses = tab === 'my';
  return (
    <div className="col-span-full py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1E293B] border border-white/10 rounded-full mb-4">
        <BookOpen className="w-8 h-8 text-white/30" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">
        {isMyCourses ? 'No enrolled courses yet' : 'No courses available'}
      </h3>
      <p className="text-white/40 text-sm max-w-xs mx-auto">
        {isMyCourses
          ? 'You have not purchased any courses. Browse the catalog to get started.'
          : 'Check back later for new course listings.'}
      </p>
    </div>
  );
}

// ─── Sort dropdown ───────────────────────────────────────────────
function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const options = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'az', label: 'A → Z' },
    { value: 'za', label: 'Z → A' },
  ];
  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#1E293B] border border-white/10 text-white text-sm px-3 py-2 rounded-xl hover:border-white/20 transition-colors"
      >
        <span>{selected.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-[#1E293B] border border-white/10 rounded-xl overflow-hidden min-w-[140px]">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  opt.value === value
                    ? 'bg-[#7C3AED]/20 text-[#7C3AED] font-medium'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Instructor filter dropdown ───────────────────────────────────
function InstructorDropdown({ value, onChange, instructors }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#1E293B] border border-white/10 text-white text-sm px-3 py-2 rounded-xl hover:border-white/20 transition-colors"
      >
        <span>{value === 'all' ? 'All Instructors' : value}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-[#1E293B] border border-white/10 rounded-xl overflow-hidden min-w-[160px]">
            <button
              onClick={() => { onChange('all'); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === 'all' ? 'bg-[#7C3AED]/20 text-[#7C3AED] font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              All Instructors
            </button>
            {instructors.map(inst => (
              <button
                key={inst}
                onClick={() => { onChange(inst); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === inst ? 'bg-[#7C3AED]/20 text-[#7C3AED] font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {inst}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────
export default function MyCourses({ role = 'STUDENT', apiBase }) {
  const [tab, setTab] = useState('all'); // 'all' | 'my'
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [instructor, setInstructor] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [allCourses, setAllCourses] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const isStudent = role === 'STUDENT';

  useEffect(() => {
    const headers = getAuthHeaders();
    const cancel = axios.CancelToken.source();

    setLoading(true);

    const fetchAll = axios.get(`${API}/courses`, {
      cancelToken: cancel.token,
    });

    const fetchMine = isStudent
      ? axios.get(`${API}/orders/my-orders`, {
          headers,
          cancelToken: cancel.token,
        })
      : Promise.resolve({ data: { data: [] } });

    axios
      .all([fetchAll, fetchMine])
      .then(
        axios.spread((allRes, mineRes) => {
          setAllCourses(allRes.data.data || []);
          setMyOrders(mineRes.data.data || []);
        })
      )
      .catch(err => {
        if (!axios.isCancel(err)) console.error(err);
      })
      .finally(() => setLoading(false));

    return () => cancel.cancel();
  }, [role, apiBase]);

  // Enrolled courses from successful orders
  const enrolledCourses = useMemo(() => {
    return myOrders
      .filter(o => o.paymentStatus === 'SUCCESSFUL')
      .map(o => ({
        ...o.course,
        progress: o.progress || 0,
        lastActivityAt: o.lastActivityAt || o.updatedAt,
        orderId: o.id,
      }));
  }, [myOrders]);

  // Unique instructors
  const instructors = useMemo(() => {
    const names = allCourses.map(c => c.creator?.fullName).filter(Boolean);
    return [...new Set(names)];
  }, [allCourses]);

  // Active dataset
  const activeCourses = tab === 'my' ? enrolledCourses : allCourses;

  // Filter + search + sort
  const filteredCourses = useMemo(() => {
    let list = activeCourses;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        c =>
          c.title?.toLowerCase().includes(q) ||
          c.creator?.fullName?.toLowerCase().includes(q)
      );
    }

    // Instructor
    if (instructor !== 'all') {
      list = list.filter(c => c.creator?.fullName === instructor);
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'az':
          return (a.title || '').localeCompare(b.title || '');
        case 'za':
          return (b.title || '').localeCompare(a.title || '');
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'newest':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    return list;
  }, [activeCourses, search, instructor, sortBy]);

  const showProgress = tab === 'my';
  const courseCount = filteredCourses.length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Courses</h1>
        <span className="text-xs font-medium text-[#7C3AED] bg-[#7C3AED]/10 px-3 py-1.5 rounded-full capitalize border border-[#7C3AED]/20">
          {role}
        </span>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search Courses..."
          className="w-full bg-[#1E293B] border border-white/10 text-white placeholder-white/30 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Tabs + count */}
        <div>
          <div className="flex items-center gap-1 bg-[#1E293B] border border-white/10 p-1 rounded-xl w-fit">
            <button
              onClick={() => setTab('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                tab === 'all'
                  ? 'bg-[#7C3AED] text-black shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              All Courses
            </button>
            <button
              onClick={() => setTab('my')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                tab === 'my'
                  ? 'bg-[#7C3AED] text-black shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              My Courses
            </button>
          </div>
          <p className="text-xs text-white/40 mt-1.5 ml-1">
            {loading ? '—' : `${courseCount} Course${courseCount === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <SortDropdown value={sortBy} onChange={setSortBy} />
          <InstructorDropdown
            value={instructor}
            onChange={setInstructor}
            instructors={instructors}
          />
          {/* View toggle */}
          <div className="flex items-center bg-[#1E293B] border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${
                viewMode === 'grid' ? 'bg-[#7C3AED] text-white' : 'text-white/40 hover:text-white'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${
                viewMode === 'list' ? 'bg-[#7C3AED] text-white' : 'text-white/40 hover:text-white'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Course grid */}
      {loading ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'space-y-4'
          }
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'space-y-4'
          }
        >
          <EmptyState tab={tab} />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              showProgress={showProgress}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              showProgress={showProgress}
            />
          ))}
        </div>
      )}
    </div>
  );
}
