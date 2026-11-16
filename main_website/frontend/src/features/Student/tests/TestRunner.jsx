import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ArrowRight, Check, Clock, GraduationCap, RotateCcw } from 'lucide-react';
import { SERVER_MESSAGE, apiFetch, userMessage } from '../../../services/apiClient';
import { layerTarget } from '../profile/floatingList';
import { BODY, HEADING_FONT, INK, MUTED, PRIMARY, SECONDARY } from '../profile/profileTheme';
import { ConfirmDialog, ErrorBanner, Spinner } from '../profile/ui';
import { companyOf, initialOf, payText, placeText, tileColor } from '../home/homeData';
import { PASS_MARK, TEST_MINUTES, clock, focusTopics, formatShortDate, looksLikeCode, parseQuestion } from './testsData';

const PANEL = 'rounded-[16px] border border-[#E1E5F2] bg-white shadow-[0_1px_2px_rgba(14,27,61,0.04),0_8px_24px_-18px_rgba(14,27,61,0.25)]';
const WARN_MS = 5 * 60 * 1000;
// The theme maps font-mono to Geist, so code in questions names a real code font.
const CODE_FONT = 'font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace]';

function Point({ icon, title, note, tone = 'bg-[#E8EEFF] text-[#0B3FA8]' }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden="true" className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[14px] font-bold ${tone}`}>
        {icon}
      </span>
      <span className="flex flex-col">
        <span className={`font-semibold ${INK}`}>{title}</span>
        <span className={`text-[14px] ${MUTED}`}>{note}</span>
      </span>
    </li>
  );
}

function CodeBlock({ lang, code }) {
  return (
    <div className="overflow-hidden rounded-[12px] bg-[#0E1B3D]">
      <div className="border-b border-white/10 px-4 py-2 text-[12.5px] font-semibold text-[#C7D3FB]">{lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'Code'}</div>
      <pre className="m-0 overflow-x-auto p-4 text-[14.5px] leading-relaxed text-[#F1F3F6]">
        <code className={CODE_FONT}>{code}</code>
      </pre>
    </div>
  );
}

/**
 * One skill test, full screen (design: Web — skill test start, questions, result):
 * the intro, ten questions one at a time (every one must be answered; the server
 * checks too), then the score with how each subtopic went, as a popup over the questions
 * while the sidebar slides back into view. Questions come from
 * POST /student/tests/generate (no answers) and are scored by POST /student/tests/submit.
 * `onFinished()` refreshes the profile, skills and jobs after a result.
 */
export default function TestRunner({ test, previous, testedAt, token, jobs, sidebarExpanded, onClose, onFinished, onOpenJob, goToTab }) {
  const skill = test.skill;
  const [stage, setStage] = useState('intro'); // intro | loading | asking | done
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [quiz, setQuiz] = useState(null); // { sessionId, questions, startedAt, before }
  const [answers, setAnswers] = useState([]);
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [matchedBefore] = useState(() => new Set(jobs.filter((job) => job.matched).map((job) => job.id)));
  const questionRef = useRef(null);
  const dialogRef = useRef(null);

  const total = quiz?.questions.length || 10;
  const answered = answers.filter((answer) => answer !== null).length;
  const timeLeft = quiz ? quiz.startedAt + TEST_MINUTES * 60000 - now : TEST_MINUTES * 60000;
  const expired = stage === 'asking' && timeLeft <= 0;
  const done = stage === 'done';

  useEffect(() => {
    if (stage !== 'asking') return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage === 'asking') questionRef.current?.focus({ preventScroll: false });
  }, [stage, index]);

  useEffect(() => {
    if (done) dialogRef.current?.focus();
  }, [done]);

  const start = async () => {
    setStage('loading');
    setError('');
    setUnavailable(false);
    try {
      const res = await apiFetch('/student/tests/generate', { token, method: 'POST', json: { skillName: skill } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(body.questions) || body.questions.length === 0) {
        // 502 "Not enough questions" = the question bank has no test for this skill yet.
        if (res.status === 502) setUnavailable(true);
        else setError(res.ok ? SERVER_MESSAGE : body.error || SERVER_MESSAGE);
        setStage('intro');
        return;
      }
      setQuiz({ sessionId: body.sessionId, questions: body.questions, startedAt: Date.now(), before: previous });
      setAnswers(body.questions.map(() => null));
      setIndex(0);
      setNow(Date.now());
      setStage('asking');
    } catch (err) {
      setError(userMessage(err, 'The test couldn’t start. Try again.'));
      setStage('intro');
    }
  };

  const submit = async () => {
    const firstOpen = answers.findIndex((answer) => answer === null);
    if (firstOpen >= 0) {
      setIndex(firstOpen);
      setError(`Answer all ${total} questions to submit. Question ${firstOpen + 1} is still open.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch('/student/tests/submit', { token, method: 'POST', json: { sessionId: quiz.sessionId, answers } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(/expired|already-used|invalid/i.test(body.error || '') ? 'This test has run out of time. Start it again to get a new set of questions.' : body.error || SERVER_MESSAGE);
        setSubmitting(false);
        return;
      }
      setResult(body);
      await onFinished?.();
      setStage('done');
    } catch (err) {
      setError(userMessage(err, 'Your answers couldn’t be sent. Try again.'));
    }
    setSubmitting(false);
  };

  const restart = () => {
    setQuiz(null);
    setAnswers([]);
    setResult(null);
    setError('');
    setStage('intro');
  };

  const leave = () => (stage === 'asking' && answered > 0 ? setLeaving(true) : onClose());
  const pick = (option) => {
    setAnswers((prev) => prev.map((answer, i) => (i === index ? option : answer)));
    setError('');
  };

  const question = quiz?.questions[index];
  const parsed = question ? parseQuestion(question.question) : null;
  const mono = question ? parsed.blocks.some((block) => block.type === 'code') && looksLikeCode(question.options) : false;
  const isLast = index === total - 1;

  let body;
  if (stage === 'intro' || stage === 'loading') {
    body = (
      <section className={`${PANEL} flex w-full max-w-[780px] flex-col gap-6 p-6 sm:p-9`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[28px] leading-tight">
              <span className={`${HEADING_FONT} font-bold ${INK}`}>{skill} test</span>
            </h1>
            <span className={MUTED}>
              {previous > 0 ? (
                <>
                  Your score now: <strong className={INK}>{previous}/10</strong>
                  {testedAt ? ` · tested ${formatShortDate(testedAt)}` : ' · self-rated'}
                </>
              ) : (
                'Not tested yet'
              )}
            </span>
          </div>
          {test.need > 0 && test.opens && (
            <span className="rounded-[12px] bg-[linear-gradient(135deg,#E8EEFF,#F1ECFF)] px-3.5 py-2.5 text-[#0B3FA8]">
              Score <strong>{test.need}+</strong> to unlock <strong>{test.opens}</strong>
            </span>
          )}
        </div>
        <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
          <Point icon="10" title="10 multiple-choice questions" note="Some show a few lines of code" />
          <Point icon={<Check className="size-4" />} title="Score = answers you get right" note={`8 right means ${skill} 8/10`} tone="bg-[#E3F5EE] text-[#0B5E41]" />
          <Point icon={<ArrowRight className="size-4" />} title="Answer all 10, change any time" note="Nothing counts until you submit" tone="bg-[#F1ECFF] text-[#5B2AA6]" />
          <Point icon={<Clock className="size-4" />} title={`${TEST_MINUTES} minutes`} note="The clock starts when you press Start" tone="bg-[#FFF3E0] text-[#8A3F06]" />
          {previous > 0 && <Point icon={<AlertCircle className="size-4" />} title={`Your new score replaces ${previous}/10`} note="Even if it’s lower" tone="bg-[#FFF1E8] text-[#9A3412]" />}
          <Point icon={<Check className="size-4" />} title={`${PASS_MARK} or more right is verified`} note="Recruiters see verified scores" tone="bg-[#E8EEFF] text-[#0B3FA8]" />
        </ul>
        <p className={`m-0 rounded-[12px] bg-[#F4F6FE] px-4 py-3 ${BODY}`}>Find a quiet place and do it on your own. Interviewers ask about these skills too.</p>
        <ErrorBanner message={error} />
        {unavailable && <p className="m-0 rounded-[12px] bg-[#FFF3E0] px-4 py-3 font-semibold text-[#8A3F06]">A {skill} test isn’t ready yet. Keep {skill} on your profile as a self-rated skill for now.</p>}
        <div className="flex flex-wrap justify-end gap-2.5">
          <button type="button" onClick={() => goToTab?.('courses', { skill })} className={`${SECONDARY} h-12 px-5`}>
            <GraduationCap aria-hidden="true" className="size-4" /> Learn {skill} first
          </button>
          {!unavailable && (
            <button type="button" onClick={start} disabled={stage === 'loading'} className={`${PRIMARY} h-12 px-7 text-[16px]!`}>
              {stage === 'loading' && <Spinner />}
              {stage === 'loading' ? 'Getting your questions…' : 'Start test'}
            </button>
          )}
        </div>
      </section>
    );
  } else {
    body = (
      <div className="flex w-full max-w-[1140px] flex-wrap items-start justify-center gap-6">
        <section className={`${PANEL} flex min-w-0 max-w-[800px] flex-[1_1_560px] flex-col gap-5 p-5 sm:p-8`}>
          <span className={`text-[14px] font-semibold ${MUTED}`}>
            Question {index + 1} of {total}
          </span>
          <h1 ref={questionRef} tabIndex={-1} className="m-0 text-[21px] leading-snug outline-none">
            <span className={`${HEADING_FONT} whitespace-pre-line break-words font-bold ${INK}`}>{parsed.prompt || question.question}</span>
          </h1>
          {parsed.blocks.map((block, i) =>
            block.type === 'code' ? (
              <CodeBlock key={i} lang={block.lang} code={block.code} />
            ) : (
              <p key={i} className={`m-0 whitespace-pre-line break-words text-[15.5px] ${BODY}`}>
                {block.text}
              </p>
            )
          )}
          <fieldset className="m-0 grid min-w-0 gap-2.5 border-0 p-0 sm:grid-cols-2">
            <legend className="sr-only">Choose one answer</legend>
            {question.options.map((option, i) => {
              const on = answers[index] === i;
              return (
                <label key={i} className={`flex min-h-[54px] cursor-pointer items-center gap-3 rounded-[12px] border px-3.5 py-2.5 transition-colors ${on ? 'border-2 border-[#0167F6] bg-[#EEF2FF] px-[13px] font-semibold text-[#0B3FA8]' : `border-[#C9D1E3] bg-white ${INK} hover:border-[#6378F9]`}`}>
                  <input type="radio" name={`q-${index}`} checked={on} onChange={() => pick(i)} className="size-[18px] shrink-0 accent-[#0167F6]" />
                  <span className={`min-w-0 break-words ${mono ? `${CODE_FONT} text-[14.5px]` : 'text-[15.5px]'}`}>{option}</span>
                </label>
              );
            })}
          </fieldset>
          <ErrorBanner message={error} />
          <div className="flex justify-between gap-2.5 border-t border-[#EEF0F6] pt-4">
            <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className={`${SECONDARY} h-11 px-5`}>
              Previous
            </button>
            {isLast ? (
              <button type="button" onClick={submit} disabled={submitting || expired} className={`${PRIMARY} h-11 px-6`}>
                {submitting && <Spinner />}
                {submitting ? 'Scoring…' : 'Submit test'}
              </button>
            ) : (
              <button type="button" onClick={() => setIndex((i) => Math.min(total - 1, i + 1))} className={`${PRIMARY} h-11 px-6`}>
                Next
              </button>
            )}
          </div>
        </section>

        <aside className={`${PANEL} flex w-full max-w-[800px] flex-[0_1_300px] flex-col gap-3.5 p-5 lg:sticky lg:top-24`}>
          <div className="flex items-center justify-between gap-2">
            <span className={`font-bold ${INK}`}>
              {answered} of {total} answered
            </span>
            <span role="timer" aria-label="Time left" className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13.5px] font-bold tabular-nums ${timeLeft < WARN_MS ? 'bg-[#FFF3E0] text-[#8A3F06]' : 'bg-[#E8EEFF] text-[#0B3FA8]'}`}>
              <Clock aria-hidden="true" className="size-3.5" />
              {clock(timeLeft)}
            </span>
          </div>
          <div role="progressbar" aria-label="Answered" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered} className="h-1.5 rounded-full bg-[#E8EEFF]">
            <div className="h-1.5 rounded-full bg-[linear-gradient(90deg,#0167F6,#6378F9)] transition-[width]" style={{ width: `${(answered / total) * 100}%` }} />
          </div>
          <nav aria-label="Jump to question" className="grid grid-cols-5 gap-1.5">
            {answers.map((answer, i) => {
              const current = i === index;
              const done = answer !== null;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Question ${i + 1}, ${done ? 'answered' : 'not answered'}`}
                  aria-current={current ? 'step' : undefined}
                  onClick={() => setIndex(i)}
                  className={`h-9 rounded-[8px] text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6] ${current ? 'border-2 border-[#0167F6] bg-white text-[#0167F6]' : done ? 'border border-[#0167F6] bg-[#0167F6] text-white' : 'border border-[#C9D1E3] bg-white text-[#1B2B55] hover:border-[#6378F9]'}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </nav>
          <button type="button" onClick={submit} disabled={submitting || expired} className={`h-11 rounded-[10px] border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${answered === total ? 'border-transparent bg-[#0167F6] text-white hover:bg-[#0052C8]' : 'border-[#0167F6] bg-white text-[#0167F6] hover:bg-[#EEF2FF]'}`}>
            {submitting ? 'Scoring…' : 'Submit test'}
          </button>
          <span className={`text-[13.5px] ${MUTED}`}>{answered === total ? 'All answered. Check any you like, then submit.' : `Answer all ${total} to submit (${total - answered} left).`}</span>
          {expired && (
            <div className="flex flex-col gap-2 rounded-[12px] bg-[#FFF3E0] px-3.5 py-3">
              <span className="font-semibold text-[#8A3F06]">Time’s up for this test.</span>
              <button type="button" onClick={restart} className={`${SECONDARY} h-9 self-start px-3 text-[14px]!`}>
                <RotateCcw aria-hidden="true" className="size-4" /> Start again
              </button>
            </div>
          )}
        </aside>
      </div>
    );
  }

  // Result popup over the questions; the layer below it is inert, so only the popup takes input.
  let resultDialog = null;
  if (done) {
    const score = result.rating;
    const before = quiz?.before || 0;
    const diff = before > 0 ? score - before : null;
    const topics = result.topics || [];
    const focus = focusTopics(topics);
    const opened = jobs.filter((job) => job.matched && !job.applied && !matchedBefore.has(job.id));
    const percent = Math.round((result.correct / result.total) * 100);
    const headline = diff === null ? `${skill} is now ${score}/10.` : diff > 0 ? `${skill} is now ${score}. Nice work.` : diff === 0 ? `${skill} stays at ${score}.` : `${skill} is now ${score}.`;
    resultDialog = (
      <div className="absolute inset-0 z-20 overflow-y-auto bg-[#0E1B3D]/45 animate-backdrop-in">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <section ref={dialogRef} role="dialog" aria-labelledby="test-result-title" tabIndex={-1} className={`${PANEL} flex w-full max-w-[720px] flex-wrap gap-6 p-5 outline-none animate-scale-up sm:p-7`}>
            <div className="flex flex-[0_0_auto] flex-col items-center gap-2">
              <div role="img" aria-label={`${result.correct} out of ${result.total} right`} className="flex size-32 items-center justify-center rounded-full" style={{ background: `conic-gradient(#0167F6 0%, #6378F9 ${percent}%, #E8EEFF ${percent}% 100%)` }}>
                <span className="flex size-[102px] flex-col items-center justify-center rounded-full bg-white">
                  <span className={`${HEADING_FONT} text-[38px] font-bold leading-none ${INK}`}>{result.correct}</span>
                  <span className={`text-[14px] ${MUTED}`}>out of {result.total}</span>
                </span>
              </div>
              <span className={`rounded-full px-2.5 py-[3px] text-[13px] font-bold ${diff === null ? 'bg-[#E8EEFF] text-[#0B3FA8]' : diff > 0 ? 'bg-[#E3F5EE] text-[#0B5E41]' : diff < 0 ? 'bg-[#FFF3E0] text-[#8A3F06]' : 'bg-[#EEF0F6] text-[#3B4A6B]'}`}>
                {diff === null ? 'First test' : diff > 0 ? `+${diff} from ${before}` : diff < 0 ? `−${-diff} from ${before}` : 'Same as before'}
              </span>
            </div>
            <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
              <h2 id="test-result-title" className="m-0 text-[24px] leading-tight">
                <span className={`${HEADING_FONT} font-bold ${INK}`}>{headline}</span>
              </h2>
              <p className={`m-0 ${BODY}`}>
                You got {result.correct} of {result.total} questions right. Your profile now shows {skill} {score}/10 · tested {formatShortDate(new Date())}.
              </p>
              <p className={`m-0 rounded-[12px] px-4 py-3 font-semibold ${result.passed ? 'bg-[#E3F5EE] text-[#0B5E41]' : 'bg-[#FFF3E0] text-[#8A3F06]'}`}>
                {result.passed ? `${result.passMark || PASS_MARK} or more right, so recruiters see ${skill} as verified.` : `Verified needs ${result.passMark || PASS_MARK} right. Practise the topics below and take it again.`}
              </p>

              {topics.length > 0 && (
                <section aria-labelledby="by-topic" className="flex flex-col gap-2.5">
                  <h2 id="by-topic" className="m-0 text-[16px]">
                    <span className={`${HEADING_FONT} font-bold ${INK}`}>How you did by topic</span>
                  </h2>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {topics.map((topic) => (
                      <li key={topic.name} className="grid grid-cols-[minmax(0,1fr)_120px_52px] items-center gap-3">
                        <span className={`min-w-0 truncate font-semibold ${INK}`}>{topic.name}</span>
                        <span aria-hidden="true" className="h-2 rounded-full bg-[#E8EEFF]">
                          <span className={`block h-2 rounded-full ${topic.correct === topic.total ? 'bg-[#0F7A55]' : topic.correct === 0 ? 'bg-[#C8281C]' : 'bg-[#E0782F]'}`} style={{ width: `${(topic.correct / topic.total) * 100}%` }} />
                        </span>
                        <span className={`text-right tabular-nums text-[14px] font-semibold ${BODY}`}>
                          {topic.correct}/{topic.total}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {focus.length > 0 ? (
                    <div className="flex flex-col gap-1.5 rounded-[12px] border border-[#FED7AA] bg-[#FFF8F1] px-4 py-3">
                      <span className="font-bold text-[#9A3412]">Focus on</span>
                      <div className="flex flex-wrap gap-1.5">
                        {focus.map((topic) => (
                          <span key={topic.name} className="rounded-full bg-white px-2.5 py-1 text-[13.5px] font-semibold text-[#8A3F06] ring-1 ring-[#FED7AA]">
                            {topic.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="m-0 font-semibold text-[#0B5E41]">Every topic right. Well done.</p>
                  )}
                </section>
              )}

              {opened.length > 0 && (
                <div className="flex flex-col gap-2.5 rounded-[14px] bg-[linear-gradient(135deg,#E8EEFF,#F1ECFF)] p-4">
                  <span className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#0B3FA8]">{opened.length === 1 ? 'New job open to you' : `${opened.length} new jobs open to you`}</span>
                  <span className="flex items-center gap-3">
                    <span aria-hidden="true" style={{ background: tileColor(companyOf(opened[0]) || opened[0].title) }} className="flex size-10 shrink-0 items-center justify-center rounded-[10px] font-bold text-white">
                      {initialOf(companyOf(opened[0]) || opened[0].title)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className={`font-bold ${INK}`}>{[opened[0].title, companyOf(opened[0])].filter(Boolean).join(' · ')}</span>
                      <span className={`text-[14px] ${BODY}`}>{[placeText(opened[0]), payText(opened[0]), 'you now meet every bar'].filter(Boolean).join(' · ')}</span>
                    </span>
                  </span>
                  <button type="button" onClick={() => onOpenJob?.(opened[0])} className={`${PRIMARY} h-11 self-start px-5`}>
                    View and apply
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onClose} className={`${PRIMARY} h-11 px-5`}>
                  Back to skills
                </button>
                <button type="button" onClick={restart} className={`${SECONDARY} h-11 px-4`}>
                  <RotateCcw aria-hidden="true" className="size-4" /> Retake test
                </button>
                {!result.passed && (
                  <button type="button" onClick={() => goToTab?.('courses', { skill })} className={`${SECONDARY} h-11 px-4`}>
                    <GraduationCap aria-hidden="true" className="size-4" /> Learn {skill}
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Once the test is over the layer's left edge slides to the sidebar's edge, which reveals the sidebar.
  const layerLeft = done ? (sidebarExpanded ? 'left-0 md:left-64' : 'left-0 md:left-20') : 'left-0';

  return createPortal(
    <div role="region" aria-label={`${skill} test`} className={`fixed inset-y-0 right-0 z-[80] overflow-hidden bg-[#F4F6FE] bg-[radial-gradient(900px_320px_at_100%_-140px,rgba(250,145,253,0.18),transparent_70%),radial-gradient(800px_300px_at_0%_-120px,rgba(1,103,246,0.12),transparent_70%)] bg-no-repeat text-[15px] text-[#0E1B3D] transition-[left] duration-500 ease-in-out motion-reduce:transition-none ${layerLeft}`}>
      <div inert={done} className="flex h-full flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#E1E5F2] bg-white/95 px-4 py-3 backdrop-blur sm:px-8">
          <div className="flex items-center gap-4">
            <img src="/a_g_logo.webp" alt="AlignGrad" className="h-8 w-auto" />
            <span aria-hidden="true" className="h-6 w-px bg-[#E1E5F2]" />
            <span className={`font-bold ${INK}`}>{skill} test</span>
          </div>
          <button type="button" onClick={leave} disabled={submitting} className={`${SECONDARY} h-10 px-4 text-[14px]!`}>
            Leave test
          </button>
        </header>
        <main className="flex flex-1 items-start justify-center px-4 py-8 sm:px-6 sm:py-12">{body}</main>
      </div>
      {resultDialog}
      {leaving && (
        <ConfirmDialog title="Leave the test?" confirmLabel="Leave test" tone="danger" onConfirm={onClose} onClose={() => setLeaving(false)}>
          Your answers won’t be saved and nothing changes on your profile.{previous > 0 ? ` ${skill} stays at ${previous}/10.` : ''}
        </ConfirmDialog>
      )}
    </div>,
    layerTarget()
  );
}
