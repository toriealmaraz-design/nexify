/**
 * AdBanner — Public advertisement display component
 * Fetches ads for a given placement and renders a clickable card.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink } from 'lucide-react';

export default function AdBanner({ placement, limit = 1 }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!placement) return;
    axios
      .get(`/api/v1/advertisements?placement=${encodeURIComponent(placement)}&limit=${limit}`)
      .then(res => setAds(res.data.data || []))
      .catch(() => setAds([]))
      .finally(() => setLoading(false));
  }, [placement, limit]);

  if (loading || ads.length === 0) return null;

  const ad = ads[0];

  const handleClick = async () => {
    if (!ad?.linkUrl) return;
    window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    try {
      await axios.post(`/api/v1/advertisements/${ad.id}/click`);
    } catch {
      // Silently ignore click tracking failures
    }
  };

  return (
    <div
      className="w-full rounded-xl overflow-hidden cursor-pointer group animate-fade-in"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      aria-label={`Ad: ${ad.title}`}
    >
      <div className="relative aspect-video bg-[#1E293B] overflow-hidden">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#7C3AED]/20 to-[#1E293B] flex items-center justify-center">
            <span className="text-white/30 text-sm font-medium uppercase tracking-wider">{ad.title}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Text content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {ad.ctaText && (
            <span className="inline-block bg-[#7C3AED] text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
              {ad.ctaText}
            </span>
          )}
          <h3 className="text-white font-bold text-lg leading-tight mb-1 drop-shadow-md">
            {ad.title}
          </h3>
          {ad.body && (
            <p className="text-white/80 text-sm line-clamp-2 drop-shadow-md">{ad.body}</p>
          )}
        </div>

        {/* External link indicator */}
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}
