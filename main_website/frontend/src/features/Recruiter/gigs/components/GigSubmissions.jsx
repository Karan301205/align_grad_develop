import { useState } from 'react';
import { Paperclip, Star } from 'lucide-react';
import { SERVER_MESSAGE, apiFetch, userMessage } from '../../../../services/apiClient';
import { formatShortDate } from '../../../../utils/format';
import { FieldError, Spinner } from '../../components/AccountControls';
import { MUTED, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../../components/accountStyles';
import { fileNameOf, personFor, safeLink } from '../gigsData';

const SUBMISSION_STATUS = {
  PENDING: { label: 'Waiting for your review', pill: 'bg-[#E3F1EE] text-[#0F7A55]' },
  ACCEPTED: { label: 'Accepted', pill: 'bg-[#E4F4EC] text-[#17794F]' },
  REJECTED: { label: 'Changes requested', pill: 'bg-[#FBF1DC] text-[#9A6312]' }
};

function ReviewForm({ gig, token, onDone, setAlertConfig }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const person = personFor(gig, gig.selectedCandidateId);

  const submit = async (event) => {
    event.preventDefault();
    if (!rating) return setError('Choose a rating from 1 to 5.');
    if (text.trim().length < 3) return setError('Write at least a few words.');
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/gigs/${gig.id}/review`, { token, method: 'POST', json: { rating, review: text.trim() } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
      setAlertConfig({ message: `Review saved. It’s added to ${person.name}’s profile as gig experience.`, type: 'success' });
      onDone();
    } catch (err) {
      setError(userMessage(err));
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-[12px] border border-[#E4E6EA] p-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold">Review {person.name}</span>
        <span className={`text-[13px] ${MUTED}`}>The gig is complete. Your rating and review are added to their profile as gig experience.</span>
      </div>
      <div role="radiogroup" aria-label="Rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n === 1 ? '' : 's'}`} onClick={() => setRating(n)} className="rounded-[6px] p-1 focus-visible:outline-2 focus-visible:outline-[#0F7A55]">
            <Star className={`size-6 ${n <= rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#D5D9E0]'}`} aria-hidden="true" />
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        maxLength={1000}
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-label="Review"
        placeholder="What was it like to work with them?"
        className="w-full resize-y rounded-[8px] border border-[#D5D9E0] px-3 py-2 text-sm focus:border-[#0F7A55] focus:outline-none focus:ring-2 focus:ring-[#0F7A55]/20"
      />
      {error && <FieldError id="review-error">{error}</FieldError>}
      <button type="submit" disabled={saving} className={`${PRIMARY_BUTTON} h-10 self-start px-4`}>
        {saving && <Spinner />}
        Submit review
      </button>
    </form>
  );
}

/**
 * What happens to the gig once work has been accepted. While the gig is still open to pitches and
 * hires (some hired freelancer hasn't been accepted yet) the owner can close it from here. When
 * every hired freelancer's work is accepted the server has already completed the gig, which also
 * stops pitches and hires, so there is nothing to close (closing it would also end reviews).
 */
function AcceptedNote({ status, onCloseGig }) {
  if (status === 'COMPLETED') {
    return <p className="m-0 rounded-[12px] border border-[#BFE0D8] bg-[#E3F1EE] px-4 py-3 text-[13px] text-[#03443F]">All hired work is accepted, so this gig is completed. It no longer takes pitches or hires.</p>;
  }
  if (!['OPEN', 'IN_PROGRESS', 'PAUSED'].includes(status)) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#BFE0D8] bg-[#E3F1EE] px-4 py-3">
      <div className="flex min-w-0 flex-col text-[13px] text-[#03443F]">
        <b className="text-sm font-semibold text-[#023836]">Work accepted</b>
        This gig can still take pitches and hires. Close it so no one else applies.
      </div>
      <button type="button" onClick={onCloseGig} className={`${PRIMARY_BUTTON} h-9 shrink-0 px-3 text-[13px]`}>
        Close gig
      </button>
    </div>
  );
}

/**
 * Work delivered by hired freelancers (POST /gigs/:id/complete with the freelancer's
 * id, so accepting one person's work never touches another's). Once every hired
 * freelancer's work is accepted the server marks the gig completed, and the review
 * form appears. `onCloseGig` opens the workspace's close-gig confirmation.
 */
export default function GigSubmissions({ gig, currentUserId, token, onChanged, onCloseGig, setAlertConfig }) {
  const [busy, setBusy] = useState(null); // `${candidateId}:${action}`
  const submissions = [...(gig.submissions || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const reviewed = (gig.reviews || []).some((r) => r.reviewerId === currentUserId);
  const hasAccepted = submissions.some((s) => s.status === 'ACCEPTED');

  const act = async (submission, action) => {
    setBusy(`${submission.candidateId}:${action}`);
    try {
      const res = await apiFetch(`/gigs/${gig.id}/complete`, { token, method: 'POST', json: { action, candidateId: submission.candidateId } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
      const name = personFor(gig, submission.candidateId).name;
      setAlertConfig({ message: action === 'ACCEPT' ? `${name}’s work is accepted.` : `Changes requested from ${name}.`, type: 'success' });
      await onChanged();
    } catch (err) {
      setAlertConfig({ message: userMessage(err), type: 'error' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {hasAccepted && <AcceptedNote status={gig.status} onCloseGig={onCloseGig} />}
      {gig.status === 'COMPLETED' && gig.selectedCandidateId && !reviewed && <ReviewForm gig={gig} token={token} onDone={onChanged} setAlertConfig={setAlertConfig} />}
      {submissions.length === 0 ? (
        <div className={`m-auto max-w-[340px] py-10 text-center ${MUTED}`}>
          <b className="block text-[15px] text-[#023836]">No submissions yet</b>
          Work delivered by your freelancers will appear here for review.
        </div>
      ) : (
        submissions.map((submission) => {
          const status = SUBMISSION_STATUS[submission.status] || SUBMISSION_STATUS.PENDING;
          const file = safeLink(submission.fileUrl);
          const name = personFor(gig, submission.candidateId).name;
          return (
            <article key={submission.id} className="flex flex-col gap-2.5 rounded-[12px] border border-[#E4E6EA] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col">
                  <b className="font-semibold">{name}</b>
                  <small className={`text-[12.5px] ${MUTED}`}>Submitted {formatShortDate(submission.createdAt) || '—'}</small>
                </div>
                <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${status.pill}`}>{status.label}</span>
              </div>
              {submission.text && <p className="m-0 whitespace-pre-wrap break-words text-[#334155]">{submission.text}</p>}
              {file && (
                <a href={file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 self-start font-semibold text-[#0F7A55] hover:underline">
                  <Paperclip className="size-4" aria-hidden="true" />
                  {fileNameOf(file)}
                </a>
              )}
              {submission.status === 'PENDING' && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={Boolean(busy)} onClick={() => act(submission, 'REVISION')} className={`${SECONDARY_BUTTON} h-9 px-3 text-[13px]`}>
                    {busy === `${submission.candidateId}:REVISION` && <Spinner />}
                    Request changes
                  </button>
                  <button type="button" disabled={Boolean(busy)} onClick={() => act(submission, 'ACCEPT')} className={`${PRIMARY_BUTTON} h-9 px-3 text-[13px]`}>
                    {busy === `${submission.candidateId}:ACCEPT` && <Spinner />}
                    Accept work
                  </button>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
