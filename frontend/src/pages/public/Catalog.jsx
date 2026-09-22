/**
 * Public Course Catalog Page
 * Dark theme with purple accent — explore and filter all published courses.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  Star,
  X,
  ChevronDown,
  SlidersHorizontal,
  BookOpen,
  ArrowUpDown,
} from 'lucide-react';
import { SkeletonCard } from '../../components/Skeleton';
import AdBanner from '../../components/AdBanner';

// ─── Active filter pill ────────────────────────────────────────
function FilterPill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#7C3AED]/20 text-[#7C3AED] text-xs font-medium px-3 py-1.5 rounded-full border border-[#7C3AED]/30">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-[#7C3AED]/30 rounded-full p-0.5 transition-colors"
        aria-label={`Remove filter ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── Skeleton card matching the course card shape ──────────────
function CatalogSkeletonCard() {
  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-2xl overflow-hidden">
      <div className="aspect-video bg-white/5 skeleton-shimmer" />
      <div className="p-5">
        <div className="skeleton-shimmer h-4 w-20 rounded-full mb-3" />
        <div className="skeleton-shimmer h-5 w-full rounded-xl mb-2" />
        <div className="skeleton-shimmer h-5 w-3/4 rounded-xl mb-3" />
        <div className="skeleton-shimmer h-3 w-32 rounded-lg mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton-shimmer h-3 w-24 rounded-lg" />
          <div className="skeleton-shimmer h-3 w-16 rounded-lg" />
        </div>
        <div className="skeleton-shimmer h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ─── Course card ───────────────────────────────────────────────
function CourseCard({ course }) {
  const isFree = !course.priceGhs || course.priceGhs === 0;
  const displayRating = typeof course.avgRating === 'number' ? course.avgRating.toFixed(1) : '4.8';
  const reviewCount = course._count?.reviews || 0;

  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-200 flex flex-col">
      {/* Cover image */}
      <Link to={`/course/${course.id}`} className="block aspect-video bg-white/5 relative overflow-hidden">
        {course.coverImageUrl ? (
          <img
            src={course.coverImageUrl}
            alt={course.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED]/20 to-[#1E1B4B]">
            <BookOpen className="w-10 h-10 text-white/20" />
          </div>
        )}
        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-[#7C3AED] text-white text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
          {course.category || 'Other'}
        </span>
      </Link>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <Link to={`/course/${course.id}`}>
          <h3 className="font-bold text-white text-base leading-snug mb-1 line-clamp-2 hover:text-[#7C3AED] transition-colors">
            {course.title}
          </h3>
        </Link>

        {/* Instructor */}
        <p className="text-white/40 text-sm mb-3">
          {course.creator?.fullName || 'Unknown Instructor'}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
              <Star
                key={n}
                className={`w-3.5 h-3.5 ${n <= Math.round(parseFloat(displayRating)) ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
              />
            ))}
          </div>
          <span className="text-white/50 text-xs">{displayRating}</span>
          {reviewCount > 0 && (
            <span className="text-white/30 text-xs">({reviewCount})</span>
          )}
        </div>

        {/* Level tag */}
        {course.level && (
          <span className="text-white/30 text-xs mb-3 uppercase tracking-wider">
            {course.level}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-2">
          <span className={`font-bold text-lg ${isFree ? 'text-emerald-400' : 'text-white'}`}>
            {isFree ? 'Free' : `GH₵ ${course.priceGhs.toFixed(2)}`}
          </span>
          <Link
            to={`/course/${course.id}`}
            className="bg-[#7C3AED] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#6D28D9] active:scale-[0.98] transition-all duration-150"
          >
            View Course
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Dropdown select ────────────────────────────────────────────
function SelectField({ value, onChange, options, className = '' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-xl hover:bg-white/10 transition-colors w-full justify-between"
      >
        <span className={selected ? 'text-white' : 'text-white/40'}>{selected?.label || 'Select...'}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-full bg-[#1E1B4B] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors ${value === opt.value ? 'text-[#7C3AED]' : 'text-white/70'}`}
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

// ─── Main Catalog Page ─────────────────────────────────────────
export default function Catalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [level, setLevel] = useState('ALL');
  const [priceFilter, setPriceFilter] = useState('ALL');
  const [sort, setSort] = useState('NEWEST');
  const [error, setError] = useState(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category !== 'ALL') params.set('category', category);
      if (level !== 'ALL') params.set('level', level);
      if (priceFilter === 'FREE') params.set('minPrice', '0');
      if (priceFilter === 'FREE') params.set('maxPrice', '0');
      if (priceFilter === 'PAID') params.set('minPrice', '0.01');
      if (sort === 'NEWEST') params.set('sort', 'NEWEST');
      if (sort === 'POPULAR') params.set('sort', 'POPULAR');
      if (sort === 'PRICE_ASC') params.set('sort', 'PRICE_ASC');
      if (sort === 'PRICE_DESC') params.set('sort', 'PRICE_DESC');

      const res = await axios.get(`/api/v1/courses?${params.toString()}`);
      setCourses(res.data.data || []);
    } catch (err) {
      setError('Failed to load courses. Please try again.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, level, priceFilter, sort]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const activeFilters = [
    category !== 'ALL' && { key: 'category', label: category, value: category },
    level !== 'ALL' && { key: 'level', label: level, value: level },
    priceFilter !== 'ALL' && { key: 'priceFilter', label: priceFilter === 'FREE' ? 'Free' : 'Paid', value: priceFilter },
  ].filter(Boolean);

  const removeFilter = key => {
    if (key === 'category') setCategory('ALL');
    if (key === 'level') setLevel('ALL');
    if (key === 'priceFilter') setPriceFilter('ALL');
  };

  const clearAll = () => {
    setCategory('ALL');
    setLevel('ALL');
    setPriceFilter('ALL');
    setSearch('');
  };

  const categoryOptions = [
    { value: 'ALL', label: 'All Categories' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Business', label: 'Business' },
    { value: 'Design', label: 'Design' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Health', label: 'Health' },
    { value: 'Other', label: 'Other' },
  ];

  const levelOptions = [
    { value: 'ALL', label: 'All Levels' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
  ];

  const priceOptions = [
    { value: 'ALL', label: 'All Prices' },
    { value: 'FREE', label: 'Free' },
    { value: 'PAID', label: 'Paid' },
  ];

  const sortOptions = [
    { value: 'NEWEST', label: 'Newest' },
    { value: 'POPULAR', label: 'Most Popular' },
    { value: 'PRICE_ASC', label: 'Price: Low to High' },
    { value: 'PRICE_DESC', label: 'Price: High to Low' },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* ─── Page Header ─── */}
      <div className="bg-[#0F172A] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
          {/* Back nav */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Explore Courses</h1>
          <p className="text-white/50 text-base mb-8">
            Discover expert-led courses from Ghana's top creators
          </p>

          {/* Search bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search courses by title, topic, or instructor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Filters + Sort Bar ─── */}
      <div className="bg-[#0F172A] border-b border-white/5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-white/50">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </div>

            <SelectField
              value={category}
              onChange={setCategory}
              options={categoryOptions}
              className="w-44"
            />

            <SelectField
              value={level}
              onChange={setLevel}
              options={levelOptions}
              className="w-40"
            />

            <SelectField
              value={priceFilter}
              onChange={setPriceFilter}
              options={priceOptions}
              className="w-40"
            />

            {/* Active filter pills */}
            {activeFilters.map(f => (
              <FilterPill
                key={f.key}
                label={f.label}
                onRemove={() => removeFilter(f.key)}
              />
            ))}

            {activeFilters.length > 0 && (
              <button
                onClick={clearAll}
                className="text-white/40 hover:text-white text-xs underline transition-colors ml-1"
              >
                Clear all
              </button>
            )}

            {/* Sort — right aligned */}
            <div className="ml-auto flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-white/40" />
              <SelectField
                value={sort}
                onChange={setSort}
                options={sortOptions}
                className="w-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Results count */}
        {!loading && (
          <p className="text-white/40 text-sm mb-6">
            Showing <span className="text-white font-medium">{courses.length}</span> course{courses.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Ad Banner */}
        <AdBanner placement="COURSE_CARD" />

        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <p className="text-white/50 mb-4">{error}</p>
            <button
              onClick={fetchCourses}
              className="text-[#7C3AED] hover:underline text-sm font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CatalogSkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && courses.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">No courses found</h3>
            <p className="text-white/40 text-sm mb-6">
              Try adjusting your filters or search term
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#7C3AED] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#6D28D9] transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        )}

        {/* Course grid */}
        {!loading && !error && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>

      {/* ─── Footer ─── */}
      <footer className="bg-[#0F172A] border-t border-white/5 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-white/30 text-sm">
          <p>2026 Nexify. Built for the West African digital economy.</p>
        </div>
      </footer>
    </div>
  );
}
