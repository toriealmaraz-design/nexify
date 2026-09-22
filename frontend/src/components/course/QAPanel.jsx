/**
 * QAPanel — Lesson Q&A Component
 * Students ask questions per lesson; creators and other students answer.
 * Shows in the CoursePlayer sidebar or tab.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, Send, ChevronUp, CheckCircle2, Clock, User } from 'lucide-react';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Avatar({ user, size = 'sm' }) {
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm';
  if (user?.avatarUrl) return <img src={user.avatarUrl} alt={user.fullName} className={`${cls} rounded-full object-cover flex-shrink-0`} />;
  return <div className={`${cls} rounded-full bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center font-semibold flex-shrink-0`}>{user?.fullName?.charAt(0) || '?'}</div>;
}

function QuestionCard({ question, currentUserId, onAnswer, onUpvote, onResolve, isCreator, api }) {
  const [answering, setAnswering] = useState(false);
  const [answerBody, setAnswerBody] = useState('');

  const handleSubmitAnswer = async () => {
    if (!answerBody.trim()) return;
    try {
      await api.post(`/questions/${question.id}/answers`, { body: answerBody });
      setAnswerBody('');
      setAnswering(false);
      onAnswer();
    } catch {}
  };

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar user={question.user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold text-white">{question.user?.fullName || 'Unknown'}</span>
            {question.resolved && <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" />Resolved</span>}
            <span className="text-[10px] text-white/30 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(question.createdAt)}</span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">{question.body}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pl-10">
        <button onClick={() => onUpvote(question.id)} className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors">
          <ChevronUp className="w-3.5 h-3.5" />{question.upvotes || 0}
        </button>
        <button onClick={() => setAnswering(a => !a)} className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors">
          <MessageCircle className="w-3.5 h-3.5" />{question._count?.answers || question.answers?.length || 0} answers
        </button>
        {isCreator && (
          <button onClick={() => onResolve(question.id)} className={`flex items-center gap-1 text-[11px] transition-colors ${question.resolved ? 'text-emerald-400' : 'text-white/40 hover:text-emerald-400'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />{question.resolved ? 'Resolved' : 'Mark resolved'}
          </button>
        )}
      </div>

      {/* Answers */}
      {answering && (
        <div className="pl-10 space-y-3">
          {(question.answers || []).map(ans => (
            <div key={ans.id} className={`flex items-start gap-2.5 p-3 rounded-xl ${ans.isOfficial ? 'bg-[#7C3AED]/10 border border-[#7C3AED]/20' : 'bg-white/5'}`}>
              <Avatar user={ans.user} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-white">{ans.user?.fullName || 'Unknown'}</span>
                  {ans.isOfficial && <span className="text-[10px] bg-[#7C3AED]/20 text-[#7C3AED] px-1.5 py-0.5 rounded-full font-medium">Creator</span>}
                  <span className="text-[10px] text-white/30">{timeAgo(ans.createdAt)}</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">{ans.body}</p>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-2">
            <Avatar user={currentUserId} />
            <div className="flex-1 flex gap-2">
              <textarea
                value={answerBody}
                onChange={e => setAnswerBody(e.target.value)}
                placeholder="Write your answer..."
                rows={2}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none"
              />
              <button onClick={handleSubmitAnswer} disabled={!answerBody.trim()} className="self-end bg-[#7C3AED] hover:bg-[#8b5cf6] disabled:opacity-40 text-white px-3 py-2 rounded-xl transition-colors">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QAPanel({ lessonId, courseCreatorId, onClose }) {
  const { api, user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQ, setNewQ] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isCreator = user?.id === courseCreatorId;

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/questions', { params: { lessonId } });
      setQuestions(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (lessonId) fetchQuestions(); }, [lessonId]);

  const handleAsk = async () => {
    if (!newQ.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/questions', { lessonId, body: newQ });
      setNewQ('');
      fetchQuestions();
    } catch {} finally { setSubmitting(false); }
  };

  const handleUpvote = async (id) => {
    try {
      await api.put(`/questions/${id}/upvote`);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, upvotes: (q.upvotes || 0) + 1 } : q));
    } catch {}
  };

  const handleResolve = async (id) => {
    try {
      await api.put(`/questions/${id}/resolve`);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, resolved: !q.resolved } : q));
    } catch {}
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><MessageCircle className="w-4 h-4" />Questions & Answers</h3>
        {onClose && <button onClick={onClose} className="text-white/30 hover:text-white text-xl leading-none">&times;</button>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="bg-white/5 rounded-xl h-24 animate-pulse" />)}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-white/30 text-sm">No questions yet. Be the first to ask!</div>
        ) : (
          questions.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              currentUserId={user}
              isCreator={isCreator}
              api={api}
              onAnswer={fetchQuestions}
              onUpvote={handleUpvote}
              onResolve={handleResolve}
            />
          ))
        )}
      </div>

      <div className="p-4 border-t border-white/5">
        <div className="flex gap-2">
          <textarea
            value={newQ}
            onChange={e => setNewQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
            placeholder="Ask a question... (Enter to send)"
            rows={2}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none"
          />
          <button onClick={handleAsk} disabled={!newQ.trim() || submitting}
            className="bg-[#7C3AED] hover:bg-[#8b5cf6] disabled:opacity-40 text-white px-4 py-2 rounded-xl transition-colors self-end flex items-center gap-1.5 text-xs font-medium">
            <Send className="w-3.5 h-3.5" />Ask
          </button>
        </div>
      </div>
    </div>
  );
}
