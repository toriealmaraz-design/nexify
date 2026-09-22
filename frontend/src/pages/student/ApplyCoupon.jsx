/**
 * ApplyCoupon — Coupon/Discount Application Component
 * Used inside Checkout to let students apply a coupon code before placing an order.
 *
 * Props:
 *   onCouponApplied(coupon) — called when a valid coupon is applied
 *   onCouponRemoved()       — called when coupon is removed
 *   currentDiscount         — existing discount from CartContext
 */

import React, { useState } from 'react';
import { Tag, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = '/api/v1';

export default function ApplyCoupon({ onCouponApplied, onCouponRemoved, currentDiscount }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coupon, setCoupon] = useState(currentDiscount || null);

  const handleApply = async () => {
    const code = input.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('nexify_token');
      const res = await axios.post(
        `${API}/coupons/validate`,
        { code },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      const validated = res.data.data; // { code, discountType, discountValue, ... }
      setCoupon(validated);
      onCouponApplied?.(validated);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply coupon');
      setCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCoupon(null);
    setInput('');
    setError('');
    onCouponRemoved?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleApply();
  };

  const discountLabel = () => {
    if (!coupon) return '';
    if (coupon.discountType === 'PERCENTAGE') {
      return `${coupon.discountValue}% off`;
    }
    return `GH₵ ${coupon.discountValue} off`;
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-white/70">
        <Tag className="w-4 h-4 text-[#7C3AED]" />
        Have a coupon code?
      </label>

      {/* No coupon applied — show input */}
      {!coupon && (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="ENTER CODE"
            maxLength={20}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/25 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
          />
          <button
            onClick={handleApply}
            disabled={!input.trim() || loading}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Apply'
            )}
          </button>
        </div>
      )}

      {/* Coupon applied — show success state */}
      {coupon && (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">{coupon.code}</p>
              <p className="text-xs text-emerald-400/70">{discountLabel()}</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all"
          >
            Remove
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
