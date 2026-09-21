/**
 * Register Page
 * Public gateway — create an account and choose your portal role.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function Register() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: searchParams.get('role') || 'STUDENT',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const user = await register(form);
      const routes = {
        ADMIN: '/admin',
        CREATOR: '/creator',
        AFFILIATE: '/affiliate',
        STUDENT: '/student',
      };
      navigate(routes[user.role] || '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE9FE] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[#0F172A] rounded-lg flex items-center justify-center">
              <span className="text-[#7C3AED] text-xl font-bold">N</span>
            </div>
            <span className="text-xl font-bold text-[#0F172A]">Nexify</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mt-4">Create Your Account</h1>
          <p className="text-slate-500 mt-1">Choose your role to get started</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-nexify shadow-card-md border border-slate-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-nexify">
                {error}
              </div>
            )}

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">I want to...</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'STUDENT', label: '📚 Learn', desc: 'Take courses' },
                  { value: 'CREATOR', label: '✏️ Teach', desc: 'Create courses' },
                  { value: 'AFFILIATE', label: '📣 Promote', desc: 'Earn commissions' },
                  { value: 'ADMIN', label: '⚙️ Admin', desc: 'Manage platform' },
                ].map(role => (
                  <label
                    key={role.value}
                    className={`flex flex-col items-center p-3 rounded-nexify border-2 cursor-pointer transition-all text-center
                      ${form.role === role.value
                        ? 'border-[#7C3AED] bg-[#7C3AED]/5 shadow-bump-glow'
                        : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={form.role === role.value}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      className="sr-only"
                    />
                    <span className="text-lg mb-1">{role.label}</span>
                    <span className="text-xs text-slate-500">{role.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-nexify text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="Kofi Mensah"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-nexify text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-nexify text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="+233..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password (min 8 chars)</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-nexify text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="Your secure password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7C3AED] text-white py-2.5 rounded-nexify font-semibold hover:bg-[#6D28D9] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-[#7C3AED] font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
