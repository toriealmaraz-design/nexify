/**
 * Login Page
 * Public gateway — sign in to access your portal.
 * Design: Grodital dark theme × animated entrances
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

// ── Animation keyframes (injected once on mount) ──
const ANIM_STYLES = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
    50%       { box-shadow: 0 0 22px 6px rgba(124,58,237,0.30); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-6px); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes spinSlow {
    to { transform: rotate(360deg); }
  }
  .animate-fade-slide-up { animation: fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
  .animate-fade-in       { animation: fadeIn 0.4s ease-out both; }
  .animate-pulse-glow    { animation: pulseGlow 2.8s ease-in-out infinite; }
  .animate-float         { animation: float 3s ease-in-out infinite; }
  .animate-shimmer       { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2.5s infinite; }
  .delay-100  { animation-delay: 0.10s; }
  .delay-200  { animation-delay: 0.20s; }
  .delay-300  { animation-delay: 0.30s; }
  .delay-400  { animation-delay: 0.40s; }
  .delay-500  { animation-delay: 0.50s; }
  .delay-600  { animation-delay: 0.60s; }
  .delay-700  { animation-delay: 0.70s; }
`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle OAuth callback — token passed via URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    if (token) {
      localStorage.setItem('nexify_token', token);
      // Decode JWT payload to get role for correct portal redirect
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
        const payload = JSON.parse(atob(padded));
        const routes = { ADMIN: '/admin', CREATOR: '/creator', AFFILIATE: '/affiliate', STUDENT: '/student' };
        navigate(routes[payload.role] || '/student');
      } catch {
        navigate('/student');
      }
      window.history.replaceState({}, document.title, '/login');
    } else if (error) {
      setError('Social login failed. Please try again or use email/password.');
      window.history.replaceState({}, document.title, '/login');
    }
  }, [navigate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stylesRef = useRef(null);
  useEffect(() => {
    if (!stylesRef.current) {
      const el = document.createElement('style');
      el.textContent = ANIM_STYLES;
      document.head.appendChild(el);
      stylesRef.current = el;
    }
    return () => {
      if (stylesRef.current) { stylesRef.current.remove(); stylesRef.current = null; }
    };
  }, []);

  // Load Apple Sign In SDK
  useEffect(() => {
  if (document.getElementById('apple-sign-in-sdk')) return;
  const script = document.createElement('script');
  script.id = 'apple-sign-in-sdk';
  script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
  script.async = true;
  script.onload = () => {
    window.AppleID.init({
      clientId: 'YOUR_APPLE_CLIENT_ID',
      scope: 'email fullName',
      redirectUri: window.location.origin + '/api/v1/auth/apple',
      usePopup: true,
    });
  };
  document.head.appendChild(script);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const user = await login(email, password);
      const routes = { ADMIN: '/admin', CREATOR: '/creator', AFFILIATE: '/affiliate', STUDENT: '/student' };
      navigate(routes[user.role] || '/student');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Pre-mount: show a clean centered logo
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">
        <div className="w-14 h-14 bg-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto animate-pulse-glow">
          <span className="text-black font-bold text-2xl">N</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white overflow-hidden relative">
      {/* Top accent bar */}
      <div className="h-1 bg-[#7C3AED] relative z-10" />

      {/* Atmospheric gradient — subtle center lighter, edges darker */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(88,28,135,0.08) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(30,27,75,0.5) 0%, transparent 50%)' }} />

      {/* Soft ambient glow behind card */}
      <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[400px] h-60 bg-[#7C3AED]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex items-center justify-center min-h-[calc(100vh-4px)] px-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo — clickable to landing */}
          <Link to="/" className="block text-center mb-6 animate-fade-slide-up hover:opacity-90 transition-opacity">
            <div className="inline-flex items-center gap-2 justify-center mb-3">
              <div className="w-10 h-10 bg-[#7C3AED] rounded-lg flex items-center justify-center animate-pulse-glow">
                <span className="text-black font-bold text-xl">N</span>
              </div>
              <span className="text-xl font-bold text-white">Nexify</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-white/40 mt-0.5 text-sm">Sign in to your account</p>
          </Link>

          {/* Form card — with purple glow shadow */}
          <div
            className="bg-[#1E1B4B] border border-white/15 rounded-2xl p-6 animate-fade-slide-up delay-200"
            style={{ boxShadow: '0 0 0 1px rgba(124,58,237,0.1), 0 0 30px rgba(124,58,237,0.12), 0 10px 15px -3px rgba(15,23,42,0.4), 0 4px 6px -2px rgba(15,23,42,0.2)' }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl animate-fade-in flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full px-4 py-2.5 bg-[#1E1B4B] border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-50 focus:border-transparent transition-all duration-200 hover:border-white/30 focus:bg-[#252050] animate-fade-slide-up delay-300"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 bg-[#1E1B4B] border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-50 focus:border-transparent transition-all duration-200 hover:border-white/30 focus:bg-[#252050] animate-fade-slide-up delay-300"
                  placeholder="Your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7C3AED] text-black py-2.5 rounded-xl font-semibold hover:brightness-110 active:scale-[0.97] active:brightness-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed animate-fade-slide-up delay-400 relative overflow-hidden group"
                style={{ transition: 'transform 200ms cubic-bezier(0.34,1.56,0.64,1), filter 150ms ease' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <svg className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Social login buttons */}
            <div className="mt-4 space-y-2.5">
              <p className="text-xs text-white/30 text-center uppercase tracking-wider">Or continue with</p>
              <button
                type="button"
                onClick={() => { window.location.href = '/api/v1/auth/google'; }}
                className="w-full bg-white text-slate-800 py-2.5 rounded-xl font-medium hover:bg-gray-100 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2.5 text-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button
                type="button"
                id="apple-sign-in-btn"
                onClick={async () => {
                  if (!window.AppleID) {
                    setError('Apple Sign In is not available. Please ensure you are on a supported browser.');
                    return;
                  }
                  try {
                    const response = await window.AppleID.auth.signIn({
                      usePopup: true,
                      request: ['email', 'fullName'],
                    });
                    const identityToken = response.authorization.id_token;
                    const res = await fetch('/api/v1/auth/apple', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        identityToken,
                        fullName: response.authorization.fullName,
                      }),
                    });
                    const data = await res.json();
                    if (data.success && data.data?.token) {
                      localStorage.setItem('nexify_token', data.data.token);
                      try {
                        const base64 = data.data.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
                        const payload = JSON.parse(atob(padded));
                        const routes = { ADMIN: '/admin', CREATOR: '/creator', AFFILIATE: '/affiliate', STUDENT: '/student' };
                        navigate(routes[payload.role] || '/student');
                      } catch {
                        navigate('/student');
                      }
                    } else {
                      setError(data.message || 'Apple sign-in failed.');
                    }
                  } catch (err) {
                    setError(err.message || 'Apple sign-in was cancelled or failed.');
                  }
                }}
                className="w-full bg-black text-white py-2.5 rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2.5 text-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                  <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            {/* Forgot password */}
            <div className="mt-3 text-right animate-fade-in delay-400">
              <Link to="/forgot-password" className="text-white/40 text-sm hover:text-[#7C3AED] transition-colors">
                Forgot password?
              </Link>
            </div>

            <div className="mt-4 text-center animate-fade-in delay-500">
              <span className="text-white/40">Don't have an account? </span>
              <Link to="/register" className="text-[#7C3AED] font-medium hover:underline hover:text-[#c4b5fd] transition-colors inline-flex items-center gap-1 group">
                Create one
                <svg className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Demo accounts */}
            <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in delay-500">
              <p className="text-xs text-white/30 mb-2.5 text-center">Demo Accounts</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { email: 'admin@nexify.app', role: 'Admin' },
                  { email: 'creator@nexify.app', role: 'Creator' },
                  { email: 'affiliate@nexify.app', role: 'Affiliate' },
                  { email: 'student@nexify.app', role: 'Student' },
                ].map((demo, i) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => { setEmail(demo.email); setPassword(demo.email.split('@')[0].split('.')[0] + '123'); }}
                    className={`flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-1.5 text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group animate-fade-in`}
                    style={{ animationDelay: `${500 + i * 60}ms` }}
                  >
                    <span className="text-[#7C3AED] group-hover:text-[#c4b5fd] transition-colors">{demo.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
