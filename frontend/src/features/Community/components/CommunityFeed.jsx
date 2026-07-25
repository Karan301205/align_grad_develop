import React, { useState, useEffect } from 'react';
import { Globe, Lock, Share2, Users, Loader2, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import PostComposer from './PostComposer';
import PostCard from './PostCard';

export default function CommunityFeed({ community, token, userProfile, currentUserId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchFeed = async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await apiFetch(`/community/${community.id}/feed?page=${pageNum}&limit=10`, { token });
      const data = await res.json();
      if (res.ok) {
        const newPosts = data.posts || [];
        if (append) {
          setPosts(prev => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }
        setHasMore(newPosts.length === 10);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (community?.id) {
      setPage(1);
      fetchFeed(1, false);
      setInviteToken('');
      setCopied(false);
    }
  }, [community?.id]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, true);
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts(prev => prev.filter(p => p.id !== deletedPostId));
  };

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    try {
      const res = await apiFetch(`/community/${community.id}/invite`, {
        token,
        method: 'POST',
        json: { expiresInHours: 72 }
      });
      const data = await res.json();
      if (res.ok) {
        setInviteToken(data.token);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCopyInvite = () => {
    if (!inviteToken) return;
    navigator.clipboard.writeText(inviteToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isGlobal = community?.type === 'GLOBAL';
  const isAdminOrOwner = community?.role === 'OWNER' || community?.role === 'ADMIN';

  return (
    <main className="flex-1 space-y-6">
      {/* Community Banner & Header Details */}
      <div className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-xs space-y-0 text-left">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-primary/30 via-secondary-container/50 to-primary/20 relative">
          {community?.banner && (
            <img src={community.banner} alt="Banner" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Info Content */}
        <div className="p-6 relative pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-surface-container-lowest border-2 border-outline-variant flex items-center justify-center text-primary font-bold text-2xl shadow-md overflow-hidden shrink-0">
              {community?.logo ? (
                <img src={community.logo} alt={community.name} className="w-full h-full object-cover" />
              ) : isGlobal ? (
                <Globe className="w-8 h-8" />
              ) : (
                community?.name?.charAt(0) || 'C'
              )}
            </div>

            {/* Invite Button for Admins */}
            {!isGlobal && isAdminOrOwner && (
              <div className="flex items-center gap-2">
                {!inviteToken ? (
                  <button
                    onClick={handleGenerateInvite}
                    disabled={generatingInvite}
                    className="py-2 px-3.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {generatingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5 text-primary" />}
                    Invite Members
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-surface-container-high border border-outline-variant p-1 rounded-xl">
                    <span className="text-[10px] font-mono px-2 text-primary font-bold truncate max-w-[120px]">{inviteToken}</span>
                    <button
                      onClick={handleCopyInvite}
                      className="px-2 py-1 bg-primary text-on-primary rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-headline font-bold text-primary">{community?.name}</h2>
              {isGlobal ? (
                <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono font-bold rounded-full">
                  Global Ecosystem
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Private Network
                </span>
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed max-w-2xl">
              {community?.description || 'Collaborate, share tech insights, and engage with verified engineers.'}
            </p>
          </div>
        </div>
      </div>

      {/* Rich Post Composer */}
      <PostComposer
        token={token}
        communityId={community?.id}
        onPostCreated={handlePostCreated}
        userProfile={userProfile}
      />

      {/* Feed Posts Stream */}
      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-on-surface-variant flex items-center justify-center gap-2 bg-surface-container border border-outline-variant rounded-2xl">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Loading community feed...
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-3 bg-surface-container border border-outline-variant rounded-2xl text-left">
          <div className="w-12 h-12 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mx-auto text-on-surface-variant">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <p className="font-bold text-on-surface text-sm text-center">No posts in this feed yet</p>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto text-center font-mono">
            Be the first to start the discussion! Share code proficiencies, career updates, or technical insights above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              token={token}
              currentUserId={currentUserId}
              onPostDeleted={handlePostDeleted}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-xs font-mono font-bold text-on-surface rounded-xl transition-all cursor-pointer shadow-xs"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Load More Posts'}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
