/**
 * User Profile / Settings Page — Nexify
 * Two-column layout: sidebar nav + main content area.
 * Tabs: Personal Info, Security, Notifications, Billing.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Camera,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  LogOut,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

const TABS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

// ─── Skeleton Loader ─────────────────────────────────────────
function Skeleton({ className }) {
  return (
    <div className={`bg-white/5 rounded-lg animate-pulse ${className}`} />
  );
}

// ─── Role Badge ──────────────────────────────────────────────
function RoleBadge({ role }) {
  const colors = {
    ADMIN: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    CREATOR: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    AFFILIATE: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    STUDENT: 'bg-[#7C3AED]/20 text-purple-400 border-[#7C3AED]/30',
  };
  const cls = colors[role] || 'bg-white/10 text-white/60 border-white/20';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {role}
    </span>
  );
}

// ─── Toggle Switch ───────────────────────────────────────────
function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2 focus:ring-offset-[#0F172A] ${
        checked ? 'bg-[#7C3AED]' : 'bg-white/10'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Personal Info Tab ────────────────────────────────────────
function PersonalInfoTab({ user, onSave, saving }) {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    bio: '',
  });
  const [avatarHovered, setAvatarHovered] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const initials = form.fullName
    ? form.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'bio' && value.length > 200) return;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center sm:items-start">
        <div
          className="relative"
          onMouseEnter={() => setAvatarHovered(true)}
          onMouseLeave={() => setAvatarHovered(false)}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={form.fullName}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#7C3AED]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#7C3AED] flex items-center justify-center border-2 border-[#7C3AED]">
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
          )}
          {/* Upload overlay */}
          <button
            type="button"
            onClick={() => alert('Avatar upload coming soon')}
            className={`absolute inset-0 rounded-full bg-black/60 flex items-center justify-center transition-opacity duration-200 ${
              avatarHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
        </div>
        <p className="mt-2 text-xs text-white/40">Click to upload avatar</p>
      </div>

      {/* Restart Tour */}
      <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
        <div>
          <p className="text-sm font-medium text-white">Platform Tour</p>
          <p className="text-xs text-white/40 mt-0.5">Replay the onboarding walkthrough for your role.</p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('nexa:restart-tour'))}
          className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 border border-[#7C3AED]/40 text-purple-300 rounded-xl text-xs font-medium transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" /> Restart Tour
        </button>
      </div>

      {/* Full Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7C3AED] transition-colors"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/40 cursor-not-allowed"
          />
          {user?.isSocialLogin && (
            <p className="mt-1 text-xs text-white/30">Managed via social login</p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
          Phone
        </label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full max-w-sm bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7C3AED] transition-colors"
          placeholder="+233 XX XXX XXXX"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
          Bio
          <span className="ml-2 normal-case tracking-normal font-normal text-white/30">
            ({form.bio.length}/200)
          </span>
        </label>
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          rows={4}
          maxLength={200}
          className="w-full max-w-lg bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7C3AED] transition-colors resize-none"
          placeholder="A short bio about yourself..."
        />
      </div>

      {/* Role (non-editable) */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/60 uppercase tracking-wider">Role:</span>
        <RoleBadge role={user?.role} />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        {saving ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

// ─── Security Tab ─────────────────────────────────────────────
function SecurityTab() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(f => ({ ...f, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.currentPassword) errs.currentPassword = 'Current password is required';
    if (!form.newPassword) errs.newPassword = 'New password is required';
    else if (form.newPassword.length < 8) errs.newPassword = 'Minimum 8 characters required';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password');
      toast('Password updated', 'success');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const PwField = ({ name, label, show, onToggle }) => (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={form[name]}
          onChange={handleChange}
          className="w-full max-w-sm bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7C3AED] transition-colors"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {errors[name] && (
        <p className="mt-1 text-xs text-red-400">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-white/50">
        Use this form to update your account password.
      </p>
      <PwField name="currentPassword" label="Current Password" show={showCurrent} onToggle={() => setShowCurrent(s => !s)} />
      <PwField name="newPassword" label="New Password" show={showNew} onToggle={() => setShowNew(s => !s)} />
      <PwField name="confirmPassword" label="Confirm Password" show={showConfirm} onToggle={() => setShowConfirm(s => !s)} />
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        {saving ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Shield className="w-4 h-4" />
        )}
        {saving ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}

// ─── Notifications Tab ────────────────────────────────────────
function NotificationsTab() {
  const [settings, setSettings] = useState({
    emailEnroll: true,
    emailPayout: true,
    emailUpdates: false,
  });

  const toggles = [
    { key: 'emailEnroll', label: 'Email me when a student enrolls in my course' },
    { key: 'emailPayout', label: 'Email me when I receive a payout' },
    { key: 'emailUpdates', label: 'Email me about platform updates and news' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/50">Manage how you receive notifications from Nexify.</p>
      <div className="space-y-4">
        {toggles.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-white/5">
            <span className="text-sm text-white/80">{label}</span>
            <Toggle
              checked={settings[key]}
              onChange={val => setSettings(s => ({ ...s, [key]: val }))}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-white/30">Changes are saved automatically.</p>
    </div>
  );
}

// ─── Billing Tab ───────────────────────────────────────────────
function BillingTab() {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-[#0F172A] border border-white/10 rounded-xl text-center">
        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
          <CreditCard className="w-6 h-6 text-white/40" />
        </div>
        <p className="text-sm text-white/50">No payment method on file</p>
        <p className="text-xs text-white/30 mt-1">Add a mobile money account to receive payouts</p>
        <button
          type="button"
          onClick={() => alert('Add payment method coming soon')}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          Add Mobile Money Account
        </button>
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────
export default function Profile() {
  const { user, token, loading, isAuthenticated, updateProfile, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0 space-y-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-24 h-6 rounded-full" />
            <div className="space-y-2 pt-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="w-full h-10" />)}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSaveProfile = async formData => {
    setSaving(true);
    try {
      await updateProfile(formData);
      toast('Profile updated successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      if (err.response?.status === 401) {
        toast('Session expired. Please log in again.', 'error');
      } else {
        toast(msg, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/40 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar — Desktop */}
        <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col gap-6">
          {/* Identity card */}
          <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-5 text-center">
            <div className="w-20 h-20 rounded-full bg-[#7C3AED] flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-2xl">{initials}</span>
            </div>
            <h2 className="text-sm font-semibold text-white">{user?.fullName || 'Unknown'}</h2>
            <p className="text-xs text-white/40 mt-0.5">{user?.email}</p>
            <div className="mt-3 flex justify-center">
              <RoleBadge role={user?.role} />
            </div>
          </div>

          {/* Nav */}
          <nav className="bg-[#1E1B4B] border border-white/10 rounded-xl p-2 space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  activeTab === id
                    ? 'bg-[#7C3AED] text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Logout
          </button>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile tabs */}
          <div className="lg:hidden flex gap-1 overflow-x-auto mb-6 pb-1 scrollbar-hide">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  activeTab === id
                    ? 'bg-[#7C3AED] text-white'
                    : 'bg-[#1E1B4B] border border-white/10 text-white/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Mobile identity strip */}
          <div className="lg:hidden flex items-center gap-3 bg-[#1E1B4B] border border-white/10 rounded-xl p-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#7C3AED] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <RoleBadge role={user?.role} />
            </div>
          </div>

          {/* Tab content card */}
          <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">
                {TABS.find(t => t.id === activeTab)?.label}
              </h3>
            </div>

            {activeTab === 'personal' && (
              <PersonalInfoTab user={user} onSave={handleSaveProfile} saving={saving} />
            )}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'billing' && <BillingTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
