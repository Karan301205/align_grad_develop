import { useCallback, useEffect, useState } from 'react';
import { SERVER_MESSAGE, apiFetch, userMessage } from '../../../services/apiClient';
import GigsDirectory from './GigsDirectory';
import GigWorkspace from './GigWorkspace';
import PostGigPage from './PostGigPage';
import { newestFirst } from './gigsData';

/**
 * Recruiter Gigs. One sidebar entry; `view` (kept by the layout so it survives tab
 * switches) is 'list' (all gigs), 'post' (Post a gig), 'edit' (edit the open gig)
 * or 'workspace' (one gig: chat, submissions, pitches).
 * Data: GET /gigs/my-gigs, keeping the gigs this recruiter owns.
 */
export default function GigsPage({ view, onView, selectedGigId, onSelectGig, user, company, token, setAlertConfig }) {
  const [list, setList] = useState({ gigs: [], loaded: false, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/gigs/my-gigs', { token });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
      const ownIds = [user?.id, company?.id, company?.userId].filter(Boolean);
      const gigs = (Array.isArray(body) ? body : []).filter((g) => ownIds.includes(g.ownerId)).sort(newestFirst);
      setList({ gigs, loaded: true, error: null });
    } catch (err) {
      setList((prev) => ({ ...prev, loaded: true, error: userMessage(err) }));
    }
  }, [token, user?.id, company?.id, company?.userId]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openGig = (id) => {
    onSelectGig(id);
    onView('workspace');
  };

  if (view === 'post' || (view === 'edit' && editing)) {
    return (
      <PostGigPage
        key={view === 'edit' ? `edit-${editing.id}` : 'new'}
        gig={view === 'edit' ? editing : null}
        company={company}
        user={user}
        token={token}
        setAlertConfig={setAlertConfig}
        onCancel={() => onView(view === 'edit' ? 'workspace' : 'list')}
        onSaved={async (saved) => {
          setEditing(null);
          await load();
          openGig(saved.id);
        }}
      />
    );
  }

  if ((view === 'workspace' || view === 'edit') && selectedGigId) {
    return (
      <GigWorkspace
        gigs={list.gigs}
        selectedId={selectedGigId}
        onSelect={onSelectGig}
        onBack={() => onView('list')}
        onNew={() => onView('post')}
        onEdit={(gig) => {
          setEditing(gig);
          onView('edit');
        }}
        onListChanged={load}
        user={user}
        token={token}
        setAlertConfig={setAlertConfig}
      />
    );
  }

  return (
    <GigsDirectory
      gigs={list.gigs}
      loading={!list.loaded}
      loadError={list.error}
      refreshing={refreshing}
      onRetry={refresh}
      onOpen={(gig) => openGig(gig.id)}
      onNew={() => onView('post')}
    />
  );
}
