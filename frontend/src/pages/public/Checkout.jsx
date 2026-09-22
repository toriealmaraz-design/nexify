/**
 * Checkout Page — Payment Form & Order Confirmation
 * Two-column layout: payment form (left) + order summary (right).
 * Auth guard, mock card validation, API call to /api/v1/orders.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  User,
  Lock,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

function formatGhs(amount) {
  return `GH\u20B5 ${amount.toFixed(2)}`;
}

// ─── Auth Guard ────────────────────────────────────────────────

function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Store intended destination
      sessionStorage.setItem('checkout_intended', '/checkout');
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
        <div className="bg-[#1E1B4B] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-8 h-8 text-[#7C3AED]" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Sign in to checkout</h1>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">
            You need an account to complete your purchase. Signing in only takes a moment.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="w-full py-3 border border-white/10 text-white/70 hover:text-white hover:border-white/20 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Create Account
            </Link>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5">
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

// ─── Field Helpers ─────────────────────────────────────────────

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return digits.slice(0, 2) + '/' + digits.slice(2);
  }
  return digits;
}

// ─── Payment Form ─────────────────────────────────────────────

function PaymentForm({ onSubmit, submitting }) {
  const [values, setValues] = useState({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!values.cardholderName.trim()) {
      errs.cardholderName = 'Cardholder name is required';
    }
    const rawCard = values.cardNumber.replace(/\s/g, '');
    if (!rawCard || rawCard.length < 16) {
      errs.cardNumber = 'Enter a valid 16-digit card number';
    }
    const [month, year] = values.expiry.split('/');
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
      errs.expiry = 'Enter a valid expiry (MM/YY)';
    }
    const expYear = parseInt('20' + year);
    const expMonth = parseInt(month);
    const now = new Date();
    if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
      errs.expiry = 'Card has expired';
    }
    if (!values.cvc || values.cvc.length < 3) {
      errs.cvc = 'Enter a valid CVC';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onSubmit(values);
  };

  const handleChange = (field) => (e) => {
    let val = e.target.value;
    if (field === 'cardNumber') {
      val = formatCardNumber(val);
    } else if (field === 'expiry') {
      val = formatExpiry(val);
    } else if (field === 'cvc') {
      val = val.replace(/\D/g, '').slice(0, 4);
    } else if (field === 'cardholderName') {
      val = val.replace(/[0-9]/g, '');
    }
    setValues(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const inputClass = (field) =>
    `w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm
    focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent
    transition-all ${errors[field] ? 'border-red-500/70' : 'border-white/10'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Cardholder Name */}
      <div>
        <label className="block text-xs text-white/50 uppercase tracking-wider font-medium mb-2">
          Cardholder Name
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <input
            type="text"
            value={values.cardholderName}
            onChange={handleChange('cardholderName')}
            placeholder="As printed on card"
            className={`${inputClass('cardholderName')} pl-10`}
            autoComplete="cc-name"
          />
        </div>
        {errors.cardholderName && (
          <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.cardholderName}
          </p>
        )}
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-xs text-white/50 uppercase tracking-wider font-medium mb-2">
          Card Number
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <input
            type="text"
            value={values.cardNumber}
            onChange={handleChange('cardNumber')}
            placeholder="0000 0000 0000 0000"
            className={`${inputClass('cardNumber')} pl-10`}
            inputMode="numeric"
            autoComplete="cc-number"
          />
        </div>
        {errors.cardNumber && (
          <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.cardNumber}
          </p>
        )}
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 uppercase tracking-wider font-medium mb-2">
            Expiry
          </label>
          <input
            type="text"
            value={values.expiry}
            onChange={handleChange('expiry')}
            placeholder="MM/YY"
            className={inputClass('expiry')}
            inputMode="numeric"
            autoComplete="cc-exp"
          />
          {errors.expiry && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.expiry}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-white/50 uppercase tracking-wider font-medium mb-2">
            CVC
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
            <input
              type="text"
              value={values.cvc}
              onChange={handleChange('cvc')}
              placeholder="123"
              className={`${inputClass('cvc')} pl-10`}
              inputMode="numeric"
              autoComplete="cc-csc"
            />
          </div>
          {errors.cvc && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.cvc}
            </p>
          )}
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 text-white/30 text-xs">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Payments are encrypted and secure</span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Complete Purchase
          </>
        )}
      </button>
    </form>
  );
}

// ─── Order Summary Sidebar ─────────────────────────────────────

function OrderSummarySidebar({ items, subtotal, platformFee, total, discountAmount, coupon }) {
  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 space-y-5">
      <h2 className="text-white font-semibold text-lg flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-[#7C3AED]" />
        Order Summary
      </h2>

      {/* Items */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {items.map(item => (
          <div key={item.courseId} className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7C3AED]/30 to-[#1E1B4B] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <CreditCard className="w-4 h-4 text-white/30" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-sm leading-snug line-clamp-2">{item.title}</p>
              <p className="text-white/40 text-xs mt-0.5">{item.instructorName}</p>
            </div>
            <p className="text-white font-medium text-sm flex-shrink-0">
              {formatGhs(item.price)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-4 space-y-2">
        {coupon && discountAmount > 0 && (
          <div className="flex justify-between text-sm text-emerald-400">
            <span>Coupon ({coupon.code})</span>
            <span>-{formatGhs(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-white/60">
          <span>Subtotal</span>
          <span>{formatGhs(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-white/60">
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Platform fee (10%)
          </span>
          <span>{formatGhs(platformFee)}</span>
        </div>
        <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
          <span>Total</span>
          <span className="text-[#7C3AED]">{formatGhs(total)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Success State ─────────────────────────────────────────────

function SuccessView({ onContinue }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-emerald-400" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Purchase Complete</h1>
      <p className="text-white/50 text-sm mb-8 max-w-sm leading-relaxed">
        Your order has been placed. Access your purchased courses from your student dashboard.
      </p>
      <button
        onClick={onContinue}
        className="px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl transition-all"
      >
        Go to My Orders
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

export default function CheckoutPage() {
  const { cartItems, subtotal, platformFee, total, discountAmount, coupon, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (!success && cartItems.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cartItems.length, success, navigate]);

  const handleSubmit = async (paymentDetails) => {
    setSubmitting(true);
    try {
      // Use the guest checkout endpoint which accepts cart-item checkout
      // POST /api/v1/orders/checkout handles both guest and authenticated checkout
      const res = await fetch('/api/v1/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            courseId: item.courseId,
            price: item.price,
          })),
          paymentDetails,
          couponCode: coupon?.code || null,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        navigate('/login');
        toast.error('Please sign in to complete your purchase');
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || `Order failed (${res.status})`);
      }

      clearCart();
      setSuccess(true);
      toast.success('Purchase complete! Your courses are ready.');
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0F172A] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/cart" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Cart</span>
          </Link>
          <div className="flex-1 text-center">
            <span className="font-bold text-white text-lg">Nexify</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {success ? (
          <SuccessView onContinue={() => navigate('/student')} />
        ) : (
          <AuthGuard>
            <h1 className="text-2xl font-bold text-white mb-8">Checkout</h1>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
              {/* Payment Form */}
              <div>
                <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-[#7C3AED]" />
                    <h2 className="text-white font-semibold">Payment Details</h2>
                  </div>
                  <PaymentForm onSubmit={handleSubmit} submitting={submitting} />
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:sticky lg:top-24 h-fit">
                <OrderSummarySidebar
                  items={cartItems}
                  subtotal={subtotal}
                  platformFee={platformFee}
                  total={total}
                  discountAmount={discountAmount}
                  coupon={coupon}
                />
              </div>
            </div>
          </AuthGuard>
        )}
      </div>
    </div>
  );
}
