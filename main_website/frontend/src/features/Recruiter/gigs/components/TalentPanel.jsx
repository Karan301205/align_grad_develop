import { useRef } from 'react';
import { Paperclip } from 'lucide-react';
import { formatShortDate } from '../../../../utils/format';
import { avatarTint, MUTED, SECONDARY_BUTTON } from '../../components/accountStyles';
import Dialog from '../../jobs/components/Dialog';
import { fileNameOf, hiredIds, initials, pendingApplicants, personFor, safeLink } from '../gigsData';
import ResizeHandle from './ResizeHandle';
import useStoredSize from '../useStoredSize';

const MIN_SECTION = 110; // px, so neither list can be dragged shut
const HANDLE = 12; // px, height of the drag bar between the two lists

const BUTTON = 'inline-flex items-center justify-center rounded-[8px] px-3 font-(family-name:--font-headline) text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7A55]';
const PRIMARY = 'bg-[#023836] text-white hover:bg-[#03443F]';
const SECONDARY = 'border border-[#D5D9E0] bg-white text-[#023836] hover:bg-[#F4F8F6]';
// Full-width pair under a pitch (Pass / Hire), and compact buttons beside a hired freelancer's name.
const PRIMARY_SMALL = `${BUTTON} h-9 flex-1 ${PRIMARY}`;
const SECONDARY_SMALL = `${BUTTON} h-9 flex-1 ${SECONDARY}`;
const PRIMARY_COMPACT = `${BUTTON} h-8 flex-none ${PRIMARY}`;
const SECONDARY_COMPACT = `${BUTTON} h-8 flex-none ${SECONDARY}`;

export function Avatar({ person, size = 38 }) {
  const src = safeLink(person?.avatar);
  return (
    <span aria-hidden="true" style={{ width: size, height: size }} className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full text-[13px] font-bold ${avatarTint(person?.name)}`}>
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials(person?.name)}
    </span>
  );
}

function Section({ id, title, count, sectionRef, style, children }) {
  return (
    <section ref={sectionRef} style={style} aria-labelledby={id} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-[18px] pb-3 pt-4">
        <h3 id={id} className="m-0 text-[15px]">
          <span className="font-bold">{title}</span>
        </h3>
        <span className="grid h-[22px] min-w-[26px] place-items-center rounded-full bg-[#E3F1EE] px-2 text-xs font-bold text-[#0F7A55]">{count}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 pb-4">{children}</div>
    </section>
  );
}

const EmptyNote = ({ children }) => <div className={`rounded-[12px] border border-dashed border-[#BFE0D8] p-4 text-center text-[13.5px] ${MUTED}`}>{children}</div>;

/**
 * Right column of the workspace (design: gig-workspace.html): hired freelancers
 * (message or open their profile) and pitches waiting for a decision. The bar between
 * the two lists can be dragged to give either more height (remembered in this browser).
 * `chattingId` is the freelancer whose chat is open, so they get no Message button.
 */
export default function TalentPanel({ gig, canHire, busyId, chattingId, onMessage, onProfile, onViewPitch, onHire, onPass }) {
  const hired = hiredIds(gig);
  const pending = pendingApplicants(gig).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const [assignedHeight, setAssignedHeight] = useStoredSize('recruiter.gigs.assignedHeight', null);
  const root = useRef(null);
  const assigned = useRef(null);

  const resize = (height) => {
    const max = Math.max(MIN_SECTION, (root.current?.clientHeight || 0) - MIN_SECTION - HANDLE);
    setAssignedHeight(Math.round(Math.min(Math.max(height, MIN_SECTION), max)));
  };

  return (
    <div ref={root} className="flex min-h-0 flex-1 flex-col">
      <Section id="assigned-title" title="Assigned talent" count={hired.length} sectionRef={assigned} style={assignedHeight ? { flex: `0 1 ${assignedHeight}px` } : undefined}>
        {hired.length === 0 ? (
          <EmptyNote>No talent assigned yet. Hire a freelancer from the pitches below.</EmptyNote>
        ) : (
          hired.map((id) => {
            const person = personFor(gig, id);
            return (
              <div key={id} role="group" aria-label={`Hired: ${person.name}`} className="flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-[12px] border border-[#E4E6EA] p-3">
                <div className="flex min-w-0 flex-[1_1_110px] flex-col">
                  <span className="truncate font-semibold">{person.name}</span>
                  {person.username && <small className={`truncate text-[12.5px] ${MUTED}`}>@{person.username}</small>}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button type="button" onClick={() => onProfile(id)} className={SECONDARY_COMPACT}>
                    Profile
                  </button>
                  {id !== chattingId && (
                    <button type="button" onClick={() => onMessage(id)} className={PRIMARY_COMPACT}>
                      Message
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Section>

      <ResizeHandle
        orientation="horizontal"
        label="Resize assigned talent and awaiting review"
        getStart={() => assigned.current?.offsetHeight || 0}
        value={assignedHeight}
        onChange={resize}
        onReset={() => setAssignedHeight(null)}
        className="h-3 shrink-0 bg-[linear-gradient(#E4E6EA,#E4E6EA)] bg-[length:100%_1px] bg-center bg-no-repeat"
      />

      <Section id="review-title" title="Awaiting review" count={pending.length}>
        {pending.length === 0 ? (
          <EmptyNote>No pitches waiting for review.</EmptyNote>
        ) : (
          <>
            {!canHire && <p className={`m-0 text-[13px] ${MUTED}`}>This gig is {gig.status === 'COMPLETED' ? 'completed' : 'closed'}, so no one else can be hired. Reopen it to hire.</p>}
            {pending.map((app) => {
              const person = app.candidate || personFor(gig, app.candidateId);
              const busy = busyId === app.candidateId;
              return (
                <div key={app.id || app.candidateId} role="group" aria-label={`Pitch from ${person.name}`} className="flex flex-col gap-2.5 rounded-[12px] border border-[#E4E6EA] p-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{person.name}</span>
                    <small className={`text-[12.5px] ${MUTED}`}>Pitched {formatShortDate(app.createdAt) || '—'}</small>
                  </div>
                  {app.message && <p className="m-0 line-clamp-2 break-words text-[13px] text-[#334155]">{app.message}</p>}
                  <button type="button" onClick={() => onViewPitch(app)} className="self-start rounded-[4px] text-[13px] font-semibold text-[#0F7A55] hover:underline">
                    View pitch
                  </button>
                  <div className="flex gap-2">
                    <button type="button" disabled={busy} onClick={() => onPass(app)} className={SECONDARY_SMALL}>
                      Pass
                    </button>
                    <button type="button" disabled={busy || !canHire} onClick={() => onHire(app)} className={PRIMARY_SMALL}>
                      Hire
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </Section>
    </div>
  );
}

/** Full pitch: message, files and screening answers (MCQs marked right or wrong). */
export function PitchDialog({ gig, app, canHire, busy, onClose, onProfile, onHire, onPass }) {
  const person = app.candidate || personFor(gig, app.candidateId);
  const answers = Array.isArray(app.answers) ? app.answers : [];
  const files = (app.attachments || []).map(safeLink).filter(Boolean);
  return (
    <Dialog
      title={`${person.name}’s pitch`}
      subtitle={`Pitched ${formatShortDate(app.createdAt) || '—'} · ${gig.title}`}
      onClose={onClose}
      width="max-w-xl"
      footer={
        <>
          <button type="button" onClick={() => onProfile(app.candidateId)} className={`${SECONDARY_BUTTON} h-10 px-4`}>
            View profile
          </button>
          <button type="button" disabled={busy} onClick={() => onPass(app)} className={`${SECONDARY_BUTTON} h-10 px-4`}>
            Pass
          </button>
          <button type="button" disabled={busy || !canHire} onClick={() => onHire(app)} className="inline-flex h-10 items-center justify-center rounded-[8px] bg-[#023836] px-4 font-(family-name:--font-headline) text-sm font-semibold text-white hover:bg-[#03443F] disabled:cursor-not-allowed disabled:opacity-60">
            Hire
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar person={person} size={44} />
        <div className="flex min-w-0 flex-col">
          <span className="font-semibold">{person.name}</span>
          {person.username && <span className={`text-[13px] ${MUTED}`}>@{person.username}</span>}
        </div>
      </div>
      {person.bio && <p className={`m-0 whitespace-pre-line ${MUTED}`}>{person.bio}</p>}
      <section className="flex flex-col gap-1.5">
        <h3 className="m-0 text-sm">
          <span className="font-semibold">Pitch</span>
        </h3>
        <p className="m-0 whitespace-pre-wrap break-words rounded-[10px] border border-[#EEF0F3] bg-[#F8FBFA] px-3.5 py-3">{app.message || 'No message, only files.'}</p>
      </section>
      {files.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h3 className="m-0 text-sm">
            <span className="font-semibold">Files</span>
          </h3>
          {files.map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 self-start font-semibold text-[#0F7A55] hover:underline">
              <Paperclip className="size-4" aria-hidden="true" />
              {fileNameOf(url)}
            </a>
          ))}
        </section>
      )}
      {answers.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="m-0 text-sm">
            <span className="font-semibold">Answers ({answers.length})</span>
          </h3>
          {answers.map((answer, index) => (
            <div key={answer.questionId || index} className="flex flex-col gap-1 rounded-[10px] border border-[#EEF0F3] bg-[#F8FBFA] px-3.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium">
                  {index + 1}. {answer.questionText}
                </span>
                {answer.type === 'MCQ' && answer.isCorrect != null && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${answer.isCorrect ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#B91C1C]'}`}>{answer.isCorrect ? 'Correct' : 'Incorrect'}</span>
                )}
              </div>
              <span className="whitespace-pre-wrap break-words text-[#334155]">{answer.answer || '—'}</span>
            </div>
          ))}
        </section>
      )}
    </Dialog>
  );
}
