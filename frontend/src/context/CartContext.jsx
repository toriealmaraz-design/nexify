/**
 * CartContext — Checkout Modal State & Order Bump Controls
 *
 * Manages the checkout modal state: which course is being purchased,
 * whether the order bump is included, and the calculated total.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
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

  // Calculate total based on course + bump
  const calculateTotal = useCallback((course) => {
    if (!course) return 0;
    const base = course.priceGhs || 0;
    const bump = (includeOrderBump && course.hasOrderBump && course.orderBumpPriceGhs)
      ? course.orderBumpPriceGhs
      : 0;
    return base + bump;
  }, [includeOrderBump]);

  const value = {
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
