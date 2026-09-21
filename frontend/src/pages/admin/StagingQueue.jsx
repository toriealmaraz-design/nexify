/**
 * Admin — Staging Queue
 * Lists courses awaiting admin review with approve/reject actions.
 *
 * API: GET /api/v1/admin/staging
 *      PUT /api/v1/admin/staging/:courseId/status { status, rejectionReason }
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function StagingQueue() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetch('/api/v1/admin/staging-queue')
      .then(r => r.json())
      .then(d => { setCourses(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleStatus(courseId, status) {
    setActionLoading(courseId);
    const body = status === 'REJECTED'
      ? { status, rejectionReason: 'Not approved at this time.' }
      : { status };
    const res = await fetch(`/api/v1/admin/courses/${courseId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setCourses(courses.map(c =>
        c.id === courseId ? { ...c, status: data.data.status } : c
      ));
    }
    setActionLoading(null);
  }

  if (loading) return <div className="text-center py-8 text-slate-400">Loading queue...</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Staging Queue</h1>

      {courses.length === 0 ? (
        <div className="bg-white rounded-nexify border border-slate-100 p-10 text-center">
          <p className="text-slate-400">No courses awaiting review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map(course => (
            <div key={course.id}
              className="bg-white rounded-nexify border border-slate-100 p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#0F172A] truncate">{course.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
                  <span>by {course.creator?.fullName}</span>
                  <span className="px-2 py-0.5 bg-[#EDE9FE] rounded-full">{course.type?.replace('_', ' ') || 'DIGITAL'}</span>
                  <span>GH₵ {course.priceGhs?.toFixed(2)}</span>
                  <span>{course.modules?.length || 0} modules</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  course.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : course.status === 'REJECTED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {course.status?.replace('_', ' ')}
                </span>
                <button
                  disabled={actionLoading === course.id || course.status === 'PUBLISHED'}
                  onClick={() => handleStatus(course.id, 'PUBLISHED')}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Approve
                </button>
                <button
                  disabled={actionLoading === course.id || course.status === 'REJECTED'}
                  onClick={() => handleStatus(course.id, 'REJECTED')}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
