/**
 * Toast Notification System — Nexify
 * Dark theme: bg-[#1E1B4B] card, border-left color by type, auto-dismiss 4s
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

// ─── Context ─────────────────────────────────────────────────
const ToastContext = createContext(null);

// ─── Individual Toast ────────────────────────────────────────
function Toast({ id, message, type = 'info', onClose }) {
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);

  useEffect(() => {
    const duration = 4000;
    const interval = 50;
    const decrement = (100 / (duration / interval));

    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p <= 0) {
          clearInterval(timerRef.current);
          onClose();
          return 0;
        }
        return p - decrement;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [onClose]);

  const borderColors = {
    success: 'border-l-emerald-500',
    error: 'border-l-red-500',
    info: 'border-l-[#7C3AED]',
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-red-400" />,
    info: <Info className="w-4 h-4 text-[#7C3AED]" />,
  };

  return (
    <div className="relative flex items-start gap-3 bg-[#1E1B4B] border border-white/10 border-l-4 rounded-xl shadow-xl overflow-hidden min-w-[280px] max-w-sm">
      <div className="flex items-start gap-3 p-4 flex-1">
        <div className="mt-0.5">{icons[type]}</div>
        <p className="text-white text-sm flex-1 leading-snug">{message}</p>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors flex-shrink-0 mt-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
        <div
          className={`h-full transition-all duration-[50ms] ${
            type === 'success' ? 'bg-emerald-500' :
            type === 'error' ? 'bg-red-500' : 'bg-[#7C3AED]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Toast Provider ─────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const queueRef = useRef([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => {
      const visible = prev.length >= 3 ? prev : [...prev, { id, message, type }];
      if (prev.length >= 3) {
        queueRef.current.push({ id, message, type });
      }
      return visible;
    });
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => {
      const next = prev.filter(t => t.id !== id);
      if (queueRef.current.length > 0) {
        const nextFromQueue = queueRef.current.shift();
        return [...next, { ...nextFromQueue, id: Date.now() + Math.random() }];
      }
      return next;
    });
  }, []);

  const toast = useCallback((message, type) => addToast(message, type), [addToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <Toast
                message={t.message}
                type={t.type}
                onClose={() => removeToast(t.id)}
              />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
