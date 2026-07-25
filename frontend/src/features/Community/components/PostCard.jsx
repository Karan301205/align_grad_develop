import React, { useState, useEffect } from 'react';
import { ThumbsUp, Heart, Sparkles, Lightbulb, Handshake, Smile, MessageSquare, Bookmark, Eye, MoreVertical, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import CommentSection from './CommentSection';

const REACTION_CONFIG = [
  { type: 'LIKE', label: 'Like', icon: '👍', color: 'text-blue-600' },
  { type: 'LOVE', label: 'Love', icon: '❤️', color: 'text-rose-600' },
  { type: 'CELEBRATE', label: 'Celebrate', icon: '👏', color: 'text-emerald-600' },
  { type: 'INSIGHTFUL', label: 'Insightful', icon: '💡', color: 'text-amber-600' },
  { type: 'SUPPORT', label: 'Support', icon: '🤝', color: 'text-purple-600' },
  { type: 'FUNNY', label: 'Funny', icon: '😂', color: 'text-yellow-600' }
];

export default function PostCard({ post, token, currentUserId, onPostDeleted }) {
  const [reactionsCount, setReactionsCount] = useState(post.reactionsCount || 0);
  const [reactionsByType, setReactionsByType] = useState(post.reactionsByType || {});
  const [userReaction, setUserReaction] = useState(post.userReaction || null);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [uniqueViewsCount, setUniqueViewsCount] = useState(post.uniqueViewsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Record unique view on mount
  useEffect(() => {
    const recordView = async () => {
      try {
        const res = await apiFetch(`/community/posts/${post.id}/view`, {
          token,
          method: 'POST'
        });
        const data = await res.json();
        if (res.ok && data.isNewView) {
          setUniqueViewsCount(prev => prev + 1);
        }
      } catch (err) {
        console.error(err);
      }
    };
    recordView();
  }, [post.id, token]);

  const handleToggleReaction = async (reactionType) => {
    setShowReactionPicker(false);
    try {
      const res = await apiFetch(`/community/posts/${post.id}/react`, {
        token,
        method: 'POST',
        json: { type: reactionType }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.action === 'added') {
          setReactionsCount(prev => prev + 1);
          setUserReaction(data.type);
        } else if (data.action === 'removed') {
          setReactionsCount(prev => Math.max(0, prev - 1));
          setUserReaction(null);
        } else if (data.action === 'updated') {
          setUserReaction(data.type);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      const res = await apiFetch(`/community/posts/${post.id}/bookmark`, {
        token,
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setIsSaved(data.isSaved);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await apiFetch(`/community/posts/${post.id}`, {
        token,
        method: 'DELETE'
      });
      if (res.ok && onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentReactionObj = REACTION_CONFIG.find(r => r.type === userReaction);

  return (
    <article className="bg-surface-container border border-outline-variant rounded-2xl p-5 shadow-xs space-y-4 text-left">
      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-outline-variant flex items-center justify-center text-primary font-bold text-sm shrink-0 overflow-hidden">
            {post.author?.profilePic ? (
              <img src={post.author.profilePic} alt={post.author.name} className="w-full h-full object-cover" />
            ) : (
              post.author?.name?.charAt(0) || 'U'
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-on-surface">{post.author?.name || 'Community Member'}</h4>
              <span className="text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold uppercase">
                {post.author?.role || 'STUDENT'}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">
              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {post.edited && <span className="ml-1 text-[9px] text-on-surface-variant font-bold">(edited)</span>}
            </p>
          </div>
        </div>

        {/* Post Actions Menu */}
        {post.authorId === currentUserId && (
          <button
            onClick={handleDeletePost}
            className="p-1.5 text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-surface-container-high cursor-pointer"
            title="Delete Post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Post Text Content */}
      <div className="text-xs md:text-sm text-on-surface whitespace-pre-wrap leading-relaxed font-sans">
        {post.content}
      </div>

      {/* Media Attachments Display */}
      {post.media && post.media.length > 0 && (
        <div className="space-y-2 pt-1">
          {/* Images Grid */}
          {post.postType === 'IMAGE' || post.postType === 'MULTI_IMAGE' ? (
            <div className={`grid gap-2 rounded-xl overflow-hidden ${
              post.media.length === 1 ? 'grid-cols-1' : post.media.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'
            }`}>
              {post.media.map((med) => (
                <div key={med.id} className="relative aspect-video bg-surface-container-high rounded-xl overflow-hidden border border-outline-variant">
                  <img src={med.url} alt="Post media" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}

          {/* Video Attachment */}
          {post.postType === 'VIDEO' && post.media[0] && (
            <div className="rounded-xl overflow-hidden border border-outline-variant bg-black">
              <video src={post.media[0].url} controls className="w-full max-h-96 object-contain" />
            </div>
          )}

          {/* PDF Attachment */}
          {post.postType === 'PDF' && post.media[0] && (
            <a
              href={post.media[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-xl flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">Attached PDF Document</p>
                  <p className="text-[10px] font-mono text-on-surface-variant">Click to open & view document</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-primary">&rarr;</span>
            </a>
          )}
        </div>
      )}

      {/* Engagement Stats Readout */}
      <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-on-surface-variant border-t border-outline-variant/40">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">👍</span>
          <span className="font-bold">{reactionsCount} reactions</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowComments(!showComments)} className="hover:underline cursor-pointer">
            {post.commentsCount || 0} comments
          </button>
          <span className="flex items-center gap-1 text-on-surface-variant font-bold">
            <Eye className="w-3 h-3" />
            {uniqueViewsCount} views
          </span>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60 relative">
        {/* Hover Reaction Picker Modal */}
        {showReactionPicker && (
          <div className="absolute left-0 -top-12 bg-surface-container-high border border-outline-variant p-1.5 rounded-2xl shadow-xl flex items-center gap-1 z-30 animate-fade-in">
            {REACTION_CONFIG.map((r) => (
              <button
                key={r.type}
                onClick={() => handleToggleReaction(r.type)}
                className="w-8 h-8 hover:scale-125 transition-transform flex items-center justify-center text-base cursor-pointer"
                title={r.label}
              >
                {r.icon}
              </button>
            ))}
          </div>
        )}

        {/* Reaction Action Trigger */}
        <div className="relative">
          <button
            onClick={() => handleToggleReaction(userReaction || 'LIKE')}
            onMouseEnter={() => setShowReactionPicker(true)}
            className={`px-3 py-1.5 hover:bg-surface-container-high rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentReactionObj ? currentReactionObj.color : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span>{currentReactionObj ? currentReactionObj.icon : '👍'}</span>
            <span>{currentReactionObj ? currentReactionObj.label : 'Like'}</span>
          </button>
        </div>

        {/* Comment Trigger */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="px-3 py-1.5 hover:bg-surface-container-high rounded-xl text-xs font-mono text-on-surface-variant hover:text-primary font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Comment
        </button>

        {/* Bookmark Save Trigger */}
        <button
          onClick={handleToggleBookmark}
          className={`px-3 py-1.5 hover:bg-surface-container-high rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            isSaved ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-primary' : ''}`} />
          {isSaved ? 'Saved' : 'Bookmark'}
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <CommentSection
          postId={post.id}
          token={token}
          currentUserId={currentUserId}
        />
      )}
    </article>
  );
}
