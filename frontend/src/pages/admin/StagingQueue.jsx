/**
 * Admin — Staging Queue
 * Lists courses awaiting admin review with approve/reject actions.
 *
 * API: GET /api/v1/admin/staging-queue
 *      PUT /api/v1/admin/courses/:courseId/status { status, rejectionReason }
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../../components/Skeleton';

export default function StagingQueue() {
  const { api } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    api.get('/admin/staging-queue')
      .then(r => { setCourses(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [api]);

  async function handleStatus(courseId, status) {
    setActionLoading(courseId);
    const body = status === 'REJECTED'
      ? { status, rejectionReason: 'Not approved at this time.' }
      : { status };
    try {
      const { data } = await api.put(`/admin/courses/${courseId}/status`, body);
      if (data.success) {
        setCourses(courses.map(c =>
          c.id === courseId ? { ...c, status: data.data.status } : c
        ));
      }
    } catch {}
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton height="36px" width="200px" className="mb-6" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
            <Skeleton height="20px" width="60%" className="mb-3" />
            <Skeleton height="14px" width="40%" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div data-tour="admin-staging-queue" className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Staging Queue</h1>
        <p className="text-white/40 text-sm">Course submissions awaiting admin review.</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-10 text-center">
          <p className="text-white/40">No courses awaiting review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map(course => (
            <div key={course.id} className="bg-[#1E293B] border border-white/5 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-white/10 transition-colors">
              <Link to={`/admin/course/${course.id}/review`} className="flex-1 min-w-0 flex flex-col gap-1">
                <h3 className="font-bold text-white truncate">{course.title}</h3>
                <div className="flex flex-wrap gap-2 text-xs text-white/40">
                  <span>by {course.creator?.fullName}</span>
                  <span className="px-2 py-0.5 bg-[#7C3AED]/20 text-[#7C3AED] rounded-full">{course.type?.replace('_', ' ') || 'DIGITAL'}</span>
                  <span>GH&#8373; {course.priceGhs?.toFixed(2)}</span>
                  <span>{course.modules?.length || 0} modules</span>
                </div>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  course.status === 'PUBLISHED'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : course.status === 'REJECTED'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {course.status?.replace('_', ' ')}
                </span>
                {course.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => handleStatus(course.id, 'PUBLISHED')}
                    disabled={actionLoading === course.id}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
                  >
                    Approve
                  </button>
                )}
                {course.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleStatus(course.id, 'REJECTED')}
                    disabled={actionLoading === course.id}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
