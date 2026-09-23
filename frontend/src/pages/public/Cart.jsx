/**
 * Cart Page — Shopping Cart Review & Checkout Initiation
 * Dark theme, card-based layout, Lucide icons, Inter font.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  BookOpen,
  Tag,
  X,
  Loader2,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/common/Toast';

function formatGhs(amount) {
  return `GH₵ ${amount.toFixed(2)}`;
}

// ─── Cart Item Card ────────────────────────────────────────────

function CartItemCard({ item, onRemove }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    // Small delay for visual feedback
    await new Promise(r => setTimeout(r, 200));
    onRemove(item.courseId);
  };

  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4 flex gap-4 items-start">
      {/* Thumbnail */}
      <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#7C3AED]/40 to-[#1E1B4B] flex items-center justify-center">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen className="w-6 h-6 text-white/30" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium text-sm leading-snug line-clamp-2 mb-1">
          {item.title}
        </h3>
        <p className="text-white/40 text-xs">{item.instructorName}</p>
        <p className="text-[#7C3AED] font-semibold text-sm mt-2">{formatGhs(item.price)}</p>
      </div>

      {/* Remove */}
      <button
        onClick={handleRemove}
        disabled={removing}
        className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-red-400/10"
        aria-label={`Remove ${item.title} from cart`}
      >
        {removing ? (
          <Loader2 className="w-4 h-4 animate-spin text-red-400" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

// ─── Skeleton Loader ────────────────────────────────────────────

function CartItemSkeleton() {
  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4 flex gap-4 items-start animate-pulse">
      <div className="w-20 h-14 rounded-lg bg-white/5" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-2 bg-white/10 rounded w-1/2" />
        <div className="h-3 bg-white/10 rounded w-1/4" />
      </div>
      <div className="w-4 h-4 bg-white/10 rounded mt-1" />
    </div>
  );
}

// ─── Order Summary ─────────────────────────────────────────────

function OrderSummary({ subtotal, platformFee, total, coupon, onCouponChange, onApplyCoupon, onCheckout }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    if (!coupon.trim()) return;
    setApplying(true);
    await new Promise(r => setTimeout(r, 800));
    setApplying(false);
    setApplied(true);
  };

  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 space-y-5">
      <h2 className="text-white font-semibold text-lg">Order Summary</h2>

      {/* Line items */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-white/70">
          <span>Subtotal</span>
          <span>{formatGhs(subtotal)}</span>
        </div>
        <div className="flex justify-between text-white/70">
          <span>Platform fee (10%)</span>
          <span>{formatGhs(platformFee)}</span>
        </div>
        {applied && (
          <div className="flex justify-between text-green-400">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Discount
            </span>
            <span>-{formatGhs(total - subtotal + platformFee)}</span>
          </div>
        )}
        <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-lg">
          <span>Total</span>
          <span className="text-[#7C3AED]">{formatGhs(total)}</span>
        </div>
      </div>

      {/* Coupon */}
      <div className="space-y-2">
        <label className="block text-xs text-white/50 uppercase tracking-wider font-medium">
          Coupon Code
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={coupon}
              onChange={e => {
                onCouponChange(e.target.value);
                setApplied(false);
              }}
              placeholder="Enter code"
              disabled={applied}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleApply}
            disabled={applying || applied || !coupon.trim()}
            className="px-4 py-2.5 bg-white/10 border border-white/10 text-white/70 text-sm rounded-xl hover:bg-white/15 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : applied ? 'Applied' : 'Apply'}
          </button>
        </div>
        {applied && (
          <p className="text-xs text-green-400 flex items-center gap-1">
            <span>Coupon applied successfully</span>
            <button
              onClick={() => { onCouponChange(''); setApplied(false); }}
              className="ml-1 underline hover:no-underline"
            >
              Remove
            </button>
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onCheckout}
        className="w-full py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/20"
      >
        Proceed to Checkout
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

export default function CartPage() {
  const { cartItems, removeFromCart, subtotal, platformFee, total } = useCart();
  const navigate = useNavigate();
  const [loading] = useState(false);
  const [coupon, setCoupon] = useState('');

  // Skeleton state: simulate loading on mount
  const [skeleton, setSkeleton] = useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setSkeleton(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (loading || skeleton) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0F172A] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-white text-lg">Nexify</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <ShoppingCart className="w-4 h-4" />
            <span className="font-medium text-white">{cartItems.length}</span>
            <span>item{cartItems.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-7 h-7 text-[#7C3AED]" />
          <h1 className="text-2xl font-bold text-white">Your Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#1E1B4B] border border-white/10 flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
            <p className="text-white/40 text-sm mb-8 max-w-xs">
              Browse our marketplace and add courses to get started.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl transition-all"
            >
              Browse Courses
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Cart Content */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            {/* Items List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/50 text-sm">
                  {cartItems.length} course{cartItems.length !== 1 ? 's' : ''} in cart
                </p>
              </div>
              <div className="space-y-3">
                {cartItems.map(item => (
                  <CartItemCard
                    key={item.courseId}
                    item={item}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>

              {/* Continue Shopping */}
              <div className="mt-6">
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 text-white/70 hover:text-white hover:border-white/20 rounded-xl text-sm transition-all"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:sticky lg:top-24 h-fit">
              <OrderSummary
                subtotal={subtotal}
                platformFee={platformFee}
                total={total}
                coupon={coupon}
                onCouponChange={setCoupon}
                onCheckout={() => navigate('/checkout')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
