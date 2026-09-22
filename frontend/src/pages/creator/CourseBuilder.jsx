/**
 * Course Builder — Creator Studio
 * Create and edit courses with modules, lessons, media, and pricing.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
  Image,
  Video,
  FileText,
  HelpCircle,
  Save,
  Send,
  Globe,
  Award,
  Languages,
  DollarSign,
  BookOpen,
  Layers,
} from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';

const COURSE_TYPES = ['ONLINE_COURSE', 'IN_PERSON_LAB'];
const SKILL_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const CATEGORIES = ['Technology', 'Business', 'Design', 'Marketing', 'Health', 'Other'];
const LANGUAGES = ['English', 'French', 'Spanish', 'Portuguese', 'Twi', 'Ga', 'Hausa'];
const LESSON_TYPES = ['VIDEO', 'TEXT', 'QUIZ'];

function getToken() {
  return localStorage.getItem('nexify_token');
}

function api() {
  return axios.create({
    baseURL: '/api/v1',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

function SectionCard({ icon: Icon, title, children, className = '' }) {
  return (
    <div className={`bg-[#1E1B4B] border border-white/10 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-5">
        {Icon && <Icon className="w-4 h-4 text-[#7C3AED]" />}
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">{children}</label>;
}

function TextInput({ value, onChange, placeholder, ...props }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
      {...props}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, ...props }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all resize-none"
      {...props}
    />
  );
}

function SelectInput({ value, onChange, options, ...props }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all appearance-none"
      {...props}
    >
      {options.map(opt => (
        <option key={opt} value={opt} className="bg-[#0F172A]">{opt}</option>
      ))}
    </select>
  );
}

function PillToggle({ options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150
            ${value === opt
              ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
              : 'bg-transparent border-white/20 text-white/50 hover:border-white/40 hover:text-white'}`}
        >
          {opt.replace(/_/g, ' ')}
        </button>
      ))}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 cursor-pointer group"
    >
      <div className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${checked ? 'bg-[#7C3AED]' : 'bg-white/20'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-white/70 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}

function ImagePreview({ url }) {
  if (!url) return null;
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-white/10 h-32 bg-white/5">
      <img src={url} alt="Cover preview" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
    </div>
  );
}

// ─── Module Accordion ─────────────────────────────────────────
function ModuleAccordion({ module, index, onUpdate, onDeleteLesson, onAddLesson, onDeleteModule }) {
  const [open, setOpen] = useState(index === 0);

  function updateLesson(lessonIdx, field, value) {
    const updated = [...module.lessons];
    updated[lessonIdx] = { ...updated[lessonIdx], [field]: value };
    onUpdate({ ...module, lessons: updated });
  }

  function removeLesson(lessonIdx) {
    onUpdate({ ...module, lessons: module.lessons.filter((_, i) => i !== lessonIdx) });
  }

  const lessonTypeIcon = type => {
    if (type === 'VIDEO') return <Video className="w-3.5 h-3.5" />;
    if (type === 'TEXT') return <FileText className="w-3.5 h-3.5" />;
    if (type === 'QUIZ') return <HelpCircle className="w-3.5 h-3.5" />;
    return null;
  };

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0F172A]/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0" />
        <span className="text-xs font-mono text-white/30 w-6">{String(index + 1).padStart(2, '0')}</span>
        <span className="flex-1 text-left text-sm font-medium text-white">{module.title || `Module ${index + 1}`}</span>
        <span className="text-xs text-white/40">{module.lessons?.length || 0} lessons</span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Module title */}
          <div>
            <FieldLabel>Module Title</FieldLabel>
            <TextInput
              value={module.title}
              onChange={v => onUpdate({ ...module, title: v })}
              placeholder="e.g. Introduction to the Course"
            />
          </div>

          {/* Lessons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FieldLabel>Lessons</FieldLabel>
              <button
                type="button"
                onClick={() => onAddLesson()}
                className="flex items-center gap-1.5 text-xs text-[#7C3AED] hover:text-[#8B5CF6] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Lesson
              </button>
            </div>

            {(!module.lessons || module.lessons.length === 0) && (
              <p className="text-xs text-white/30 text-center py-4">No lessons yet. Add one above.</p>
            )}

            {module.lessons?.map((lesson, li) => (
              <div key={li} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-white/20">{lessonTypeIcon(lesson.type)}</span>
                  <input
                    type="text"
                    value={lesson.title}
                    onChange={e => updateLesson(li, 'title', e.target.value)}
                    placeholder="Lesson title"
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                  />
                  <select
                    value={lesson.type}
                    onChange={e => updateLesson(li, 'type', e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 focus:outline-none"
                  >
                    {LESSON_TYPES.map(t => (
                      <option key={t} value={t} className="bg-[#0F172A]">{t}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeLesson(li)}
                    className="text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={lesson.contentUrl || ''}
                  onChange={e => updateLesson(li, 'contentUrl', e.target.value)}
                  placeholder={lesson.type === 'VIDEO' ? 'Video URL (YouTube, Vimeo...)' : lesson.type === 'QUIZ' ? 'Quiz ID or URL' : 'Text content URL'}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={lesson.duration || ''}
                    onChange={e => updateLesson(li, 'duration', e.target.value)}
                    placeholder="Duration (e.g. 10 min)"
                    className="w-36 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lesson.isFreePreview || false}
                      onChange={e => updateLesson(li, 'isFreePreview', e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    Free preview
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Delete module */}
          <div className="flex justify-end pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => onDeleteModule()}
              className="flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Module
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────
function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-[#1E1B4B] border border-white/10 rounded-2xl p-6">
        <Skeleton height="14px" width="120px" className="mb-5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Skeleton height="38px" /></div>
          <div><Skeleton height="38px" /></div>
        </div>
        <div className="mt-4"><Skeleton height="80px" /></div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div><Skeleton height="38px" /></div>
          <div><Skeleton height="38px" /></div>
        </div>
      </div>
      <div className="bg-[#1E1B4B] border border-white/10 rounded-2xl p-6">
        <Skeleton height="14px" width="120px" className="mb-5" />
        <div className="grid grid-cols-2 gap-4">
          <div><Skeleton height="38px" /></div>
          <div><Skeleton height="38px" /></div>
        </div>
        <div className="mt-4"><Skeleton height="120px" /></div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function CourseBuilder() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(courseId);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'ONLINE_COURSE',
    category: 'Technology',
    skillLevel: 'BEGINNER',
    coverImageUrl: '',
    priceGhs: '',
    discountPriceGhs: '',
    language: 'English',
    hasCertificate: false,
  });

  const [modules, setModules] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Load existing course for edit
  useEffect(() => {
    if (!isEdit) return;
    api().get(`/courses/${courseId}`)
      .then(res => {
        const c = res.data.data;
        setForm({
          title: c.title || '',
          description: c.description || '',
          type: c.type || 'ONLINE_COURSE',
          category: c.category || 'Technology',
          skillLevel: c.skillLevel || 'BEGINNER',
          coverImageUrl: c.coverImageUrl || '',
          priceGhs: c.priceGhs != null ? String(c.priceGhs) : '',
          discountPriceGhs: c.discountPriceGhs != null ? String(c.discountPriceGhs) : '',
          language: c.language || 'English',
          hasCertificate: Boolean(c.hasCertificate),
        });
        setModules(c.modules || []);
      })
      .catch(err => {
        if (err.response?.status === 401) {
          navigate('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [courseId, isEdit, navigate]);

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function updateModule(idx, updated) {
    setModules(prev => prev.map((m, i) => i === idx ? updated : m));
  }

  function deleteModule(idx) {
    setModules(prev => prev.filter((_, i) => i !== idx));
  }

  function addModule() {
    setModules(prev => [...prev, { title: '', lessons: [] }]);
  }

  function addLesson(moduleIdx) {
    setModules(prev => prev.map((m, i) =>
      i === moduleIdx
        ? { ...m, lessons: [...(m.lessons || []), { title: '', type: 'VIDEO', contentUrl: '', duration: '', isFreePreview: false }] }
        : m
    ));
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.priceGhs || isNaN(Number(form.priceGhs)) || Number(form.priceGhs) < 0) e.priceGhs = 'Valid price is required';
    return e;
  }

  async function saveAsDraft() {
    await saveCourse('DRAFT');
  }

  async function submitForReview() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    await saveCourse('PENDING_APPROVAL');
  }

  async function saveCourse(status) {
    setSaving(true);
    setServerError('');
    try {
      const payload = {
        ...form,
        priceGhs: Number(form.priceGhs),
        discountPriceGhs: form.discountPriceGhs ? Number(form.discountPriceGhs) : null,
        status,
      };

      let courseIdToUse = courseId;

      if (isEdit) {
        await api().put(`/courses/${courseId}`, payload);
      } else {
        const res = await api().post('/courses', payload);
        courseIdToUse = res.data.data.id;
      }

      // Save modules and lessons
      for (const mod of modules) {
        const modPayload = { title: mod.title, order: modules.indexOf(mod) };
        const modRes = await api().post(`/courses/${courseIdToUse}/modules`, modPayload);
        const modId = modRes.data.data.id;

        for (const lesson of (mod.lessons || [])) {
          await api().post(`/modules/${modId}/lessons`, {
            title: lesson.title,
            type: lesson.type,
            contentUrl: lesson.contentUrl,
            duration: lesson.duration,
            isFreePreview: lesson.isFreePreview || false,
          });
        }
      }

      if (!isEdit && status === 'DRAFT') {
        navigate(`/creator/course/${courseIdToUse}/edit`, { replace: true });
      } else if (!isEdit) {
        navigate('/creator', { replace: true });
      } else {
        navigate('/creator', { replace: true });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setServerError(err.response?.data?.message || 'Failed to save course. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6"><Skeleton height="32px" width="200px" /></div>
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          to="/creator"
          className="text-sm text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? 'Edit Course' : 'New Course'}
          </h1>
          <p className="text-sm text-white/40 mt-0.5">
            {isEdit ? `Updating course` : 'Build your course from scratch'}
          </p>
        </div>
      </div>

      {serverError && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      {/* Section 1: Course Header */}
      <SectionCard data-tour="course-builder-form" icon={BookOpen} title="Course Header" className="mb-6">
        <div className="space-y-5">
          <div>
            <FieldLabel>Course Title</FieldLabel>
            <TextInput
              value={form.title}
              onChange={v => setField('title', v)}
              placeholder="e.g. Complete Web Development Bootcamp"
              {...(errors.title ? { 'data-error': true } : {})}
            />
            {errors.title && <p className="mt-1.5 text-xs text-red-400">{errors.title}</p>}
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={form.description}
              onChange={v => setField('description', v)}
              placeholder="Describe what students will learn..."
              rows={4}
            />
            {errors.description && <p className="mt-1.5 text-xs text-red-400">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel>Course Type</FieldLabel>
              <PillToggle options={COURSE_TYPES} value={form.type} onChange={v => setField('type', v)} />
            </div>
            <div>
              <FieldLabel>Category</FieldLabel>
              <SelectInput
                value={form.category}
                onChange={v => setField('category', v)}
                options={CATEGORIES}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Skill Level</FieldLabel>
            <PillToggle options={SKILL_LEVELS} value={form.skillLevel} onChange={v => setField('skillLevel', v)} />
          </div>
        </div>
      </SectionCard>

      {/* Section 2: Media & Pricing */}
      <SectionCard icon={DollarSign} title="Media and Pricing" className="mb-6">
        <div className="space-y-5">
          <div>
            <FieldLabel>Cover Image URL</FieldLabel>
            <TextInput
              value={form.coverImageUrl}
              onChange={v => setField('coverImageUrl', v)}
              placeholder="https://..."
            />
            <ImagePreview url={form.coverImageUrl} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel>Price (GHs)</FieldLabel>
              <TextInput
                value={form.priceGhs}
                onChange={v => setField('priceGhs', v)}
                placeholder="0.00"
                type="number"
                min="0"
                step="0.01"
              />
              {errors.priceGhs && <p className="mt-1.5 text-xs text-red-400">{errors.priceGhs}</p>}
            </div>
            <div>
              <FieldLabel>Discount Price (GHs)</FieldLabel>
              <TextInput
                value={form.discountPriceGhs}
                onChange={v => setField('discountPriceGhs', v)}
                placeholder="Optional"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel>Language</FieldLabel>
              <SelectInput
                value={form.language}
                onChange={v => setField('language', v)}
                options={LANGUAGES}
              />
            </div>
          </div>

          <div>
            <ToggleSwitch
              checked={form.hasCertificate}
              onChange={v => setField('hasCertificate', v)}
              label="Completion Certificate"
            />
          </div>
        </div>
      </SectionCard>

      {/* Section 3: Module/Lesson Builder */}
      <SectionCard icon={Layers} title="Curriculum" className="mb-6">
        <div className="space-y-3">
          {modules.length === 0 && (
            <p className="text-sm text-white/30 text-center py-6">No modules yet. Add one below to start building your curriculum.</p>
          )}

          {modules.map((mod, idx) => (
            <ModuleAccordion
              key={idx}
              module={mod}
              index={idx}
              onUpdate={updated => updateModule(idx, updated)}
              onDeleteModule={() => deleteModule(idx)}
              onAddLesson={() => addLesson(idx)}
              onDeleteLesson={(li) => {
                setModules(prev => prev.map((m, i) =>
                  i === idx ? { ...m, lessons: m.lessons.filter((_, l) => l !== li) } : m
                ));
              }}
            />
          ))}

          <button
            type="button"
            onClick={addModule}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/20 rounded-xl text-sm text-white/50 hover:border-white/40 hover:text-white transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </button>
        </div>
      </SectionCard>

      {/* Section 4: Publish Controls */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Link
          to="/creator"
          className="px-5 py-2.5 border border-white/10 text-white/60 rounded-xl text-sm font-medium hover:bg-white/5 transition-all"
        >
          Cancel
        </Link>
        <div className="flex items-center gap-3">
          {saving ? (
            <div className="flex items-center gap-2 text-sm text-white/40">
              <div className="w-4 h-4 border-2 border-white/20 border-t-[#7C3AED] rounded-full animate-spin" />
              Saving...
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={saveAsDraft}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 border border-white/10 text-white/70 rounded-xl text-sm font-medium hover:bg-white/5 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save as Draft
              </button>
              <button
                type="button"
                onClick={submitForReview}
                disabled={saving}
                className="flex items-center gap-2 bg-[#7C3AED] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Submit for Review
              </button>
            </>
          )}
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}
