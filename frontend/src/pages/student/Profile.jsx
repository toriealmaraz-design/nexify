/**
 * Student Profile — Learning Hub Personalization
 * Enrolled courses, active enrollments, bookmarks, review history, certificates.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Star,
  Clock,
  TrendingUp,
  Award,
  Settings,
  Camera,
  ExternalLink,
  Play,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API = '/api/v1';

const TABS = [
  { id: 'enrollments', label: 'My Courses' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'certificates', label: 'Certificates' },
];

function Skeleton({ className }) {
  return <div className={`bg-white/5 rounded-lg animate-pulse ${className}`} />;
}

export default function StudentProfile() {
  const { user, api } = useAuth();
  const [activeTab, setActiveTab] = useState('enrollments');
  const [enrollments, setEnrollments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my-orders')
      .then(res => {
        const purchased = (res.data.data || []).filter(o => o.paymentStatus === 'SUCCESSFUL');
        setEnrollments(purchased.map(o => ({ ...o.course, courseId: o.courseId, paymentStatus: o.paymentStatus, completedLessons: o.completedLessons || 0, totalLessons: o.course?.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0 })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const purchasedCourseIds = enrollments.map(e => e.courseId);
  const totalLearning = enrollments.length;
  const inProgressCount = enrollments.filter(e => e.completedLessons < e.totalLessons).length;

  return (
    <div className="max-w-5xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Learning</h1>
        <p className="text-white/40 text-sm mt-1">Track your progress and achievements</p>
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
      <div data-tour="student-profile-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Enrolled</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalLearning}</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-white">{inProgressCount}</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Reviews</span>
          </div>
          <p className="text-2xl font-bold text-white">{reviews.length}</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Certificates</span>
          </div>
          <p className="text-2xl font-bold text-white">0</p>
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
                ? 'border-purple-500 text-white'
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
      ) : activeTab === 'enrollments' ? (
        <EnrollmentsTab enrollments={enrollments} />
      ) : activeTab === 'reviews' ? (
        <ReviewsTab reviews={reviews} />
      ) : (
        <CertificatesTab enrollments={enrollments} />
      )}
    </div>
  );
}

function EnrollmentsTab({ enrollments }) {
  if (!enrollments.length) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm">No enrollments yet</p>
        <Link to="/courses" className="mt-3 inline-block text-sm text-purple-400 hover:text-purple-300">
          Browse courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enrollments.map(enrollment => {
        const progress = enrollment.totalLessons > 0
          ? Math.round((enrollment.completedLessons / enrollment.totalLessons) * 100)
          : 0;
        return (
          <div key={enrollment.id} className="bg-[#1E293B] border border-white/5 rounded-xl p-4 flex gap-4">
            <div className="w-16 h-16 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="font-medium text-white truncate">{enrollment.course?.title || 'Course'}</h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex-shrink-0">
                  {enrollment.paymentStatus === 'SUCCESSFUL' ? 'Enrolled' : enrollment.paymentStatus}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40 mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {enrollment.completedLessons}/{enrollment.totalLessons} lessons
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {progress}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <Link
                  to={`/student/course/${enrollment.courseId}`}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Continue <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewsTab({ reviews }) {
  if (!reviews.length) {
    return (
      <div className="text-center py-16">
        <Star className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm">No reviews yet</p>
        <p className="text-white/30 text-xs mt-1">Complete a course to leave a review</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map(order => (
        <div key={order.id} className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-white text-sm">{order.course?.title || 'Course'}</h3>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${s <= (order.review?.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
                />
              ))}
            </div>
          </div>
          {order.review?.comment && (
            <p className="text-sm text-white/60">{order.review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function CertificatesTab({ enrollments }) {
  const completed = enrollments.filter(e => e.completedLessons > 0 && e.completedLessons >= e.totalLessons);
  if (!completed.length) {
    return (
      <div className="text-center py-16">
        <Award className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm">No certificates yet</p>
        <p className="text-white/30 text-xs mt-1">Complete all lessons in a course to earn your certificate</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {completed.map(enrollment => (
        <div key={enrollment.id} className="bg-[#1E293B] border border-white/5 rounded-xl p-4 text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Award className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="font-medium text-white text-sm mb-1">{enrollment.course?.title || 'Course'}</h3>
          <p className="text-xs text-white/40">Certificate of Completion</p>
        </div>
      ))}
    </div>
  );
}
