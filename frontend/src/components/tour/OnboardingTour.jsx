/**
 * OnboardingTour — Spotlight tour system (Duolingo-inspired fluid animations)
 * - SVG overlay punches a hole at the target element
 * - Glowing purple ring highlights the spotlighted element with pulse
 * - Tooltip anchored near the element with rich copy
 * - Progress checklist sidebar (desktop) / progress dots (mobile)
 * - Steps navigate to real pages via useNavigate
 * - Confetti explosion on completion
 * - Spring-bounce physics throughout
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Check, RotateCw,
  LayoutDashboard, BookOpen, Play, DollarSign, User,
  Plus, FolderOpen, TrendingUp, ClipboardList, Settings,
  Wand2, Link2, Trophy, Shield, Users, ClipboardCheck,
  BarChart3, Cpu, Image, Megaphone,
} from 'lucide-react';
import NexaIcon from '../common/NexaIcon';
import { useAuth } from '../../context/AuthContext';
import TourMascot from './TourMascot';
import { TOUR_STEPS, TOUR_KEY, TOUR_DONE_VALUE } from './TourConfig';

const ICON_MAP = {
  LayoutDashboard, BookOpen, Play, DollarSign, User, NexaIcon,
  Plus, FolderOpen, TrendingUp, ClipboardList, Settings,
  Wand2, Link2, Trophy, Shield, Users, ClipboardCheck,
  BarChart3, Cpu, Image, Megaphone,
};

const SPRING = { type: 'spring', stiffness: 400, damping: 26 };
const SPRING_BOUNCE = { type: 'spring', stiffness: 500, damping: 18 };
const SPOTLIGHT_PADDING = 10;
const GLOW_COLOR = '#7C3AED';
const GLOW_COLOR_RGBA = '124, 58, 237';

// ─── Confetti Particle ────────────────────────────────────────────
function ConfettiParticle({ delay, color }) {
  const drift = (Math.random() - 0.5) * 200;
  const rotation = Math.random() * 720 - 360;
  const scale = Math.random() * 0.6 + 0.4;
  const duration = Math.random() * 1.2 + 1.0;

  return (
    <motion.div
      initial={{ opacity: 1, scale }}
      animate={{
        y: [-10, window.innerHeight + 50],
        x: [0, drift],
        rotate: rotation,
        opacity: [1, 0.6, 0],
        scale: [scale, scale * 0.5, 0.3],
      }}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
      className="absolute w-2.5 h-2.5 rounded-sm"
      style={{ backgroundColor: color, top: '50%', left: '50%' }}
    />
  );
}

// ─── Confetti Explosion ───────────────────────────────────────────
function ConfettiBurst({ active }) {
  if (!active) return null;
  const colors = ['#7C3AED', '#A78BFA', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#3B82F6'];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.6,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] pointer-events-none"
    >
      {particles.map((p) => (
        <ConfettiParticle key={p.id} delay={p.delay} color={p.color} />
      ))}
    </motion.div>
  );
}

// ─── Spotlight SVG Overlay ─────────────────────────────────────────
function SpotlightOverlay({ rect, borderRadius = 12 }) {
  if (!rect) return null;
  const { x, y, width, height } = rect;
  const p = SPOTLIGHT_PADDING;
  const r = borderRadius;

  const svgX = Math.max(0, x - p);
  const svgY = Math.max(0, y - p);
  const svgW = width + p * 2;
  const svgH = height + p * 2;

  const cutX = x - p;
  const cutY = y - p;
  const cutW = width + p * 2;
  const cutH = height + p * 2;

  const glowW = 3;

  return (
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9996,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id="spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect
            x={cutX} y={cutY} width={cutW} height={cutH}
            rx={r + p} ry={r + p}
            fill="black"
          />
        </mask>
        <filter id="glow-blur">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Dark overlay */}
      <rect
        x="0" y="0" width="100%" height="100%"
        fill="rgba(0,0,0,0.78)"
        mask="url(#spotlight-mask)"
      />

      {/* Pulse ring — animated glow */}
      <motion.rect
        x={cutX + glowW / 2}
        y={cutY + glowW / 2}
        width={cutW - glowW}
        height={cutH - glowW}
        rx={r + p - glowW / 2}
        ry={r + p - glowW / 2}
        fill="none"
        stroke={GLOW_COLOR}
        strokeWidth={glowW}
        filter="url(#glow-blur)"
        animate={{
          strokeOpacity: [0.6, 1, 0.6],
          strokeWidth: [2, 4, 2],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Outer glow ring */}
      <motion.rect
        x={cutX + glowW / 2 - 4}
        y={cutY + glowW / 2 - 4}
        width={cutW - glowW + 8}
        height={cutH - glowW + 8}
        rx={r + p - glowW / 2 + 2}
        ry={r + p - glowW / 2 + 2}
        fill="none"
        stroke={GLOW_COLOR}
        strokeWidth={1}
        opacity={0.3}
        animate={{
          opacity: [0.1, 0.5, 0.1],
          strokeWidth: [1, 3, 1],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
    </svg>
  );
}

// ─── Arrow connector ────────────────────────────────────────────────
function ConnectorArrow({ fromRect, toRect, tooltipRect, position }) {
  if (!fromRect || !toRect || !tooltipRect) return null;

  const tx = tooltipRect.x + tooltipRect.width / 2;
  const ty = tooltipRect.y + tooltipRect.height / 2;
  const sx = fromRect.x + fromRect.width / 2;
  const sy = fromRect.y + fromRect.height / 2;

  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9997 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={GLOW_COLOR} />
        </marker>
      </defs>
      <motion.line
        x1={tx} y1={ty}
        x2={sx} y2={sy}
        stroke={GLOW_COLOR}
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.5"
        markerEnd="url(#arrowhead)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
    </svg>
  );
}

// ─── Tooltip Card ──────────────────────────────────────────────────
function TooltipCard({ step, stepIndex, totalSteps, onNext, onPrev, onSkip, onJump, isFirst, isLast, mascotPose }) {
  const Icon = ICON_MAP[step.icon] || NexaIcon;

  return (
    <motion.div
      key={stepIndex}
      initial={{ opacity: 0, scale: 0.85, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -16 }}
      transition={SPRING}
      className="relative z-[9998] w-[min(440px, calc(100vw-32px))]"
    >
      {/* Glow border */}
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-500/50 via-purple-500/10 to-purple-500/50" />

      <div className="relative bg-[#1E1B4B] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/40">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">{step.subtitle}</p>
              <h2 className="text-lg font-black text-white leading-tight">{step.title}</h2>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="text-white/30 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/5 flex-shrink-0"
            title="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mascot */}
        <div className="flex justify-center my-3">
          <motion.div
            animate={{
              rotate: mascotPose === 'celebrate' ? [0, -8, 8, 0] : 0,
              scale: mascotPose === 'celebrate' ? [1, 1.12, 1] : [1, 1.03, 1],
            }}
            transition={{ duration: 0.5, repeat: mascotPose === 'celebrate' ? Infinity : 0, repeatDelay: 2 }}
          >
            <TourMascot pose={mascotPose} size={56} />
          </motion.div>
        </div>

        {/* Body */}
        <div className="px-5 pb-2">
          <p className="text-sm text-white/65 leading-relaxed">{step.body}</p>

          {/* Hint */}
          <div className="mt-3 flex items-start gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2.5">
            <NexaIcon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-purple-300/80 leading-relaxed">{step.hint}</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 px-5 py-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.button
              key={i}
              onClick={() => onJump(i)}
              animate={{
                width: i === stepIndex ? 20 : 6,
                height: i === stepIndex ? 6 : 6,
                backgroundColor: i < stepIndex ? GLOW_COLOR : i === stepIndex ? '#A78BFA' : 'rgba(255,255,255,0.2)',
                scale: i === stepIndex ? 1.3 : 1,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="rounded-full cursor-pointer"
            />
          ))}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-3 px-5 pb-5">
          {stepIndex > 0 ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onPrev}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/50 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </motion.button>
          ) : (
            <div />
          )}
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(124,58,237,0.5)' }}
            whileTap={{ scale: 0.96 }}
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg shadow-purple-500/25"
          >
            {isLast ? (
              <>All done! <NexaIcon className="w-4 h-4" /></>
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Checklist Sidebar ─────────────────────────────────────────────
function ChecklistSidebar({ steps, currentIndex, onJump }) {
  return (
    <div className="w-60 flex-shrink-0 bg-[#0F172A] border-r border-white/10 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0">
            <NexaIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Onboarding Tour</p>
            <p className="text-[10px] text-white/40 mt-0.5">{steps.length} steps</p>
          </div>
        </div>
      </div>

      {/* Step list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {steps.map((step, i) => {
          const Icon = ICON_MAP[step.icon] || NexaIcon;
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isUpcoming = i > currentIndex;

          return (
            <motion.button
              key={step.id}
              onClick={() => onJump(i)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200
                ${isCurrent ? 'bg-purple-500/15 border border-purple-500/30' : 'hover:bg-white/5 border border-transparent'}
              `}
            >
              {/* Icon circle */}
              <div className={`
                w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                ${isCompleted ? 'bg-emerald-500/20' : isCurrent ? 'bg-purple-500/20' : 'bg-white/5'}
              `}>
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </motion.div>
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-purple-400' : 'text-white/30'}`} />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium leading-tight truncate ${
                  isCurrent ? 'text-white' : isCompleted ? 'text-white/50' : 'text-white/30'
                }`}>
                  {step.title}
                </p>
                <p className="text-[10px] text-white/25 mt-0.5 truncate">{step.subtitle}</p>
              </div>

              {/* Current indicator */}
              {isCurrent && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-[10px] text-white/20 text-center">Press Skip anytime to dismiss</p>
      </div>
    </div>
  );
}

// ─── Mobile Top Progress Bar ────────────────────────────────────────
function MobileProgressBar({ steps, currentIndex, onJump }) {
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#0F172A]/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
      <NexaIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
      <p className="text-xs font-semibold text-white flex-shrink-0">{currentIndex + 1}/{steps.length}</p>
      <div className="flex-1 flex items-center gap-1.5">
        {steps.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <button
              key={step.id}
              onClick={() => onJump(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-emerald-500 flex-1' :
                isCurrent ? 'bg-purple-400 w-6' :
                'bg-white/20 flex-1'
              }`}
            />
          );
        })}
      </div>
      {/* Gradient progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─── Bottom Sheet (Mobile) ──────────────────────────────────────────
function BottomSheet({ step, stepIndex, totalSteps, onNext, onPrev, onSkip, onJump, isFirst, isLast, mascotPose }) {
  const Icon = ICON_MAP[step.icon] || NexaIcon;

  return (
    <motion.div
      key={stepIndex}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={SPRING}
      className="fixed bottom-0 left-0 right-0 z-[9998] bg-[#1E1B4B] border-t border-white/10 rounded-t-3xl shadow-2xl shadow-black/50"
      style={{ maxHeight: '80vh', overflowY: 'auto' }}
    >
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between px-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">{step.subtitle}</p>
            <h2 className="text-base font-black text-white leading-tight">{step.title}</h2>
          </div>
        </div>
        <button onClick={onSkip} className="text-white/30 hover:text-white/60 transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 pb-2">
        <p className="text-sm text-white/65 leading-relaxed">{step.body}</p>
        <div className="mt-3 flex items-start gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2.5">
          <NexaIcon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-purple-300/80 leading-relaxed">{step.hint}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-1.5 px-5 py-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.button
            key={i}
            onClick={() => onJump(i)}
            animate={{
              width: i === stepIndex ? 16 : 6,
              backgroundColor: i < stepIndex ? GLOW_COLOR : i === stepIndex ? '#A78BFA' : 'rgba(255,255,255,0.2)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="rounded-full h-1.5"
          />
        ))}
      </div>

      {/* Nav */}
      <div className="flex items-center gap-3 px-5 pb-6">
        {stepIndex > 0 ? (
          <button
            onClick={onPrev}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/50 bg-white/5 border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg"
        >
          {isLast ? <>All done! <NexaIcon className="w-4 h-4" /></> : <>Next <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Export ────────────────────────────────────────────────────
export default function OnboardingTour({ role }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [tooltipRect, setTooltipRect] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const tooltipRef = useRef(null);

  const steps = TOUR_STEPS[role] || TOUR_STEPS.STUDENT;
  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];
  const isLast = stepIndex >= totalSteps - 1;

  // Check mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Restart event
  useEffect(() => {
    function handleRestart() {
      localStorage.removeItem(TOUR_KEY(role));
      setStepIndex(0);
      setActive(true);
    }
    window.addEventListener('nexa:restart-tour', handleRestart);
    return () => window.removeEventListener('nexa:restart-tour', handleRestart);
  }, [role]);

  // Auto-show on first visit
  useEffect(() => {
    if (!isAuthenticated) return;
    const key = TOUR_KEY(role);
    const done = localStorage.getItem(key);
    if (!done) {
      const timer = setTimeout(() => setActive(true), 600);
      return () => clearTimeout(timer);
    }
  }, [role, isAuthenticated]);

  // Calculate mascot pose from step
  const getMascotPose = useCallback((idx) => {
    if (idx === 0) return 'wave';
    if (isLast) return 'celebrate';
    return 'point';
  }, [isLast]);

  // Position tooltip near the spotlight element
  const positionTooltip = useCallback((elRect) => {
    if (!elRect || !tooltipRef.current) return;
    const tt = tooltipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const p = SPOTLIGHT_PADDING + 4;

    let top, left;
    const ttW = tt.width || 380;
    const ttH = tt.height || 280;

    switch (currentStep.position) {
      case 'top':
        top = elRect.y - ttH - p;
        left = Math.max(16, Math.min(elRect.x + elRect.width / 2 - ttW / 2, vw - ttW - 16));
        break;
      case 'bottom':
        top = elRect.y + elRect.height + p;
        left = Math.max(16, Math.min(elRect.x + elRect.width / 2 - ttW / 2, vw - ttW - 16));
        break;
      case 'left':
        top = Math.max(16, Math.min(elRect.y + elRect.height / 2 - ttH / 2, vh - ttH - 16));
        left = elRect.x - ttW - p;
        if (left < 16) { left = elRect.x + elRect.width + p; }
        break;
      case 'right':
      default:
        top = Math.max(16, Math.min(elRect.y + elRect.height / 2 - ttH / 2, vh - ttH - 16));
        left = elRect.x + elRect.width + p;
        if (left + ttW > vw - 16) { left = elRect.x - ttW - p; }
        break;
    }

    top = Math.max(16, Math.min(top, vh - ttH - 16));
    left = Math.max(16, Math.min(left, vw - ttW - 16));

    tooltipRef.current.style.top = `${top}px`;
    tooltipRef.current.style.left = `${left}px`;
    tooltipRef.current.style.right = 'auto';
    tooltipRef.current.style.bottom = 'auto';

    setTooltipRect({ x: left, y: top, width: ttW, height: ttH });
  }, [currentStep?.position]);

  // Navigate to step route and find element
  const navigateToStep = useCallback((idx) => {
    const step = steps[idx];
    setNavigating(true);

    if (step.route === location.pathname || !step.route) {
      setTimeout(() => {
        findAndHighlight(idx);
      }, 100);
      return;
    }

    navigate(step.route);

    setTimeout(() => {
      findAndHighlight(idx);
    }, 400);
  }, [steps, location.pathname, navigate]);

  const findAndHighlight = useCallback((idx) => {
    const step = steps[idx];
    if (!step) { setNavigating(false); return; }

    if (!step.selector) {
      setSpotlightRect(null);
      setTooltipRect(null);
      setNavigating(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 15;
    const interval = setInterval(() => {
      attempts++;
      const el = document.querySelector(step.selector);
      if (el) {
        clearInterval(interval);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setSpotlightRect({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
          positionTooltip(rect);
          setNavigating(false);
        }, 300);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setSpotlightRect(null);
        setTooltipRect(null);
        setNavigating(false);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [steps, positionTooltip]);

  // When step changes, navigate
  useEffect(() => {
    if (!active) return;
    navigateToStep(stepIndex);
  }, [active, stepIndex, navigateToStep]);

  // Handle Next
  const handleNext = useCallback(() => {
    if (isLast) {
      localStorage.setItem(TOUR_KEY(role), TOUR_DONE_VALUE);
      setShowConfetti(true);
      setTimeout(() => {
        setActive(false);
        setSpotlightRect(null);
        setShowConfetti(false);
      }, 2500);
      return;
    }
    setSpotlightRect(null);
    setTooltipRect(null);
    setStepIndex(s => s + 1);
  }, [isLast, role]);

  // Handle Prev
  const handlePrev = useCallback(() => {
    if (stepIndex === 0) return;
    setSpotlightRect(null);
    setTooltipRect(null);
    setStepIndex(s => s - 1);
  }, [stepIndex]);

  // Handle Jump to step
  const handleJump = useCallback((idx) => {
    if (idx === stepIndex) return;
    setSpotlightRect(null);
    setTooltipRect(null);
    setStepIndex(idx);
  }, [stepIndex]);

  // Handle Skip
  const handleSkip = useCallback(() => {
    localStorage.setItem(TOUR_KEY(role), TOUR_DONE_VALUE);
    setActive(false);
    setSpotlightRect(null);
  }, [role]);

  if (!isAuthenticated) return null;
  if (!active) return null;

  const mascotPose = getMascotPose(stepIndex);

  return createPortal(
    <>
      <ConfettiBurst active={showConfetti} />

      {/* Dark overlay + spotlight */}
      <SpotlightOverlay rect={spotlightRect} borderRadius={12} />

      {/* Connector arrow */}
      {spotlightRect && tooltipRect && (
        <ConnectorArrow
          fromRect={spotlightRect}
          toRect={spotlightRect}
          tooltipRect={tooltipRect}
          position={currentStep.position}
        />
      )}

      {/* Mobile progress bar */}
      {isMobile && (
        <MobileProgressBar
          steps={steps}
          currentIndex={stepIndex}
          onJump={handleJump}
        />
      )}

      {/* Desktop layout: sidebar + tooltip */}
      {!isMobile && (
        <div className="fixed inset-0 z-[9997] flex" style={{ pointerEvents: 'none' }}>
          {/* Checklist sidebar */}
          <div style={{ pointerEvents: 'auto' }}>
            <ChecklistSidebar
              steps={steps}
              currentIndex={stepIndex}
              onJump={handleJump}
            />
          </div>

          {/* Main area: spotlight + tooltip */}
          <div className="flex-1 relative">
            {/* Tooltip */}
            <div
              ref={tooltipRef}
              className="absolute"
              style={{ top: 0, left: 0 }}
            >
              <div style={{ pointerEvents: 'auto' }}>
                <TooltipCard
                  step={currentStep}
                  stepIndex={stepIndex}
                  totalSteps={totalSteps}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onSkip={handleSkip}
                  onJump={handleJump}
                  isFirst={stepIndex === 0}
                  isLast={isLast}
                  mascotPose={mascotPose}
                />
              </div>
            </div>

            {/* Navigation hint */}
            {navigating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-[#1E1B4B] border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full"
                  />
                  <p className="text-sm text-white/70">Loading…</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile: bottom sheet only */}
      {isMobile && (
        <BottomSheet
          step={currentStep}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          onJump={handleJump}
          isFirst={stepIndex === 0}
          isLast={isLast}
          mascotPose={mascotPose}
        />
      )}
    </>,
    document.body
  );
}