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

function getCertificateData(certificate) {
  if (!certificate) return PLACEHOLDER;
  return {
    studentName: certificate.user?.fullName || PLACEHOLDER.studentName,
    courseTitle: certificate.course?.title || PLACEHOLDER.courseTitle,
    instructorName: certificate.course?.creator?.fullName || PLACEHOLDER.instructorName,
    completionDate: certificate.completedAt
      ? new Date(certificate.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : PLACEHOLDER.completionDate,
    certificateId: certificate.certificateId || PLACEHOLDER.certificateId,
  };
}

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

  const data = getCertificateData(certificate);

  const handleDownload = () => {
    const certId = certificate?.certificateId || PLACEHOLDER.certificateId;
    const studentName = certificate?.user?.fullName || data.studentName;
    const courseTitle = certificate?.course?.title || data.courseTitle;
    const instructorName = certificate?.course?.creator?.fullName || data.instructorName;
    const completionDate = certificate?.completedAt
      ? new Date(certificate.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : data.completionDate;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Certificate - ${courseTitle}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #FFF8E7; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .certificate { width: 1000px; height: 700px; background: #FFF8E7; border: 12px solid #7C3AED; padding: 8px; position: relative; }
  .inner-border { width: 100%; height: 100%; border: 2px dashed rgba(124, 58, 237, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; }
  .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
  .logo-box { width: 48px; height: 48px; background: #7C3AED; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #000; font-size: 24px; font-weight: 700; }
  .logo-text { font-size: 24px; font-weight: 700; color: #1E293B; }
  .subtitle { font-size: 12px; color: #7C3AED; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; }
  .cert-title { font-size: 14px; color: #7C3AED; font-weight: 600; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 16px; }
  .divider { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
  .divider-line { width: 120px; height: 1px; background: rgba(124, 58, 237, 0.3); }
  .divider-icon { color: #7C3AED; font-size: 20px; }
  .label { font-size: 14px; color: #64748B; margin-bottom: 8px; }
  .student-name { font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 700; color: #1E293B; margin-bottom: 12px; }
  .course-label { font-size: 14px; color: #64748B; margin-bottom: 16px; }
  .course-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #1E293B; margin-bottom: 40px; max-width: 600px; text-align: center; }
  .meta { display: flex; align-items: center; justify-content: center; gap: 48px; margin-bottom: 32px; }
  .meta-item { text-align: center; }
  .meta-label { font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .meta-value { font-size: 14px; font-weight: 600; color: #475569; }
  .footer { border-top: 1px dashed #CBD5E1; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 500px; }
  .cert-id { font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }
  .cert-id-value { font-family: monospace; font-size: 12px; color: #64748B; }
  @media print { body { background: #FFF8E7; } }
</style>
</head>
<body>
<div class="certificate">
  <div class="inner-border">
    <div class="logo">
      <div class="logo-box">N</div>
      <div>
        <div class="logo-text">Nexify</div>
        <div class="subtitle">Learning Platform</div>
      </div>
    </div>
    <div class="cert-title">Certificate of Completion</div>
    <div class="divider"><div class="divider-line"></div><span class="divider-icon">🏆</span><div class="divider-line"></div></div>
    <div class="label">This certifies that</div>
    <div class="student-name">${studentName}</div>
    <div class="course-label">has successfully completed</div>
    <div class="course-title">"${courseTitle}"</div>
    <div class="meta">
      <div class="meta-item"><div class="meta-label">Date</div><div class="meta-value">${completionDate}</div></div>
      <div class="meta-item"><div class="meta-label">Instructor</div><div class="meta-value">${instructorName}</div></div>
    </div>
    <div class="footer">
      <div><div class="cert-id">Certificate ID</div><div class="cert-id-value">${certId}</div></div>
      <div><div class="cert-id">Verify at</div><div class="cert-id-value" style="color:#7C3AED">nexify.io/cert/verify</div></div>
    </div>
  </div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${courseTitle.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
