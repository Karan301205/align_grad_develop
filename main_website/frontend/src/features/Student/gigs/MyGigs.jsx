import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Paperclip, RotateCcw, Star, Upload, X } from 'lucide-react';
import { SERVER_MESSAGE, apiFetch, userMessage } from '../../../services/apiClient';
import { uploadGigFile } from '../../Gigs/useGigChat';
import { cleanMultiline } from '../profile/profileRules';
import { BODY, CARD, HEADING_FONT, INK, MUTED, PRIMARY, SECONDARY, SMALL } from '../profile/profileTheme';
import { Dialog, ErrorBanner, Field, Spinner, TextArea } from '../profile/ui';
import { FileLink } from './GigDetail';
import GigChat from './GigChat';
import { GROUPS, STATE, budgetText, companyOf, deliveryText, gigBars, myGigLine, myGigState, pitchCountText, safeLink, whenText, workSteps } from './gigsData';

const DETAILS_REFRESH_MS = 15000; // status and approval changes, while the tab is visible
const NOTE_MAX = 2000;
const REVIEW_MAX = 1000;

const SubHeading = ({ id, children }) => (
  <h3 id={id} className="m-0 text-[16px]">
    <span className={`${HEADING_FONT} font-bold ${INK}`}>{children}</span>
  </h3>
);

const Badge = ({ state }) => <span className={`shrink-0 self-start rounded-full px-2.5 py-[3px] text-[12.5px] font-bold ${STATE[state].tone}`}>{STATE[state].label}</span>;

/** The brief, skills and files of a gig the candidate already pitched for or works on. */
function BriefDialog({ gig, onClose }) {
  const files = (gig.attachments || []).filter(safeLink);
  const bars = gigBars(gig, []);
  return (
    <Dialog title={gig.title} subtitle={[companyOf(gig), budgetText(gig), deliveryText(gig) && `deliver in ${deliveryText(gig)}`].filter(Boolean).join(' · ')} onClose={onClose} width="max-w-[640px]">
      <SubHeading>The brief</SubHeading>
      <p className={`m-0 whitespace-pre-line break-words text-[15px] ${BODY}`}>{gig.description}</p>
      {bars.length > 0 && (
        <>
          <SubHeading>Skills asked</SubHeading>
          <div className="flex flex-wrap gap-1.5">
            {bars.map((bar) => (
              <span key={bar.skillName} className="rounded-[6px] bg-[#E8EEFF] px-2 py-[3px] text-[13px] font-semibold text-[#0B3FA8]">
                {bar.skillName}
                {bar.needs > 1 ? ` · ${bar.needs}+` : ''}
              </span>
            ))}
          </div>
        </>
      )}
      {files.length > 0 && (
        <>
          <SubHeading>Files</SubHeading>
          {files.map((url) => (
            <FileLink key={url} url={url} />
          ))}
        </>
      )}
    </Dialog>
  );
}

/** "Submit finished work": a file and/or a note for the company (POST /gigs/:id/submit). */
function SubmitWork({ gig, token, onDone, onCancel }) {
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const company = companyOf(gig) || 'the company';

  const submit = async () => {
    if (!file && !note.trim()) {
      setError('Add your file or a note.');
      return;
    }
    setError('');
    setSending(true);
    try {
      const fileUrl = file ? await uploadGigFile(file, token) : null;
      const res = await apiFetch(`/gigs/${gig.id}/submit`, { token, method: 'POST', json: { text: note.trim() || null, fileUrl } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
      await onDone();
    } catch (err) {
      setError(userMessage(err, 'Your work couldn’t be sent. Try again.'));
      setSending(false);
    }
  };

  return (
    <section aria-label="Submit finished work" className="flex flex-col gap-3 rounded-[14px] border border-[#D5DEFF] bg-[#F4F6FE] p-4">
      <ErrorBanner message={error} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1.5">
          <span className={`text-[14px] font-semibold ${INK}`}>File</span>
          {file ? (
            <span className="flex h-11 min-w-0 items-center gap-2 rounded-[10px] border border-[#C9D1E3] bg-white px-3">
              <Paperclip aria-hidden="true" className="size-4 shrink-0 text-[#475373]" />
              <span className={`min-w-0 flex-1 truncate font-semibold ${INK}`}>{file.name}</span>
              <span className={`shrink-0 text-[13px] ${MUTED}`}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              <button type="button" onClick={() => setFile(null)} aria-label={`Remove ${file.name}`} className="flex size-8 items-center justify-center rounded-full text-[#475373] hover:bg-[#F4F6FE]">
                <X className="size-4" />
              </button>
            </span>
          ) : (
            <label className={`${SECONDARY} h-11 cursor-pointer px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0167F6]`}>
              <Upload aria-hidden="true" className="size-4" /> Choose a file
              <input type="file" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </label>
          )}
        </div>
        <div className="flex min-w-0 flex-[2_1_300px] flex-col">
          <Field id="work-note" label={`Note for ${company}`} counter={note.length > NOTE_MAX - 200 ? { text: `${note.length} / ${NOTE_MAX}`, over: note.length > NOTE_MAX } : null}>
            <TextArea id="work-note" rows={2} maxLength={NOTE_MAX} value={note} onChange={setNote} clean={cleanMultiline} placeholder="What you did, and anything they should check" />
          </Field>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={sending} className={`${SECONDARY} h-10 px-4`}>
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={sending} className={`${PRIMARY} h-10 px-4`}>
          {sending && <Spinner />}
          {sending ? 'Sending…' : 'Submit for approval'}
        </button>
      </div>
    </section>
  );
}

/** Rating the company once the gig is complete (POST /gigs/:id/review). */
function RateCompany({ gig, token, onDone }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const company = companyOf(gig) || 'the company';

  const send = async () => {
    const problem = !rating ? 'Choose a rating.' : text.trim().length < 3 ? 'Write a few words about working with them.' : '';
    setError(problem);
    if (problem) return;
    setSending(true);
    try {
      const res = await apiFetch(`/gigs/${gig.id}/review`, { token, method: 'POST', json: { rating, review: text.trim() } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
      await onDone();
    } catch (err) {
      setError(userMessage(err, 'Your rating couldn’t be saved. Try again.'));
      setSending(false);
    }
  };

  return (
    <section aria-labelledby="rate-company" className="flex flex-col gap-3 rounded-[14px] border border-[#E1E5F2] p-4">
      <SubHeading id="rate-company">Rate {company}</SubHeading>
      <ErrorBanner message={error} />
      <div role="radiogroup" aria-label="Rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} star${value === 1 ? '' : 's'}`} onClick={() => setRating(value)} className="rounded-[6px] p-1 focus-visible:outline-2 focus-visible:outline-[#0167F6]">
            <Star aria-hidden="true" className={`size-7 ${value <= rating ? 'fill-[#F5A524] text-[#F5A524]' : 'text-[#C9D1E3]'}`} />
          </button>
        ))}
      </div>
      <Field id="rate-text" label="Your review" required counter={{ text: `${text.length} / ${REVIEW_MAX}`, over: text.length > REVIEW_MAX }}>
        <TextArea id="rate-text" rows={3} maxLength={REVIEW_MAX} value={text} onChange={setText} clean={cleanMultiline} placeholder="Clear brief? Quick replies?" />
      </Field>
      <button type="button" onClick={send} disabled={sending} className={`${PRIMARY} h-10 self-start px-4`}>
        {sending && <Spinner />}
        {sending ? 'Saving…' : 'Send rating'}
      </button>
    </section>
  );
}

/** Pitch details for a gig the candidate hasn't been picked for (yet). */
function PitchView({ gig, state }) {
  const company = companyOf(gig) || 'the company';
  const pitch = gig.myPitch || {};
  const samples = (pitch.attachments || []).filter(safeLink);
  return (
    <div className="flex flex-col gap-4 p-5 sm:p-6">
      <span className={`self-start rounded-full px-2.5 py-[3px] text-[12.5px] font-bold ${STATE[state].tone}`}>{state === 'waiting' ? `Waiting for ${company}` : 'Not picked'}</span>
      <dl className="m-0 grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-[15px]">
        <dt className={MUTED}>Budget</dt>
        <dd className={`m-0 font-semibold ${INK}`}>{budgetText(gig)}</dd>
        {deliveryText(gig) && (
          <>
            <dt className={MUTED}>Delivery</dt>
            <dd className={`m-0 font-semibold ${INK}`}>{deliveryText(gig)}</dd>
          </>
        )}
        <dt className={MUTED}>Sent</dt>
        <dd className={`m-0 font-semibold ${INK}`}>{[pitch.createdAt && whenText(pitch.createdAt).replace(/^on /, ''), pitchCountText(gig.pitchCount).replace(' so far', ' on this gig')].filter(Boolean).join(' · ')}</dd>
      </dl>
      {pitch.message && <p className={`m-0 whitespace-pre-line break-words rounded-[12px] bg-[#F4F6FE] px-4 py-3 text-[15px] ${BODY}`}>{pitch.message}</p>}
      {samples.length > 0 && (
        <div className="flex flex-col gap-2">
          <SubHeading>Your work samples</SubHeading>
          {samples.map((url) => (
            <FileLink key={url} url={url} />
          ))}
        </div>
      )}
      {pitch.answers?.length > 0 && (
        <div className="flex flex-col gap-2">
          <SubHeading>Your answers</SubHeading>
          {pitch.answers.map((answer, index) => (
            <div key={answer.questionId || index} className="flex flex-col gap-0.5 border-t border-[#EEF0F6] pt-2.5">
              <span className={MUTED}>{answer.questionText}</span>
              <span className={`whitespace-pre-line break-words font-semibold ${INK}`}>{answer.answer}</span>
            </div>
          ))}
        </div>
      )}
      <p className={`m-0 ${MUTED}`}>{state === 'waiting' ? 'If they pick you, a chat opens here so you can start.' : 'Your scores stay on your profile for other gigs.'}</p>
    </div>
  );
}

/** The gig the candidate was hired for: progress, the chat, finished work and the rating. */
function WorkView({ gig, state, token, myIds, onChanged }) {
  const [submitting, setSubmitting] = useState(false);
  const company = companyOf(gig) || 'the company';
  const steps = workSteps(state);
  const canSubmit = gig.status === 'IN_PROGRESS' && ['working', 'changes', 'submitted'].includes(state);
  const work = gig.mySubmission;

  return (
    <>
      {state !== 'ended' && (
        <ol aria-label="Gig status" className="m-0 grid list-none grid-cols-3 gap-1.5 border-b border-[#EEF0F6] px-5 py-4 sm:px-6">
          {steps.map((step) => (
            <li key={step.label} aria-current={step.current ? 'step' : undefined} className="flex flex-col gap-1.5">
              <span aria-hidden="true" className={`h-1.5 rounded-full ${step.done ? (step.label === 'Approved' ? 'bg-[#0F7A55]' : 'bg-[#0167F6]') : 'bg-[#E1E5F2]'}`} />
              <span className={`text-[13.5px] ${step.current ? `font-bold ${INK}` : BODY}`}>{step.label}</span>
            </li>
          ))}
        </ol>
      )}
      {(state === 'changes' || state === 'submitted' || state === 'approved' || state === 'ended' || work) && (
        <div className="flex flex-col gap-3 px-5 pt-4 sm:px-6">
          {state === 'changes' && <p className="m-0 rounded-[12px] bg-[#FFF3E8] px-4 py-3 font-semibold text-[#8A3F06]">{company} asked for changes. Check the chat, then submit your work again.</p>}
          {state === 'submitted' && <p className={`m-0 rounded-[12px] bg-[#F1ECFF] px-4 py-3 font-semibold text-[#5B2AA6]`}>Work submitted. Waiting for {company} to approve.</p>}
          {state === 'approved' && (
            <p className="m-0 inline-flex items-center gap-2 rounded-[12px] bg-[#E3F5EE] px-4 py-3 font-semibold text-[#0B5E41]">
              <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" /> {company} approved your work.
            </p>
          )}
          {state === 'ended' && <p className={`m-0 rounded-[12px] bg-[#EEF0F6] px-4 py-3 font-semibold text-[#3B4A6B]`}>{company} closed this gig.</p>}
          {work && (work.text || work.fileUrl) && (
            <div className="flex flex-col gap-1.5 rounded-[12px] border border-[#E1E5F2] px-4 py-3">
              <span className={`text-[13px] font-bold ${MUTED}`}>Your latest submission{work.createdAt ? ` · ${whenText(work.createdAt).replace(/^on /, '')}` : ''}</span>
              {work.text && <span className={`whitespace-pre-line break-words ${BODY}`}>{work.text}</span>}
              {work.fileUrl && <FileLink url={work.fileUrl} />}
            </div>
          )}
          {state === 'approved' && gig.status === 'COMPLETED' && (gig.myReview ? (
            <p className={`m-0 ${BODY}`}>
              You rated {company} {gig.myReview.rating}/5: “{gig.myReview.review}”
            </p>
          ) : (
            gig.myReview === null && <RateCompany gig={gig} token={token} onDone={onChanged} />
          ))}
        </div>
      )}
      {submitting && (
        <div className="px-5 pt-4 sm:px-6">
          <SubmitWork
            gig={gig}
            token={token}
            onCancel={() => setSubmitting(false)}
            onDone={async () => {
              setSubmitting(false);
              await onChanged();
            }}
          />
        </div>
      )}
      <div className="mt-4">
        <GigChat
          key={gig.id}
          gig={gig}
          company={company}
          myIds={myIds}
          token={token}
          extra={
            canSubmit && !submitting ? (
              <button type="button" onClick={() => setSubmitting(true)} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] border border-[#0167F6] bg-white px-4 text-[15px] font-semibold text-[#0167F6] hover:bg-[#EEF2FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]">
                {state === 'submitted' ? 'Send a new version' : 'Submit finished work'}
              </button>
            ) : null
          }
        />
      </div>
    </>
  );
}

/**
 * The selected gig in "My gigs" (design: Web — my gigs and workspace chat). The
 * gig's own page (GET /gigs/:id) is re-read every 15 s while the tab is visible, for
 * hires, approvals and the rating; the chat polls on its own (useGigChat).
 */
function Workspace({ listed, token, myIds, onListChanged }) {
  const [details, setDetails] = useState(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const loading = useRef(false);
  const gig = details && details.id === listed.id ? { ...listed, ...details } : listed;
  const state = myGigState(gig);

  const load = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const res = await apiFetch(`/gigs/${listed.id}`, { token });
      const body = await res.json().catch(() => ({}));
      if (res.ok) setDetails(body);
    } catch (err) {
      console.error('[gigs] Could not refresh the gig:', err);
    } finally {
      loading.current = false;
    }
  }, [listed.id, token]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, DETAILS_REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  const changed = async () => {
    await Promise.all([load(), onListChanged()]);
  };

  return (
    <article aria-label="Gig workspace" className={`${CARD} flex min-w-0 flex-col overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF0F6] p-5 sm:px-6">
        <div className="flex min-w-0 flex-[1_1_260px] flex-col">
          <h2 className="m-0 text-[20px] leading-tight">
            <span className={`${HEADING_FONT} break-words font-bold ${INK}`}>{gig.title}</span>
          </h2>
          <span className={`text-[15px] ${BODY}`}>{[companyOf(gig), budgetText(gig), deliveryText(gig) && `deliver in ${deliveryText(gig)}`].filter(Boolean).join(' · ')}</span>
        </div>
        <button type="button" onClick={() => setBriefOpen(true)} className={`${SECONDARY} ${SMALL}`}>
          View brief
        </button>
      </div>
      {gig.isHired ? <WorkView gig={gig} state={state} token={token} myIds={myIds} onChanged={changed} /> : <PitchView gig={gig} state={state} />}
      {briefOpen && <BriefDialog gig={gig} onClose={() => setBriefOpen(false)} />}
    </article>
  );
}

/** "My gigs": what the candidate is working on, pitches sent and finished gigs. */
export default function MyGigs({ myGigs, loading, error, onRetry, selectedId, onSelect, token, myIds, onListChanged, onBrowse }) {
  const groups = GROUPS.map((group) => ({ ...group, items: myGigs.filter((gig) => group.states.includes(myGigState(gig))) })).filter((group) => group.items.length);
  const selected = myGigs.find((gig) => gig.id === selectedId) || groups[0]?.items[0] || null;
  const detailRef = useRef(null);

  if (loading && myGigs.length === 0) {
    return (
      <div className={`${CARD} flex items-center justify-center gap-3 p-10 ${BODY}`} role="status">
        <Spinner className="size-5 text-[#0167F6]" /> Loading your gigs…
      </div>
    );
  }
  if (error && myGigs.length === 0) {
    return (
      <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-6`}>
        <p role="alert" className="m-0 font-medium text-[#8C1D14]">
          {error}
        </p>
        <button type="button" onClick={onRetry} className={`${SECONDARY} ${SMALL}`}>
          <RotateCcw aria-hidden="true" className="size-4" /> Try again
        </button>
      </div>
    );
  }
  if (myGigs.length === 0) {
    return (
      <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-6`}>
        <p className={`m-0 ${BODY}`}>You haven’t pitched for a gig yet. Your pitches and the work you’re picked for show here.</p>
        <button type="button" onClick={onBrowse} className={`${PRIMARY} ${SMALL}`}>
          Browse gigs
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 max-w-full flex-[1_1_320px] flex-col gap-4 lg:max-w-[400px]">
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`my-gigs-${group.id}`} className="flex flex-col gap-2">
              <h2 id={`my-gigs-${group.id}`} className={`m-0 text-[13px] font-bold uppercase tracking-[0.05em] ${MUTED}`}>
                {group.label} · {group.items.length}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {group.items.map((gig) => {
                  const on = gig.id === selected?.id;
                  const state = myGigState(gig);
                  return (
                    <li key={gig.id}>
                      <button
                        type="button"
                        aria-current={on ? 'true' : undefined}
                        onClick={() => {
                          onSelect(gig.id);
                          if (window.innerWidth < 1024) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                        }}
                        className={`flex w-full flex-col gap-2 rounded-[14px] bg-white px-4 py-3.5 text-left transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6] ${on ? 'border-2 border-[#0167F6] px-[15px] py-[13px] shadow-[0_12px_28px_-18px_rgba(1,103,246,0.8)]' : 'border border-[#E1E5F2] hover:border-[#6378F9]'}`}
                      >
                        <span className="flex items-start justify-between gap-2.5">
                          <span className="flex min-w-0 flex-col">
                            <span className={`text-[15px] font-bold ${INK}`}>{gig.title}</span>
                            <span className={`text-[14px] ${MUTED}`}>{[companyOf(gig), budgetText(gig)].filter(Boolean).join(' · ')}</span>
                          </span>
                          <Badge state={state} />
                        </span>
                        <span className={`text-[13.5px] ${BODY}`}>{myGigLine(gig, state)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
        <div ref={detailRef} className="min-w-0 flex-[999_1_520px] scroll-mt-20">
          {selected && <Workspace key={selected.id} listed={selected} token={token} myIds={myIds} onListChanged={onListChanged} />}
        </div>
      </div>
    </div>
  );
}
