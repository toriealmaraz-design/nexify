/**
 * Student Community Page — Course discussion forums
 * Skool-style community feed per course
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Heart, Pin, Send, ArrowLeft, ThumbsUp, MoreHorizontal } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Posts' },
  { id: 'announcement', label: '📢 Announcements' },
  { id: 'discussion', label: '💬 Discussions' },
  { id: 'question', label: '❓ Questions' },
];

export default function Community() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '', category: 'discussion' });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [course, setCourse] = useState(null);

  useEffect(() => {
    fetchPosts();
    fetchCourse();
  }, [courseId]);

  async function fetchPosts() {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/community/posts?courseId=${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('nexify_token')}` },
      });
      const data = await res.json();
      if (data.success) setPosts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourse() {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/courses/${courseId}`);
      const data = await res.json();
      if (data.success) setCourse(data.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchComments(postId) {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/community/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('nexify_token')}` },
      });
      const data = await res.json();
      if (data.success) setComments(prev => ({ ...prev, [postId]: data.data }));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/v1/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('nexify_token')}`,
        },
        body: JSON.stringify({ courseId, ...newPost }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewPost(false);
        setNewPost({ title: '', body: '', category: 'discussion' });
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLike(postId) {
    try {
      await fetch(`http://localhost:5000/api/v1/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('nexify_token')}` },
      });
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleReply(postId) {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/api/v1/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('nexify_token')}`,
        },
        body: JSON.stringify({ body: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        setReplyingTo(null);
        fetchComments(postId);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const filteredPosts = selectedCategory === 'all'
    ? posts
    : posts.filter(p => p.category === selectedCategory);

  const pinnedPosts = filteredPosts.filter(p => p.isPinned);
  const regularPosts = filteredPosts.filter(p => !p.isPinned);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to={`/student/course/${courseId}`} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Community</h1>
            {course && <p className="text-sm text-white/50">{course.title}</p>}
          </div>
        </div>
        <button
          onClick={() => setShowNewPost(true)}
          className="px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-medium hover:brightness-110 transition-all"
        >
          New Post
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-[#7C3AED] text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-4 mb-6">
          <form onSubmit={handleCreatePost} className="space-y-3">
            <input
              type="text"
              placeholder="Post title..."
              value={newPost.title}
              onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              required
            />
            <textarea
              placeholder="What's on your mind?"
              value={newPost.body}
              onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none"
              required
            />
            <div className="flex items-center justify-between">
              <select
                value={newPost.category}
                onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none"
              >
                <option value="discussion">💬 Discussion</option>
                <option value="question">❓ Question</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowNewPost(false)} className="px-3 py-1.5 text-white/60 text-sm hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#7C3AED] text-white rounded-lg text-sm font-medium hover:brightness-110">
                  Post
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Pinned Posts */}
      {pinnedPosts.length > 0 && (
        <div className="mb-4">
          {pinnedPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onReply={() => { setReplyingTo(post.id); fetchComments(post.id); }}
              comments={comments[post.id] || []}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleReply={handleReply}
            />
          ))}
        </div>
      )}

      {/* Regular Posts */}
      {regularPosts.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No posts yet. Be the first to start a discussion!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {regularPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onReply={() => { setReplyingTo(post.id); fetchComments(post.id); }}
              comments={comments[post.id] || []}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onLike, onReply, comments, replyingTo, replyText, setReplyText, handleReply }) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="bg-[#1E293B] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-[#7C3AED]/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-[#7C3AED] text-xs font-bold">
            {post.author?.fullName?.charAt(0) || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">{post.author?.fullName || 'Anonymous'}</span>
            {post.isPinned && <Pin className="w-3 h-3 text-amber-400" />}
            <span className="text-xs text-white/30">·</span>
            <span className="text-xs text-white/40">{new Date(post.createdAt).toLocaleDateString()}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              post.category === 'announcement' ? 'bg-amber-500/20 text-amber-400' :
              post.category === 'question' ? 'bg-sky-500/20 text-sky-400' :
              'bg-white/10 text-white/60'
            }`}>
              {post.category}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{post.title}</h3>
          {post.body && <p className="text-sm text-white/60 mb-3">{post.body}</p>}
          <div className="flex items-center gap-4">
            <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-red-400 transition-colors">
              <Heart className="w-3.5 h-3.5" fill={post.isLiked ? 'currentColor' : 'none'} />
              {post.likesCount || 0}
            </button>
            <button onClick={() => { setShowComments(!showComments); onReply(); }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#7C3AED] transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              {comments.length || post.commentsCount || 0}
            </button>
          </div>

          {/* Comments */}
          {showComments && comments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
              {comments.map(comment => (
                <div key={comment.id} className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white/60 text-[10px] font-bold">
                      {comment.author?.fullName?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-white/80">{comment.author?.fullName}</span>
                    <p className="text-xs text-white/50">{comment.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply Input */}
          {replyingTo === post.id && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
              <button onClick={() => handleReply(post.id)} className="px-3 py-1.5 bg-[#7C3AED] text-white rounded-lg text-xs hover:brightness-110">
                <Send className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
