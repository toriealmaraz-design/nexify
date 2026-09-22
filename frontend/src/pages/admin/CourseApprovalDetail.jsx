/**
 * Admin — Course Approval Detail
 * Full review view for a single course in the staging queue.
 *
 * API: GET  /api/v1/admin/courses/:courseId
 *      PUT  /api/v1/admin/courses/:courseId/approve  { note?: string }
 *      PUT  /api/v1/admin/courses/:courseId/reject   { reason }
 */

import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Video,
  FileText,
  HelpCircle,
  BookOpen,
  Award,
  GraduationCap,
  Clock,
  Globe,
  Tag,
  X,
} from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../components/common/Toast';

const STATUS_CONFIG = {
  PENDING_APPROVAL: { label: 'Pending Review', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  APPROVED:         { label: 'Approved',       badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  REJECTED:         { label: 'Rejected',        badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

function SkeletonLine({ className = 'h-4 w-full' }) {
  return <div className={`bg-white/5 rounded animate-pulse ${className}`} />;
}

function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-[#1E293B] border border-white/10 rounded-xl p-6 ${className}`}>
      <SkeletonLine className="h-5 w-1/3 mb-4" />
      <div className="space-y-3">
        <SkeletonLine />
        <SkeletonLine className="h-4 w-4/5" />
        <SkeletonLine className="h-4 w-3/5" />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_APPROVAL;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.badge}`}>
      {config.label}
    </span>
  );
}

function LessonTypeIcon({ type }) {
  const lower = (type || '').toLowerCase();
  if (lower.includes('video')) return <Video className="w-4 h-4 text-[#7C3AED]" />;
  if (lower.includes('quiz') || lower.includes('exam')) return <HelpCircle className="w-4 h-4 text-amber-400" />;
  if (lower.includes('reading') || lower.includes('pdf') || lower.includes('doc')) return <FileText className="w-4 h-4 text-blue-400" />;
  return <BookOpen className="w-4 h-4 text-white/40" />;
}

function ModuleAccordion({ module, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#1E293B]/60 hover:bg-[#1E293B] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-medium">{module.title}</span>
          <span className="text-xs text-white/40">{module.lessons?.length || 0} lessons</span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="divide-y divide-white/5">
          {(module.lessons || []).map((lesson, i) => (
            <div key={lesson.id || i} className="flex items-center gap-3 px-5 py-3 bg-[#0F172A]/50">
              <LessonTypeIcon type={lesson.type} />
              <span className="text-sm text-white/70 flex-1">{lesson.title}</span>
              {lesson.durationMinutes && (
                <span className="text-xs text-white/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lesson.durationMinutes}m
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1E293B] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ActivityLog({ entries }) {
  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={entry.id || i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full border-2 ${STATUS_CONFIG[entry.status]?.badge.split(' ')[0] || 'bg-white/20 border-white/20'}`} />
            {i < entries.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
          </div>
          <div className="pb-5">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={entry.status} />
              <span className="text-xs text-white/40">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </div>
            {entry.note && (
              <p className="text-sm text-white/60 bg-white/5 rounded-lg px-3 py-2 border border-white/5 mt-1">
                {entry.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CourseApprovalDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`/api/v1/admin/courses/${courseId}`)
      .then(r => {
        setCourse(r.data.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [courseId]);

  async function handleApprove() {
    setSubmitting(true);
    try {
      const { data: d } = await axios.put(
        `/api/v1/admin/courses/${courseId}/approve`,
        approveNote.trim() ? { note: approveNote } : {}
      );
      if (!d.success) throw new Error(d.message || 'Approval failed.');
      toast('Course approved.', 'success');
      navigate('/admin/staging');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast('A rejection reason is required.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { data: d } = await axios.put(
        `/api/v1/admin/courses/${courseId}/reject`,
        { reason: rejectReason }
      );
      if (!d.success) throw new Error(d.message || 'Rejection failed.');
      toast('Course rejected.', 'error');
      navigate('/admin/staging');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <SkeletonLine className="h-8 w-8 rounded-lg" />
          <SkeletonLine className="h-6 w-48" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-4xl">
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-10 text-center">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Course Not Found</h2>
          <p className="text-white/50 text-sm mb-6">{error || 'This course does not exist or is no longer in staging.'}</p>
          <Link
            to="/admin/staging"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-black text-sm font-medium rounded-xl hover:bg-[#8b5cf6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Staging Queue
          </Link>
        </div>
      </div>
    );
  }

  const activityLog = [
    {
      id: 'submitted',
      status: 'PENDING_APPROVAL',
      timestamp: course.createdAt || new Date().toISOString(),
      note: 'Course submitted for review.',
    },
    ...(course.rejectionReason ? [{
      id: 'rejected-prev',
      status: 'REJECTED',
      timestamp: new Date(new Date(course.createdAt).getTime() + 86400000).toISOString(),
      note: course.rejectionReason,
    }] : []),
  ];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/staging"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staging Queue
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">{course.title}</h1>
            <p className="text-white/40 text-sm mt-1">
              Submitted {new Date(course.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <StatusBadge status={course.status} />
        </div>
      </div>

      <div className="space-y-6 pb-32 md:pb-8">
        {/* Creator info */}
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Creator</h2>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-medium">{course.creator?.fullName || 'Unknown'}</p>
              <p className="text-white/50 text-sm mt-0.5">{course.creator?.email || '—'}</p>
              <p className="text-white/30 text-xs mt-1">
                {course.creator?._count?.createdCourses || 0} previously approved course{course.creator?._count?.createdCourses !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <GraduationCap className="w-5 h-5 text-white/20 ml-auto mb-1" />
            </div>
          </div>
        </div>

        {/* Course content preview */}
        <div className="bg-[#1E293B] border border-white/10 rounded-xl overflow-hidden">
          {/* Cover */}
          {course.coverImageUrl ? (
            <div className="h-48 overflow-hidden">
              <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-br from-[#7C3AED]/40 to-[#1E293B]" />
          )}

          <div className="p-6">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Course Details</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { icon: Tag,         label: 'Category',  value: course.category },
                { icon: Globe,       label: 'Language',  value: course.language || 'English' },
                { icon: Award,       label: 'Level',     value: course.level },
                { icon: BookOpen,    label: 'Type',      value: course.type?.replace(/_/g, ' ') },
                { icon: Clock,       label: 'Price',     value: `GH\u8373 ${(course.priceGhs || 0).toFixed(2)}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white/30">{label}</p>
                    <p className="text-sm text-white font-medium">{value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>

            {course.description && (
              <div className="mb-6">
                <p className="text-xs text-white/30 mb-1">Description</p>
                <p className="text-sm text-white/70 leading-relaxed">{course.description}</p>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites?.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-white/30 mb-2">Prerequisites</p>
                <div className="flex flex-wrap gap-2">
                  {course.prerequisites.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/60">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certificate */}
            <div className="flex items-center gap-2 mb-6">
              <Award className={`w-4 h-4 ${course.certificateEligible ? 'text-emerald-400' : 'text-white/20'}`} />
              <span className={`text-sm ${course.certificateEligible ? 'text-emerald-400' : 'text-white/40'}`}>
                {course.certificateEligible ? 'Eligible for certificate' : 'No certificate'}
              </span>
            </div>

            {/* Modules */}
            {course.modules?.length > 0 && (
              <div>
                <p className="text-xs text-white/30 mb-3">Curriculum ({course.modules.length} module{course.modules.length !== 1 ? 's' : ''})</p>
                <div className="space-y-2">
                  {course.modules
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((mod, i) => (
                      <ModuleAccordion key={mod.id || i} module={mod} defaultOpen={i === 0} />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity log */}
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-6">Activity Log</h2>
          <ActivityLog entries={activityLog} />
        </div>
      </div>

      {/* Sticky action panel */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-[#0F172A]/95 backdrop-blur-md border-t border-white/10 p-4 flex gap-3 z-40">
        <button
          onClick={() => setRejectModal(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-xl hover:bg-red-600/30 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Reject Course
        </button>
        <button
          onClick={() => setApproveModal(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#7C3AED] text-black text-sm font-semibold rounded-xl hover:bg-[#8b5cf6] transition-colors shadow-lg shadow-[#7C3AED]/20"
        >
          <CheckCircle className="w-4 h-4" />
          Approve Course
        </button>
      </div>

      {/* Approve modal */}
      {approveModal && (
        <ActionModal title="Approve Course" onClose={() => { setApproveModal(false); setApproveNote(''); }}>
          <p className="text-white/60 text-sm mb-4">
            This course will be published and made available to students. Optionally add a note to the creator.
          </p>
          <textarea
            value={approveNote}
            onChange={e => setApproveNote(e.target.value)}
            placeholder="Optional note to creator..."
            rows={3}
            className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-[#7C3AED] transition-colors mb-4"
          />
          <button
            onClick={handleApprove}
            disabled={submitting}
            className="w-full py-3 bg-[#7C3AED] text-black text-sm font-semibold rounded-xl hover:bg-[#8b5cf6] disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Approving...' : 'Confirm Approval'}
          </button>
        </ActionModal>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <ActionModal title="Reject Course" onClose={() => { setRejectModal(false); setRejectReason(''); }}>
          <p className="text-white/60 text-sm mb-4">
            The course will be rejected and the creator will be notified. A reason is required.
          </p>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (required)..."
            rows={3}
            className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-500/60 transition-colors mb-4"
          />
          <button
            onClick={handleReject}
            disabled={submitting}
            className="w-full py-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </ActionModal>
      )}
    </div>
  );
}
