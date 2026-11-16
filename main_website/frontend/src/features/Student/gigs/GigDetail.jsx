import { useState } from 'react';
import { BadgeCheck, CheckCircle2, FileText, Lock, Paperclip, Plus, Send, X } from 'lucide-react';
import { uploadGigFile } from '../../Gigs/useGigChat';
import { cleanMultiline, cleanUrl, normalizeUrl, urlError } from '../profile/profileRules';
import { BODY, CARD, GRADIENT, HEADING_FONT, INK, MUTED, PRIMARY, SECONDARY, SMALL, fieldClass } from '../profile/profileTheme';
import { ConfirmDialog, ErrorBanner, Field, RequiredMark, Spinner, TextArea, TextInput } from '../profile/ui';
import { budgetText, categoryText, companyOf, deliveryText, fileNameOf, gapText, gigBars, postedLower, safeLink } from './gigsData';

const PITCH_MAX = 1000;
const PITCH_MIN = 20;

const SubHeading = ({ id, children }) => (
  <h3 id={id} className="m-0 text-[16px]">
    <span className={`${HEADING_FONT} font-bold ${INK}`}>{children}</span>
  </h3>
);

/** Gig files (brief attachments, pitch samples, finished work): web links only. */
export function FileLink({ url, label }) {
  const href = safeLink(url);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2.5 rounded-[12px] border border-[#E1E5F2] bg-white px-3.5 py-3 hover:border-[#6378F9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]">
      <FileText aria-hidden="true" className="size-[18px] shrink-0 text-[#6378F9]" />
      <span className={`min-w-0 flex-1 truncate font-semibold ${INK}`}>{label || fileNameOf(href)}</span>
      <span className="shrink-0 font-semibold text-[#0167F6]">Open</span>
    </a>
  );
}

/** Shown in place of a gig that's outside the free part of the list. */
export function LockedGig({ onUpgrade, goToTab }) {
  return (
    <article aria-label="Gig details" className={`${CARD} flex flex-col items-center gap-3 p-8 text-center`}>
      <span aria-hidden="true" className={`flex size-14 items-center justify-center rounded-[16px] text-white ${GRADIENT}`}>
        <Lock className="size-6" />
      </span>
      <h2 className="m-0 text-[20px]">
        <span className={`${HEADING_FONT} font-bold ${INK}`}>This gig is part of Student Pro</span>
      </h2>
      <p className={`m-0 max-w-[420px] ${BODY}`}>Free accounts see the top gigs of each list. Student Pro shows every gig, with search and filters.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={onUpgrade} className={`${PRIMARY} h-11 px-5`}>
          See Student Pro
        </button>
        <button type="button" onClick={() => goToTab?.('tests')} className={`${SECONDARY} h-11 px-4`}>
          Test a new skill
        </button>
      </div>
    </article>
  );
}

/** After a pitch is sent (kept by the page: the gig leaves "You can pitch" at once). */
export function PitchSent({ gig, onShowMine, onBack }) {
  return (
    <article aria-label="Pitch sent" className={`${CARD} flex flex-col items-center gap-3 px-6 py-12 text-center`}>
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-[#E8EEFF] text-[#0167F6]">
        <Send className="size-7" />
      </span>
      <h2 className="m-0 text-[22px]">
        <span className={`${HEADING_FONT} font-bold ${INK}`}>Pitch sent</span>
      </h2>
      <p className={`m-0 max-w-[440px] text-[15px] ${BODY}`}>
        {companyOf(gig) || 'The company'} sees it with your scores and profile. If they pick you, a chat opens in My gigs so you can start.
      </p>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={onShowMine} className={`${PRIMARY} h-11 px-5`}>
          See my gigs
        </button>
        <button type="button" onClick={onBack} className={`${SECONDARY} h-11 px-4`}>
          Back to gigs
        </button>
      </div>
    </article>
  );
}

function Question({ question, index, value, onChange, error }) {
  const id = `pitch-q-${question.id || index}`;
  const required = question.required !== false;
  const label = (
    <>
      {index + 1}. {question.question}
      {required && <RequiredMark />}
    </>
  );
  if (question.type === 'MCQ') {
    return (
      <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
        <legend className={`mb-1 p-0 text-[15px] font-semibold ${INK}`}>{label}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(question.options || []).map((option) => {
            const on = value === option;
            return (
              <label key={option} className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[10px] border px-3.5 py-2 text-[15px] ${on ? 'border-2 border-[#0167F6] bg-[#EEF2FF] px-[13px] font-semibold text-[#0B3FA8]' : `border-[#C9D1E3] bg-white ${INK} hover:border-[#6378F9]`}`}>
                <input type="radio" name={id} checked={on} onChange={() => onChange(option)} className="size-[18px] shrink-0 accent-[#0167F6]" />
                {option}
              </label>
            );
          })}
        </div>
        {error && <span className="text-[13px] font-medium text-[#B42318]">{error}</span>}
      </fieldset>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={`text-[15px] font-semibold ${INK}`}>
        {label}
      </label>
      <textarea id={id} rows={3} maxLength={2000} value={value} onChange={(event) => onChange(cleanMultiline(event.target.value))} aria-invalid={Boolean(error)} className={fieldClass(error, 'resize-y py-2.5 leading-relaxed')} />
      {error && <span className="text-[13px] font-medium text-[#B42318]">{error}</span>}
    </div>
  );
}

/** The pitch (design: "Your pitch"): why you, an optional work sample, and the gig's questions. */
function PitchForm({ gig, token, onCancel, onSent }) {
  const questions = Array.isArray(gig.screeningQuestions) ? gig.screeningQuestions : [];
  const [why, setWhy] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const company = companyOf(gig) || 'the company';

  const send = async () => {
    const next = {};
    const text = why.trim();
    if (!text) next.why = 'Tell them why you.';
    else if (text.length < PITCH_MIN) next.why = 'Add a little more detail.';
    const linkProblem = urlError(link, { field: 'link' });
    if (linkProblem) next.link = linkProblem;
    questions.forEach((question, index) => {
      if (question.required !== false && !String(answers[question.id || index] || '').trim()) next[`q${index}`] = 'Answer this question.';
    });
    setErrors(next);
    if (Object.keys(next).length) {
      setError('Some details need fixing.');
      return;
    }
    setError('');
    setSending(true);
    try {
      const attachments = [link.trim() && normalizeUrl(link)].filter(Boolean);
      if (file) attachments.push(await uploadGigFile(file, token));
      const result = await onSent({
        message: text,
        attachments,
        answers: questions
          .map((question, index) => ({ questionId: question.id || null, questionText: question.question, type: question.type === 'MCQ' ? 'MCQ' : 'LONG_ANSWER', answer: String(answers[question.id || index] || '').trim() }))
          .filter((answer) => answer.answer)
      });
      if (!result.ok) setError(result.error);
    } catch (err) {
      console.error('[gigs] Pitch upload failed:', err);
      setError(err.message || 'Your pitch couldn’t be sent. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6">
      <SubHeading>Your pitch</SubHeading>
      <ErrorBanner message={error} />
      <Field id="pitch-why" label="Why you" required error={errors.why} hint="How you’d do it, and any similar work. A few lines is enough." counter={{ text: `${why.length} / ${PITCH_MAX}`, over: why.length > PITCH_MAX }}>
        <TextArea id="pitch-why" rows={5} maxLength={PITCH_MAX} value={why} onChange={(value) => { setWhy(value); setErrors((prev) => ({ ...prev, why: '' })); }} clean={cleanMultiline} error={errors.why} hint="How you’d do it, and any similar work. A few lines is enough." />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pitch-link" label="Link to similar work" error={errors.link} hint="GitHub, Drive, a portfolio…">
          <TextInput id="pitch-link" type="url" inputMode="url" maxLength={300} value={link} onChange={(value) => { setLink(value); setErrors((prev) => ({ ...prev, link: '' })); }} clean={cleanUrl} error={errors.link} placeholder="https://github.com/…" className="h-11" />
        </Field>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={`text-[14px] font-semibold ${INK}`}>Or attach a file</span>
          {file ? (
            <span className="flex h-11 min-w-0 items-center gap-2 rounded-[10px] border border-[#C9D1E3] bg-[#F4F6FE] px-3">
              <Paperclip aria-hidden="true" className="size-4 shrink-0 text-[#475373]" />
              <span className={`min-w-0 flex-1 truncate font-semibold ${INK}`}>{file.name}</span>
              <button type="button" onClick={() => setFile(null)} aria-label={`Remove ${file.name}`} className="flex size-8 items-center justify-center rounded-full text-[#475373] hover:bg-white">
                <X className="size-4" />
              </button>
            </span>
          ) : (
            <label className={`${SECONDARY} h-11 cursor-pointer px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0167F6]`}>
              <Paperclip aria-hidden="true" className="size-4" /> Choose a file
              <input type="file" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </label>
          )}
          <span className={`text-[13px] ${MUTED}`}>Images up to 2 MB, other files up to 10 MB.</span>
        </div>
      </div>
      {questions.length > 0 && (
        <section aria-label="Questions" className="flex flex-col gap-4 border-t border-[#EEF0F6] pt-5">
          <SubHeading>
            {questions.length} question{questions.length === 1 ? '' : 's'} from {company}
          </SubHeading>
          {questions.map((question, index) => (
            <Question
              key={question.id || index}
              question={question}
              index={index}
              value={answers[question.id || index] || ''}
              error={errors[`q${index}`]}
              onChange={(value) => {
                setAnswers((prev) => ({ ...prev, [question.id || index]: value }));
                setErrors((prev) => ({ ...prev, [`q${index}`]: '' }));
              }}
            />
          ))}
        </section>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F6] pt-4">
        <span className={MUTED}>{companyOf(gig) || 'The company'} also sees your scores and profile.</span>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={sending} className={`${SECONDARY} h-11 px-4`}>
            Cancel
          </button>
          <button type="button" onClick={send} disabled={sending} className={`${PRIMARY} h-11 px-5`}>
            {sending ? <Spinner /> : <Send aria-hidden="true" className="size-4" />}
            {sending ? 'Sending…' : 'Send pitch'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * One gig beside the list (design: Web — gigs browse, details, pitch): the brief,
 * files, your scores against each skill bar and the next step (pitch, take a test,
 * add a skill). `onPitch(body)` resolves to { ok, error }.
 */
export default function GigDetail({ gig, profile, token, onPitch, onTakeTest, onAddSkillWithoutTest, onOpenCompanyProfile, goToTab, onShowMine }) {
  const [pitching, setPitching] = useState(false);
  const [confirm, setConfirm] = useState(null); // a no-test skill bar to add to the profile
  const [busy, setBusy] = useState(false);

  const company = companyOf(gig);
  const bars = gigBars(gig, profile?.skills);
  const missing = gig.missingRequirements || [];
  const files = (gig.attachments || []).filter(safeLink);
  const open = gig.status === 'OPEN';

  const runConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await onAddSkillWithoutTest?.({ skillName: confirm.skillName, rating: Math.min(10, Math.max(1, confirm.needs)) });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const barAction = (bar) => {
    if (bar.hasTest) {
      return (
        <button type="button" onClick={() => onTakeTest?.({ skillName: bar.skillName, need: bar.needs, opens: gig.title })} className={`${PRIMARY} ${SMALL}`}>
          {bar.hasSkill && bar.score > 0 ? 'Retake' : 'Take'} {bar.skillName} test
        </button>
      );
    }
    if (!bar.hasSkill) {
      return (
        <button type="button" onClick={() => setConfirm(bar)} className={`${PRIMARY} ${SMALL}`}>
          <Plus aria-hidden="true" className="size-4" /> Add {bar.skillName} to profile
        </button>
      );
    }
    return (
      <button type="button" onClick={() => goToTab?.('profile')} className={`${SECONDARY} ${SMALL}`}>
        Update your {bar.skillName} rating
      </button>
    );
  };

  return (
    <article aria-label="Gig details" className={`${CARD} flex min-w-0 flex-col overflow-hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EEF0F6] p-5 sm:p-6">
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1">
          <span className="self-start rounded-[6px] bg-[linear-gradient(90deg,#E8EEFF,#F1ECFF)] px-2 py-[3px] text-[12.5px] font-bold text-[#0B3FA8]">Gig{categoryText(gig) ? ` · ${categoryText(gig)}` : ''}</span>
          <h2 className="m-0 mt-1 text-[22px] leading-tight">
            <span className={`${HEADING_FONT} break-words font-bold ${INK}`}>{gig.title}</span>
          </h2>
          <span className={`text-[15px] ${BODY}`}>
            {company &&
              (gig.company?.id && onOpenCompanyProfile ? (
                <button type="button" onClick={() => onOpenCompanyProfile(gig.company.id)} className="font-semibold text-[#0E1B3D] hover:text-[#0167F6] hover:underline">
                  {company}
                </button>
              ) : (
                <span className="font-semibold">{company}</span>
              ))}
            {gig.company?.verified && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle font-semibold text-[#0167F6]">
                <BadgeCheck aria-hidden="true" className="size-4" /> Verified
              </span>
            )}
            {postedLower(gig.createdAt) && ` · posted ${postedLower(gig.createdAt)}`}
          </span>
        </div>
        <dl className="m-0 flex gap-2">
          <div className="rounded-[12px] bg-[#F4F6FE] px-3.5 py-2.5">
            <dt className={`text-[12.5px] ${MUTED}`}>Budget</dt>
            <dd className={`m-0 text-[17px] font-bold ${INK}`}>{budgetText(gig)}</dd>
          </div>
          {deliveryText(gig) && (
            <div className="rounded-[12px] bg-[#F4F6FE] px-3.5 py-2.5">
              <dt className={`text-[12.5px] ${MUTED}`}>Deliver in</dt>
              <dd className={`m-0 text-[17px] font-bold ${INK}`}>{deliveryText(gig)}</dd>
            </div>
          )}
        </dl>
      </div>

      {pitching ? (
        <PitchForm gig={gig} token={token} onCancel={() => setPitching(false)} onSent={onPitch} />
      ) : (
        <div className="flex flex-wrap gap-6 p-5 sm:p-6">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
            <SubHeading>The brief</SubHeading>
            <p className={`m-0 whitespace-pre-line break-words text-[15px] ${BODY}`}>{gig.description}</p>
            {files.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                <SubHeading>Files</SubHeading>
                {files.map((url) => (
                  <FileLink key={url} url={url} />
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3.5">
            <SubHeading>Your scores vs. this gig</SubHeading>
            {bars.length === 0 ? (
              <p className={`m-0 ${BODY}`}>This gig has no skill bars.</p>
            ) : (
              bars.map((bar) => (
                <div key={bar.skillName} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`font-semibold ${INK}`}>{bar.skillName}</span>
                    <span className={`tabular-nums font-semibold ${bar.met ? 'text-[#0B3FA8]' : 'text-[#9A3412]'}`}>
                      {bar.needs <= 1 ? 'Any level' : `${bar.hasSkill ? bar.score : 'Not added'} · needs ${bar.needs}`}
                    </span>
                  </div>
                  {bar.needs > 1 && (
                    <div role="img" aria-label={`${bar.skillName}: ${bar.hasSkill ? `${bar.score} out of 10` : 'not on your profile'}, needs ${bar.needs}`} className="relative h-2.5 rounded-full bg-[#E8EEFF]">
                      <div className={`absolute inset-y-0 left-0 rounded-full ${bar.met ? 'bg-[linear-gradient(90deg,#0167F6,#6378F9)]' : 'bg-[#E0782F]'}`} style={{ width: `${Math.min(100, bar.score * 10)}%` }} />
                      <div aria-hidden="true" className="absolute -bottom-1 -top-1 w-0.5 rounded bg-[#0E1B3D]" style={{ left: `calc(${Math.min(100, bar.needs * 10)}% - 1px)` }} />
                    </div>
                  )}
                  {!bar.met && !gig.hasApplied && missing.length > 1 && <div className="pt-1">{barAction(bar)}</div>}
                </div>
              ))
            )}

            {gig.hasApplied ? (
              <div className="flex flex-col gap-2 rounded-[12px] bg-[#E3F5EE] px-3.5 py-3">
                <span className="inline-flex items-center gap-1.5 font-bold text-[#0B5E41]">
                  <CheckCircle2 aria-hidden="true" className="size-4" /> You pitched for this gig
                </span>
                <button type="button" onClick={onShowMine} className={`${SECONDARY} ${SMALL} self-start`}>
                  See my gigs
                </button>
              </div>
            ) : !open ? (
              <div className="rounded-[12px] bg-[#EEF0F6] px-3.5 py-3 font-semibold text-[#3B4A6B]">This gig isn’t taking pitches right now.</div>
            ) : missing.length === 0 && !profile?.introVideoUrl ? (
              <div className="flex flex-col gap-2.5 rounded-[12px] border border-[#FED7AA] bg-[#FFF3E8] px-3.5 py-3">
                <span className="font-bold text-[#9A3412]">Add your intro video to pitch</span>
                <span className={`text-[14px] ${BODY}`}>The recruiter watches it when they open your pitch.</span>
                <button type="button" onClick={() => goToTab?.('profile', { section: 'video' })} className={`${PRIMARY} h-11`}>
                  Add intro video
                </button>
              </div>
            ) : missing.length === 0 ? (
              <div className="flex flex-col gap-2.5 rounded-[12px] bg-[#EEF2FF] px-3.5 py-3">
                <span className="font-bold text-[#0B3FA8]">You can pitch for this gig</span>
                <button type="button" onClick={() => setPitching(true)} className={`${PRIMARY} h-11`}>
                  Send a pitch
                </button>
              </div>
            ) : missing.length === 1 ? (
              <div className="flex flex-col gap-2.5 rounded-[12px] border border-[#FED7AA] bg-[#FFF3E8] px-3.5 py-3">
                <span className="font-bold text-[#9A3412]">1 skill away: {gapText(missing[0])}</span>
                {barAction(bars.find((bar) => bar.skillName.toLowerCase() === missing[0].skillName.toLowerCase()) || { skillName: missing[0].skillName, needs: missing[0].requiredRating, score: missing[0].currentRating, hasSkill: missing[0].onProfile, hasTest: missing[0].hasTest })}
              </div>
            ) : (
              <div className="rounded-[12px] bg-[#F1ECFF] px-3.5 py-3 font-bold text-[#5B2AA6]">{missing.length} skill bars to meet before you can pitch</div>
            )}

            <ol className={`m-0 mt-1 flex list-decimal flex-col gap-1 pl-5 text-[14px] ${BODY}`}>
              <li>Send a pitch: why you, and any similar work</li>
              <li>If picked, a chat opens and you start</li>
              <li>Submit your finished work for approval</li>
            </ol>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog title={`Add ${confirm.skillName} to your profile?`} confirmLabel="Add skill" busyLabel="Adding…" busy={busy} onConfirm={runConfirm} onClose={() => setConfirm(null)}>
          {`There’s no ${confirm.skillName} test yet, so it’s added as self-rated ${Math.min(10, Math.max(1, confirm.needs))}/10 and counts for this gig.`}
        </ConfirmDialog>
      )}
    </article>
  );
}
