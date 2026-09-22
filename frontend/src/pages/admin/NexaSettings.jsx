/**
 * Admin Nexa AI Settings Page
 * Configure Nexa's LLM endpoint, model, API key, and chatbot fallback replies.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../../components/Skeleton';
import {
  Zap, Globe, Brain, Key, MessageSquare, CheckCircle, XCircle,
  Save, Trash2, Plus, RefreshCw, AlertCircle, Wifi, WifiOff,
  MessageCircle, Edit3, RotateCw, Sparkles,
} from 'lucide-react';

const DEFAULT_SYSTEM_PROMPTS = {
  ADMIN: `You are Nexa, operating in Executive Administrative Mode on the Nexify Platform. Provide platform-wide summaries, staging queue insights, and revenue analytics. Maintain an authoritative, concise tone. Use clean Markdown formatting. Never expose another user's private data.`,
  CREATOR: `You are Nexa, the Creator Course & Funnel Strategist on Nexify. Assist course authors with curriculum structuring, conversion optimization, and earnings analysis. Use GH\u8373 for all monetary figures. Remind creators about the 30-90s trailer requirement and the staging review process. Use clean Markdown formatting.`,
  AFFILIATE: `You are Nexa, the Affiliate Network Promotional Coach on Nexify. Help affiliates maximize conversions, write promotional copy, and analyze their metrics. Use GH\u8373 for all figures. Generate copy that can be pasted directly into WhatsApp, TikTok, or email. Never expose other affiliates' data. Use clean Markdown formatting.`,
  STUDENT: `You are Nexa, the dedicated learning assistant on the Nexify Platform. Help students with course materials, clarify topics, track their progress, and navigate enrolled courses. Use a friendly, encouraging tone. Never reveal platform financials or other users' data. Use clean Markdown formatting.`,
};

// ── Toast helper ──────────────────────────────────────────────────────
function ToastMessage({ message, type }) {
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 shadow-xl ${type === 'success' ? 'bg-emerald-500/90 text-black' : 'bg-red-500/90 text-white'}`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Provider Selector ──────────────────────────────────────────────────
const PROVIDERS = ['OLLAMA', 'OPENAI', 'GEMINI', 'CLAUDE'];
function ProviderSelector({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/70 mb-1.5">Provider</label>
      <div className="grid grid-cols-2 gap-2">
        {PROVIDERS.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              value === p
                ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Fallback Responses Panel ───────────────────────────────────────────
function FallbackResponsesPanel({ api, replies, setReplies, editingReply, setEditingReply, replyForm, setReplyForm, showToast, handleDeleteReply, handleSaveReply }) {
  const [filterRole, setFilterRole] = useState('ALL');
  const filtered = replies.filter(r => filterRole === 'ALL' || r.role === filterRole || r.role === 'ALL');
  const roleBadgeColor = (role) => ({
    ALL: 'bg-white/10 text-white/60',
    ADMIN: 'bg-purple-500/20 text-purple-400',
    CREATOR: 'bg-sky-500/20 text-sky-400',
    AFFILIATE: 'bg-emerald-500/20 text-emerald-400',
    STUDENT: 'bg-amber-500/20 text-amber-400',
  }[role] || 'bg-white/10 text-white/40');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Fallback Responses</h2>
          <p className="text-xs text-white/40 mt-0.5">Predefined chatbot replies — used when the LLM is offline or for keyword-matched responses.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            api.post('/chatbot-replies/seed').then(() => {
              showToast('Defaults seeded.', 'success');
              setEditingReply(null);
              setReplyForm({ key: '', role: 'ALL', trigger: '', question: '', answer: '', priority: 50, enabled: true });
              api.get('/chatbot-replies').then(r => setReplies(r.data.data || []));
            }).catch(() => showToast('Seed failed.', 'error'));
          }}
            className="border border-white/10 hover:bg-white/5 text-white/60 px-3 py-1.5 rounded-xl text-xs transition-colors">Seed Defaults</button>
          <button onClick={() => { setEditingReply(null); setReplyForm({ key: '', role: 'ALL', trigger: '', question: '', answer: '', priority: 50, enabled: true }); }}
            className="bg-[#7C3AED] hover:bg-[#8b5cf6] text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"><Plus className="w-3 h-3" /> New Reply</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-2 max-h-[600px] overflow-y-auto pr-1">
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {['ALL', 'ADMIN', 'CREATOR', 'AFFILIATE', 'STUDENT'].map(r => (
              <button key={r} onClick={() => setFilterRole(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${filterRole === r ? 'bg-[#7C3AED] text-white' : 'bg-[#1E293B] border border-white/10 text-white/50 hover:text-white'}`}>{r}</button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">No responses found. Click "Seed Defaults" to load preset replies.</div>
          ) : filtered.map(reply => (
            <div key={reply.key}
              onClick={() => { setEditingReply(reply.key); setReplyForm({ key: reply.key, role: reply.role, trigger: reply.trigger || '', question: reply.question || '', answer: reply.answer, priority: reply.priority, enabled: reply.enabled }); }}
              className={`bg-[#1E293B] border rounded-xl p-4 cursor-pointer transition-colors hover:border-white/20 ${editingReply === reply.key ? 'border-[#7C3AED]' : 'border-white/5'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${roleBadgeColor(reply.role)}`}>{reply.role}</span>
                  <span className="text-xs font-bold text-white">{reply.key}</span>
                  {!reply.enabled && <span className="text-[10px] text-red-400/60 bg-red-500/10 px-1.5 py-0.5 rounded">Disabled</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={e => { e.stopPropagation(); api.put(`/chatbot-replies/${reply.key}`, { ...reply, enabled: !reply.enabled }).then(() => api.get('/chatbot-replies').then(r => setReplies(r.data.data || []))).catch(() => showToast('Toggle failed.', 'error')); }}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${reply.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/30'}`}>
                    {reply.enabled ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDeleteReply(reply.key); }}
                    className="w-6 h-6 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400/60 hover:text-red-400 flex items-center justify-center transition-colors"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
              <p className="text-xs text-white/70 mb-1 line-clamp-2">{reply.answer}</p>
              <p className="text-[10px] text-white/30 font-mono">triggers: {reply.trigger || '(none)'}</p>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2">
          <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 sticky top-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Edit3 className="w-4 h-4 text-white/50" />{editingReply ? `Edit: ${editingReply}` : 'New Reply'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-white/60 mb-1">Key *</label>
                <input value={replyForm.key} onChange={e => setReplyForm(f => ({ ...f, key: e.target.value.toUpperCase().replace(/\s/g, '_') }))} placeholder="MY_REPLY_KEY"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/60 mb-1">Role Scope</label>
                <select value={replyForm.role} onChange={e => setReplyForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C3AED]">
                  {['ALL', 'ADMIN', 'CREATOR', 'AFFILIATE', 'STUDENT'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/60 mb-1">Keywords / Triggers * <span className="text-white/30">(comma-separated)</span></label>
                <input value={replyForm.trigger} onChange={e => setReplyForm(f => ({ ...f, trigger: e.target.value }))} placeholder="hello, hi, hey"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/60 mb-1">Example Question <span className="text-white/30">(optional)</span></label>
                <input value={replyForm.question} onChange={e => setReplyForm(f => ({ ...f, question: e.target.value }))} placeholder="How do I enroll?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/60 mb-1">Reply Text *</label>
                <textarea value={replyForm.answer} onChange={e => setReplyForm(f => ({ ...f, answer: e.target.value }))} rows={4} placeholder="Write the response Nexa should give..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/60 mb-1">Priority (higher = matched first)</label>
                <input type="number" value={replyForm.priority} onChange={e => setReplyForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
              </div>
              <button onClick={handleSaveReply}
                className="w-full bg-[#7C3AED] hover:bg-[#8b5cf6] text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                <Save className="w-3.5 h-3.5" />{editingReply ? 'Update Reply' : 'Save Reply'}
              </button>
              {editingReply && (
                <button onClick={() => { setEditingReply(null); setReplyForm({ key: '', role: 'ALL', trigger: '', question: '', answer: '', priority: 50, enabled: true }); }}
                  className="w-full border border-white/10 hover:bg-white/5 text-white/60 py-2 rounded-xl text-sm transition-colors">Cancel</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────
export default function NexaSettings() {
  const { api } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [activeKey, setActiveKey] = useState('DEFAULT');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('ai');
  const [replies, setReplies] = useState([]);
  const [editingReply, setEditingReply] = useState(null);
  const [replyForm, setReplyForm] = useState({ key: '', role: 'ALL', trigger: '', question: '', answer: '', priority: 50, enabled: true });
  const [form, setForm] = useState({ key: 'DEFAULT', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', apiKey: '', systemPrompt: DEFAULT_SYSTEM_PROMPTS.ADMIN, enabled: true });

  // Toast must be defined before fetchConfigs since fetchConfigs calls it
  const showToast = (message, type) => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/nexa-config');
      setConfigs(res.data.data || []);
      if (res.data.data?.length > 0) setActiveKey(res.data.data[0].key);
    } catch { showToast('Failed to load configurations.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConfigs(); }, [api]);

  useEffect(() => {
    const existing = configs.find(c => c.key === activeKey);
    if (existing) setForm({ key: existing.key, baseUrl: existing.baseUrl, model: existing.model, apiKey: existing.apiKey || '', systemPrompt: existing.systemPrompt, enabled: existing.enabled });
  }, [activeKey, configs]);

  const handleSave = async () => {
    if (!form.baseUrl || !form.model || !form.systemPrompt) { showToast('baseUrl, model, and systemPrompt are required.', 'error'); return; }
    setSaving(true);
    try {
      await api.post('/nexa-config', { key: form.key, baseUrl: form.baseUrl, model: form.model, apiKey: form.apiKey || undefined, systemPrompt: form.systemPrompt, enabled: form.enabled });
      showToast('Configuration saved.', 'success');
      fetchConfigs();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to save.', 'error'); }
    finally { setSaving(false); }
  };
  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await api.post('/nexa/chat', { prompt: 'Say hello in one sentence.' });
      const provider = res.data.data?.provider;
      const usedLLM = res.data.data?.usedLLM;
      setTestResult({ ok: true, message: `Nexa responded via ${provider}${usedLLM ? ' (LLM enhanced)' : ' (keyword match)'}.` });
      showToast('Test message sent.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Connection failed.';
      setTestResult({ ok: false, message: msg }); showToast(msg, 'error');
    } finally { setTesting(false); }
  };
  const handleDelete = async (key) => {
    if (key === 'DEFAULT') { showToast('Cannot delete DEFAULT.', 'error'); return; }
    if (!window.confirm(`Delete config "${key}"?`)) return;
    try { await api.delete(`/nexa-config/${key}`); showToast('Deleted.', 'success'); if (activeKey === key) setActiveKey('DEFAULT'); fetchConfigs(); }
    catch { showToast('Delete failed.', 'error'); }
  };
  const handleNewConfig = () => {
    const newKey = prompt('Enter a unique config key (e.g. CREATOR_SCOPE):');
    if (!newKey || !newKey.trim()) return;
    const key = newKey.trim().toUpperCase();
    if (configs.find(c => c.key === key)) { showToast('Key already exists.', 'error'); return; }
    setConfigs(prev => [...prev, { key, provider: 'OPENAI', model: 'gpt-4o-mini', systemPrompt: DEFAULT_SYSTEM_PROMPTS.CREATOR, enabled: true }]);
    setActiveKey(key);
    setForm({ key, provider: 'OPENAI', model: 'gpt-4o-mini', apiKey: '', systemPrompt: DEFAULT_SYSTEM_PROMPTS.CREATOR, enabled: true });
  };
  const toggleEnabled = () => setForm(f => ({ ...f, enabled: !f.enabled }));
  const handleProviderChange = (provider) => {
    const modelMap = { OLLAMA: 'llama3.2', OPENAI: 'gpt-4o-mini', GEMINI: 'gemini-1.5-flash', CLAUDE: 'claude-3-5-haiku' };
    setForm(f => ({ ...f, provider, model: modelMap[provider] || '' }));
  };

  const fetchReplies = async () => { try { const res = await api.get('/chatbot-replies'); setReplies(res.data.data || []); } catch { showToast('Failed to load fallback responses.', 'error'); } };
  const handleSaveReply = async () => {
    if (!replyForm.key || !replyForm.trigger || !replyForm.answer) { showToast('Key, trigger, and answer are required.', 'error'); return; }
    try {
      if (editingReply) { await api.put(`/chatbot-replies/${editingReply}`, replyForm); showToast('Response updated.', 'success'); }
      else { await api.post('/chatbot-replies', replyForm); showToast('Response created.', 'success'); }
      setEditingReply(null); setReplyForm({ key: '', role: 'ALL', trigger: '', question: '', answer: '', priority: 50, enabled: true }); fetchReplies();
    } catch (err) { showToast(err.response?.data?.message || 'Save failed.', 'error'); }
  };
  const handleDeleteReply = async (key) => {
    if (!window.confirm(`Delete "${key}"?`)) return;
    try { await api.delete(`/chatbot-replies/${key}`); showToast('Deleted.', 'success'); if (editingReply === key) { setEditingReply(null); setReplyForm({ key: '', role: 'ALL', trigger: '', question: '', answer: '', priority: 50, enabled: true }); } fetchReplies(); }
    catch { showToast('Delete failed.', 'error'); }
  };

  if (loading) return (<div className="max-w-4xl"><Skeleton height="32px" width="240px" className="mb-6" /><Skeleton height="400px" /></div>);

  return (
    <div data-tour="admin-nexa-settings-panel" className="max-w-4xl">
      {toast && <ToastMessage message={toast.message} type={toast.type} />}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center"><Brain className="w-5 h-5 text-amber-400" /></div>
            <h1 className="text-2xl font-bold text-white">Nexa AI Settings</h1>
          </div>
          <p className="text-white/40 text-sm ml-[44px]">Keyword-match responses always run first. LLM is an optional enhancement.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('nexa:restart-tour'))}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-full transition-colors"
            title="Replay the onboarding tour for all roles"
          >
            <RotateCw className="w-3.5 h-3.5" /> Restart Tour
          </button>
          {form.enabled
            ? <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Enabled</span>
            : <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full"><XCircle className="w-3.5 h-3.5" /> Disabled</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 mb-6 bg-[#1E293B]/50 border border-white/5 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('ai')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'ai' ? 'bg-[#7C3AED] text-white' : 'text-white/50 hover:text-white'}`}><Zap className="w-4 h-4" /> AI Configuration</button>
        <button onClick={() => { setActiveTab('fallback'); fetchReplies(); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'fallback' ? 'bg-[#7C3AED] text-white' : 'text-white/50 hover:text-white'}`}><MessageCircle className="w-4 h-4" /> Keyword Responses</button>
      </div>

      {activeTab === 'ai' && (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 flex items-center gap-2 flex-wrap mb-2">
          {configs.map(c => (
            <button key={c.key} onClick={() => setActiveKey(c.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${activeKey === c.key ? 'bg-[#7C3AED] text-white' : 'bg-[#1E293B] border border-white/10 text-white/50 hover:text-white'}`}>
              {c.key} {c.enabled ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
            </button>
          ))}
          <button onClick={handleNewConfig} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#1E293B] border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-colors flex items-center gap-1.5"><Plus className="w-3 h-3" /> New Config</button>
        </div>
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><Globe className="w-4 h-4 text-white/50" /><h2 className="text-sm font-semibold text-white">Endpoint Configuration</h2></div>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-white mb-1">Config Key</label><input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value.toUpperCase() }))} placeholder="DEFAULT" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" /></div>
              <ProviderSelector value={form.provider} onChange={handleProviderChange} />
              <div>
                <label className="block text-xs font-medium text-white mb-1">Model <span className="text-white/30 text-[10px]">auto-filled from provider</span></label>
                <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="auto-filled or custom"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white mb-1">API Key <span className="text-white/30 text-[10px]">(not needed for local Ollama)</span></label>
                <div className="relative"><Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" /><input type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="sk-..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] font-mono" /></div>
              </div>
            </div>
          </div>
          <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><MessageSquare className="w-4 h-4 text-white/50" /><h2 className="text-sm font-semibold text-white">System Prompt</h2></div>
            <textarea value={form.systemPrompt} onChange={e => setForm(f => ({ ...f, systemPrompt: e.target.value }))} rows={7} placeholder="You are Nexa, ..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none font-mono leading-relaxed" />
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(DEFAULT_SYSTEM_PROMPTS).map(([role, prompt]) => (<button key={role} onClick={() => setForm(f => ({ ...f, systemPrompt: prompt }))} className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white px-2.5 py-1.5 rounded-lg transition-colors">{role}</button>))}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={handleSave} disabled={saving} className="bg-[#7C3AED] hover:bg-[#8b5cf6] disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">{saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? 'Saving...' : 'Save Configuration'}</button>
            <button onClick={handleTest} disabled={testing} className="border border-white/10 hover:bg-white/5 text-white/60 px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">{testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}{testing ? 'Testing...' : 'Test Connection'}</button>
            {activeKey !== 'DEFAULT' && (<button onClick={() => handleDelete(activeKey)} className="border border-red-500/20 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 ml-auto"><Trash2 className="w-3.5 h-3.5" /> Delete</button>)}
          </div>
          {testResult && (<div className={`border rounded-xl p-4 flex items-start gap-3 ${testResult.ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>{testResult.ok ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}<div><p className={`text-xs font-medium ${testResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>{testResult.ok ? 'Connection Successful' : 'Connection Failed'}</p><p className="text-xs text-white/50 mt-0.5">{testResult.message}</p></div></div>)}
        </div>
        <div className="space-y-4">
          <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-white/50" /><h3 className="text-sm font-semibold text-white">Nexa AI</h3></div>
              <button onClick={toggleEnabled} className={`relative w-11 h-6 rounded-full transition-colors ${form.enabled ? 'bg-emerald-500' : 'bg-white/10'}`}><span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.enabled ? 'left-[22px]' : 'left-0.5'}`} /></button>
            </div>
            <p className="text-xs text-white/30 mt-3">{form.enabled ? 'Nexa AI is active. All roles can use the chat.' : 'Nexa AI is disabled. Chat returns a 503.'}</p>
          </div>
          <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">How Nexa Works</h3>
            <div className="space-y-3">
              {[
                { icon: MessageSquare, text: 'Nexa always checks keyword responses first — no network call needed.' },
                { icon: Sparkles, text: 'LLM enhancement runs only when enabled and explicitly requested.' },
                { icon: Brain, text: 'System context is built from live database records per role scope.' },
                { icon: Key, text: 'API key is stored per provider. Gemini and Claude keys are supported.' },
              ].map(({ icon: Icon, text }) => (<div key={text} className="flex items-start gap-2.5"><div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"><Icon className="w-3 h-3 text-white/40" /></div><p className="text-xs text-white/50 leading-relaxed">{text}</p></div>))}
            </div>
          </div>
          <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Supported Providers</h3>
            <div className="space-y-2">
              {PROVIDERS.map(p => (
                <div key={p.value} className="flex items-start gap-2.5 py-2 border-b border-white/5 last:border-0">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md mt-0.5 flex-shrink-0 ${p.color}`}>{p.label}</span>
                  <div><p className="text-[11px] text-white/40">{p.defaultModel || 'custom model'}</p><p className="text-[10px] text-white/20">{p.hint}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>)}

      {activeTab === 'fallback' && (<FallbackResponsesPanel api={api} replies={replies} setReplies={setReplies} editingReply={editingReply} setEditingReply={setEditingReply} replyForm={replyForm} setReplyForm={setReplyForm} showToast={showToast} handleDeleteReply={handleDeleteReply} handleSaveReply={handleSaveReply} />)}
    </div>
  );
}
