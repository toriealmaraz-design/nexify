/**
 * Certificates List — Student's earned certificates
 * Route: /student/certificates
 * Protected: STUDENT role
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Download, ArrowLeft, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = '/api/v1';

export default function Certificates() {
  const token = localStorage.getItem('nexify_token');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/certificates/my`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      setCertificates(res.data.data || []);
    }).catch(() => {
      setCertificates([]);
    }).finally(() => setLoading(false));
  }, [token]);

  const handleDownload = (cert) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Certificate - ${cert.course?.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #FFF8E7; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .certificate { width: 1000px; height: 700px; background: #FFF8E7; border: 12px solid #7C3AED; padding: 8px; }
  .inner-border { width: 100%; height: 100%; border: 2px dashed rgba(124, 58, 237, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; }
  .logo-box { width: 48px; height: 48px; background: #7C3AED; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #000; font-size: 24px; font-weight: 700; margin-bottom: 8px; }
  .cert-title { font-size: 14px; color: #7C3AED; font-weight: 600; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 16px; }
  .label { font-size: 14px; color: #64748B; margin-bottom: 8px; }
  .student-name { font-size: 42px; font-weight: 700; color: #1E293B; margin-bottom: 12px; }
  .course-title { font-size: 28px; font-weight: 700; color: #1E293B; margin-bottom: 40px; text-align: center; }
  .meta { display: flex; gap: 48px; }
  .meta-item { text-align: center; }
  .meta-label { font-size: 11px; color: #94A3B8; text-transform: uppercase; }
  .meta-value { font-size: 14px; font-weight: 600; color: #475569; }
  .footer { border-top: 1px dashed #CBD5E1; padding-top: 16px; margin-top: 32px; font-size: 12px; color: #64748B; font-family: monospace; }
</style>
</head>
<body>
<div class="certificate">
  <div class="inner-border">
    <div class="logo-box">N</div>
    <div class="cert-title">Certificate of Completion</div>
    <div class="label">This certifies that</div>
    <div class="student-name">${cert.user?.fullName || 'Student'}</div>
    <div class="label">has successfully completed</div>
    <div class="course-title">"${cert.course?.title || 'Course'}"</div>
    <div class="meta">
      <div class="meta-item"><div class="meta-label">Date</div><div class="meta-value">${cert.completedAt ? new Date(cert.completedAt).toLocaleDateString() : ''}</div></div>
      <div class="meta-item"><div class="meta-label">Instructor</div><div class="meta-value">${cert.course?.creator?.fullName || ''}</div></div>
    </div>
    <div class="footer">ID: ${cert.certificateId}</div>
  </div>
</div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${(cert.course?.title || 'course').replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/student" className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Award className="w-7 h-7 text-emerald-400" />
          My Certificates
        </h1>
        <p className="text-white/40 text-sm mt-1">Your earned course completion certificates.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#7C3AED] animate-spin" />
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-12 text-center">
          <Award className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-white mb-1">No certificates yet</h3>
          <p className="text-sm text-white/40">Complete a course to earn your first certificate.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map(cert => (
            <div key={cert.id} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-5 flex items-center gap-4 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white truncate">{cert.course?.title}</h3>
                <p className="text-sm text-white/40 mt-0.5">
                  {cert.completedAt
                    ? `Completed on ${new Date(cert.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                    : 'In progress'}
                </p>
                <p className="text-xs text-white/20 mt-1 font-mono">{cert.certificateId}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {cert.completedAt && (
                  <button
                    onClick={() => handleDownload(cert)}
                    className="flex items-center gap-2 px-3 py-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-xl text-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <Link
                  to={`/student/course/${cert.courseId}/certificate`}
                  className="bg-[#7C3AED] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
