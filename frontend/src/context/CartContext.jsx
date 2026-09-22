/**
 * CartContext — Full Shopping Cart State Management
 *
 * Manages cart items list, add/remove/clear operations, and pricing totals.
 * The checkoutCourse / checkout modal logic is preserved alongside this.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'nexify_cart';

export function CartProvider({ children }) {
  // ─── Cart Items State ────────────────────────────────────────
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // ─── Coupon State ────────────────────────────────────────────
  const [coupon, setCoupon] = useState(null); // { code, discountType, discountValue }

  // ─── Checkout Modal State (existing logic preserved) ─────────
  const [checkoutCourse, setCheckoutCourse] = useState(null);
  const [includeOrderBump, setIncludeOrderBump] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    studentEmail: '',
    studentName: '',
    studentPhone: '',
    paymentChannel: 'MOMO_MTN',
  });
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // ─── Cart Item Operations ────────────────────────────────────
  const addToCart = useCallback((course) => {
    setCartItems(prev => {
      if (prev.find(item => item.courseId === course.id)) {
        return prev; // already in cart
      }
      return [
        ...prev,
        {
          courseId: course.id,
          title: course.title,
          instructorName: course.creator?.fullName || course.instructorName || 'Nexify Instructor',
          price: course.priceGhs || 0,
          thumbnail: course.thumbnailUrl || null,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((courseId) => {
    setCartItems(prev => prev.filter(item => item.courseId !== courseId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const isInCart = useCallback((courseId) => {
    return cartItems.some(item => item.courseId === courseId);
  }, [cartItems]);

  // ─── Coupon Operations ───────────────────────────────────────
  const applyCoupon = useCallback(async (code) => {
    const token = localStorage.getItem('nexify_token');
    const res = await fetch(`/api/v1/coupons/validate/${code}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Invalid coupon');
    setCoupon(data.data);
    return data.data;
  }, []);

  const removeCoupon = useCallback(() => {
    setCoupon(null);
  }, []);

  // ─── Pricing ─────────────────────────────────────────────────
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const discountAmount = coupon
    ? coupon.discountType === 'PERCENTAGE'
      ? subtotal * (coupon.discountValue / 100)
      : coupon.discountValue
    : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const platformFee = discountedSubtotal * 0.1;
  const total = discountedSubtotal + platformFee;

  // ─── Checkout Modal Operations (existing) ────────────────────
  const openCheckout = useCallback((course) => {
    setCheckoutCourse(course);
    setIncludeOrderBump(false);
    setCheckoutForm({
      studentEmail: '',
      studentName: '',
      studentPhone: '',
      paymentChannel: 'MOMO_MTN',
    });
    setCheckoutError(null);
  }, []);

  const closeCheckout = useCallback(() => {
    setCheckoutCourse(null);
    setCheckoutError(null);
  }, []);

  const toggleOrderBump = useCallback((course) => {
    if (course.hasOrderBump) {
      setIncludeOrderBump(prev => !prev);
    }
  }, []);

  const updateCheckoutForm = useCallback((field, value) => {
    setCheckoutForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const calculateTotal = useCallback((course) => {
    if (!course) return 0;
    const base = course.priceGhs || 0;
    const bump = (includeOrderBump && course.hasOrderBump && course.orderBumpPriceGhs)
      ? course.orderBumpPriceGhs
      : 0;
    return base + bump;
  }, [includeOrderBump]);

  // ─── Checkout submit ─────────────────────────────────────────
  const submitCheckout = useCallback(async (formData) => {
    if (!checkoutCourse) return;
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const token = localStorage.getItem('nexify_token');
      const payload = {
        courseId: checkoutCourse.id,
        studentEmail: formData.studentEmail,
        studentName: formData.studentName,
        studentPhone: formData.studentPhone,
        paymentChannel: formData.paymentChannel,
        includeOrderBump: includeOrderBump && checkoutCourse.hasOrderBump,
      };
      const res = await axios.post('/api/v1/orders/checkout', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      // On success, close modal and clear cart
      setCheckoutCourse(null);
      setIncludeOrderBump(false);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Checkout failed. Please try again.';
      setCheckoutError(msg);
      throw err;
    } finally {
      setCheckingOut(false);
    }
  }, [checkoutCourse, includeOrderBump]);

  // ─── Combined Value ──────────────────────────────────────────
  const value = {
    // Cart items
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    subtotal,
    discountAmount,
    discountedSubtotal,
    platformFee,
    total,
    itemCount: cartItems.length,
    // Coupon
    coupon,
    applyCoupon,
    removeCoupon,
    // Checkout modal (preserved)
    checkoutCourse,
    includeOrderBump,
    checkoutForm,
    checkingOut,
    checkoutError,
    openCheckout,
    closeCheckout,
    toggleOrderBump,
    updateCheckoutForm,
    calculateTotal,
    submitCheckout,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
