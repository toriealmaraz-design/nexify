/**
 * Nexify Platform — Master Client Router & Context Wrapper
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Layout, ClipboardList, BarChart3, Users, FolderOpen, LogOut, Link2, BookOpen, PlusCircle, DollarSign, ShoppingBag, User, Brain, Trophy, ShoppingCart } from 'lucide-react';
import { ToastProvider } from './components/common/Toast';
import NexaWidget from './components/NexaWidget';
import OnboardingTour from './components/tour/OnboardingTour';

// ─── Page components ─────────────────────────────────────────
import PublicLanding from './pages/public/Landing';
const LoginPage = lazy(() => import('./pages/public/Login'));
const RegisterPage = lazy(() => import('./pages/public/Register'));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/public/ResetPassword'));
const Catalog = lazy(() => import('./pages/public/Catalog'));
const CourseDetail = lazy(() => import('./pages/public/CourseDetail'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const OrderHistory = lazy(() => import('./pages/student/OrderHistory'));
const Receipt = lazy(() => import('./pages/student/Receipt'));
const CreatorDashboard = lazy(() => import('./pages/creator/Dashboard'));
const CreatorEarnings = lazy(() => import('./pages/creator/Earnings'));
const CourseBuilder = lazy(() => import('./pages/creator/CourseBuilder'));
const CoursePlayer = lazy(() => import('./pages/student/CoursePlayer'));
const AffiliateDashboard = lazy(() => import('./pages/affiliate/Dashboard'));
const LinkGenerator = lazy(() => import('./pages/affiliate/LinkGenerator'));
const Nexa = lazy(() => import('./pages/public/Nexa'));
const Profile = lazy(() => import('./pages/public/Profile'));
const StudentProfile = lazy(() => import('./pages/student/Profile'));
const CreatorProfile = lazy(() => import('./pages/creator/Profile'));
const AffiliateProfile = lazy(() => import('./pages/affiliate/Profile'));
const AdminStaging = lazy(() => import('./pages/admin/StagingQueue'));
const AdminCourseApprovalDetail = lazy(() => import('./pages/admin/CourseApprovalDetail'));
const AdminMetrics = lazy(() => import('./pages/admin/MetricsDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/UserGrid'));
const AdminAssets = lazy(() => import('./pages/admin/AssetsManager'));
const AdminNexaSettings = lazy(() => import('./pages/admin/NexaSettings'));
const AdminAds = lazy(() => import('./pages/admin/AdManager'));
const CartPage = lazy(() => import('./pages/public/Cart'));
const CheckoutPage = lazy(() => import('./pages/public/Checkout'));
const StudentWishlist = lazy(() => import('./pages/student/Wishlist'));
const StudentCertificate = lazy(() => import('./pages/student/Certificate'));
const StudentReviews = lazy(() => import('./pages/student/CourseReviews'));
const StudentNexaHistory = lazy(() => import('./pages/student/NexaChatHistory'));
const StudentCommunity = lazy(() => import('./pages/student/Community'));
const StudentGamification = lazy(() => import('./pages/student/Gamification'));
const AffiliateLeaderboard = lazy(() => import('./pages/affiliate/Leaderboard'));
const AffiliateReferral = lazy(() => import('./pages/affiliate/ReferralProgram'));
const CreatorPayout = lazy(() => import('./pages/creator/Payout'));

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
            <div className="mb-4 flex justify-center">
              <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
            </div>
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

// ─── Portal Logo ──────────────────────────────────────────────
function PortalLogo({ portal }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-black font-bold text-sm">N</span>
      </div>
      <div>
        <span className="font-bold text-white">Nexify</span>
        <p className="text-xs text-white/40">{portal}</p>
      </div>
    </Link>
  );
}

// ─── Creator Layout ────────────────────────────────────────────
function CreatorLayout({ children }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      <aside className="w-60 min-h-screen bg-[#0B1120] border-r border-white/5 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-white/5">
          <PortalLogo portal="Creator" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavItem href="/creator" icon={Layout} label="Dashboard" />
          <NavItem href="/creator/course/new" icon={PlusCircle} label="Create Course" />
          <NavItem href="/creator/earnings" icon={DollarSign} label="Earnings" />
          <NavItem href="/creator/payout" icon={DollarSign} label="Payouts" />
          <NavItem href="/creator/profile" icon={User} label="Profile" />
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all w-full">
            <LogOut className="w-4 h-4 flex-shrink-0" /><span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </main>
    </div>
  );
}

// ─── Student Layout ───────────────────────────────────────────
function StudentLayout({ children }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      <aside className="w-60 min-h-screen bg-[#0B1120] border-r border-white/5 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-white/5">
          <PortalLogo portal="Student" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavItem href="/student" icon={Layout} label="Dashboard" />
          <NavItem href="/student/orders" icon={ShoppingBag} label="Orders" />
          <NavItem href="/student/wishlist" icon={BookOpen} label="Wishlist" />
          <NavItem href="/student/gamification" icon={Trophy} label="Rewards" />
          <NavItem href="/student/profile" icon={User} label="Profile" />
          <NavItem href="/nexa" icon={Brain} label="Nexa AI" />
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all w-full">
            <LogOut className="w-4 h-4 flex-shrink-0" /><span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </main>
    </div>
  );
}

// ─── Nav Item (updated active detection) ──────────────────────
function NavItem({ href, icon: Icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === href || (href !== '/' && location.pathname.startsWith(href));
  return (
    <Link
      to={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150
        ${isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span>{label}</span>
    </Link>
  );
}

// ─── Admin Layout (updated logout) ────────────────────────────
function AdminLayout({ children }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      <aside className="w-60 min-h-screen bg-[#0B1120] border-r border-white/5 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-white/5">
          <PortalLogo portal="Admin" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavItem href="/admin" icon={Layout} label="Dashboard" />
          <NavItem href="/admin/staging" icon={ClipboardList} label="Staging Queue" />
          <NavItem href="/admin/metrics" icon={BarChart3} label="Metrics" />
          <NavItem href="/admin/users" icon={Users} label="Users" />
          <NavItem href="/admin/assets" icon={FolderOpen} label="Assets" />
          <NavItem href="/admin/nexa-settings" icon={Brain} label="Nexa AI" />
          <NavItem href="/admin/ads" icon={ShoppingBag} label="Ad Manager" />
          <NavItem href="/profile" icon={User} label="Profile" />
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all w-full">
            <LogOut className="w-4 h-4 flex-shrink-0" /><span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </main>
    </div>
  );
}

// ─── Affiliate Layout (updated logout) ───────────────────────
function AffiliateLayout({ children }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      <aside className="w-60 min-h-screen bg-[#0B1120] border-r border-white/5 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-white/5">
          <PortalLogo portal="Affiliate" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavItem href="/affiliate" icon={Layout} label="Dashboard" />
          <NavItem href="/affiliate/links" icon={Link2} label="My Links" />
          <NavItem href="/affiliate/leaderboard" icon={Trophy} label="Leaderboard" />
          <NavItem href="/affiliate/referral" icon={Users} label="Referral Program" />
          <NavItem href="/affiliate/profile" icon={User} label="Profile" />
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all w-full">
            <LogOut className="w-4 h-4 flex-shrink-0" /><span>Logout</span>
          </button>
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
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<PublicLanding />} />
                <Route path="/login" element={<Suspense fallback={<PageLoader />}><PublicRoute><LoginPage /></PublicRoute></Suspense>} />
                <Route path="/register" element={<Suspense fallback={<PageLoader />}><PublicRoute><RegisterPage /></PublicRoute></Suspense>} />
                <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><PublicRoute><ForgotPasswordPage /></PublicRoute></Suspense>} />
                <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><PublicRoute><ResetPasswordPage /></PublicRoute></Suspense>} />
                <Route path="/course/:courseId" element={<Suspense fallback={<PageLoader />}><CourseDetail /></Suspense>} />
                <Route path="/courses" element={<Suspense fallback={<PageLoader />}><Catalog /></Suspense>} />
                <Route path="/cart" element={<Suspense fallback={<PageLoader />}><CartPage /></Suspense>} />
                <Route path="/checkout" element={<Suspense fallback={<PageLoader />}><CheckoutPage /></Suspense>} />
                <Route path="/nexa" element={<Suspense fallback={<PageLoader />}><PublicRoute><Nexa /></PublicRoute></Suspense>} />
                <Route path="/profile" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><Profile /></ProtectedRoute></Suspense>} />
                <Route path="/student/profile" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout><StudentProfile /></StudentLayout></ProtectedRoute></Suspense>} />
                <Route path="/creator/profile" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['CREATOR']}><CreatorLayout><CreatorProfile /></CreatorLayout></ProtectedRoute></Suspense>} />
                <Route path="/affiliate/profile" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['AFFILIATE']}><AffiliateLayout><AffiliateProfile /></AffiliateLayout></ProtectedRoute></Suspense>} />
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/staging" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminStaging /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/course/:courseId/review" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminCourseApprovalDetail /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/metrics" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminMetrics /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/assets" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminAssets /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/nexa-settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminNexaSettings /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/ads" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminAds /></AdminLayout></ProtectedRoute>} />
                <Route path="/creator" element={<ProtectedRoute allowedRoles={['CREATOR']}><CreatorLayout><CreatorDashboard /></CreatorLayout></ProtectedRoute>} />
                <Route path="/creator/earnings" element={<ProtectedRoute allowedRoles={['CREATOR']}><CreatorLayout><CreatorEarnings /></CreatorLayout></ProtectedRoute>} />
                <Route path="/creator/course/new" element={<ProtectedRoute allowedRoles={['CREATOR']}><CreatorLayout><CourseBuilder /></CreatorLayout></ProtectedRoute>} />
                <Route path="/creator/course/:courseId/edit" element={<ProtectedRoute allowedRoles={['CREATOR']}><CreatorLayout><CourseBuilder /></CreatorLayout></ProtectedRoute>} />
                <Route path="/creator/payout" element={<ProtectedRoute allowedRoles={['CREATOR']}><CreatorLayout><CreatorPayout /></CreatorLayout></ProtectedRoute>} />
                <Route path="/affiliate" element={<ProtectedRoute allowedRoles={['AFFILIATE']}><AffiliateLayout><AffiliateDashboard /></AffiliateLayout></ProtectedRoute>} />
                <Route path="/affiliate/links" element={<ProtectedRoute allowedRoles={['AFFILIATE']}><AffiliateLayout><LinkGenerator /></AffiliateLayout></ProtectedRoute>} />
                <Route path="/affiliate/leaderboard" element={<ProtectedRoute allowedRoles={['AFFILIATE']}><AffiliateLayout><AffiliateLeaderboard /></AffiliateLayout></ProtectedRoute>} />
                <Route path="/affiliate/referral" element={<ProtectedRoute allowedRoles={['AFFILIATE']}><AffiliateLayout><AffiliateReferral /></AffiliateLayout></ProtectedRoute>} />
                <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout><StudentDashboard /></StudentLayout></ProtectedRoute>} />
                <Route path="/student/orders" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout><OrderHistory /></StudentLayout></ProtectedRoute>} />
                <Route path="/student/receipts/:orderId" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout><Receipt /></StudentLayout></ProtectedRoute></Suspense>} />
                <Route path="/student/course/:courseId" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout><CoursePlayer /></StudentLayout></ProtectedRoute>} />
                <Route path="/student/course/:courseId/certificate" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout><StudentCertificate /></StudentLayout></ProtectedRoute>} />
                <Route path="/student/course/:courseId/review" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout><StudentReviews /></StudentLayout></ProtectedRoute>} />
                <Route path="/student/wishlist" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout><StudentWishlist /></StudentLayout></ProtectedRoute>} />
                <Route path="/student/nexa-history" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout><StudentNexaHistory /></StudentLayout></ProtectedRoute>} />
                <Route path="/student/course/:courseId/community" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout><StudentCommunity /></StudentLayout></ProtectedRoute>} />
                <Route path="/student/gamification" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout><StudentGamification /></StudentLayout></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <NexaWidget />
              <OnboardingTourWrapper />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

// Separate component so it can use useAuth inside the AuthProvider tree
function OnboardingTourWrapper() {
  const { user } = useAuth();
  if (!user) return null;
  return <OnboardingTour role={user.role} />;
}
