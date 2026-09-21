/**
 * Nexify Platform — Master Client Router & Context Wrapper
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ─── Cart Provider (placeholder) ──────────────────────────────
function CartProvider({ children }) {
  return <>{children}</>;
}

// ─── Page components ─────────────────────────────────────────
import PublicLanding from './pages/public/Landing';
const LoginPage = lazy(() => import('./pages/public/Login'));
const RegisterPage = lazy(() => import('./pages/public/Register'));
const CourseDetail = lazy(() => import('./pages/public/CourseDetail'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));

// ─── Loading fallback ────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ─── Error Boundary ───────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[Nexify Error]', error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-white/50 text-sm mb-4 font-mono">{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-medium"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Nav Item ────────────────────────────────────────────────
function NavItem({ href, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === href;
  return (
    <Link
      to={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150
        ${isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

// ─── Simple Layouts ───────────────────────────────────────────
function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      <aside className="w-60 min-h-screen bg-[#0B1120] border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">N</span>
            </div>
            <span className="font-bold">Nexify</span>
          </Link>
          <p className="text-xs text-white/40 mt-1">Admin Portal</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavItem href="/admin" icon="📊" label="Dashboard" />
          <NavItem href="/admin/staging" icon="📋" label="Staging" />
          <NavItem href="/admin/metrics" icon="📈" label="Metrics" />
          <NavItem href="/admin/users" icon="👥" label="Users" />
          <NavItem href="/admin/assets" icon="🎨" label="Assets" />
        </nav>
        <div className="p-3 border-t border-white/5">
          <NavItem href="/logout" icon="🚪" label="Logout" />
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </main>
    </div>
  );
}

// ─── Protected Route ──────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const roleRoutes = { ADMIN: '/admin', CREATOR: '/creator', AFFILIATE: '/affiliate', STUDENT: '/student' };
    return <Navigate to={roleRoutes[user.role] || '/'} replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  return children;
}

// ─── App Router ──────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<PublicLanding />} />
              <Route path="/login" element={<Suspense fallback={<PageLoader />}><PublicRoute><LoginPage /></PublicRoute></Suspense>} />
              <Route path="/register" element={<Suspense fallback={<PageLoader />}><PublicRoute><RegisterPage /></PublicRoute></Suspense>} />
              <Route path="/course/:courseId" element={<Suspense fallback={<PageLoader />}><CourseDetail /></Suspense>} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
