/**
 * Student Wishlist — Saved courses with heart toggle
 * GET /api/v1/wishlist — list wishlisted courses
 * POST /api/v1/wishlist/:courseId — add to wishlist
 * DELETE /api/v1/wishlist/:courseId — remove from wishlist
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, BookOpen, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import axios from 'axios';

const API = '/api/v1';

function WishlistCard({ course, onRemove, onAddToCart }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setRemoving(true);
    await onRemove(course.id);
    setRemoving(false);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    onAddToCart(course);
  };

  return (
    <div className="bg-[#1E293B] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all group relative">
      {/* Thumbnail */}
      <Link to={`/course/${course.id}`} className="block">
        <div className="aspect-video bg-[#0F172A] relative">
          {course.coverImageUrl ? (
            <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl text-white/20">{course.title?.charAt(0)}</span>
            </div>
          )}
          {/* Heart / Remove */}
          <button
            onClick={handleRemove}
            disabled={removing}
            className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500/80 hover:scale-110 transition-all"
            title="Remove from wishlist"
          >
            {removing ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            )}
          </button>
          {/* Type badge */}
          {course.type && (
            <span className="absolute top-3 left-3 bg-white/10 text-white/80 text-xs font-medium px-2 py-0.5 rounded-full capitalize backdrop-blur-sm">
              {course.type === 'IN_PERSON_LAB' ? 'Lab' : 'Digital'}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link to={`/course/${course.id}`} className="block">
          <h3 className="text-sm font-bold text-white line-clamp-2 mb-1 group-hover:text-[#7C3AED] transition-colors">
            {course.title}
          </h3>
        </Link>
        <p className="text-xs text-white/30 mb-3 line-clamp-2">{course.description}</p>

        {/* Creator */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/30">by {course.creator?.fullName || 'Nexify Creator'}</span>
          <div className="flex items-center gap-1">
            {course.averageRating > 0 && (
              <>
                <span className="text-amber-400 text-xs">★</span>
                <span className="text-xs text-white/40">{course.averageRating.toFixed(1)}</span>
              </>
            )}
            {course.totalStudents > 0 && (
              <span className="text-xs text-white/30 ml-1">({course.totalStudents})</span>
            )}
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between">
          <span className="text-[#7C3AED] font-bold text-lg">
            GH₵ {(course.priceGhs || 0).toFixed(2)}
          </span>
          <button
            onClick={handleBuyNow}
            className="flex items-center gap-1.5 bg-[#7C3AED] text-black px-3 py-1.5 rounded-lg text-xs font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

function WishlistSkeleton() {
  return (
    <div className="bg-[#1E293B] border border-white/10 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-6 bg-white/5 rounded w-1/4" />
      </div>
    </div>
  );
}

function EmptyWishlist() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-[#1E293B] border border-white/10 rounded-2xl flex items-center justify-center mb-4">
        <Heart className="w-10 h-10 text-white/20" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Your wishlist is empty</h3>
      <p className="text-sm text-white/40 mb-6 max-w-sm">
        Save courses you love by clicking the heart icon on any course card.
      </p>
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 bg-[#7C3AED] text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
      >
        <BookOpen className="w-4 h-4" />
        Browse Courses
      </Link>
    </div>
  );
}

export default function Wishlist() {
  const { token } = useAuth();
  const { openCheckout } = useCart();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data.data || []);
    } catch (err) {
      // Backend may not have wishlist yet — show empty gracefully
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (courseId) => {
    try {
      await axios.delete(`${API}/wishlist/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch {
      // Optimistic remove anyway
      setCourses(prev => prev.filter(c => c.id !== courseId));
    }
  };

  const handleAddToCart = (course) => {
    openCheckout(course);
  };

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/student"
          className="text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">My Wishlist</h1>
          <p className="text-white/40 text-sm mt-1">
            {loading ? 'Loading...' : `${courses.length} saved course${courses.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 mb-6">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <WishlistSkeleton key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <EmptyWishlist />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {courses.map(course => (
            <WishlistCard
              key={course.id}
              course={course}
              onRemove={handleRemove}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
