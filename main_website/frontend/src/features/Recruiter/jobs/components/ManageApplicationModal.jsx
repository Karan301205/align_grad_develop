import { useState } from 'react';
import { apiFetch, userMessage, SERVER_MESSAGE } from '../../../../services/apiClient';
import { getApplicationStage } from '../../../../utils/hiringProgress';
import { formatScreeningAnswer, typeLabel as questionTypeLabel } from '../../../../constants/screeningQuestions';
import { SelectControl, Spinner } from '../../components/AccountControls';
import { MUTED, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../../components/accountStyles';
import { stageLabel } from '../jobsData';
import Dialog from './Dialog';

// Values PUT /recruiter/applications/:id/rounds accepts (recruiter.validator.js).
const PIPELINE = [
  ['APPLIED', 'Applied (screening pending)'],
  ['SHORTLISTED', 'Shortlisted'],
  // Counts as Shortlisted; the Interview stage comes from a round being scheduled or in progress.
  ['IN_PROGRESS', 'In progress'],
  ['SELECTED', 'Hired / selected'],
  ['REJECTED', 'Rejected']
];
// Older statuses the server also accepts; offered only when an application already has one.
const OTHER_STATUSES = { SCHEDULED: 'Scheduled', INTERVIEW: 'Interview', HIRED: 'Hired' };

const ROUND_OPTIONS = [
  ['PENDING', 'Pending'],
  ['SCHEDULED', 'Scheduled'],
  ['IN_PROGRESS', 'In progress'],
  ['CLEARED', 'Cleared'],
  ['REJECTED', 'Rejected']
];
const ROUND_VALUES = [...ROUND_OPTIONS.map(([value]) => value), 'QUALIFIED'];
const FEEDBACK_MAX = 2000;

/** Rounds in the shape the server validates; older rows may lack a number or name. */
const normalizeRounds = (rounds) =>
  (Array.isArray(rounds) ? rounds : []).map((round, index) => {
    const status = String(round?.status || 'PENDING').toUpperCase();
    return {
      roundNumber: Number(round?.roundNumber) > 0 ? Number(round.roundNumber) : index + 1,
      name: String(round?.name || round?.roundName || `Round ${index + 1}`),
      status: ROUND_VALUES.includes(status) ? status : 'PENDING',
      feedback: String(round?.feedback || '')
    };
  });

function ScreeningAnswers({ answers }) {
  return (
    <section aria-labelledby="screening-title" className="flex flex-col gap-2.5">
      <h3 id="screening-title" className="m-0 text-sm">
        <span className="font-semibold">Screening answers ({answers.length})</span>
      </h3>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {answers.map((answer, index) => (
          <li key={answer.questionId || index} className="flex flex-col gap-1.5 rounded-[10px] border border-[#EEF0F3] bg-[#FAFAF9] px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium">
                {index + 1}. {answer.questionText}
              </span>
              {answer.type === 'MCQ' && answer.isCorrect != null ? (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${answer.isCorrect ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#B91C1C]'}`}>
                  {answer.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-[#F1F3F6] px-2 py-0.5 text-xs font-medium text-[#334155]">{questionTypeLabel(answer.type)}</span>
              )}
            </div>
            <span className="whitespace-pre-line break-words text-[#334155]">{formatScreeningAnswer(answer) || '—'}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Move an applicant through the job: overall status, each round's status and
 * feedback for the candidate (PUT /recruiter/applications/:id/rounds). The server
 * decides the final status: a rejected round rejects the application, and every
 * round cleared marks the candidate as hired.
 */
export default function ManageApplicationModal({ row, token, onClose, onSaved }) {
  const { app, job, student } = row;
  const initialStatus = app.status || 'APPLIED';
  const [status, setStatus] = useState(initialStatus);
  const [rounds, setRounds] = useState(() => normalizeRounds(app.roundStatuses));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = PIPELINE.some(([value]) => value === initialStatus) || !OTHER_STATUSES[initialStatus] ? PIPELINE : [...PIPELINE, [initialStatus, OTHER_STATUSES[initialStatus]]];
  const statusIsValid = statusOptions.some(([value]) => value === status);
  const answers = Array.isArray(app.answers) ? app.answers : [];
  const name = student?.name || 'this candidate';

  const updateRound = (index, patch) => setRounds((list) => list.map((round, i) => (i === index ? { ...round, ...patch } : round)));

  const save = async () => {
    if (!statusIsValid && rounds.length === 0) {
      setError('Choose a pipeline status.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const json = { ...(statusIsValid ? { status } : {}), ...(rounds.length ? { roundStatuses: rounds } : {}) };
      const res = await apiFetch(`/recruiter/applications/${app.id}/rounds`, { token, method: 'PUT', json });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || SERVER_MESSAGE);
        setSaving(false);
        return;
      }
      await onSaved(`Saved. ${name} is now: ${stageLabel(getApplicationStage(body))}.`);
    } catch (err) {
      setError(userMessage(err));
      setSaving(false);
    }
  };

  return (
    <Dialog
      title="Manage application"
      subtitle={`${student?.name || 'Applicant'} · ${job.title}`}
      onClose={onClose}
      busy={saving}
      width="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={`${SECONDARY_BUTTON} h-10 px-4`}>
            Cancel
          </button>
          <button type="button" onClick={save} disabled={saving} className={`${PRIMARY_BUTTON} h-10 px-4`}>
            {saving && <Spinner />}
            {saving ? 'Saving…' : 'Save progress'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-2 rounded-[10px] border border-[#EEF0F3] bg-[#FAFAF9] p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <label htmlFor="manage-status" className="font-semibold">
            Pipeline status
          </label>
          <span className={`text-[13px] ${MUTED}`}>Current stage: {stageLabel(getApplicationStage(app))}</span>
        </div>
        <SelectControl id="manage-status" size="sm" className="w-full sm:w-[240px]" value={status} onChange={setStatus} options={statusOptions} placeholder="Choose a status" />
      </div>

      <p className={`m-0 text-[13px] ${MUTED}`}>
        A round marked scheduled or in progress moves the candidate to Interview. A rejected round rejects the application. When every round is cleared, the candidate is marked as hired.
      </p>

      {answers.length > 0 && <ScreeningAnswers answers={answers} />}

      <section aria-labelledby="rounds-title" className="flex flex-col gap-2.5">
        <h3 id="rounds-title" className="m-0 text-sm">
          <span className="font-semibold">Interview rounds</span>
        </h3>
        {rounds.length === 0 ? (
          <p className={`m-0 rounded-[10px] border border-[#EEF0F3] bg-[#FAFAF9] px-3.5 py-3 ${MUTED}`}>
            This application has no interview rounds. Changing the pipeline status above is enough.
          </p>
        ) : (
          rounds.map((round, index) => (
            <div key={`${round.roundNumber}-${index}`} className="flex flex-col gap-2.5 rounded-[10px] border border-[#E4E6EA] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">
                  Round {round.roundNumber} · {round.name}
                </span>
                <SelectControl
                  size="sm"
                  className="w-[170px]"
                  aria-label={`Status of round ${round.roundNumber}, ${round.name}`}
                  value={round.status}
                  onChange={(value) => updateRound(index, { status: value })}
                  options={round.status === 'QUALIFIED' ? [...ROUND_OPTIONS, ['QUALIFIED', 'Qualified']] : ROUND_OPTIONS}
                />
              </div>
              <label className="flex flex-col gap-1.5">
                <span className={`text-[13px] ${MUTED}`}>Feedback or instructions for the candidate · optional</span>
                <textarea
                  value={round.feedback}
                  maxLength={FEEDBACK_MAX}
                  onChange={(event) => updateRound(index, { feedback: event.target.value })}
                  rows={2}
                  className="w-full resize-y rounded-[8px] border border-[#D5D9E0] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#6B7280] focus:border-[#1447E6] focus:outline-none focus:ring-2 focus:ring-[#1447E6]/20"
                />
              </label>
            </div>
          ))
        )}
      </section>

      {error && (
        <p role="alert" className="m-0 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[#991B1B]">
          {error}
        </p>
      )}
    </Dialog>
  );
}
