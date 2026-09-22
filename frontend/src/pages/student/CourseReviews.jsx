/**
 * CourseReviews — Student review submission + existing reviews
 * Route: /student/course/:courseId/review
 * POST /api/v1/courses/:courseId/reviews
 * GET /api/v1/courses/:courseId/reviews
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Send, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API = '/api/v1';

function StarRating({ value, onChange, hoverValue, size = 'lg' }) {
  const displayValue = hoverValue || value;
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' };
  const cls = sizes[size] || sizes.lg;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
          className={`${cls} transition-all duration-100`}
        >
          <Star
            className={`${cls} transition-colors ${
              star <= displayValue
                ? 'text-amber-400 fill-amber-400'
                : 'text-white/20'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarRatingDisplay({ value, size = 'sm' }) {
  const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5' };
  const cls = sizes[size] || sizes.sm;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${cls} ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const initial = review.user?.fullName?.charAt(0)?.toUpperCase() || 'U';
  const colors = ['bg-purple-500/20 text-purple-400', 'bg-amber-500/20 text-amber-400', 'bg-emerald-500/20 text-emerald-400', 'bg-sky-500/20 text-sky-400'];
  const colorIdx = review.user?.fullName?.charCodeAt(0) % colors.length || 0;

  return (
    <div className="bg-[#1E293B] border border-white/10 rounded-xl p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${colors[colorIdx]}`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-white truncate">{review.user?.fullName || 'Student'}</p>
            <span className="text-[11px] text-white/30 flex-shrink-0">
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
            </span>
          </div>
          <StarRatingDisplay value={review.rating} size="sm" />
          {review.comment && (
            <p className="text-sm text-white/60 mt-2 leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ courseId, onSuccess }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }
    if (comment.trim().length < 20) {
      setError('Please write at least 20 characters');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/courses/${courseId}/reviews`,
        { rating, comment: comment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Review submitted!</h3>
        <p className="text-sm text-white/50">Thank you for your feedback.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1E293B] border border-white/10 rounded-xl p-5 space-y-4">
      <h3 className="text-base font-bold text-white">Write a Review</h3>

      {/* Star rating */}
      <div>
        <label className="text-sm text-white/60 mb-2 block">Your Rating</label>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-white/20'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-white/50">{rating} / 5</span>
          )}
        </div>
      </div>

      {/* Text area */}
      <div>
        <label className="text-sm text-white/60 mb-2 block">Your Review</label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience with this course... (min 20 characters)"
          rows={5}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED]/30 transition-all"
        />
        <p className={`text-[11px] mt-1 ${comment.length >= 20 ? 'text-emerald-400' : 'text-white/30'}`}>
          {comment.length} / 20 min characters
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 bg-[#7C3AED] text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}

export default function CourseReviews() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    axios.all([
      axios.get(`${API}/courses/${courseId}`),
      axios.get(`${API}/courses/${courseId}/reviews`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).catch(() => ({ data: { data: [] } })),
    ]).then(axios.spread((courseRes, reviewsRes) => {
      setCourse(courseRes.data.data);
      setReviews(reviewsRes.data.data || []);
    })).catch(() => {}).finally(() => setLoading(false));
  }, [courseId, token]);

  const handleReviewSuccess = () => {
    // Refresh reviews
    axios.get(`${API}/courses/${courseId}/reviews`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => setReviews(res.data.data || []))
      .catch(() => {});
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Course Reviews</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {loading ? 'Loading...' : course?.title}
          </p>
        </div>
      </div>

      {/* Course info card */}
      {!loading && course && (
        <div className="flex items-center gap-4 bg-[#1E293B] border border-white/10 rounded-xl p-4 mb-6">
          {course.coverImageUrl ? (
            <img src={course.coverImageUrl} alt={course.title} className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
          ) : (
            <div className="w-20 h-14 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl text-white/30">{course.title?.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white line-clamp-2">{course.title}</h2>
            <p className="text-xs text-white/40 mt-0.5">by {course.creator?.fullName}</p>
            <div className="flex items-center gap-3 mt-1">
              {course.averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <StarRatingDisplay value={Math.round(course.averageRating)} />
                  <span className="text-xs text-white/50">{course.averageRating.toFixed(1)}</span>
                </div>
              )}
              <span className="text-xs text-white/30">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <Link
            to={`/student/course/${courseId}`}
            className="text-xs text-[#7C3AED] hover:text-[#9D5EF0] transition-colors flex items-center gap-1 flex-shrink-0"
          >
            Go to Course
          </Link>
        </div>
      )}

      {/* Review form */}
      <div className="mb-8">
        <ReviewForm courseId={courseId} onSuccess={handleReviewSuccess} />
      </div>

      {/* Existing reviews */}
      <div>
        <h3 className="text-base font-bold text-white mb-4">
          Reviews
          <span className="ml-2 text-sm font-normal text-white/40">({reviews.length})</span>
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-[#1E293B] border border-white/10 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="h-3 bg-white/10 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-3 bg-white/10 rounded w-full mb-2" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-[#1E293B] border border-white/10 rounded-xl p-8 text-center">
            <Star className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/50">No reviews yet — be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
