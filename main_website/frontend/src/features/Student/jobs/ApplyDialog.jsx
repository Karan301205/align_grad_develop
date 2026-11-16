import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { TEXT_LIMITS, compactAnswers, getAnswer, isAnswerBlank, setAnswer } from '../../../constants/screeningQuestions';
import { userMessage } from '../../../services/apiClient';
import { BODY, HEADING_FONT, INK, MUTED, PRIMARY, SECONDARY, fieldClass } from '../profile/profileTheme';
import { Dialog, ErrorBanner, RequiredMark, Spinner } from '../profile/ui';
import { companyOf, placeText } from './jobsData';

function Choices({ sq, name, value, onChange, multiple }) {
  const picked = multiple ? value : [value];
  const toggle = (option) => {
    if (!multiple) return onChange(option);
    const next = picked.includes(option) ? picked.filter((item) => item !== option) : [...picked, option];
    return onChange((sq.options || []).filter((item) => next.includes(item)));
  };
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {(sq.options || []).map((option) => {
        const on = picked.includes(option);
        return (
          <label key={option} className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[10px] border px-3.5 py-2 text-[15px] ${on ? 'border-2 border-[#0167F6] bg-[#EEF2FF] px-[13px] font-semibold text-[#0B3FA8]' : `border-[#C9D1E3] bg-white ${INK} hover:border-[#6378F9]`}`}>
            <input type={multiple ? 'checkbox' : 'radio'} name={name} checked={on} onChange={() => toggle(option)} className="size-[18px] shrink-0 accent-[#0167F6]" />
            {option}
          </label>
        );
      })}
    </div>
  );
}

/** One screening question, every question type the recruiter can ask. */
function Question({ sq, index, value, onChange, error }) {
  const id = `apply-q-${sq.id || index}`;
  const type = sq.type || 'LONG_ANSWER';
  const required = sq.required !== false;
  const label = (
    <>
      {index + 1}. {sq.question}
      {required && <RequiredMark />}
      {type === 'CHECKBOX' && <span className={`font-medium ${MUTED}`}> (pick all that apply)</span>}
    </>
  );
  const control =
    type === 'MCQ' || type === 'CHECKBOX' ? (
      <Choices sq={sq} name={id} value={value} onChange={onChange} multiple={type === 'CHECKBOX'} />
    ) : type === 'LONG_ANSWER' ? (
      <textarea id={id} rows={4} maxLength={TEXT_LIMITS.LONG_ANSWER} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} className={fieldClass(error, 'resize-y py-2.5 leading-relaxed')} />
    ) : (
      <input
        id={id}
        type={type === 'DATE' ? 'date' : type === 'TIME' ? 'time' : 'text'}
        maxLength={type === 'SHORT_ANSWER' ? TEXT_LIMITS.SHORT_ANSWER : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={fieldClass(error, `h-11 ${type === 'DATE' || type === 'TIME' ? 'max-w-[240px]' : ''}`)}
      />
    );
  return type === 'MCQ' || type === 'CHECKBOX' ? (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0" aria-describedby={error ? `${id}-error` : undefined}>
      <legend className={`mb-2 p-0 text-[15px] font-semibold ${INK}`}>{label}</legend>
      {control}
      {error && (
        <span id={`${id}-error`} className="text-[13px] font-medium text-[#B42318]">
          {error}
        </span>
      )}
    </fieldset>
  ) : (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={`text-[15px] font-semibold ${INK}`}>
        {label}
      </label>
      {control}
      {error && <span className="text-[13px] font-medium text-[#B42318]">{error}</span>}
    </div>
  );
}

function Seen({ label, children, action, warn }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 rounded-[12px] px-3.5 py-3 ${warn ? 'bg-[#FFF3E8]' : 'bg-[#F4F6FE]'}`}>
      <span className={`text-[12.5px] font-semibold ${warn ? 'text-[#9A3412]' : MUTED}`}>{label}</span>
      {children}
      {action}
    </div>
  );
}

/**
 * Apply (design: Web — apply dialog). Shows what the company receives from the
 * profile, asks the job's screening questions and sends the application.
 * `onApply(jobId, answers)` resolves to { success, error }.
 */
export default function ApplyDialog({ job, profile, bars, onApply, onClose, goToTab }) {
  const company = companyOf(job);
  const questions = Array.isArray(job.screeningQuestions) ? job.screeningQuestions : [];
  const [answers, setAnswers] = useState(() => questions.map((sq) => ({ questionId: sq.id, questionText: sq.question, type: sq.type || 'LONG_ANSWER', answer: sq.type === 'CHECKBOX' ? [] : '' })));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const education = (profile?.education || []).find((edu) => edu.eduType && edu.eduType !== 'High School') || (profile?.education || [])[0];
  const educationLine = education ? [education.eduType === 'High School' ? 'Class 12' : [education.degree, education.fieldOfStudy].filter(Boolean).join(' '), education.institute].filter(Boolean).join(' · ') : '';
  const go = (tab, options) => {
    onClose();
    goToTab?.(tab, options);
  };
  // The intro video is what the company watches, so it is required to apply (the server checks too).
  const needsVideo = !profile?.introVideoUrl;

  const send = async () => {
    const next = {};
    questions.forEach((sq, index) => {
      if (sq.required !== false && isAnswerBlank(getAnswer(answers, sq))) next[sq.id || index] = 'Answer this question.';
    });
    setErrors(next);
    if (Object.keys(next).length) {
      setError('Some details need fixing.');
      return;
    }
    setError('');
    setSending(true);
    try {
      const result = await onApply(job.id, compactAnswers(answers));
      if (result?.success) setSent(true);
      else setError(result?.error || 'Your application couldn’t be sent. Try again.');
    } catch (err) {
      setError(userMessage(err, 'Your application couldn’t be sent. Try again.'));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Dialog title={`Apply to ${job.title}`} subtitle={[company, placeText(job)].filter(Boolean).join(' · ')} onClose={onClose} width="max-w-[600px]">
        <div className="flex flex-col items-center gap-3.5 px-2 py-6 text-center">
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-[#E3F5EE] text-[#0F7A55]">
            <CheckCircle2 className="size-8" />
          </span>
          <h3 className="m-0 text-[22px]">
            <span className={`${HEADING_FONT} font-bold ${INK}`}>Application sent</span>
          </h3>
          <p className={`m-0 max-w-[420px] text-[15px] ${BODY}`}>{company || 'The company'} now has your scores, profile and answers. You’ll see it in Job Progress when they shortlist you or invite you to an interview.</p>
          <div className="mt-1.5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => go('progress', { jobId: job.id })} className={`${PRIMARY} h-11 px-[18px]`}>
              See my applications
            </button>
            <button type="button" onClick={onClose} className={`${SECONDARY} h-11 px-[18px]`}>
              Back to jobs
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title={`Apply to ${job.title}`}
      subtitle={[company, placeText(job)].filter(Boolean).join(' · ')}
      onClose={onClose}
      busy={sending}
      width="max-w-[640px]"
      footer={
        <>
          <span className={`mr-auto text-[13.5px] ${MUTED}`}>Track it later in Job Progress.</span>
          <button type="button" onClick={onClose} disabled={sending} className={`${SECONDARY} h-11 px-4`}>
            Cancel
          </button>
          <button type="button" onClick={send} disabled={sending || needsVideo} className={`${PRIMARY} h-11 px-5`}>
            {sending ? <Spinner /> : <Send aria-hidden="true" className="size-4" />}
            {sending ? 'Sending…' : 'Send application'}
          </button>
        </>
      }
    >
      <ErrorBanner message={error} />
      {needsVideo && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[12px] bg-[#FFF3E8] px-4 py-3">
          <span className="min-w-0 flex-1 font-semibold text-[#9A3412]">Add your intro video to apply. {company || 'The company'} watches it when they open your application.</span>
          <button type="button" onClick={() => go('profile', { section: 'video' })} className={`${PRIMARY} h-10 px-4`}>
            Add intro video
          </button>
        </div>
      )}
      <section aria-labelledby="apply-seen" className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 id="apply-seen" className="m-0 text-[16px]">
            <span className={`${HEADING_FONT} font-bold ${INK}`}>What {company || 'the company'} will see</span>
          </h3>
          <span className={MUTED}>Sent from your profile. Nothing to fill in again.</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Seen label="Skill scores">
            {bars.length ? (
              <span className="flex flex-wrap gap-1">
                {bars.map((bar) => (
                  <span key={bar.skillName} className="rounded-[6px] bg-[#E8EEFF] px-2 py-0.5 text-[12.5px] font-semibold text-[#0B3FA8]">
                    {bar.skillName} {bar.score}
                  </span>
                ))}
              </span>
            ) : (
              <span className={`font-semibold ${INK}`}>All your skills</span>
            )}
          </Seen>
          <Seen
            label="Profile"
            action={
              <button type="button" onClick={() => go('profile')} className="self-start text-[13.5px] font-semibold text-[#0167F6] hover:underline">
                View
              </button>
            }
          >
            <span className={`font-semibold ${INK}`}>{educationLine || profile?.name || 'Your profile'}</span>
          </Seen>
          <Seen
            label="Resume"
            action={
              <button type="button" onClick={() => go('profile')} className="self-start text-[13.5px] font-semibold text-[#0167F6] hover:underline">
                Change
              </button>
            }
          >
            <span className={`font-semibold ${INK}`}>{profile?.resumeUrl ? 'AlignGrad resume + your own' : 'AlignGrad resume'}</span>
          </Seen>
          <Seen
            label="Intro video"
            warn={!profile?.introVideoUrl}
            action={
              needsVideo && (
                <button type="button" onClick={() => go('profile', { section: 'video' })} className="self-start text-[13.5px] font-semibold text-[#0167F6] hover:underline">
                  Add one
                </button>
              )
            }
          >
            <span className={`font-semibold ${INK}`}>{profile?.introVideoUrl ? 'Added' : 'Not added yet'}</span>
          </Seen>
        </div>
      </section>

      {questions.length > 0 && (
        <section aria-labelledby="apply-questions" className="flex flex-col gap-[18px] border-t border-[#EEF0F6] pt-5">
          <h3 id="apply-questions" className="m-0 text-[16px]">
            <span className={`${HEADING_FONT} font-bold ${INK}`}>
              {questions.length} question{questions.length === 1 ? '' : 's'} from {company || 'the company'}
            </span>
          </h3>
          {questions.map((sq, index) => (
            <Question
              key={sq.id || index}
              sq={sq}
              index={index}
              value={getAnswer(answers, sq)}
              error={errors[sq.id || index]}
              onChange={(value) => {
                setAnswers((prev) => setAnswer(prev, sq, value));
                setErrors((prev) => ({ ...prev, [sq.id || index]: '' }));
              }}
            />
          ))}
        </section>
      )}
    </Dialog>
  );
}
