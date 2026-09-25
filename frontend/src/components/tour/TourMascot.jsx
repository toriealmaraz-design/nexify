/**
 * TourMascot — Bouncy Duolingo-style animated mascot (Owlet)
 * Poses: wave | point | celebrate | idle | jump
 * Uses framer-motion for spring physics + morph transitions
 *
 * Morph transitions smoothly animate between poses so the mascot
 * flows from one state to the next instead of snapping.
 */
import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

const SPRING = { type: 'spring', stiffness: 300, damping: 20 };
const SPRING_BOUNCY = { type: 'spring', stiffness: 400, damping: 10 };
const MORPH_DURATION = 0.5;

// ─── Pose Variants (for morph transitions) ────────────
const poseVariants = {
  idle: {
    wingLeft: { rotate: [-10, -8, -12, -10], y: [0, -1, 0] },
    wingRight: { rotate: [10, 12, 8, 10], y: [0, -1, 0] },
    body: { scaleY: [0.8, 1.05, 0.95, 1] },
    eyes: { scaleY: [1, 0.1, 1, 1, 0.1, 1], y: [0, -2, 0, 0, -2, 0] },
    beak: { rotate: [0, -5, 5, 0] },
    tuftLeft: { rotate: [-5, 5, -5], y: [0, -2, 0] },
    tuftCenter: { rotate: [-3, 3, -3], y: [0, -3, 0] },
    tuftRight: { rotate: [5, -5, 5], y: [0, -2, 0] },
    bounce: { y: [0, -12, 0], rotate: [-2, 2, -2] },
  },
  wave: {
    wingLeft: { rotate: [0, 30, 0, 20, 0], y: [0, -2, 0, -1, 0] },
    wingRight: { rotate: [0, -20, 0, 10, 0], y: [0, -1, 0, -0.5, 0] },
    body: { scaleY: [0.9, 1.08, 0.95, 1] },
    eyes: { scaleY: [1, 0.3, 1, 1, 0.3, 1], y: [0, -1, 0, 0, -1, 0] },
    beak: { rotate: [0, -3, 5, 0] },
    tuftLeft: { rotate: [-8, 8, -5], y: [0, -3, 0] },
    tuftCenter: { rotate: [-5, 5, -3], y: [0, -4, 0] },
    tuftRight: { rotate: [8, -6, 5], y: [0, -2, 0] },
    bounce: { y: [0, -14, 0], rotate: [-3, 3, -2] },
  },
  point: {
    wingLeft: { x: [0, 8, 0], y: [0, -4, 0], rotate: [-30, -25, -30] },
    wingRight: { x: [0, 5, 0], y: [0, -2, 0], rotate: [15, 10, 15] },
    body: { scaleY: [0.85, 1.02, 0.98, 1] },
    eyes: { scaleY: [1, 0.2, 1], y: [0, -3, 0] },
    beak: { rotate: [0, -2, 3, 0] },
    tuftLeft: { rotate: [-5, 5, -3], y: [0, -2, 0] },
    tuftCenter: { rotate: [-3, 3, -2], y: [0, -3, 0] },
    tuftRight: { rotate: [5, -4, 3], y: [0, -1, 0] },
    bounce: { y: [0, -10, 0], rotate: [-1, 1, 0] },
  },
  celebrate: {
    wingLeft: { rotate: [-20, -40, -20], y: [0, -6, 0] },
    wingRight: { rotate: [20, 40, 20], y: [0, -6, 0] },
    body: { scaleY: [0.9, 1.12, 0.95, 1] },
    eyes: { scaleY: [1, 0.4, 1, 1, 0.4, 1], y: [0, -4, 0, 0, -4, 0] },
    beak: { rotate: [0, -5, 5, 0] },
    tuftLeft: { rotate: [-10, 10, -8], y: [0, -5, 0] },
    tuftCenter: { rotate: [-8, 8, -6], y: [0, -6, 0] },
    tuftRight: { rotate: [10, -8, 6], y: [0, -5, 0] },
    bounce: { y: [0, -16, 0], rotate: [-4, 4, -3] },
  },
};

// ─── Mascot Body ──────────────────────────────────────
function MascotBody({ pose }) {
  const bodyControls = useAnimation();
  const eyeControls = useAnimation();
  const beakControls = useAnimation();
  const tuftLControls = useAnimation();
  const tuftCControls = useAnimation();
  const tuftRControls = useAnimation();
  const wingLControls = useAnimation();
  const wingRControls = useAnimation();

  useEffect(() => {
    const variants = poseVariants[pose] || poseVariants.idle;
    bodyControls.start({ ...variants.body, transition: { duration: MORPH_DURATION, ease: 'easeInOut' } });
    eyeControls.start({ ...variants.eyes, transition: { duration: MORPH_DURATION * 1.2, ease: 'easeInOut' } });
    beakControls.start({ ...variants.beak, transition: { duration: MORPH_DURATION, ease: 'easeInOut' } });
    tuftLControls.start({ ...variants.tuftLeft, transition: { duration: MORPH_DURATION, ease: 'easeInOut' } });
    tuftCControls.start({ ...variants.tuftCenter, transition: { duration: MORPH_DURATION, ease: 'easeInOut' } });
    tuftRControls.start({ ...variants.tuftRight, transition: { duration: MORPH_DURATION, ease: 'easeInOut' } });
    wingLControls.start({ ...variants.wingLeft, transition: { duration: MORPH_DURATION, ease: 'easeInOut' } });
    wingRControls.start({ ...variants.wingRight, transition: { duration: MORPH_DURATION, ease: 'easeInOut' } });
  }, [pose]);

  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.ellipse cx="40" cy="48" rx="22" ry="24" fill="#7C3AED" animate={bodyControls} />
      <ellipse cx="40" cy="52" rx="14" ry="15" fill="#A78BFA" />
      <motion.g animate={eyeControls}>
        <circle cx="32" cy="40" r="6" fill="white" />
        <circle cx="48" cy="40" r="6" fill="white" />
        <circle cx="33" cy="40" r="3" fill="#1E1B4B" />
        <circle cx="49" cy="40" r="3" fill="#1E1B4B" />
        <circle cx="34.5" cy="38.5" r="1.2" fill="white" />
        <circle cx="50.5" cy="38.5" r="1.2" fill="white" />
      </motion.g>
      <motion.path d="M36 50 L40 56 L44 50 Z" fill="#F59E0B" animate={beakControls} />
      <motion.path d="M30 22 Q32 12 36 20" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" fill="none" animate={tuftLControls} />
      <motion.path d="M40 18 Q40 8 40 16" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" fill="none" animate={tuftCControls} />
      <motion.path d="M50 22 Q48 12 44 20" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" fill="none" animate={tuftRControls} />
      <motion.ellipse cx="18" cy="46" rx="8" ry="12" fill="#6D28D9" transform="rotate(-10 18 46)" animate={wingLControls} />
      <motion.ellipse cx="62" cy="46" rx="8" ry="12" fill="#6D28D9" transform="rotate(10 62 46)" animate={wingRControls} />
    </svg>
  );
}

// ─── Sparkles (celebrate only) ────────────────────────
function Sparkles() {
  return (
    <>
      {[0, 1, 2].map(i => (
        <motion.circle key={i} cx={20 + i * 20} cy={10 + i * 5} r="3" fill="#FBBF24"
          animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0], y: [0, -10, -20] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </>
  );
}

// ─── Main Export ───────────────────────────────────────
export default function TourMascot({ pose = 'idle', size = 80 }) {
  const bounceControls = useAnimation();

  useEffect(() => {
    bounceControls.start({
      y: [0, -12, 0],
      rotate: [-2, 2, -2],
      transition: {
        y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
      },
    });
  }, [bounceControls]);

  return (
    <motion.div animate={bounceControls} className="relative">
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <MascotBody pose={pose} />
        {pose === 'celebrate' && <Sparkles />}
      </svg>
    </motion.div>
  );
}
