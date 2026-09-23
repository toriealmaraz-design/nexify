/**
 * NexaAvatar — Global Nexa AI avatar using the TourMascot owl
 * Used everywhere: chat widget, tour, notifications, etc.
 */
import React from 'react';
import TourMascot from '../tour/TourMascot';

export default function NexaAvatar({ size = 'md', pose = 'idle' }) {
  const sizes = { sm: 36, md: 44, lg: 56, xl: 80 };
  const px = sizes[size] || sizes.md;

  return (
    <div className="flex-shrink-0" style={{ width: px, height: px }}>
      <TourMascot pose={pose} size={px} />
    </div>
  );
}
