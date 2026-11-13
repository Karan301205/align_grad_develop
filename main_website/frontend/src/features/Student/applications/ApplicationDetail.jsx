import { CalendarClock } from 'lucide-react';
import { formatScreeningAnswer } from '../../../constants/screeningQuestions';
import { evaluateBars } from '../jobs/jobsData';
import { BODY, CARD, HEADING_FONT, INK, MUTED } from '../profile/profileTheme';
import { STAGE, companyOf, getApplicationStage, initialOf, liveRound, payText, placeText, progressSteps, roundFeedback, statusNote, tileColor } from './applicationsData';

export function Tile({ name, size }) {
  return (
    <span aria-hidden="true" style={{ width: size, height: size, background: tileColor(name), fontSize: Math.round(size * 0.4) }} className="flex shrink-0 items-center justify-center rounded-[12px] font-bold text-white">
      {initialOf(name)}
    </span>
  );
}

export function StageBadge({ stage }) {
  return <span className={`shrink-0 self-start rounded-full px-2.5 py-[3px] text-[12.5px] font-bold ${STAGE[stage].tone}`}>{STAGE[stage].label}</span>;
}

const SubHeading = ({ id, children }) => (
  <h3 id={id} className="m-0 text-[16px]">
    <span className={`${HEADING_FONT} font-bold ${INK}`}>{children}</span>
  </h3>
);

const BAR = { done: 'bg-[#0167F6]', now: 'bg-[#E8890C]', failed: 'bg-[#C8281C]', todo: 'bg-[#E1E5F2]' };
const NOTE = { done: MUTED, now: 'font-semibold text-[#8A3F06]', failed: 'font-semibold text-[#B42318]', todo: MUTED };
const SPOKEN = { done: 'done', now: 'happening now', failed: 'not cleared', todo: 'not reached yet' };

function Progress({ app }) {
  const steps = progressSteps(app);
  return (
    <ol aria-label="Progress" className="m-0 flex list-none flex-col gap-3 p-0 sm:grid sm:auto-cols-[minmax(96px,1fr)] sm:grid-flow-col sm:gap-1.5 sm:overflow-x-auto">
      {steps.map((step) => (
        <li key={step.key} aria-current={step.current ? 'step' : undefined} className="flex min-w-0 gap-3 sm:flex-col sm:gap-1.5">
          <span aria-hidden="true" className={`w-1.5 shrink-0 self-stretch rounded-full sm:h-1.5 sm:w-full ${step.key === 'selected' && step.state === 'done' ? 'bg-[#0F7A55]' : BAR[step.state]}`} />
          <span className="flex min-w-0 flex-col">
            <span className={`text-[13.5px] ${step.current ? `font-bold ${INK}` : BODY}`}>
              {step.label}
              <span className="sr-only">, {SPOKEN[step.state]}</span>
            </span>
            <span className={`min-h-[18px] text-[12.5px] ${NOTE[step.state]}`}>{step.note}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The round happening now: what it is, the recruiter's note and what comes after. */
function InterviewCard({ live, company }) {
  return (
    <section aria-labelledby="app-interview" className="flex flex-col gap-3 rounded-[14px] border-2 border-[#0167F6] bg-white p-4 shadow-[0_14px_30px_-22px_rgba(1,103,246,0.7)] sm:p-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E8EEFF] text-[#0167F6]">
          <CalendarClock className="size-5" />
        </span>
        <h3 id="app-interview" className="m-0 text-[17px]">
          <span className={`${HEADING_FONT} font-bold ${INK}`}>Interview · {live.label}</span>
        </h3>
        <span className="rounded-full bg-[#FFF3E0] px-2.5 py-[3px] text-[12.5px] font-bold text-[#8A3F06]">{live.status}</span>
      </div>
      {live.about && <p className={`m-0 ${BODY}`}>{live.about}</p>}
      {live.feedback && (
        <figure className="m-0 flex flex-col gap-1 rounded-[10px] bg-[#F4F6FE] px-3.5 py-3">
          <blockquote className={`m-0 whitespace-pre-line break-words ${BODY}`}>{live.feedback}</blockquote>
          <figcaption className={`text-[13.5px] font-semibold ${MUTED}`}>— {company || 'The company'}</figcaption>
        </figure>
      )}
      {live.next && <span className={`text-[14px] ${MUTED}`}>After this round: {live.next}</span>}
    </section>
  );
}

/**
 * One application (design: Web — my applications and interview): progress through
 * the hiring rounds, the round happening now, the recruiter's feedback and what the
 * candidate sent. `profile` gives the current skill scores and resume.
 */
export default function ApplicationDetail({ app, profile }) {
  const job = app.job || {};
  const company = companyOf(job);
  const stage = getApplicationStage(app);
  const live = stage === 'INTERVIEW' || stage === 'SHORTLISTED' ? liveRound(app) : null;
  const feedback = roundFeedback(app).filter((round) => round.label !== live?.label);
  const bars = evaluateBars(job, profile?.skills).filter((bar) => bar.hasSkill);
  const answers = Array.isArray(app.answers) ? app.answers : [];

  return (
    <article aria-label="Application details" className={`${CARD} flex min-w-0 flex-col overflow-hidden`}>
      <div className="flex flex-wrap items-start gap-4 border-b border-[#EEF0F6] p-5 sm:p-6">
        <Tile name={company || job.title} size={52} />
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
          <h2 className="m-0 text-[21px] leading-tight">
            <span className={`${HEADING_FONT} break-words font-bold ${INK}`}>{job.title || 'Job'}</span>
          </h2>
          <span className={`text-[15px] ${BODY}`}>{[company, placeText(job), payText(job)].filter(Boolean).join(' · ')}</span>
        </div>
        <StageBadge stage={stage} />
      </div>

      <div className="border-b border-[#EEF0F6] p-5 sm:px-6">
        <Progress app={app} />
      </div>

      <div className="flex flex-col gap-6 p-5 sm:p-6">
        {live ? (
          <InterviewCard live={live} company={company} />
        ) : (
          <p className={`m-0 rounded-[12px] px-4 py-3.5 text-[15px] ${stage === 'HIRED' ? 'bg-[#E3F5EE] text-[#0B5E41]' : `bg-[#F4F6FE] ${BODY}`}`}>{statusNote(app, company)}</p>
        )}

        {feedback.length > 0 && (
          <section aria-labelledby="app-feedback" className="flex flex-col gap-3">
            <SubHeading id="app-feedback">Feedback from {company || 'the company'}</SubHeading>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {feedback.map((round) => (
                <li key={round.label} className="flex flex-col gap-1 rounded-[12px] border border-[#E1E5F2] px-4 py-3">
                  <span className={`text-[14px] font-semibold ${INK}`}>
                    {round.label}
                    {round.status === 'REJECTED' ? ' · Not cleared' : ['CLEARED', 'QUALIFIED', 'SELECTED'].includes(round.status) ? ' · Cleared' : ''}
                  </span>
                  <span className={`whitespace-pre-line break-words ${BODY}`}>{round.feedback}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="app-sent" className="flex flex-col gap-3">
          <SubHeading id="app-sent">What you sent</SubHeading>
          {bars.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {bars.map((bar) => (
                <span key={bar.skillName} className="rounded-[6px] bg-[#E8EEFF] px-2 py-[3px] text-[13px] font-semibold text-[#0B3FA8]">
                  {bar.skillName} {bar.score || ''}
                </span>
              ))}
            </div>
          )}
          {answers.map((answer, index) => (
            <div key={answer.questionId || index} className="flex flex-col gap-0.5 border-t border-[#EEF0F6] pt-2.5">
              <span className={MUTED}>{answer.questionText}</span>
              <span className={`whitespace-pre-line break-words text-[15px] font-semibold ${INK}`}>{formatScreeningAnswer(answer) || '—'}</span>
            </div>
          ))}
          <div className="flex flex-col border-t border-[#EEF0F6] pt-2.5">
            <span className={MUTED}>Resume</span>
            <span className={`font-semibold ${INK}`}>{profile?.resumeUrl ? 'AlignGrad resume + your own' : 'AlignGrad resume'}</span>
          </div>
        </section>
      </div>
    </article>
  );
}
