/**
 * NexaAvatar — small reusable avatar component
 * Displays a Sparkles icon in a purple circle
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

export default function NexaAvatar({ size = 'md' }) {
  const sizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`${sizes[size] || sizes.md} bg-[#7C3AED] rounded-full flex items-center justify-center flex-shrink-0`}
      aria-label="Nexa AI Assistant"
    >
      <Sparkles className={`${iconSizes[size] || iconSizes.md} text-white`} />
    </div>
  );
}
