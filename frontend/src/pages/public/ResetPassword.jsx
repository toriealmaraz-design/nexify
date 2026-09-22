/**
 * Reset Password Page
 * Sets a new password using a token from the forgot-password email.
 */
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

const ANIM_STYLES = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-slide-up { animation: fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
`;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!newPassword) errs.newPassword = 'Password is required.';
    else if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters.';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrors({ form: data.message || 'Failed to reset password. The link may have expired.' });
      }
    } catch (err) {
      setErrors({ form: 'Unable to connect. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <>
        <style>{ANIM_STYLES}</style>
        <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <div className="bg-[#1E1B4B] border border-white/10 rounded-2xl p-8">
              <div className="mb-4 flex justify-center">
                <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Invalid reset link</h2>
              <p className="text-white/40 text-sm mb-6">This password reset link is missing or has expired.</p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 bg-[#7C3AED] text-black px-5 py-2.5 rounded-xl font-semibold hover:brightness-110 transition-all text-sm"
              >
                Request new link
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{ANIM_STYLES}</style>
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-6 animate-fade-slide-up">
            <div className="inline-flex items-center gap-2 justify-center mb-3">
              <div className="w-10 h-10 bg-[#7C3AED] rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-xl">N</span>
              </div>
              <span className="text-xl font-bold text-white">Nexify</span>
            </div>
          </div>

          {/* Card */}
          <div
            className="bg-[#1E1B4B] border border-white/10 rounded-2xl p-6 animate-fade-slide-up"
            style={{ boxShadow: '0 0 0 1px rgba(124,58,237,0.1), 0 0 30px rgba(124,58,237,0.12), 0 10px 15px -3px rgba(15,23,42,0.4), 0 4px 6px -2px rgba(15,23,42,0.2)' }}
          >
            {!success ? (
              <>
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-white mb-1">Set new password</h1>
                  <p className="text-white/40 text-sm">Choose a strong password to secure your account</p>
                </div>

                {errors.form && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    {errors.form}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' })); }}
                        className={`w-full px-4 py-2.5 pr-10 bg-[#0F172A] border rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-50 transition-all duration-200 hover:border-white/30 ${errors.newPassword ? 'border-red-500/50' : 'border-white/20'}`}
                        placeholder="Min 8 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        tabIndex={-1}
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-red-400 text-xs mt-1.5">{errors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                        className={`w-full px-4 py-2.5 pr-10 bg-[#0F172A] border rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-50 transition-all duration-200 hover:border-white/30 ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/20'}`}
                        placeholder="Repeat password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#7C3AED] text-black py-2.5 rounded-xl font-semibold hover:brightness-110 active:scale-[0.97] active:brightness-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Resetting...
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-[#7C3AED]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Password reset</h2>
                <p className="text-white/50 text-sm mb-6">Your password has been changed successfully.</p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-[#7C3AED] text-black px-5 py-2.5 rounded-xl font-semibold hover:brightness-110 transition-all text-sm"
                >
                  Go to Sign In
                </Link>
              </div>
            )}

            <div className="mt-6 text-center">
              <span className="text-white/40 text-sm">Remember your password? </span>
              <Link to="/login" className="text-[#7C3AED] font-medium hover:underline text-sm">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
