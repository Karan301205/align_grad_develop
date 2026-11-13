import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock, Download, FileText, HelpCircle, PlayCircle, RotateCcw, X } from 'lucide-react';
import { BODY, CARD, GRADIENT_X, HEADING_FONT, INK, MUTED, PAGE, PRIMARY, SECONDARY, SMALL, SOFT, TONES } from '../profile/profileTheme';
import { ErrorBanner, Spinner } from '../profile/ui';
import { downloadNotes, flatLessons, progressOf, request, startLesson, youTubeEmbed } from './learnData';

/** Share of an uploaded video that has to be played (not skipped) to complete the lesson. */
const WATCHED_TO_COMPLETE = 0.5;
const MODULE_TONES = ['blue', 'violet', 'plum', 'peri', 'green', 'amber'].map((tone) => TONES[tone].icon);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * A course: the lesson video, its notes, quiz and description, and the course content
 * list. A lesson completes when half its uploaded video has been played, when it is
 * opened if there is nothing to watch (no video, or a YouTube link), or when its quiz
 * is submitted (lessons with a quiz and no video).
 */
export default function CoursePlayer({ courseId, token, onBack }) {
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');
  const [lessonId, setLessonId] = useState(null);
  const [stream, setStream] = useState({ state: 'loading', url: '' }); // loading | ready | none | failed
  const [watched, setWatched] = useState(0);
  const [tab, setTab] = useState('notes');
  const [quizPrompt, setQuizPrompt] = useState(false);
  const [closed, setClosed] = useState({});
  const requested = useRef(new Set()); // lessons completed or with a request sent
  const streamFor = useRef(null); // the lesson whose video is wanted (late answers are ignored)
  const tabsRef = useRef(null);

  const complete = async (id) => {
    if (requested.current.has(id)) return;
    requested.current.add(id);
    const { data } = await request(`/courses/${courseId}/lessons/${id}/complete`, { token, method: 'POST' }, '');
    if (data) setCourse((prev) => ({ ...prev, enrollment: data.enrollment }));
    else requested.current.delete(id); // tried again next time
  };

  const openLesson = async (lesson, nextTab = 'notes') => {
    setLessonId(lesson.id);
    setTab(nextTab);
    setQuizPrompt(false);
    setWatched(0);
    streamFor.current = lesson.id;
    if (!lesson.hasVideo) {
      setStream({ state: 'none', url: '' });
      if (!lesson.quiz) complete(lesson.id);
      return;
    }
    setStream({ state: 'loading', url: '' });
    const { data } = await request(`/courses/${courseId}/lessons/${lesson.id}/stream`, { token }, '');
    if (streamFor.current !== lesson.id) return;
    const url = data?.streamUrl || '';
    setStream({ state: !data ? 'failed' : url ? 'ready' : 'none', url });
    if (youTubeEmbed(url)) complete(lesson.id);
  };

  const load = async () => {
    setError('');
    const { data, error: failed } = await request(`/courses/${courseId}`, { token }, 'This course couldn’t be opened. Try again.');
    if (failed) return setError(failed);
    requested.current = new Set(data.course.enrollment.completedLessonIds);
    setCourse(data.course);
    const first = startLesson(data.course);
    if (first) openLesson(first);
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const back = (
    <button type="button" onClick={onBack} className={`${SECONDARY} ${SMALL} self-start`}>
      <ArrowLeft aria-hidden="true" className="size-4" /> All courses
    </button>
  );

  if (!course) {
    return (
      <div className={PAGE}>
        <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-4">
          {back}
          {error ? (
            <>
              <ErrorBanner message={error} />
              <button type="button" onClick={load} className={`${SECONDARY} h-10 px-4`}>
                Try again
              </button>
            </>
          ) : (
            <span className={`flex items-center gap-2 ${MUTED}`}>
              <Spinner /> Opening the course…
            </span>
          )}
        </div>
      </div>
    );
  }

  const lessons = flatLessons(course);
  const progress = progressOf(course);
  const index = lessons.findIndex((item) => item.id === lessonId);
  const lesson = lessons[index] || null;
  const prev = lessons[index - 1];
  const next = index >= 0 ? lessons[index + 1] : null;
  const embed = youTubeEmbed(stream.url);
  const tabs = [
    { id: 'notes', label: 'Notes' },
    lesson?.quiz && { id: 'quiz', label: `Quiz · ${lesson.quiz.questions.length}` },
    { id: 'about', label: 'About' }
  ].filter(Boolean);
  const shownTab = tabs.some((item) => item.id === tab) ? tab : 'notes';

  const showQuiz = (item) => {
    if (item.id === lessonId) setTab('quiz');
    else openLesson(item, 'quiz');
    setQuizPrompt(false);
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onProgress = (event) => {
    const video = event.currentTarget;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    let seconds = 0;
    for (let i = 0; i < video.played.length; i++) seconds += video.played.end(i) - video.played.start(i);
    setWatched(Math.min(100, Math.floor((seconds / video.duration) * 100)));
    if (seconds >= video.duration * WATCHED_TO_COMPLETE) complete(lessonId);
  };

  let status = null;
  if (lesson && progress.done.has(lesson.id)) status = { text: 'Completed', icon: Check, tone: 'bg-[#E3F5EE] text-[#0B5E41]' };
  else if (stream.state === 'failed') status = { text: 'Video unavailable', icon: X, tone: 'bg-[#FDECEA] text-[#8C1D14]' };
  else if (stream.state === 'ready' && !embed) status = { text: `${watched}% watched · completes at ${WATCHED_TO_COMPLETE * 100}%`, icon: Clock, tone: 'bg-[#E8EEFF] text-[#0B3FA8]' };
  else if (stream.state === 'none' && lesson?.quiz) status = { text: 'Completes when you submit the quiz', icon: HelpCircle, tone: 'bg-[#F1ECFF] text-[#5B2AA6]' };

  return (
    <div className={PAGE}>
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5">
        <header className="flex flex-col gap-3">
          {back}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[13.5px] font-bold uppercase tracking-wide text-[#7B3FD0]">{course.category}</span>
              <h1 className="m-0 text-[26px] leading-tight">
                <span className={`${HEADING_FONT} font-bold ${INK}`}>{course.title}</span>
              </h1>
            </div>
            <div className="flex w-full max-w-[300px] flex-col gap-1.5">
              <span className="flex justify-between gap-3 text-[14px]">
                <span className={`font-semibold ${BODY}`}>
                  {progress.count} of {plural(progress.total, 'lesson')} done
                </span>
                <span className="font-bold text-[#0167F6]">{progress.percent}%</span>
              </span>
              <div role="img" aria-label={`${progress.percent}% of the course done`} className="h-2.5 rounded-full bg-[#E8EEFF]">
                <div className={`h-full rounded-full ${GRADIENT_X}`} style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          </div>
        </header>

        {!lesson ? (
          <p className={`m-0 ${CARD} px-5 py-4 ${BODY}`}>This course has no lessons yet.</p>
        ) : (
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
              <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[16px] bg-[#0B1430] shadow-[0_18px_40px_-24px_rgba(14,27,61,0.8)]">
                {stream.state === 'loading' ? (
                  <span className="flex items-center gap-2 text-white">
                    <Spinner className="size-5" /> Loading video…
                  </span>
                ) : stream.state === 'ready' && embed ? (
                  <iframe key={embed} src={embed} title={lesson.title} className="size-full border-0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                ) : stream.state === 'ready' ? (
                  <video
                    key={stream.url}
                    src={stream.url}
                    controls
                    autoPlay
                    playsInline
                    controlsList="nodownload"
                    className="size-full bg-black object-contain"
                    onTimeUpdate={onProgress}
                    onEnded={() => lesson.quiz && setQuizPrompt(true)}
                    onError={() => setStream((current) => ({ ...current, state: 'failed' }))}
                  />
                ) : (
                  <div className="flex max-w-md flex-col items-center gap-3 px-6 text-center text-white">
                    <PlayCircle aria-hidden="true" className="size-10 text-[#B386F9]" />
                    <p className="m-0 text-[16px] font-semibold">
                      {stream.state === 'failed' ? 'This video couldn’t be played right now.' : 'This lesson has no video. Read the notes below.'}
                    </p>
                    {stream.state === 'failed' && (
                      <button type="button" onClick={() => openLesson(lesson, shownTab)} className={`${SECONDARY} ${SMALL}`}>
                        Try again
                      </button>
                    )}
                  </div>
                )}
              </div>

              <section className={`${CARD} flex flex-col gap-3 p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-[#E8EEFF] px-3 py-1 text-[13.5px] font-bold text-[#0B3FA8]">
                    {lesson.moduleTitle} · Lesson {lesson.number} of {lessons.length}
                  </span>
                  {status && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13.5px] font-bold ${status.tone}`}>
                      <status.icon aria-hidden="true" className="size-4" /> {status.text}
                    </span>
                  )}
                </div>
                <h2 className="m-0 text-[22px] leading-snug">
                  <span className={`${HEADING_FONT} font-bold ${INK}`}>{lesson.title}</span>
                </h2>
                {(lesson.duration || lesson.subTopic) && (
                  <div className="flex flex-wrap items-center gap-2 text-[14px]">
                    {lesson.duration && (
                      <span className={`inline-flex items-center gap-1.5 ${MUTED}`}>
                        <Clock aria-hidden="true" className="size-4" /> {lesson.duration}
                      </span>
                    )}
                    {lesson.subTopic && <span className="rounded-[6px] bg-[#F1ECFF] px-2 py-[3px] font-semibold text-[#5B2AA6]">{lesson.subTopic}</span>}
                  </div>
                )}
                <div className="flex flex-wrap justify-between gap-2 border-t border-[#EEF0F6] pt-3">
                  <button type="button" onClick={() => openLesson(prev)} disabled={!prev} className={`${SECONDARY} h-10 px-4`}>
                    <ChevronLeft aria-hidden="true" className="size-4" /> Previous
                  </button>
                  <button type="button" onClick={() => openLesson(next)} disabled={!next} className={`${PRIMARY} h-10 px-4`}>
                    Next lesson <ChevronRight aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </section>

              {quizPrompt && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#D9C8F5] bg-[#F5F0FF] px-5 py-4">
                  <span className="flex flex-col">
                    <span className="font-bold text-[#5B2AA6]">Video finished</span>
                    <span className={BODY}>Check what you learned: {plural(lesson.quiz.questions.length, 'question')}.</span>
                  </span>
                  <button type="button" onClick={() => showQuiz(lesson)} className={`${PRIMARY} h-10 px-4`}>
                    Take the quiz
                  </button>
                </div>
              )}

              <section ref={tabsRef} className={`${CARD} scroll-mt-6 overflow-hidden`}>
                <div role="tablist" aria-label="Lesson" className="flex gap-1 overflow-x-auto border-b border-[#E1E5F2] px-3">
                  {tabs.map((item) => {
                    const on = item.id === shownTab;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => setTab(item.id)}
                        className={`relative h-12 shrink-0 px-3 text-[15px] font-semibold ${on ? 'text-[#0167F6] after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-full after:bg-[#0167F6]' : 'text-[#475373] hover:text-[#0E1B3D]'}`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <div role="tabpanel" className="p-5">
                  {shownTab === 'notes' && (
                    <div className="flex flex-col gap-4">
                      {lesson.notes ? (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className={`font-bold ${INK}`}>Notes from the instructor</span>
                            <button type="button" onClick={() => downloadNotes(course, lesson)} className={`${SOFT} ${SMALL}`}>
                              <Download aria-hidden="true" className="size-4" /> Download notes
                            </button>
                          </div>
                          <p className={`m-0 whitespace-pre-line break-words ${BODY}`}>{lesson.notes}</p>
                        </>
                      ) : (
                        <p className={`m-0 ${MUTED}`}>There are no notes for this lesson.</p>
                      )}
                      {lesson.documentUrl && (
                        <a href={lesson.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-[12px] border border-[#D5DEFF] bg-[#F4F6FE] p-3.5 hover:border-[#0167F6]">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#0167F6] text-white">
                            <FileText aria-hidden="true" className="size-5" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className={`truncate font-semibold ${INK}`}>{lesson.documentName || 'Lesson document'}</span>
                            <span className={`text-[13.5px] ${MUTED}`}>Reference document</span>
                          </span>
                          <Download aria-hidden="true" className="size-5 shrink-0 text-[#0167F6]" />
                        </a>
                      )}
                    </div>
                  )}
                  {shownTab === 'quiz' && <LessonQuiz key={lesson.id} quiz={lesson.quiz} path={`/courses/${courseId}/lessons/${lesson.id}/quiz`} token={token} onScored={(enrollment) => setCourse((current) => ({ ...current, enrollment }))} />}
                  {shownTab === 'about' && (
                    <div className="flex flex-col gap-4">
                      {lesson.description && (
                        <div className="flex flex-col gap-1">
                          <span className={`font-bold ${INK}`}>This lesson</span>
                          <p className={`m-0 whitespace-pre-line break-words ${BODY}`}>{lesson.description}</p>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className={`font-bold ${INK}`}>About the course</span>
                        <p className={`m-0 whitespace-pre-line break-words ${BODY}`}>{course.description}</p>
                        {course.instructor && <span className={`text-[14px] ${MUTED}`}>Instructor: {course.instructor}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside aria-label="Course content" className={`${CARD} flex w-full min-w-0 flex-[1_1_300px] flex-col overflow-hidden lg:sticky lg:top-6 lg:max-h-[calc(100vh-48px)]`}>
              <div className="border-b border-[#E1E5F2] px-4 py-3.5">
                <h2 className="m-0 text-[16px]">
                  <span className={`${HEADING_FONT} font-bold ${INK}`}>Course content</span>
                </h2>
                <span className={`text-[14px] ${MUTED}`}>
                  {plural(course.modules.length, 'section')} · {plural(lessons.length, 'lesson')}
                </span>
              </div>
              <div className="overflow-y-auto">
                {course.modules.map((mod, mi) => {
                  const inModule = lessons.filter((item) => item.moduleId === mod.id);
                  const isClosed = closed[mod.id];
                  return (
                    <div key={mod.id} className="border-b border-[#EEF0F6] last:border-b-0">
                      <button type="button" aria-expanded={!isClosed} onClick={() => setClosed((current) => ({ ...current, [mod.id]: !current[mod.id] }))} className="flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-[#F8F9FE]">
                        <span className={`flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[13px] font-bold ${MODULE_TONES[mi % MODULE_TONES.length]}`}>{mi + 1}</span>
                        <span className={`min-w-0 flex-1 break-words font-semibold ${INK}`}>{mod.title}</span>
                        <span className={`shrink-0 text-[13px] font-semibold ${MUTED}`}>
                          {inModule.filter((item) => progress.done.has(item.id)).length}/{inModule.length}
                        </span>
                        <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-[#475373] transition-transform ${isClosed ? '-rotate-90' : ''}`} />
                      </button>
                      {!isClosed && (
                        <ul className="m-0 list-none p-0 pb-2">
                          {inModule.map((item) => {
                            const current = item.id === lessonId;
                            const done = progress.done.has(item.id);
                            const Icon = done ? CheckCircle2 : current ? PlayCircle : Circle;
                            return (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  aria-current={current ? 'true' : undefined}
                                  onClick={() => (current ? setTab('notes') : openLesson(item))}
                                  className={`flex w-full items-start gap-2.5 py-2.5 pl-5 pr-4 text-left ${current && shownTab !== 'quiz' ? 'bg-[#EEF2FF] shadow-[inset_3px_0_0_#0167F6]' : 'hover:bg-[#F8F9FE]'}`}
                                >
                                  <Icon aria-hidden="true" className={`mt-0.5 size-[18px] shrink-0 ${done ? 'text-[#0F7A55]' : current ? 'text-[#0167F6]' : 'text-[#9AA6C8]'}`} />
                                  <span className="flex min-w-0 flex-1 flex-col">
                                    <span className={`break-words text-[14.5px] ${current ? 'font-semibold text-[#0B3FA8]' : INK}`}>{item.title}</span>
                                    {(item.duration || item.subTopic) && <span className={`text-[13px] ${MUTED}`}>{[item.duration, item.subTopic].filter(Boolean).join(' · ')}</span>}
                                  </span>
                                </button>
                                {item.quiz && (
                                  <button type="button" onClick={() => showQuiz(item)} className={`flex w-full items-center gap-2.5 py-2 pl-[46px] pr-4 text-left text-[14px] font-semibold text-[#5B2AA6] ${current && shownTab === 'quiz' ? 'bg-[#F5F0FF] shadow-[inset_3px_0_0_#7B3FD0]' : 'hover:bg-[#F8F9FE]'}`}>
                                    <HelpCircle aria-hidden="true" className="size-4 shrink-0" />
                                    <span className="min-w-0 break-words">
                                      {item.quiz.title || 'Quiz'} · {plural(item.quiz.questions.length, 'question')}
                                    </span>
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

/** A lesson's practice quiz: every question must be answered; the server scores it. */
function LessonQuiz({ quiz, path, token, onScored }) {
  const total = quiz.questions.length;
  const [answers, setAnswers] = useState(() => Array(total).fill(null));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const answered = answers.filter((answer) => answer !== null).length;

  const pick = (question, option) => {
    setAnswers((current) => current.map((answer, i) => (i === question ? option : answer)));
    setError('');
  };

  const submit = async () => {
    const open = answers.indexOf(null);
    if (open !== -1) {
      setError(`Answer all ${total} questions to submit. Question ${open + 1} is still open.`);
      document.getElementById(`quiz-q-${open}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setBusy(true);
    const { data, error: failed } = await request(path, { token, method: 'POST', json: { answers } }, 'Your answers couldn’t be checked. Try again.');
    setBusy(false);
    if (failed) return setError(failed);
    setResult(data);
    onScored(data.enrollment);
  };

  const retry = () => {
    setAnswers(Array(total).fill(null));
    setResult(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className={`font-bold ${INK}`}>{quiz.title || 'Lesson quiz'}</span>
          <span className={`text-[14px] ${MUTED}`}>{result ? 'Practice only: it doesn’t change your skill scores.' : `${answered} of ${total} answered · practice, not a skill test`}</span>
        </span>
        {result && (
          <span className={`rounded-full px-3 py-1 text-[14px] font-bold ${result.correct === result.total ? 'bg-[#E3F5EE] text-[#0B5E41]' : 'bg-[#E8EEFF] text-[#0B3FA8]'}`}>
            {result.correct} of {result.total} right
          </span>
        )}
      </div>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {quiz.questions.map((question, qi) => {
          const right = result?.results[qi]?.correctAnswer;
          const explanation = result?.results[qi]?.explanation;
          return (
            <li key={qi} id={`quiz-q-${qi}`} className="flex flex-col gap-2.5 rounded-[14px] border border-[#E1E5F2] bg-[#FAFBFF] p-4">
              <p className={`m-0 flex gap-2.5 font-semibold ${INK}`}>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#F1ECFF] text-[13px] font-bold text-[#5B2AA6]">{qi + 1}</span>
                <span className="min-w-0 whitespace-pre-line break-words">{question.question}</span>
              </p>
              <fieldset disabled={Boolean(result)} className="m-0 grid min-w-0 gap-2 border-0 p-0 sm:grid-cols-2">
                <legend className="sr-only">Answer for question {qi + 1}</legend>
                {question.options.map((option, oi) => {
                  const on = answers[qi] === oi;
                  const tone = result
                    ? oi === right
                      ? 'border-[#0F7A55] bg-[#E3F5EE] font-semibold text-[#0B5E41]'
                      : on
                        ? 'border-[#C8281C] bg-[#FDECEA] text-[#8C1D14]'
                        : 'border-[#E1E5F2] bg-white text-[#475373]'
                    : on
                      ? 'border-[#0167F6] bg-[#EEF2FF] font-semibold text-[#0B3FA8]'
                      : `cursor-pointer border-[#C9D1E3] bg-white ${INK} hover:border-[#6378F9]`;
                  return (
                    <label key={oi} className={`flex min-h-[48px] items-center gap-3 rounded-[12px] border px-3.5 py-2 ${tone}`}>
                      <input type="radio" name={`quiz-${qi}`} checked={on} onChange={() => pick(qi, oi)} className="size-[18px] shrink-0 accent-[#0167F6]" />
                      <span className="min-w-0 flex-1 break-words">{option}</span>
                      {result && oi === right && <Check aria-label="Right answer" className="size-4 shrink-0" />}
                      {result && on && oi !== right && <X aria-label="Your answer" className="size-4 shrink-0" />}
                    </label>
                  );
                })}
              </fieldset>
              {explanation && (
                <p className={`m-0 rounded-[10px] bg-[#F4F6FE] px-3.5 py-2.5 ${BODY}`}>
                  <strong>Why: </strong>
                  {explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <ErrorBanner message={error} />
      <div className="flex justify-end">
        {result ? (
          <button type="button" onClick={retry} className={`${SECONDARY} h-11 px-5`}>
            <RotateCcw aria-hidden="true" className="size-4" /> Try again
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={busy} className={`${PRIMARY} h-11 px-6`}>
            {busy && <Spinner />}
            {busy ? 'Checking…' : 'Submit answers'}
          </button>
        )}
      </div>
    </div>
  );
}
