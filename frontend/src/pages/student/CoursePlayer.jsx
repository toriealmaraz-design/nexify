/**
 * CoursePlayer — Immersive learning interface
 * Video player + collapsible module tree + Q&A + Announcements tabs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Play, ChevronDown, ChevronRight, Video, FileText, HelpCircle,
  CheckCircle2, Circle, ChevronLeft, ChevronRight as ChevronRightIcon,
  Loader2, AlertCircle, Star, BookOpen, Award, MessageCircle, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import QAPanel from '../../components/course/QAPanel';

const API_BASE = '/api/v1';

function getProgressKey(courseId) { return `nexify_progress_${courseId}`; }
function loadProgress(courseId) { try { return JSON.parse(localStorage.getItem(getProgressKey(courseId)) || '[]'); } catch { return []; } }
function saveProgress(courseId, completedIds) { localStorage.setItem(getProgressKey(courseId), JSON.stringify(completedIds)); }

// ─── Skeleton loaders ───────────────────────────────────────
function VideoSkeleton() {
  return <div className="bg-[#1E1B4B] border border-white/10 rounded-xl overflow-hidden"><div className="aspect-video bg-[#0F172A] flex items-center justify-center"><Loader2 className="w-10 h-10 text-white/20 animate-spin" /></div></div>;
}

function ModuleSkeleton() {
  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3"><div className="w-4 h-4 rounded skeleton-shimmer" /><div className="h-4 w-2/3 skeleton-shimmer rounded" /><div className="h-3 w-1/2 skeleton-shimmer rounded ml-auto" /></div>
      <div className="h-3 w-10 skeleton-shimmer rounded ml-auto" />
    </div>
  );
}

// ─── Lesson type icon ───────────────────────────────────────
function LessonTypeIcon({ type }) {
  const map = { VIDEO: { Icon: Video, label: 'Video' }, TEXT: { Icon: FileText, label: 'Text' }, QUIZ: { Icon: HelpCircle, label: 'Quiz' } };
  const { Icon } = map[type] || map.VIDEO;
  return <Icon className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />;
}

// ─── Progress bar ───────────────────────────────────────────
function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs text-white/40 mb-1.5"><span>Course Progress</span><span>{completed}/{total} lessons · {pct}%</span></div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#7C3AED] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

// ─── Community Preview (embedded in CoursePlayer) ────────────
function CommunityPreview({ courseId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch(
          `/api/v1/community/posts?courseId=${courseId}&limit=3`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('nexify_token')}` } }
        );
        const data = await res.json();
        if (data.success) setPosts(data.data.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecent();
  }, [courseId]);

  if (loading) return <div className="text-xs text-white/30 py-2">Loading...</div>;
  if (posts.length === 0) return <p className="text-xs text-white/30 py-2">No discussions yet. Be the first!</p>;

  return (
    <div className="space-y-2">
      {posts.map(post => (
        <div key={post.id} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer">
          <p className="text-xs font-medium text-white/80 line-clamp-1">{post.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-white/40">{post.author?.fullName}</span>
            <span className="text-[10px] text-white/30">·</span>
            <span className="text-[10px] text-white/40">❤️ {post.likesCount || 0}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Module item ────────────────────────────────────────────
function ModuleItem({ module, completedLessons, currentLessonId, onLessonSelect, onMarkComplete }) {
  const [open, setOpen] = useState(true);
  const moduleCompleted = module.lessons?.filter(l => completedLessons.includes(l.id)).length || 0;
  const totalLessons = module.lessons?.length || 0;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-4 py-3 bg-[#0F172A] hover:bg-white/5 transition-colors text-left">
        {open ? <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />}
        <span className="flex-1 text-sm font-semibold text-white truncate">{module.title}</span>
        <span className="text-xs text-white/30 flex-shrink-0">{moduleCompleted}/{totalLessons}</span>
      </button>
      {open && (
        <div className="divide-y divide-white/5">
          {module.lessons?.map(lesson => {
            const isCompleted = completedLessons.includes(lesson.id);
            const isCurrent = lesson.id === currentLessonId;
            return (
              <div key={lesson.id} className={`flex items-center gap-2 px-4 py-2.5 transition-colors group ${isCurrent ? 'bg-[#7C3AED]/10' : 'hover:bg-white/5'}`}>
                <button onClick={() => onLessonSelect(lesson)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> : <Circle className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />}
                  <LessonTypeIcon type={lesson.type} />
                  <span className={`text-xs truncate ${isCurrent ? 'text-[#7C3AED] font-medium' : 'text-white/70'}`}>{lesson.title}</span>
                  {lesson.duration && <span className="text-xs text-white/30 flex-shrink-0">{lesson.duration}</span>}
                </button>
                {!isCompleted && (
                  <button onClick={(e) => { e.stopPropagation(); onMarkComplete(lesson.id); }}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-emerald-400 transition-all text-xs px-1.5 py-0.5 rounded bg-white/5">Done</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Video player ───────────────────────────────────────────
function YouTubeTracker({ videoUrl, onEnded }) {
  useEffect(() => {
    const id = videoUrl?.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (!id) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      new window.YT.Player(document.querySelector('iframe'), {
        events: { onStateChange: (event) => { if (event.data === window.YT.PlayerState.ENDED) onEnded?.(); } }
      });
    };
    return () => { document.body.removeChild(tag); delete window.onYouTubeIframeAPIReady; };
  }, [videoUrl, onEnded]);
  return null;
}

function VimeoTracker({ onEnded }) {
  useEffect(() => {
    const handler = (e) => { if (e.data === 5) onEnded?.(); };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onEnded]);
  return null;
}

function VideoPlayer({ lesson, onComplete }) {
  const [watched, setWatched] = useState(false);
  useEffect(() => { setWatched(false); }, [lesson?.id]);

  if (!lesson) return <div className="aspect-video bg-[#1E1B4B] border border-white/10 rounded-xl flex items-center justify-center"><p className="text-sm text-white/30">Select a lesson to begin</p></div>;

  const isYoutube = lesson.videoUrl?.includes('youtube.com') || lesson.videoUrl?.includes('youtu.be');
  const isVimeo = lesson.videoUrl?.includes('vimeo.com');
  let embedSrc = lesson.videoUrl;
  if (isYoutube) { const id = lesson.videoUrl.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)?.[1]; embedSrc = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`; }
  if (isVimeo) { const id = lesson.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1]; embedSrc = `https://player.vimeo.com/video/${id}`; }

  const handleEnded = useCallback(() => { if (!watched) { setWatched(true); onComplete?.(); } }, [watched, onComplete]);

  if (embedSrc) {
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10">
        <iframe src={embedSrc} title={lesson.title} className="w-full h-full" frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        {isYoutube && <YouTubeTracker videoUrl={lesson.videoUrl} onEnded={handleEnded} />}
        {isVimeo && <VimeoTracker onEnded={handleEnded} />}
      </div>
    );
  }

  return (
    <div className="aspect-video bg-[#1E1B4B] rounded-xl flex flex-col items-center justify-center gap-3 border border-white/10">
      <Video className="w-10 h-10 text-white/20" /><p className="text-sm text-white/30">Video content unavailable</p>
    </div>
  );
}

// ─── Text lesson ────────────────────────────────────────────
function TextLesson({ lesson, onComplete }) {
  const [read, setRead] = useState(false);
  const handleScroll = useCallback((e) => {
    if (e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50 && !read) { setRead(true); onComplete?.(); }
  }, [read, onComplete]);
  return (
    <div onScroll={handleScroll} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 text-sm text-white/70 leading-relaxed max-h-64 overflow-y-auto">
      <div dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />
    </div>
  );
}

// ─── Quiz lesson ────────────────────────────────────────────
function QuizLesson({ lesson, onComplete }) {
  const questions = lesson.quiz?.questions || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = () => { setSubmitted(true); onComplete?.(); };

  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-5 space-y-5">
      <h3 className="text-sm font-semibold text-white">Quiz</h3>
      {questions.map((q, qi) => (
        <div key={q.id || qi} className="space-y-2">
          <p className="text-xs font-medium text-white">{qi + 1}. {q.question}</p>
          <div className="space-y-1.5">
            {q.options?.map((opt, oi) => (
              <button key={oi} onClick={() => !submitted && setAnswers(a => ({ ...a, [q.id || qi]: oi }))}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors border ${(answers[q.id || qi] === oi) ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'} ${submitted ? 'pointer-events-none' : ''}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      {!submitted ? (
        <button onClick={handleSubmit} className="bg-[#7C3AED] text-black px-4 py-2 rounded-xl text-xs font-semibold hover:brightness-110 transition-all">Submit Quiz</button>
      ) : (
        <div className="flex items-center gap-2 text-xs text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" />Quiz submitted</div>
      )}
    </div>
  );
}

// ─── Prev/Next navigation ────────────────────────────────────
function LessonNav({ prev, next, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between mt-4">
      <button onClick={onPrev} disabled={!prev}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${prev ? 'bg-[#1E1B4B] border border-white/10 text-white hover:bg-white/10' : 'bg-transparent border border-white/5 text-white/20 cursor-not-allowed'}`}>
        <ChevronLeft className="w-3.5 h-3.5" />{prev ? 'Previous' : 'First Lesson'}
      </button>
      <button onClick={onNext} disabled={!next}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${next ? 'bg-[#7C3AED] text-black hover:brightness-110' : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'}`}>
        {next ? 'Next Lesson' : 'Complete!'}<ChevronRightIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Announcements Panel ─────────────────────────────────────
function AnnouncementsPanel({ announcements, courseId, api }) {
  const [form, setForm] = useState({ title: '', body: '', priority: 0 });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const isCreator = user?.role === 'CREATOR';

  const handleCreate = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/announcements', { courseId, ...form });
      setForm({ title: '', body: '', priority: 0 });
      announcements.unshift(res.data.data);
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-3">
      {isCreator && (
        <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-semibold text-white">Post Announcement</h4>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Announcement title..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Announcement body..." rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none" />
          <button onClick={handleCreate} disabled={!form.title.trim() || !form.body.trim() || submitting}
            className="w-full bg-[#7C3AED] hover:bg-[#8b5cf6] disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-xl transition-colors">
            {submitting ? 'Posting...' : 'Post to Students'}
          </button>
        </div>
      )}
      {announcements.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-xs">No announcements yet</div>
      ) : (
        announcements.map(a => (
          <div key={a.id} className={`bg-[#1E1B4B] border rounded-xl p-4 space-y-2 ${a.priority >= 5 ? 'border-amber-500/30' : 'border-white/10'}`}>
            <div className="flex items-start gap-2">
              <Bell className={`w-4 h-4 flex-shrink-0 mt-0.5 ${a.priority >= 5 ? 'text-amber-400' : 'text-white/40'}`} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white">{a.title}</h4>
                <p className="text-xs text-white/60 mt-1">{a.body}</p>
                <p className="text-[10px] text-white/30 mt-2">By {a.user?.fullName || 'Creator'} · {new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────
export default function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, token, logout, api } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(() => loadProgress(courseId));
  const [currentLesson, setCurrentLesson] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState('syllabus');
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    axios.get(`${API_BASE}/courses/${courseId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => {
        setCourse(res.data.data);
        setCurrentLesson(res.data.data.modules?.[0]?.lessons?.[0] || null);
        setLoading(false);
      })
      .catch(err => {
        if (err.response?.status === 401) { setAuthError(true); logout?.(); }
        else setError(err.response?.data?.message || 'Failed to load course');
        setLoading(false);
      });
  }, [courseId, token, logout]);

  useEffect(() => { saveProgress(courseId, completedLessons); }, [courseId, completedLessons]);

  useEffect(() => {
    if (!courseId || !token) return;
    api.get('/announcements', { params: { courseId } })
      .then(res => setAnnouncements(res.data.data || []))
      .catch(() => {});
  }, [courseId, token, api]);

  const allLessons = course?.modules?.flatMap(m => m.lessons || []) || [];
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const markComplete = useCallback((lessonId) => {
    setCompletedLessons(prev => {
      if (prev.includes(lessonId)) return prev;
      const next = [...prev, lessonId];
      setTimeout(() => { if (nextLesson) setCurrentLesson(nextLesson); }, 800);
      return next;
    });
  }, [nextLesson]);

  if (authError) return <Navigate to="/login" replace />;

  const unreadAnnouncements = announcements.filter(a => !a.read).length;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {course && allLessons.length > 0 && (
        <div className="mb-4 bg-[#1E293B] border border-white/10 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
            <span className="font-medium text-white">Course Progress</span>
            <span>{completedLessons.length}/{allLessons.length} lessons · {allLessons.length > 0 ? Math.round((completedLessons.length / allLessons.length) * 100) : 0}%</span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#7C3AED] to-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${allLessons.length > 0 ? (completedLessons.length / allLessons.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white truncate">
            {loading ? <span className="text-white/20 skeleton-shimmer inline-block w-48 h-5 rounded" /> : course?.title || 'Course Player'}
          </h1>
        </div>
        {announcements.length > 0 && (
          <button onClick={() => setActiveTab('announcements')} className="relative p-2 text-white/40 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            {unreadAnnouncements > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#7C3AED] text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadAnnouncements}</span>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" /><p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: video + content */}
        <div className="flex-1 min-w-0">
          {loading ? <VideoSkeleton /> : (
            <>
              <VideoPlayer lesson={currentLesson} onComplete={() => currentLesson && markComplete(currentLesson.id)} />

              {currentLesson && (
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">{currentLesson.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <LessonTypeIcon type={currentLesson.type} />
                      <span className="text-xs text-white/40 capitalize">{currentLesson.type?.toLowerCase()} Lesson</span>
                      {currentLesson.duration && <><span className="text-white/20">·</span><span className="text-xs text-white/40">{currentLesson.duration}</span></>}
                    </div>
                  </div>
                  {completedLessons.includes(currentLesson.id) && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" />Completed</span>
                  )}
                </div>
              )}

              {currentLesson?.type === 'TEXT' && <div className="mt-4"><TextLesson lesson={currentLesson} onComplete={() => markComplete(currentLesson.id)} /></div>}
              {currentLesson?.type === 'QUIZ' && <div className="mt-4"><QuizLesson lesson={currentLesson} onComplete={() => markComplete(currentLesson.id)} /></div>}

              {allLessons.length > 0 && completedLessons.length === allLessons.length && (
                <>
                  <Link to={`/student/course/${courseId}/certificate`}
                    className="mt-3 flex items-center justify-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-[#7C3AED] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#7C3AED]/20 transition-all">
                    <Award className="w-4 h-4" />View Certificate
                  </Link>
                  <Link to={`/student/course/${courseId}/review`}
                    className="mt-2 flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-all">
                    <Star className="w-4 h-4" />Write a Review
                  </Link>
                </>
              )}

              <LessonNav prev={prevLesson} next={nextLesson}
                onPrev={() => prevLesson && setCurrentLesson(prevLesson)}
                onNext={() => { if (nextLesson) { setCurrentLesson(nextLesson); if (!completedLessons.includes(nextLesson.id)) markComplete(nextLesson.id); } }} />
            </>
          )}
        </div>

        {/* Right: tabbed sidebar */}
        <div className="w-full lg:w-[420px] flex-shrink-0 space-y-4">
          <div className="flex items-center gap-1 bg-[#1E1B4B] border border-white/10 rounded-xl p-1">
            {[
              { key: 'syllabus', label: 'Syllabus', icon: BookOpen },
              { key: 'community', label: 'Community', icon: MessageCircle },
              { key: 'qa', label: 'Q&A', icon: HelpCircle },
              { key: 'announcements', label: 'News', icon: Bell, badge: unreadAnnouncements },
            ].map(({ key, label, icon: Icon, badge }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === key ? 'bg-[#7C3AED] text-white' : 'text-white/40 hover:text-white/70'}`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
                {badge > 0 && <span className="bg-white/20 text-white text-[9px] px-1 rounded-full">{badge}</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <><div className="skeleton-shimmer h-6 w-3/4 rounded mb-3" /><ModuleSkeleton /><ModuleSkeleton /></>
          ) : (
            <>
              {activeTab === 'syllabus' && (
                <>
                  <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4">
                    <h2 className="text-base font-bold text-white mb-1 line-clamp-2">{course.title}</h2>
                    <p className="text-xs text-white/40 mb-4 line-clamp-2">{course.description}</p>
                    <ProgressBar completed={completedLessons.length} total={allLessons.length} />
                    <div className="flex items-center gap-2 text-xs text-white/40"><span>{allLessons.length} lessons</span><span>·</span><span>{course.modules?.length} modules</span></div>
                  </div>
                  <div className="space-y-3">
                    {course.modules?.map(module => (
                      <ModuleItem key={module.id} module={module} completedLessons={completedLessons}
                        currentLessonId={currentLesson?.id} onLessonSelect={setCurrentLesson} onMarkComplete={markComplete} />
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'community' && (
                <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Course Community</h3>
                    <Link
                      to={`/student/course/${courseId}/community`}
                      className="text-xs text-[#7C3AED] hover:text-[#c4b5fd] font-medium"
                    >
                      Open Full View →
                    </Link>
                  </div>
                  <CommunityPreview courseId={courseId} />
                </div>
              )}

              {activeTab === 'qa' && currentLesson && (
                <div className="bg-[#1E1B4B] border border-white/10 rounded-xl overflow-hidden" style={{ height: '600px' }}>
                  <QAPanel lessonId={currentLesson.id} courseCreatorId={course?.creatorId} />
                </div>
              )}

              {activeTab === 'announcements' && (
                <AnnouncementsPanel announcements={announcements} courseId={courseId} api={api} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
