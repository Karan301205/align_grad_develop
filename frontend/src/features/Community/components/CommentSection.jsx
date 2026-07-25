import React, { useState, useEffect } from 'react';
import { Send, CornerDownRight, Trash2, Loader2 } from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';

function CommentItem({ comment, postId, token, currentUserId, onReplyAdded, onCommentDeleted }) {
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await apiFetch(`/community/posts/${postId}/comments`, {
        token,
        method: 'POST',
        json: {
          content: replyContent.trim(),
          parentCommentId: comment.id
        }
      });

      const data = await res.json();
      if (res.ok) {
        setReplyContent('');
        setReplying(false);
        if (onReplyAdded) onReplyAdded(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await apiFetch(`/community/comments/${comment.id}`, {
        token,
        method: 'DELETE'
      });
      if (res.ok && onCommentDeleted) {
        onCommentDeleted(comment.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-3 pt-2 text-left">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-primary/10 border border-outline-variant flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden mt-0.5">
          {comment.author?.profilePic ? (
            <img src={comment.author.profilePic} alt={comment.author.name} className="w-full h-full object-cover" />
          ) : (
            comment.author?.name?.charAt(0) || 'U'
          )}
        </div>

        <div className="flex-1 bg-surface-container-high/60 border border-outline-variant/60 rounded-xl p-3 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-on-surface">{comment.author?.name || 'User'}</span>
              <span className="text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold">
                {comment.authorRole || 'STUDENT'}
              </span>
            </div>
            {comment.authorId === currentUserId && (
              <button
                onClick={handleDelete}
                className="text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer"
                title="Delete comment"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <p className="text-on-surface whitespace-pre-wrap leading-relaxed font-sans">{comment.content}</p>

          <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-on-surface-variant">
            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
            <button
              onClick={() => setReplying(!replying)}
              className="hover:text-primary font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <CornerDownRight className="w-3 h-3" />
              Reply
            </button>
          </div>

          {/* Inline Reply Form */}
          {replying && (
            <form onSubmit={handleReplySubmit} className="pt-2 flex gap-2">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="flex-1 bg-surface-container border border-outline-variant rounded-xl px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary font-sans"
              />
              <button
                type="submit"
                disabled={!replyContent.trim() || submittingReply}
                className="px-3 py-1.5 bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-40 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1 cursor-pointer"
              >
                {submittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Recursive Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-6 border-l-2 border-outline-variant/40 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              token={token}
              currentUserId={currentUserId}
              onReplyAdded={onReplyAdded}
              onCommentDeleted={onCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId, token, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/community/posts/${postId}/comments`, { token });
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await apiFetch(`/community/posts/${postId}/comments`, {
        token,
        method: 'POST',
        json: { content: newComment.trim() }
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-4 border-t border-outline-variant/60 space-y-4 text-left">
      {/* New Root Comment Form */}
      <form onSubmit={handleCreateComment} className="flex gap-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="px-4 py-2 bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-40 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1 cursor-pointer"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Comment
        </button>
      </form>

      {/* Comment List */}
      {loading ? (
        <div className="py-4 text-center text-xs font-mono text-on-surface-variant flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-center text-xs font-mono text-on-surface-variant">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postId={postId}
              token={token}
              currentUserId={currentUserId}
              onReplyAdded={fetchComments}
              onCommentDeleted={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
