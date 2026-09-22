/**
 * TourMascot — Bouncy Duolingo-style animated mascot (Owlet)
 * Poses: wave | point | celebrate | idle | jump
 * Uses framer-motion for spring physics
 */
import React from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

const SPRING = { type: 'spring', stiffness: 300, damping: 20 };
const SPRING_BOUNCY = { type: 'spring', stiffness: 400, damping: 10 };

function MascotBody() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <motion.ellipse cx="40" cy="48" rx="22" ry="24"
        fill="#7C3AED"
        initial={{ scaleY: 0.8 }}
        animate={{ scaleY: [0.8, 1.05, 0.95, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
      />
      {/* Belly */}
      <ellipse cx="40" cy="52" rx="14" ry="15" fill="#A78BFA" />
      {/* Eyes */}
      <motion.g
        animate={{
          scaleY: [1, 0.1, 1, 1, 0.1, 1],
          y: [0, -2, 0, 0, -2, 0],
        }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
      >
        <circle cx="32" cy="40" r="6" fill="white" />
        <circle cx="48" cy="40" r="6" fill="white" />
        <circle cx="33" cy="40" r="3" fill="#1E1B4B" />
        <circle cx="49" cy="40" r="3" fill="#1E1B4B" />
        {/* Eye shine */}
        <circle cx="34.5" cy="38.5" r="1.2" fill="white" />
        <circle cx="50.5" cy="38.5" r="1.2" fill="white" />
      </motion.g>
      {/* Beak */}
      <motion.path
        d="M36 50 L40 56 L44 50 Z"
        fill="#F59E0B"
        animate={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Head tufts */}
      <motion.path
        d="M30 22 Q32 12 36 20"
        stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" fill="none"
        animate={{ rotate: [-5, 5, -5], y: [0, -2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.path
        d="M40 18 Q40 8 40 16"
        stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" fill="none"
        animate={{ rotate: [-3, 3, -3], y: [0, -3, 0] }}
        transition={{ duration: 1.3, repeat: Infinity, delay: 0.2 }}
      />
      <motion.path
        d="M50 22 Q48 12 44 20"
        stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" fill="none"
        animate={{ rotate: [5, -5, 5], y: [0, -2, 0] }}
        transition={{ duration: 1.7, repeat: Infinity, delay: 0.4 }}
      />
    </svg>
  );
}

function MascotWave() {
  const controls = useAnimation();
  useEffect(() => {
    controls.start({
      rotate: [0, 30, 0, 20, 0],
      transition: { duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }
    });
  }, [controls]);
  return (
    <motion.g animate={controls} style={{ transformOrigin: '60px 60px' }}>
      {/* Wing */}
      <motion.ellipse cx="62" cy="44" rx="10" ry="16" fill="#6D28D9"
        animate={{ rotate: [0, -30, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.5 }}
      />
    </motion.g>
  );
}

function MascotPoint() {
  return (
    <motion.g
      animate={{ x: [0, 8, 0], y: [0, -4, 0] }}
      transition={{ duration: 1.2, repeat: Infinity }}
      style={{ transformOrigin: '20px 60px' }}
    >
      {/* Wing pointing */}
      <ellipse cx="18" cy="42" rx="10" ry="14" fill="#6D28D9"
        transform="rotate(-30 18 42)"
      />
    </motion.g>
  );
}

function MascotCelebrate() {
  return (
    <>
      {/* Both wings up */}
      <motion.g
        animate={{ rotate: [-20, -40, -20], y: [0, -4, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.3 }}
        style={{ transformOrigin: '20px 48px' }}
      >
        <ellipse cx="18" cy="42" rx="10" ry="14" fill="#6D28D9" transform="rotate(-20 18 42)" />
      </motion.g>
      <motion.g
        animate={{ rotate: [20, 40, 20], y: [0, -4, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.3 }}
        style={{ transformOrigin: '60px 48px' }}
      >
        <ellipse cx="62" cy="44" rx="10" ry="14" fill="#6D28D9" transform="rotate(20 62 44)" />
      </motion.g>
      {/* Sparkles */}
      {[0, 1, 2].map(i => (
        <motion.circle key={i}
          cx={20 + i * 20} cy={10 + i * 5} r="3" fill="#FBBF24"
          animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0], y: [0, -10, -20] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </>
  );
}

function MascotIdle() {
  return (
    <>
      {/* Wings resting at sides */}
      <ellipse cx="18" cy="46" rx="8" ry="12" fill="#6D28D9" transform="rotate(-10 18 46)" />
      <ellipse cx="62" cy="46" rx="8" ry="12" fill="#6D28D9" transform="rotate(10 62 46)" />
    </>
  );
}

export default function TourMascot({ pose = 'idle', size = 80 }) {
  const poseComponents = { wave: MascotWave, point: MascotPoint, celebrate: MascotCelebrate, idle: MascotIdle };

  return (
    <motion.div
      animate={{
        y: [0, -12, 0],
        rotate: [-2, 2, -2],
      }}
      transition={{
        y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
      }}
      className="relative"
    >
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <MascotBody />
        {React.createElement(poseComponents[pose] || MascotIdle)}
      </svg>
    </motion.div>
  );
}
