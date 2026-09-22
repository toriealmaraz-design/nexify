/**
 * Certificate — Course Completion Certificate Page
 * Route: /student/course/:courseId/certificate
 * Protected: STUDENT role
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  Download,
  Share2,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Calendar,
  User,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';
import axios from 'axios';

const API = '/api/v1';

// Fallback placeholder data when API is not available
const PLACEHOLDER = {
  studentName: 'Student Name',
  courseTitle: 'Course Title',
  instructorName: 'Instructor Name',
  completionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  certificateId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
};

function SkeletonCertificate() {
  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-2xl p-12 text-center">
      <div className="h-6 w-48 bg-white/5 rounded animate-pulse mx-auto mb-6" />
      <div className="h-4 w-64 bg-white/5 rounded animate-pulse mx-auto mb-4" />
      <div className="h-8 w-96 bg-white/5 rounded animate-pulse mx-auto mb-6" />
      <div className="h-4 w-48 bg-white/5 rounded animate-pulse mx-auto mb-2" />
      <div className="h-3 w-56 bg-white/5 rounded animate-pulse mx-auto" />
    </div>
  );
}

// Print-specific styles are injected via a <style> tag when downloading
export default function Certificate() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('nexify_token');

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    const fetchCertificate = async () => {
      try {
        const res = await axios.get(`${API}/certificates/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCertificate(res.data?.data || null);
      } catch (err) {
        // Certificate may not exist yet — show placeholder with design
        setCertificate(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [courseId, token]);

  const data = certificate || PLACEHOLDER;

  const handleDownload = () => {
    window.print();
  };

  const handleShare = () => {
    const certId = certificate?.certificateId || PLACEHOLDER.certificateId;
    const shareUrl = `${window.location.origin}/cert/verify/${certId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back button */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to={`/student/course/${courseId}`}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </Link>
      </div>

      {loading ? (
        <SkeletonCertificate />
      ) : (
        <>
          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 mb-6 no-print">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E1B4B] border border-white/10 text-white/70 hover:text-white hover:border-white/20 rounded-xl text-sm transition-all"
            >
              {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied!</> : <><Share2 className="w-4 h-4" /> Share</>}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-black font-semibold hover:brightness-110 rounded-xl text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Download as PDF
            </button>
          </div>

          {/* Certificate card */}
          <div className="bg-[#FFF8E7] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 relative">
            {/* Decorative border pattern */}
            <div className="absolute inset-3 border-4 border-double border-[#7C3AED]/60 rounded-xl pointer-events-none" />
            <div className="absolute inset-6 border border-dashed border-[#7C3AED]/30 rounded-xl pointer-events-none" />

            {/* Inner certificate content */}
            <div className="relative p-12 md:p-16 text-center">
              {/* Nexify logo */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="w-12 h-12 bg-[#7C3AED] rounded-xl flex items-center justify-center">
                  <span className="text-black font-bold text-xl">N</span>
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold text-[#1E293B] leading-none">Nexify</p>
                  <p className="text-xs text-[#7C3AED] font-medium tracking-widest uppercase">Learning Platform</p>
                </div>
              </div>

              {/* Certificate header */}
              <p className="text-xs font-semibold text-[#7C3AED] tracking-[0.3em] uppercase mb-4">
                Certificate of Completion
              </p>

              {/* Decorative line */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#7C3AED]/40" />
                <Award className="w-5 h-5 text-[#7C3AED]" />
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#7C3AED]/40" />
              </div>

              {/* Main cert text */}
              <p className="text-sm text-[#64748B] mb-3">This certifies that</p>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-3 font-serif">
                {data.studentName}
              </h1>
              <p className="text-sm text-[#64748B] mb-6">
                has successfully completed
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-[#1E293B] mb-8 font-serif max-w-lg mx-auto">
                "{data.courseTitle}"
              </h2>

              {/* Date and instructor */}
              <div className="flex items-center justify-center gap-12 mb-8">
                <div className="text-center">
                  <p className="text-xs text-[#94A3B8] mb-1 flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3" /> Date
                  </p>
                  <p className="text-sm font-semibold text-[#475569]">{data.completionDate}</p>
                </div>
                <div className="w-px h-10 bg-[#CBD5E1]" />
                <div className="text-center">
                  <p className="text-xs text-[#94A3B8] mb-1 flex items-center justify-center gap-1">
                    <User className="w-3 h-3" /> Instructor
                  </p>
                  <p className="text-sm font-semibold text-[#475569]">{data.instructorName}</p>
                </div>
              </div>

              {/* Certificate ID and verification */}
              <div className="border-t border-dashed border-[#CBD5E1] pt-6 mt-4">
                <div className="flex items-center justify-between max-w-sm mx-auto">
                  <div className="text-left">
                    <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-0.5">Certificate ID</p>
                    <p className="text-xs font-mono text-[#64748B]">{data.certificateId}</p>
                  </div>
                  <div className="text-right no-print">
                    <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-0.5">Verify at</p>
                    <p className="text-[10px] font-mono text-[#7C3AED] flex items-center gap-1">
                      nexify.io/cert/verify/{data.certificateId?.slice(0, 8)}...
                      <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>
                </div>
              </div>

              {/* If no real certificate data, show notice */}
              {!certificate && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-600">
                    Preview mode — real certificate data will appear after course completion.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Back to course link */}
          <div className="mt-6 text-center no-print">
            <Link
              to={`/student/course/${courseId}`}
              className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Course
            </Link>
          </div>
        </>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .certificate-print-target,
          .certificate-print-target * { visibility: visible; }
          .certificate-print-target {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            background: #FFF8E7;
          }
          .no-print { display: none !important; }
          @page { margin: 0; size: A4 landscape; }
        }
      `}</style>
    </div>
  );
}
