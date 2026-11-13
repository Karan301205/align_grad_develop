import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock, MessageSquare, Paperclip, Plus, Search, Users, Wallet } from 'lucide-react';
import { SERVER_MESSAGE, apiFetch, userMessage } from '../../../services/apiClient';
import CandidateProfileModal from '../components/CandidateProfileModal';
import { Spinner } from '../components/AccountControls';
import { MUTED, PAGE_GLOW, SECONDARY_BUTTON } from '../components/accountStyles';
import Dialog, { ConfirmDialog } from '../jobs/components/Dialog';
import JobActionsMenu from '../jobs/components/JobActionsMenu';
import {
  STATUS_FILTERS,
  canDelete,
  canEdit,
  categoryLine,
  createdLabel,
  deliveryLabel,
  fileNameOf,
  gigMatches,
  hiredIds,
  money,
  personFor,
  safeLink,
  statusActions,
  statusOf
} from './gigsData';
import GigChat from './components/GigChat';
import GigSubmissions from './components/GigSubmissions';
import TalentPanel, { PitchDialog } from './components/TalentPanel';

const DETAILS_POLL_MS = 15000; // new pitches, submissions and status changes
const PANEL = 'flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[16px] border border-[#E4E6EA] bg-white';
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6]';

function StatusPill({ gig, inverted }) {
  const s = statusOf(gig);
  return (
    <span className={`inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-[0.06em] ${inverted ? 'bg-white/15 text-white' : s.pill}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

function GigList({ gigs, selectedId, onSelect, onBack, onNew }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const counts = useMemo(() => {
    const c = { ALL: gigs.length };
    gigs.forEach((g) => {
      c[g.status] = (c[g.status] || 0) + 1;
    });
    return c;
  }, [gigs]);
  const visible = gigs.filter((g) => (filter === 'ALL' || g.status === filter) && gigMatches(g, query));

  return (
    <section aria-label="All hosted gigs" className={`${PANEL} max-h-[480px] lg:max-h-none`}>
      <header className="shrink-0 border-b border-[#E4E6EA] px-[18px] pb-3.5 pt-4">
        <button type="button" onClick={onBack} className={`mb-2 inline-flex items-center gap-1.5 rounded-[4px] text-[13px] font-semibold text-[#1447E6] hover:underline ${FOCUS}`}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All gigs
        </button>
        <div className="flex items-center justify-between gap-2.5">
          <h2 className="m-0 flex items-center gap-2.5 text-[17px]">
            <span className="font-bold">All hosted gigs</span>
            <span className="grid h-[22px] min-w-[26px] place-items-center rounded-full bg-[#EEF2FE] px-2 text-xs font-bold text-[#1447E6]">{gigs.length}</span>
          </h2>
          <button type="button" onClick={onNew} aria-label="Post a new gig" className={`flex size-[38px] items-center justify-center rounded-[8px] bg-[#1447E6] text-white hover:bg-[#0F38B8] ${FOCUS}`}>
            <Plus className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
        <label className={`mt-3.5 flex h-10 items-center gap-2 rounded-[10px] border border-[#E4E6EA] bg-[#F8F8F6] px-3 focus-within:border-[#1447E6] focus-within:bg-white ${MUTED}`}>
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input type="search" aria-label="Search gigs" placeholder="Search by title or category" value={query} onChange={(event) => setQuery(event.target.value)} className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-[#0F172A] placeholder:text-[#6B7280] focus:outline-none" />
        </label>
        <div role="group" aria-label="Filter by status" className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {STATUS_FILTERS.filter(([value]) => value === 'ALL' || counts[value]).map(([value, label]) => {
            const on = filter === value;
            return (
              <button key={value} type="button" aria-pressed={on} onClick={() => setFilter(value)} className={`inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full border px-[11px] text-[13px] font-semibold ${FOCUS} ${on ? 'border-[#1447E6] bg-[#1447E6] text-white' : 'border-[#E4E6EA] bg-white text-[#4B5563] hover:bg-[#F8F8F6]'}`}>
                {label} <b className={on ? 'text-white' : 'text-[#0F172A]'}>{counts[value] || 0}</b>
              </button>
            );
          })}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-[#FBFBFA] p-3">
        {visible.length === 0 ? (
          <p className={`m-auto px-4 py-6 text-center ${MUTED}`}>No gigs match.</p>
        ) : (
          visible.map((g) => {
            const on = g.id === selectedId;
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(g.id)}
                className={`flex w-full shrink-0 flex-col gap-2.5 rounded-[14px] border p-3.5 text-left transition-shadow ${FOCUS} ${on ? 'border-[#1447E6] bg-[#1447E6] text-white shadow-md' : 'border-[#E4E6EA] bg-white text-[#0F172A] hover:border-[#C7D3FB] hover:shadow-sm'}`}
              >
                <span className="flex min-w-0 items-start justify-between gap-2.5">
                  <span className="min-w-0 truncate text-[15px] font-bold leading-tight">{g.title}</span>
                  <StatusPill gig={g} inverted={on} />
                </span>
                <span className={`-mt-1.5 truncate text-[12.5px] ${on ? 'text-white/75' : MUTED}`}>{categoryLine(g)}</span>
                <span className={`grid grid-cols-2 gap-x-3 gap-y-2.5 border-t pt-3 ${on ? 'border-white/20' : 'border-[#E4E6EA]'}`}>
                  {[
                    ['Budget', money(g.budget, g.currency)],
                    ['Delivery', deliveryLabel(g.deliveryTime)],
                    ['Pitches', (g.applicants || []).length],
                    ['Assigned', `${hiredIds(g).length} talent`]
                  ].map(([label, value]) => (
                    <span key={label} className="min-w-0">
                      <span className={`block text-[11px] font-semibold tracking-[0.03em] ${on ? 'text-white/75' : MUTED}`}>{label}</span>
                      <span className="block truncate text-sm font-bold">{value}</span>
                    </span>
                  ))}
                </span>
              </button>
            );
          })
        )}
      </div>
      <footer className={`shrink-0 border-t border-[#E4E6EA] px-4 py-3 text-[13px] ${MUTED}`}>
        Showing {visible.length} of {gigs.length} gig{gigs.length === 1 ? '' : 's'}
      </footer>
    </section>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[12px] bg-[#F8F8F6] px-3.5 py-3">
      <span className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${MUTED}`}>
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </span>
      <span className="truncate text-[17px] font-bold">{value}</span>
    </div>
  );
}

function BriefDialog({ gig, onClose }) {
  const files = (gig.attachments || []).map(safeLink).filter(Boolean);
  const questions = gig.screeningQuestions || [];
  return (
    <Dialog title={gig.title} subtitle={categoryLine(gig)} onClose={onClose} width="max-w-xl">
      <p className="m-0 whitespace-pre-wrap break-words">{gig.description}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <span>
          <span className={MUTED}>Budget </span>
          <b>{money(gig.budget, gig.currency)}</b>
        </span>
        <span>
          <span className={MUTED}>Deliver within </span>
          <b>{deliveryLabel(gig.deliveryTime)}</b>
        </span>
      </div>
      {(gig.requirements || []).length > 0 && (
        <div className="flex flex-col gap-1.5">
          <b className="text-sm">Skills</b>
          <div className="flex flex-wrap gap-1.5">
            {gig.requirements.map((req) => (
              <span key={req.skillName} className="rounded-[6px] bg-[#F1F3F6] px-2 py-0.5 text-xs font-medium text-[#334155]">
                {req.minRating > 1 ? `${req.skillName} ≥ ${req.minRating}` : req.skillName}
              </span>
            ))}
          </div>
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <b className="text-sm">Files</b>
          {files.map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 self-start font-semibold text-[#1447E6] hover:underline">
              <Paperclip className="size-4" aria-hidden="true" />
              {fileNameOf(url)}
            </a>
          ))}
        </div>
      )}
      {questions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <b className="text-sm">Questions with each pitch</b>
          <ol className="m-0 flex flex-col gap-1 pl-5">
            {questions.map((q) => (
              <li key={q.id || q.question}>
                {q.question} <span className={`text-[13px] ${MUTED}`}>· {q.type === 'MCQ' ? 'multiple choice' : 'written answer'}{q.required === false ? ', optional' : ''}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Dialog>
  );
}

/**
 * Gig workspace (design: design/gigs_recruiter/gig-workspace.html): all hosted gigs
 * on the left, the open gig with its private chats and submissions in the middle,
 * hired freelancers and pitches waiting for review on the right.
 * Data: GET /gigs/:id (re-read every 15 s while the tab is visible) and the chat
 * endpoints through GigChat.
 */
export default function GigWorkspace({ gigs, selectedId, onSelect, onBack, onNew, onEdit, onListChanged, user, candidates = [], token, setAlertConfig }) {
  const [details, setDetails] = useState({ id: null, gig: null, error: null });
  const [tab, setTab] = useState('messages');
  const [partnerFor, setPartnerFor] = useState({ gigId: null, id: null });
  const [dialog, setDialog] = useState(null); // { kind: 'hire'|'pass'|'pitch'|'brief'|'delete'|'close', app? }
  const [busyId, setBusyId] = useState(null);
  const [profile, setProfile] = useState(null);

  const summary = gigs.find((g) => g.id === selectedId) || null;
  const gig = details.id === selectedId ? details.gig : null;
  const loadError = details.id === selectedId ? details.error : null;

  const load = useCallback(async () => {
    if (!selectedId) return;
    const id = selectedId;
    try {
      const res = await apiFetch(`/gigs/${id}`, { token });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
      setDetails((prev) => (prev.id === id || !prev.id || id === selectedId ? { id, gig: body, error: null } : prev));
    } catch (err) {
      setDetails((prev) => ({ id, gig: prev.id === id ? prev.gig : null, error: userMessage(err) }));
    }
  }, [selectedId, token]);

  // Re-read the gig while it is open and the tab is visible (new pitches, submissions).
  useEffect(() => {
    if (!selectedId) return undefined;
    let timer = null;
    let stopped = false;
    const run = async () => {
      if (!document.hidden) await load();
      if (!stopped) timer = setTimeout(run, DETAILS_POLL_MS);
    };
    timer = setTimeout(run, 0);
    const onVisibility = () => {
      if (!document.hidden) load();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [selectedId, load]);

  const hired = gig ? hiredIds(gig) : [];
  const partnerId = partnerFor.gigId === selectedId && hired.includes(partnerFor.id) ? partnerFor.id : hired[0] || null;
  const canHire = gig && gig.status !== 'CLOSED' && gig.status !== 'COMPLETED';

  const refresh = async () => {
    await load();
    onListChanged();
  };

  const post = async (path, json, method = 'POST') => {
    const res = await apiFetch(path, { token, method, json });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
    return body;
  };

  const decide = async (kind, app) => {
    const name = (app.candidate || personFor(gig, app.candidateId)).name;
    setBusyId(app.candidateId);
    try {
      await post(`/gigs/${gig.id}/${kind === 'hire' ? 'hire' : 'reject'}`, { candidateId: app.candidateId });
      setAlertConfig({ message: kind === 'hire' ? `${name} is hired. You can chat with them in Messages.` : `You passed on ${name}’s pitch.`, type: 'success' });
      setDialog(null);
      if (kind === 'hire') {
        setPartnerFor({ gigId: gig.id, id: app.candidateId });
        setTab('messages');
      }
      await refresh();
    } catch (err) {
      setAlertConfig({ message: userMessage(err), type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const changeStatus = async (status) => {
    setBusyId('status');
    try {
      await post(`/gigs/${gig.id}/status`, { status }, 'PATCH');
      setAlertConfig({ message: `Gig ${status === 'PAUSED' ? 'paused' : status === 'CLOSED' ? 'closed' : 'reopened'}.`, type: 'success' });
      setDialog(null);
      await refresh();
    } catch (err) {
      setAlertConfig({ message: userMessage(err), type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    setBusyId('delete');
    try {
      await post(`/gigs/${gig.id}`, undefined, 'DELETE');
      setAlertConfig({ message: `“${gig.title}” was deleted.`, type: 'success' });
      setDialog(null);
      onListChanged();
      onBack();
    } catch (err) {
      setAlertConfig({ message: userMessage(err), type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const openProfile = (candidateId) => {
    const full = candidates.find((c) => c.userId === candidateId || c.id === candidateId);
    const person = personFor(gig, candidateId);
    setProfile(full || { id: candidateId, name: person.name, username: person.username, profilePic: person.avatar, bio: person.bio });
  };

  const menu = gig
    ? [
        { id: 'brief', label: 'View brief', onSelect: () => setDialog({ kind: 'brief' }) },
        ...statusActions(gig).map(([status, label]) => ({
          id: status,
          label,
          onSelect: () => (status === 'CLOSED' ? setDialog({ kind: 'close' }) : changeStatus(status))
        })),
        canDelete(gig) && { id: 'delete', label: 'Delete gig', danger: true, onSelect: () => setDialog({ kind: 'delete' }) }
      ].filter(Boolean)
    : [];

  return (
    <div className={`min-h-full ${PAGE_GLOW} font-(family-name:--font-headline) text-sm text-[#0F172A] antialiased`}>
      <div className="grid gap-4 px-4 py-5 sm:px-6 lg:h-screen lg:grid-cols-[236px_minmax(0,1fr)_248px] xl:grid-cols-[252px_minmax(0,1fr)_268px]">
        <GigList gigs={gigs} selectedId={selectedId} onSelect={onSelect} onBack={onBack} onNew={onNew} />

        <section aria-label="Selected gig" aria-busy={!gig && !loadError} className={`${PANEL} min-h-[640px] lg:min-h-0`}>
          {!summary && !gig ? (
            <div className={`m-auto max-w-[360px] p-8 text-center ${MUTED}`}>
              <b className="block text-[17px] text-[#0F172A]">This gig isn’t in your list</b>
              It may have been deleted.
            </div>
          ) : loadError && !gig ? (
            <div role="alert" className="m-auto flex max-w-[360px] flex-col items-center gap-3 p-8 text-center">
              <span className="text-[#B91C1C]">Couldn’t open this gig. {loadError}</span>
              <button type="button" onClick={load} className={`${SECONDARY_BUTTON} h-9 px-3`}>
                Try again
              </button>
            </div>
          ) : !gig ? (
            <div className={`m-auto flex items-center gap-2 ${MUTED}`}>
              <Spinner className="border-[#1447E6]" />
              Opening {summary?.title}…
            </div>
          ) : (
            <>
              <div className="shrink-0 px-6 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className={`flex flex-wrap items-center gap-2.5 text-[13px] ${MUTED}`}>
                      <StatusPill gig={gig} />
                      <span>
                        {categoryLine(gig)} · Created {createdLabel(gig)}
                      </span>
                    </div>
                    <h1 className="m-0 mt-2.5 break-words text-2xl leading-tight">
                      <span className="font-bold">{gig.title}</span>
                    </h1>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit(gig) && (
                      <button type="button" onClick={() => onEdit(gig)} className={`${SECONDARY_BUTTON} h-10 px-4`}>
                        Edit
                      </button>
                    )}
                    <JobActionsMenu label={`More actions for ${gig.title}`} items={menu} />
                  </div>
                </div>
                {loadError && (
                  <p role="status" className="m-0 mt-2 text-[13px] text-[#9A6312]">
                    Showing the last loaded details. {loadError}
                  </p>
                )}
                <div className="mt-[18px] grid grid-cols-2 gap-2.5 xl:grid-cols-4">
                  <Metric icon={Wallet} label="Budget" value={money(gig.budget, gig.currency)} />
                  <Metric icon={Clock} label="Delivery" value={deliveryLabel(gig.deliveryTime)} />
                  <Metric icon={MessageSquare} label="Pitches received" value={(gig.applicants || []).length} />
                  <Metric icon={Users} label="Assigned" value={`${hired.length} talent`} />
                </div>
              </div>
              <div role="tablist" aria-label="Gig communication" className="mt-[18px] flex shrink-0 gap-1.5 border-b border-[#E4E6EA] px-6">
                {[
                  ['messages', 'Messages', (gig.messages || []).length],
                  ['submissions', 'Submissions', (gig.submissions || []).length]
                ].map(([id, label, count]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ${FOCUS} ${tab === id ? 'border-[#1447E6] text-[#1447E6]' : 'border-transparent text-[#4B5563] hover:text-[#0F172A]'}`}
                  >
                    {label}
                    <span className="grid h-5 min-w-6 place-items-center rounded-full bg-[#EEF2FE] px-1.5 text-xs font-bold text-[#1447E6]">{count}</span>
                  </button>
                ))}
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-5 pt-4">
                {tab === 'messages' ? (
                  <GigChat gig={gig} hired={hired} partnerId={partnerId} onPartner={(id) => setPartnerFor({ gigId: gig.id, id })} currentUserId={user?.id} token={token} />
                ) : (
                  <GigSubmissions gig={gig} currentUserId={user?.id} token={token} onChanged={refresh} setAlertConfig={setAlertConfig} />
                )}
              </div>
            </>
          )}
        </section>

        <aside aria-label="Assigned talent and awaiting review" className={`${PANEL} min-h-[420px] lg:min-h-0`}>
          {gig ? (
            <TalentPanel
              gig={gig}
              canHire={canHire}
              busyId={busyId}
              onMessage={(id) => {
                setPartnerFor({ gigId: gig.id, id });
                setTab('messages');
              }}
              onProfile={openProfile}
              onViewPitch={(app) => setDialog({ kind: 'pitch', app })}
              onHire={(app) => setDialog({ kind: 'hire', app })}
              onPass={(app) => setDialog({ kind: 'pass', app })}
            />
          ) : (
            <p className={`m-4 rounded-[12px] border border-dashed border-[#C7D3FB] p-4 text-center text-[13.5px] ${MUTED}`}>Open a gig to see its assigned talent and pitches.</p>
          )}
        </aside>
      </div>

      {gig && dialog?.kind === 'pitch' && (
        <PitchDialog
          gig={gig}
          app={dialog.app}
          canHire={canHire}
          busy={busyId === dialog.app.candidateId}
          onClose={() => setDialog(null)}
          onProfile={openProfile}
          onHire={(app) => setDialog({ kind: 'hire', app })}
          onPass={(app) => setDialog({ kind: 'pass', app })}
        />
      )}
      {gig && dialog?.kind === 'hire' && (
        <ConfirmDialog title={`Hire ${(dialog.app.candidate || personFor(gig, dialog.app.candidateId)).name}?`} confirmLabel="Hire" busyLabel="Hiring…" busy={busyId === dialog.app.candidateId} onConfirm={() => decide('hire', dialog.app)} onClose={() => setDialog(null)}>
          <p className="m-0">They’re added to this gig’s assigned talent, the gig moves to In progress, and a private chat opens with a first message from you.</p>
        </ConfirmDialog>
      )}
      {gig && dialog?.kind === 'pass' && (
        <ConfirmDialog title={`Pass on ${(dialog.app.candidate || personFor(gig, dialog.app.candidateId)).name}?`} tone="danger" confirmLabel="Pass" busyLabel="Passing…" busy={busyId === dialog.app.candidateId} onConfirm={() => decide('pass', dialog.app)} onClose={() => setDialog(null)}>
          <p className="m-0">Their pitch is removed from this gig. This can’t be undone.</p>
        </ConfirmDialog>
      )}
      {gig && dialog?.kind === 'close' && (
        <ConfirmDialog title="Close this gig?" confirmLabel="Close gig" busyLabel="Closing…" busy={busyId === 'status'} onConfirm={() => changeStatus('CLOSED')} onClose={() => setDialog(null)}>
          <p className="m-0">It stops taking pitches and no one else can be hired. Chats and submissions stay open, and you can reopen it later.</p>
        </ConfirmDialog>
      )}
      {gig && dialog?.kind === 'delete' && (
        <ConfirmDialog title="Delete this gig?" tone="danger" confirmLabel="Delete gig" busyLabel="Deleting…" busy={busyId === 'delete'} onConfirm={remove} onClose={() => setDialog(null)}>
          <p className="m-0">
            <strong className="font-semibold">{gig.title}</strong> and its {(gig.applicants || []).length} pitch{(gig.applicants || []).length === 1 ? '' : 'es'} will be deleted. This can’t be undone.
          </p>
        </ConfirmDialog>
      )}
      {gig && dialog?.kind === 'brief' && <BriefDialog gig={gig} onClose={() => setDialog(null)} />}

      <CandidateProfileModal candidate={profile} onClose={() => setProfile(null)} />
    </div>
  );
}
