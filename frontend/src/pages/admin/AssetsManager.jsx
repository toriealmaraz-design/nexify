/**
 * Admin — System Assets Manager
 * Upload/replace branding assets (logos, placeholders, payment badges).
 *
 * API: GET /api/v1/admin/assets
 *      POST /api/v1/admin/assets { key, fileUrl, mimeType }
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ASSET_LIST = [
  { key: 'LOGO_MAIN', label: 'Main Logo', description: 'Primary brand logo (dark bg)' },
  { key: 'LOGO_MAIN_LIGHT', label: 'Light Logo', description: 'Logo variant for light backgrounds' },
  { key: 'LOGO_NEXA', label: 'Nexa Logo', description: 'Nexa AI assistant logo' },
  { key: 'PLACEHOLDER_COURSE', label: 'Course Placeholder', description: 'Default course cover image' },
  { key: 'PLACEHOLDER_AVATAR', label: 'Avatar Placeholder', description: 'Default user avatar' },
  { key: 'PAYMENT_MOMO_MTN', label: 'MoMo MTN Badge', description: 'MTN Mobile Money payment icon' },
  { key: 'PAYMENT_MOMO_TELECEL', label: 'MoMo Telecel Badge', description: 'Telecel Mobile Money payment icon' },
  { key: 'PAYMENT_MOMO_AT', label: 'MoMo AT Badge', description: 'AT Mobile Money payment icon' },
];

export default function AssetsManager() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);

  useEffect(() => {
    fetch('/api/v1/admin/assets')
      .then(r => r.json())
      .then(d => { setAssets(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function startEdit(key) { setEditingKey(key); }

  async function saveAsset(key, fileUrl, mimeType) {
    const res = await fetch('/api/v1/admin/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, fileUrl, mimeType }),
    });
    if (res.ok) {
      setAssets(assets.map(a => a.key === key ? { ...a, fileUrl, mimeType } : a));
      setEditingKey(null);
    }
  }

  if (loading) return <div className="text-center py-8 text-slate-400">Loading assets...</div>;

  const assetMap = Object.fromEntries(assets.map(a => [a.key, a]));

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">System Assets</h1>

      <div className="grid md:grid-cols-2 gap-4">
        {ASSET_LIST.map(asset => {
          const existing = assetMap[asset.key];
          const isEditing = editingKey === asset.key;

          return (
            <div key={asset.key}
              className="bg-white rounded-nexify shadow-card-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-[#0F172A]">{asset.label}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{asset.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{asset.key}</p>
                </div>
                <button
                  onClick={() => startEdit(asset.key)}
                  className="text-xs text-[#7C3AED] hover:underline"
                >
                  {isEditing ? 'Cancel' : 'Update'}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="url"
                    placeholder="https://..."
                    defaultValue={existing?.fileUrl || ''}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="MIME type (e.g. image/svg+xml)"
                    defaultValue={existing?.mimeType || ''}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveAsset(
                        asset.key,
                        document.querySelector(`input[placeholder="https://..."]`)?.value,
                        document.querySelector(`input[placeholder="MIME type.*"]`)?.value,
                      )}
                      className="flex-1 px-3 py-2 bg-[#7C3AED] text-white rounded-lg text-sm hover:bg-[#7C3AED] transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="min-h-[80px] bg-[#EDE9FE] rounded-lg flex items-center justify-center border border-dashed border-slate-200">
                  {existing?.fileUrl ? (
                    <img
                      src={existing.fileUrl}
                      alt={asset.label}
                      className="max-h-[70px] max-w-full object-contain"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <p className="text-xs text-slate-400">No asset set</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
