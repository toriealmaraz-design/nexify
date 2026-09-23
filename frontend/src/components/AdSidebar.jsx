/**
 * AdSidebar — Displays ads in sidebar/portals (student, creator, affiliate)
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink } from 'lucide-react';

export default function AdSidebar() {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    axios.get('/api/v1/advertisements?placement=SIDEBAR&limit=3')
      .then(res => setAds(res.data.data || []))
      .catch(() => setAds([]));
  }, []);

  if (ads.length === 0) return null;

  return (
    <div className="space-y-3 mt-4">
      {ads.map(ad => (
        <div
          key={ad.id}
          onClick={() => { if (ad.linkUrl) window.open(ad.linkUrl, '_blank', 'noopener,noreferrer'); }}
          className="bg-[#1E293B] border border-white/5 rounded-xl p-3 cursor-pointer hover:border-[#7C3AED]/30 transition-all group"
        >
          {ad.imageUrl && (
            <img src={ad.imageUrl} alt={ad.title} className="w-full h-20 object-cover rounded-lg mb-2" />
          )}
          {ad.ctaText && (
            <span className="inline-block bg-[#7C3AED] text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
              {ad.ctaText}
            </span>
          )}
          <p className="text-xs font-medium text-white/90 line-clamp-2">{ad.title}</p>
          {ad.body && <p className="text-[10px] text-white/40 line-clamp-1 mt-0.5">{ad.body}</p>}
          <ExternalLink className="w-3 h-3 text-white/20 mt-1 group-hover:text-[#7C3AED] transition-colors" />
        </div>
      ))}
    </div>
  );
}
