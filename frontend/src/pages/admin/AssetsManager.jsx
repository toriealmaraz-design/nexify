/**
 * Admin — System Assets Manager
 * Upload/replace branding assets (logos, placeholders, payment badges).
 *
 * API: GET /api/v1/admin/assets
 *      POST /api/v1/admin/assets { key, fileUrl, mimeType }
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../../components/Skeleton';

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

function AssetCard({ asset, existing, isEditing, onStartEdit, onSave, onCancel }) {
  const { api } = useAuth();
  const [fileUrl, setFileUrl] = useState(existing?.fileUrl || '');
  const [mimeType, setMimeType] = useState(existing?.mimeType || '');

  useEffect(() => {
    setFileUrl(existing?.fileUrl || '');
    setMimeType(existing?.mimeType || '');
  }, [existing, isEditing]);

  async function handleSave() {
    if (!fileUrl.trim()) return;
    try {
      await api.post('/admin/assets', { key: asset.key, fileUrl: fileUrl.trim(), mimeType: mimeType.trim() || 'image/png' });
      onSave(asset.key, fileUrl.trim(), mimeType.trim() || 'image/png');
    } catch {}
  }

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-white">{asset.label}</h3>
          <p className="text-xs text-white/40 mt-0.5">{asset.description}</p>
          <p className="text-xs text-white/20 mt-0.5 font-mono">{asset.key}</p>
        </div>
        {!isEditing && (
          <button
            onClick={onStartEdit}
            className="text-xs text-[#7C3AED] hover:text-[#8b5cf6] transition-colors"
          >
            Update
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <input
            type="url"
            value={fileUrl}
            onChange={e => setFileUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
          <input
            type="text"
            value={mimeType}
            onChange={e => setMimeType(e.target.value)}
            placeholder="image/png"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 bg-[#7C3AED] text-white rounded-xl text-sm hover:bg-[#8b5cf6] transition-colors"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-2 border border-white/10 text-white/60 rounded-xl text-sm hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-[80px] bg-[#0F172A] rounded-xl flex items-center justify-center border border-dashed border-white/10">
          {existing?.fileUrl ? (
            <img
              src={existing.fileUrl}
              alt={asset.label}
              className="max-h-[70px] max-w-full object-contain"
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <p className="text-xs text-white/30">No asset set</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssetsManager() {
  const { api } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);

  useEffect(() => {
    api.get('/admin/assets')
      .then(r => { setAssets(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [api]);

  function startEdit(key) { setEditingKey(key); }
  function cancelEdit() { setEditingKey(null); }

  function saveAsset(key, fileUrl, mimeType) {
    setAssets(prev => prev.map(a => a.key === key ? { ...a, fileUrl, mimeType } : a));
    setEditingKey(null);
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton height="36px" width="200px" className="mb-6" />
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#1E293B] border border-white/5 rounded-xl p-5 h-[160px]">
              <Skeleton height="14px" width="50%" className="mb-3" />
              <Skeleton height="80px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const assetMap = Object.fromEntries(assets.map(a => [a.key, a]));

  return (
    <div data-tour="admin-asset-manager" className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">System Assets</h1>
        <p className="text-white/40 text-sm">Upload and manage platform branding assets.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {ASSET_LIST.map(asset => {
          const existing = assetMap[asset.key];
          const isEditing = editingKey === asset.key;

          return (
            <AssetCard
              key={asset.key}
              asset={asset}
              existing={existing}
              isEditing={isEditing}
              onStartEdit={() => startEdit(asset.key)}
              onSave={saveAsset}
              onCancel={cancelEdit}
            />
          );
        })}
      </div>
    </div>
  );
}
