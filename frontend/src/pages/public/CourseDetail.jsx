/**
 * Course Detail Page
 * Public course landing with trailer preview, curriculum display, and checkout CTA.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { Loader2, Play } from 'lucide-react';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { openCheckout } = useCart();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/v1/courses/${courseId}`)
      .then(res => setCourse(res.data.data))
      .catch(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
          <p className="text-white/40 text-sm">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Course Not Found</h1>
          <Link to="/courses" className="text-[#7C3AED] font-medium hover:underline">Back to Catalog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Header */}
      <header className="bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>
            <span className="text-lg font-bold">Nexify</span>
          </Link>
          <nav className="flex items-center gap-4 ml-auto">
            <Link to="/login" className="text-sm text-white/70 hover:text-white">Sign In</Link>
            <Link to="/register" className="text-sm bg-[#7C3AED] text-white px-3 py-1.5 rounded-nexify hover:bg-[#6D28D9]">Get Started</Link>
          </nav>
        </div>
      </header>

      {/* Course Hero */}
      <div className="bg-[#0F172A] text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Back */}
          <Link to="/courses" className="text-sm text-white/60 hover:text-white mb-6 inline-block">← Back to Catalog</Link>

          {/* Trailer video */}
          <div className="aspect-video bg-[#1E293B] rounded-2xl overflow-hidden mb-8 shadow-card-lg">
            {course.teaserUrl ? (
              <video src={course.teaserUrl} controls autoPlay className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Play className="w-12 h-12 text-white/20 mb-2" />
                <p className="text-white/40 text-sm">Trailer preview</p>
              </div>
            )}
          </div>

          {/* Title & meta */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize flex items-center gap-1.5
                ${course.type === 'IN_PERSON_LAB' ? 'bg-white/10 text-white' : 'bg-[#7C3AED]/20 text-[#7C3AED]'}`}>
                {course.type === 'IN_PERSON_LAB' ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
                    Physical Lab
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    Digital Course
                  </>
                )}
              </span>
              <span className="text-xs text-white/50">{course.status.replace('_', ' ')}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{course.title}</h1>
            <p className="text-white/70 max-w-2xl mx-auto mb-4">{course.description}</p>
            <p className="text-sm text-white/50">by <span className="font-medium text-white">{course.creator?.fullName}</span></p>
          </div>

          {/* Price & CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="text-4xl font-bold text-[#7C3AED] currency-ghs">
              GH₵ {(course.priceGhs || 0).toFixed(2)}
            </div>
            {course.hasOrderBump && course.orderBumpTitle && (
              <div className="flex items-center gap-2 text-sm text-amber-300 bg-white/10 px-3 py-1.5 rounded-nexify">
                <span className="text-base">+</span>
                <span>Add: {course.orderBumpTitle} (GH₵ {course.orderBumpPriceGhs?.toFixed(2)})</span>
              </div>
            )}
            <button
              onClick={() => openCheckout(course)}
              className="bg-[#7C3AED] text-white px-8 py-3 rounded-nexify font-bold text-lg hover:bg-[#6D28D9] active:scale-[0.98] transition-all duration-150 shadow-lg shadow-[#7C3AED]/20"
            >
              Buy Now
            </button>
          </div>

          {/* Course info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Course Type', value: course.type === 'IN_PERSON_LAB' ? 'In-Person Lab' : 'Digital' },
              { label: 'Duration', value: course.labDates || 'Self-paced' },
              { label: 'Platform Fee', value: '10%' },
              { label: 'Affiliate Rate', value: `${(course.affiliateRate || 0) * 100}%` },
            ].map(item => (
              <div key={item.label} className="bg-white/5 rounded-nexify p-3">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-white font-medium">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Physical lab details */}
          {course.type === 'IN_PERSON_LAB' && (
            <div className="mt-6 bg-white/5 rounded-nexify p-4">
              <h3 className="text-sm font-semibold text-white/80 mb-2">Lab Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/50 text-xs uppercase">Venue</p>
                  <p className="text-white">{course.venueLocation || 'TBA'}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase">Dates</p>
                  <p className="text-white">{course.labDates || 'TBA'}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase">Capacity</p>
                  <p className="text-white">{course.maxSeats} seats ({(course.bookedSeats || 0)} booked)</p>
                </div>
                {course.depositGhs && (
                  <div>
                    <p className="text-white/50 text-xs uppercase">Deposit</p>
                    <p className="text-white">GH₵ {course.depositGhs.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Curriculum */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-white mb-6">Course Curriculum</h2>
        {course.modules && course.modules.length > 0 ? (
          <div className="space-y-4">
            {course.modules.map((module, mi) => (
              <div key={module.id} className="bg-[#1E293B] border border-white/10 rounded-nexify shadow-card-sm overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-[#0F172A] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Module {mi + 1}</span>
                    <h3 className="text-base font-bold text-white">{module.title}</h3>
                  </div>
                  <span className="text-sm text-white/40">{module.lessons?.length || 0} lessons</span>
                </div>
                <div className="p-4 space-y-2">
                  {module.lessons?.map((lesson, li) => (
                    <div key={lesson.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                      <span className="text-xs font-mono text-white/30 w-6">{String(li + 1).padStart(2, '0')}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{lesson.title}</p>
                        {lesson.isFreePreview && <span className="text-xs text-[#7C3AED] ml-2">Free Preview</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {lesson.videoUrl && (
                          <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                        <span className="text-xs text-white/30">{lesson.isFreePreview ? 'Preview' : 'Locked'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1E293B] border border-white/10 rounded-nexify shadow-card-sm p-8 text-center text-white/40">
            No modules published yet.
          </div>
        )}

        {/* Reviews */}
        {course.reviews && course.reviews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>
            <div className="space-y-4">
              {course.reviews.map(review => (
                <div key={review.id} className="bg-[#1E293B] border border-white/10 rounded-nexify shadow-card-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-white/50">{review.student?.fullName}</span>
                  </div>
                  {review.body && <p className="text-sm text-white/70">{review.body}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-white/50 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm">
          <p>&copy; 2026 Nexify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
