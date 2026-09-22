/**
 * CreatorProfile — Public page showing a creator's profile and published courses
 * Route: /creator/:creatorId (public, no auth required)
 * GET /api/v1/users/:creatorId or /api/v1/creators/:creatorId
 * GET /api/v1/courses?creatorId=X
 */

import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, DollarSign, Star, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = '/api/v1';

// Reuse the CourseCard pattern from Catalog/MyCourses
function CourseCard({ course }) {
  return (
    <div className="bg-[#1E293B] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all group">
      <Link to={`/course/${course.id}`} className="block">
        <div className="aspect-video bg-[#0F172A] relative">
          {course.coverImageUrl ? (
            <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl text-white/20">{course.title?.charAt(0)}</span>
            </div>
          )}
          {course.type && (
            <span className="absolute top-2 left-2 bg-white/10 text-white/80 text-xs font-medium px-2 py-0.5 rounded-full capitalize backdrop-blur-sm">
              {course.type === 'IN_PERSON_LAB' ? 'Lab' : 'Digital'}
            </span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/course/${course.id}`}>
          <h3 className="text-sm font-bold text-white line-clamp-2 mb-1 group-hover:text-[#7C3AED] transition-colors">
            {course.title}
          </h3>
        </Link>
        <p className="text-xs text-white/30 mb-3 line-clamp-2">{course.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-amber-400">
            {course.averageRating > 0 && (
              <>
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span className="text-xs">{course.averageRating.toFixed(1)}</span>
              </>
            )}
            {course.totalStudents > 0 && (
              <span className="text-xs text-white/30 ml-1">({course.totalStudents})</span>
            )}
          </div>
          <span className="text-[#7C3AED] font-bold text-base">
            GH₵ {(course.priceGhs || 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CreatorSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-40 bg-white/5 rounded-2xl mb-6" />
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-white/10" />
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-white/10 rounded w-48" />
          <div className="h-4 bg-white/10 rounded w-64" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-[#1E293B] border border-white/10 rounded-xl overflow-hidden">
            <div className="aspect-video bg-white/5" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CreatorProfile() {
  const { creatorId } = useParams();
  const navigate = useNavigate();

  const [creator, setCreator] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!creatorId) return;
    setLoading(true);
    setError(null);

    // Try to fetch creator info and their courses in parallel
    axios.all([
      axios.get(`${API}/creators/${creatorId}`).catch(() => ({ data: { data: null } })),
      axios.get(`${API}/creators/${creatorId}/courses`).catch(() => ({ data: { data: [] } })),
    ]).then(axios.spread((creatorRes, coursesRes) => {
      const creatorData = creatorRes.data?.data;
      if (!creatorData) {
        setError('Creator not found');
      } else {
        setCreator(creatorData);
      }
      setCourses(coursesRes.data.data || []);
    })).catch(() => {
      setError('Failed to load creator profile');
    }).finally(() => {
      setLoading(false);
    });
  }, [creatorId]);

  const totalStudents = courses.reduce((sum, c) => sum + (c.totalStudents || 0), 0);
  const totalRevenue = courses.reduce((sum, c) => sum + ((c.totalStudents || 0) * (c.priceGhs || 0) * 0.7), 0); // Approx
  const avgRating = courses.length > 0
    ? (courses.reduce((sum, c) => sum + (c.averageRating || 0), 0) / courses.filter(c => c.averageRating > 0).length) || 0
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A]">
        <div className="max-w-6xl mx-auto p-6 pt-8">
          <CreatorSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">{error}</p>
          <Link to="/courses" className="text-[#7C3AED] hover:underline text-sm">
            ← Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-6xl mx-auto p-6 pt-8">
        {/* Back */}
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>

        {/* Cover + Profile */}
        <div className="mb-8">
          {/* Cover gradient */}
          <div className="h-40 rounded-2xl bg-gradient-to-br from-[#7C3AED]/30 via-[#1E1B4B] to-[#0F172A] border border-white/10 mb-0 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, #7C3AED 0%, transparent 50%), radial-gradient(circle at 80% 50%, #06b6d4 0%, transparent 50%)',
              }}
            />
          </div>

          {/* Profile info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 px-2">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-[#1E293B] border-4 border-[#0F172A] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt={creator.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-[#7C3AED]">
                  {creator.fullName?.charAt(0)?.toUpperCase() || 'C'}
                </span>
              )}
            </div>

            <div className="flex-1 pt-2 sm:pt-0">
              <h1 className="text-2xl font-bold text-white">{creator.fullName}</h1>
              {creator.bio && (
                <p className="text-sm text-white/50 mt-1 max-w-2xl">{creator.bio}</p>
              )}
              {creator.title && (
                <p className="text-xs text-white/30 mt-0.5 capitalize">{creator.title}</p>
              )}
            </div>

            <div className="text-sm text-white/40 flex-shrink-0">
              {courses.length} course{courses.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1E293B] border border-white/10 rounded-xl p-4 text-center">
            <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-xl font-bold text-white">{totalStudents.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-0.5">Total Students</p>
          </div>
          <div className="bg-[#1E293B] border border-white/10 rounded-xl p-4 text-center">
            <div className="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white">GH₵ {totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-white/40 mt-0.5">Est. Revenue</p>
          </div>
          <div className="bg-[#1E293B] border border-white/10 rounded-xl p-4 text-center">
            <div className="w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-xl font-bold text-white">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-white/40 mt-0.5">Avg. Rating</p>
          </div>
        </div>

        {/* Courses grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Published Courses</h2>
            <span className="text-sm text-white/40">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
          </div>

          {courses.length === 0 ? (
            <div className="bg-[#1E293B] border border-white/10 rounded-xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">No published courses yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
