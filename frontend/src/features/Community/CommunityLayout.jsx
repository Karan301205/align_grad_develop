import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import CommunitySidebar from './components/CommunitySidebar';
import CommunityFeed from './components/CommunityFeed';
import CreateCommunityModal from './components/CreateCommunityModal';
import JoinCommunityModal from './components/JoinCommunityModal';

export default function CommunityLayout({ user, token }) {
  const [communities, setCommunities] = useState([]);
  const [activeCommunityId, setActiveCommunityId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      // 1. Fetch user profile info
      try {
        const profRes = await apiFetch('/student/profile', { token });
        if (profRes.ok) {
          const profData = await profRes.json();
          setUserProfile(profData);
        } else {
          setUserProfile(user || { name: 'User' });
        }
      } catch {
        setUserProfile(user || { name: 'User' });
      }

      // 2. Fetch accessible communities
      const commRes = await apiFetch('/community?page=1&limit=20', { token });
      const commData = await commRes.json();
      if (commRes.ok) {
        const list = commData.communities || [];
        setCommunities(list);
        if (list.length > 0 && !activeCommunityId) {
          setActiveCommunityId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading community hub:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [token]);

  const activeCommunity = communities.find(c => c.id === activeCommunityId) || communities[0];

  const filteredCommunities = communities.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
  });

  const handleCommunityCreated = (newCommunity) => {
    setCommunities(prev => [newCommunity, ...prev]);
    setActiveCommunityId(newCommunity.id);
  };

  const handleCommunityJoined = (joinedId) => {
    fetchCommunities();
    if (joinedId) setActiveCommunityId(joinedId);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Sidebar */}
          <CommunitySidebar
            communities={filteredCommunities}
            activeCommunityId={activeCommunity?.id}
            onSelectCommunity={setActiveCommunityId}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenJoinModal={() => setIsJoinModalOpen(true)}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />

          {/* Main Feed View */}
          {activeCommunity ? (
            <CommunityFeed
              community={activeCommunity}
              token={token}
              userProfile={userProfile}
              currentUserId={user?.id}
            />
          ) : (
            <div className="flex-1 py-12 text-center text-xs font-mono text-on-surface-variant bg-surface-container border border-outline-variant rounded-2xl">
              No active community selected.
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        token={token}
        onCommunityCreated={handleCommunityCreated}
      />

      <JoinCommunityModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        token={token}
        onJoined={handleCommunityJoined}
      />
    </div>
  );
}
