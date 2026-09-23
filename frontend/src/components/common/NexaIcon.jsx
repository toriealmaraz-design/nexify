/**
 * NexaIcon — Tiny owl head icon for use in nav bars, buttons, etc.
 * Replaces Brain/Sparkles icons for Nexa branding throughout the system.
 */
import React from 'react';

export default function NexaIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="48" rx="22" ry="24" fill="currentColor" opacity="0.9" />
      <ellipse cx="40" cy="52" rx="14" ry="15" fill="currentColor" opacity="0.6" />
      <circle cx="32" cy="40" r="6" fill="white" />
      <circle cx="48" cy="40" r="6" fill="white" />
      <circle cx="33" cy="40" r="3" fill="#1E1B4B" />
      <circle cx="49" cy="40" r="3" fill="#1E1B4B" />
      <circle cx="34.5" cy="38.5" r="1.2" fill="white" />
      <circle cx="50.5" cy="38.5" r="1.2" fill="white" />
      <path d="M36 50 L40 56 L44 50 Z" fill="#F59E0B" />
      <path d="M30 22 Q32 12 36 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M40 18 Q40 8 40 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M50 22 Q48 12 44 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
    </svg>
  );
}
