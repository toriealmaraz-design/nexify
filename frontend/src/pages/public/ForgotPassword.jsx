/**
 * Forgot Password Page
 * Sends a password reset link to the user's email.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const ANIM_STYLES = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-slide-up { animation: fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
`;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{ANIM_STYLES}</style>
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="block text-center mb-6 animate-fade-slide-up hover:opacity-90 transition-opacity">
            <div className="inline-flex items-center gap-2 justify-center mb-3">
              <div className="w-10 h-10 bg-[#7C3AED] rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-xl">N</span>
              </div>
              <span className="text-xl font-bold text-white">Nexify</span>
            </div>
          </Link>

          {/* Card */}
          <div
            className="bg-[#1E1B4B] border border-white/10 rounded-2xl p-6 animate-fade-slide-up"
            style={{ boxShadow: '0 0 0 1px rgba(124,58,237,0.1), 0 0 30px rgba(124,58,237,0.12), 0 10px 15px -3px rgba(15,23,42,0.4), 0 4px 6px -2px rgba(15,23,42,0.2)' }}
          >
            {!success ? (
              <>
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-white mb-1">Reset your password</h1>
                  <p className="text-white/40 text-sm">Enter your email and we will send you a reset link</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full px-4 py-2.5 bg-[#0F172A] border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-50 focus:border-transparent transition-all duration-200 hover:border-white/30"
                      placeholder="you@example.com"
                      required
                    />
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
                        Sending...
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-[#7C3AED]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
                <p className="text-white/50 text-sm mb-6">
                  If <span className="text-white/70">{email}</span> is registered, a reset link has been sent.
                </p>
                <p className="text-white/30 text-xs mb-6">
                  You can close this tab.
                </p>
                <Link
                  to="/login"
                  className="text-[#7C3AED] font-medium hover:underline text-sm"
                >
                  Back to Sign In
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
