import { useState } from 'react';
import { BadgeCheck, CheckCircle2, Download, GraduationCap, Lock, Plus, Share2 } from 'lucide-react';
import { BODY, CARD, GRADIENT, HEADING_FONT, INK, MUTED, PRIMARY, SECONDARY, SMALL, SOFT } from '../profile/profileTheme';
import { ConfirmDialog } from '../profile/ui';
import { downloadJobBrief } from './jobBriefPdf';
import { closesText, companyOf, evaluateBars, initialOf, kindText, lines, payText, placeText, tileColor } from './jobsData';

function Tile({ name, size }) {
  return (
    <span aria-hidden="true" style={{ width: size, height: size, background: tileColor(name), fontSize: Math.round(size * 0.4) }} className="flex shrink-0 items-center justify-center rounded-[12px] font-bold text-white">
      {initialOf(name)}
    </span>
  );
}

const SubHeading = ({ children }) => (
  <h3 className="m-0 text-[16px]">
    <span className={`${HEADING_FONT} font-bold ${INK}`}>{children}</span>
  </h3>
);

/** Shown in place of a job that's outside the free part of the list. */
export function LockedDetail({ onUpgrade, goToTab }) {
  return (
    <article aria-label="Job details" className={`${CARD} flex flex-col items-center gap-3 p-8 text-center`}>
      <span aria-hidden="true" className={`flex size-14 items-center justify-center rounded-[16px] text-white ${GRADIENT}`}>
        <Lock className="size-6" />
      </span>
      <h2 className="m-0 text-[20px]">
        <span className={`${HEADING_FONT} font-bold ${INK}`}>This job is part of Student Pro</span>
      </h2>
      <p className={`m-0 max-w-[420px] ${BODY}`}>Free accounts see the top jobs of each list. Student Pro shows every listing, with search and filters.</p>
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

/**
 * One job beside the list (design: Web — jobs list and details): your scores
 * against each skill bar, the facts, what the job is, how they hire, and Apply.
 */
export default function JobDetail({ job, profile, onOpenApply, onTakeTest, onAddSkillWithoutTest, onOpenCompanyProfile, goToTab }) {
  const [confirm, setConfirm] = useState(null); // a no-test skill bar to add to the profile
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const company = companyOf(job);
  const bars = evaluateBars(job, profile?.skills);
  const unmet = bars.filter((bar) => !bar.met);
  const pay = payText(job);
  const chips = [kindText(job), job.workMode, pay, job.joiningMonth && `Joining: ${job.joiningMonth}`].filter(Boolean);
  const facts = [
    ['Openings', job.openings],
    ['Experience', job.desiredExperience],
    ['Education', job.preferredEducation],
    ['Applications close', closesText(job)]
  ].filter(([, value]) => value);
  const tasks = lines(job.roleResponsibilities);
  const rounds = Array.isArray(job.selectionProcess) ? job.selectionProcess : [];
  const questionCount = Array.isArray(job.screeningQuestions) ? job.screeningQuestions.length : 0;

  const share = async () => {
    const url = `${window.location.origin}/job_brief?id=${job.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[jobs] Could not copy the job link:', err);
      window.prompt('Copy this link:', url);
    }
  };

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

  const barAction = (bar, size = SMALL) =>
    bar.hasTest ? (
      <button type="button" onClick={() => onTakeTest?.({ skillName: bar.skillName, need: bar.needs, opens: [job.title, company].filter(Boolean).join(' · ') })} className={`${PRIMARY} ${size}`}>
        {bar.hasSkill && bar.score > 0 ? 'Retake' : 'Take'} {bar.skillName} test
      </button>
    ) : (
      <button type="button" onClick={() => setConfirm(bar)} className={`${PRIMARY} ${size}`}>
        <Plus aria-hidden="true" className="size-4" /> Add {bar.skillName} to profile
      </button>
    );

  return (
    <article aria-label="Job details" className={`${CARD} flex min-w-0 flex-col overflow-hidden`}>
      <div className="flex flex-wrap items-start gap-4 border-b border-[#EEF0F6] p-5 sm:p-6">
        <Tile name={company || job.title} size={56} />
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
          <h2 className="m-0 text-[22px] leading-tight">
            <span className={`${HEADING_FONT} break-words font-bold ${INK}`}>{job.title}</span>
          </h2>
          <span className={`text-[15px] ${BODY}`}>
            {company &&
              (job.company?.id && onOpenCompanyProfile ? (
                <button type="button" onClick={() => onOpenCompanyProfile(job.company.id)} className="font-semibold text-[#0E1B3D] hover:text-[#0167F6] hover:underline">
                  {company}
                </button>
              ) : (
                <span className="font-semibold">{company}</span>
              ))}
            {job.company?.verified && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle font-semibold text-[#0167F6]">
                <BadgeCheck aria-hidden="true" className="size-4" /> Verified
              </span>
            )}
            {placeText(job) && ` · ${placeText(job)}`}
          </span>
          {chips.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <span key={chip} className="rounded-full bg-[#F1F3FA] px-2.5 py-1 text-[13px] font-semibold text-[#1B2B55]">
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={share} aria-label="Copy a link to this job" title="Copy link" className={`${SECONDARY} size-11 px-0`}>
            {copied ? <CheckCircle2 aria-hidden="true" className="size-5 text-[#0F7A55]" /> : <Share2 aria-hidden="true" className="size-5" />}
          </button>
          <button type="button" onClick={() => downloadJobBrief(job)} aria-label="Download the job brief as a PDF" title="Download PDF" className={`${SECONDARY} size-11 px-0`}>
            <Download aria-hidden="true" className="size-5" />
          </button>
          {job.applied ? (
            <span className="inline-flex h-11 items-center gap-1.5 rounded-[10px] bg-[#E3F5EE] px-4 font-semibold text-[#0B5E41]">
              <CheckCircle2 aria-hidden="true" className="size-4" /> Applied
            </span>
          ) : unmet.length === 0 ? (
            <button type="button" onClick={() => onOpenApply(job)} className={`${PRIMARY} h-11 px-6`}>
              Apply now
            </button>
          ) : (
            unmet.length === 1 && barAction(unmet[0], 'h-11 px-[18px]')
          )}
        </div>
        {copied && (
          <span role="status" className="basis-full text-right text-[13px] font-semibold text-[#0F7A55]">
            Link copied
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-6 p-5 sm:p-6">
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3.5">
          <SubHeading>Your scores vs. this job</SubHeading>
          {bars.length === 0 ? (
            <p className={`m-0 ${BODY}`}>This job has no skill bars.</p>
          ) : (
            bars.map((bar) => (
              <div key={bar.skillName} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className={`font-semibold ${INK}`}>{bar.skillName}</span>
                  <span className={`tabular-nums font-semibold ${bar.met ? 'text-[#0B3FA8]' : 'text-[#9A3412]'}`}>
                    {bar.hasSkill ? bar.score : 'Not added'} · needs {bar.needs}
                  </span>
                </div>
                <div role="img" aria-label={`${bar.skillName}: ${bar.hasSkill ? `${bar.score} out of 10` : 'not on your profile'}, needs ${bar.needs}`} className="relative h-2.5 rounded-full bg-[#E8EEFF]">
                  <div className={`absolute inset-y-0 left-0 rounded-full ${bar.met ? 'bg-[linear-gradient(90deg,#0167F6,#6378F9)]' : 'bg-[#E0782F]'}`} style={{ width: `${Math.min(100, bar.score * 10)}%` }} />
                  <div aria-hidden="true" className="absolute -bottom-1 -top-1 w-0.5 rounded bg-[#0E1B3D]" style={{ left: `calc(${Math.min(100, bar.needs * 10)}% - 1px)` }} />
                </div>
                {!bar.met && !job.applied && unmet.length > 1 && <div className="pt-1">{barAction(bar, 'h-8 px-2.5 text-[13px]!')}</div>}
              </div>
            ))
          )}
          {!job.applied && bars.length > 0 && unmet.length === 0 && (
            <div className="flex flex-col gap-0.5 rounded-[12px] bg-[#EEF2FF] px-3.5 py-3">
              <span className="font-bold text-[#0B3FA8]">You meet every skill bar</span>
              <span className={BODY}>{company || 'The company'} sees your scores, profile and intro video when you apply.</span>
            </div>
          )}
          {!job.applied && unmet.length === 1 && (
            <div className="flex flex-col gap-2 rounded-[12px] border border-[#FED7AA] bg-[#FFF3E8] px-3.5 py-3">
              <span className="font-bold text-[#9A3412]">
                You’re 1 skill away: {unmet[0].skillName} {unmet[0].hasSkill ? `${unmet[0].score}, needs ${unmet[0].needs}` : `not on your profile, needs ${unmet[0].needs}`}
              </span>
              <span className={BODY}>{unmet[0].hasTest ? `Pass the ${unmet[0].skillName} test with ${unmet[0].needs} or more to apply.` : `There’s no ${unmet[0].skillName} test yet. Add it to your profile to apply.`}</span>
              <button type="button" onClick={() => goToTab?.('courses', { skill: unmet[0].skillName })} className={`${SOFT} ${SMALL} self-start`}>
                <GraduationCap aria-hidden="true" className="size-4" /> See courses
              </button>
            </div>
          )}
          {!job.applied && unmet.length > 1 && (
            <div className="rounded-[12px] bg-[#F4F6FE] px-3.5 py-3">
              <span className={`font-bold ${INK}`}>{unmet.length} skill bars to meet before you can apply</span>
            </div>
          )}
          {job.applied && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-[#E3F5EE] px-3.5 py-3">
              <span className="font-bold text-[#0B5E41]">You’ve applied to this job</span>
              <button type="button" onClick={() => goToTab?.('progress', { jobId: job.id })} className={`${SECONDARY} ${SMALL}`}>
                See progress
              </button>
            </div>
          )}
        </div>

        {facts.length > 0 && (
          <dl className="m-0 grid min-w-0 flex-[1_1_220px] grid-cols-2 content-start gap-2">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-[12px] bg-[#F4F6FE] px-3 py-2.5">
                <dt className={`text-[12.5px] ${MUTED}`}>{label}</dt>
                <dd className={`m-0 break-words font-semibold ${INK}`}>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="flex flex-col gap-2.5 px-5 pb-6 sm:px-6">
        {job.description && (
          <>
            <SubHeading>About the job</SubHeading>
            <p className={`m-0 whitespace-pre-line break-words text-[15px] ${BODY}`}>{job.description}</p>
          </>
        )}
        {tasks.length > 0 && (
          <>
            <div className="mt-2">
              <SubHeading>What you’ll do</SubHeading>
            </div>
            <ul className={`m-0 flex list-disc flex-col gap-1 pl-5 text-[15px] ${BODY}`}>
              {tasks.map((task, index) => (
                <li key={index} className="break-words">
                  {task}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-2">
          <SubHeading>How they hire</SubHeading>
        </div>
        <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          {[{ name: 'Apply with your scores', description: questionCount ? `${questionCount} short question${questionCount === 1 ? '' : 's'}` : 'No questions' }, ...rounds].map((round, index) => (
            <li key={index} className="flex gap-2.5 rounded-[12px] border border-[#E1E5F2] p-3">
              <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#E8EEFF] text-[12px] font-bold text-[#0B3FA8]">
                {index + 1}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className={`break-words font-semibold ${INK}`}>{index === 0 ? round.name : [round.roundNumber ? `Round ${round.roundNumber}` : '', round.name].filter(Boolean).join(' · ')}</span>
                {round.description && <span className={`break-words text-[13.5px] ${MUTED}`}>{round.description}</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {confirm && (
        <ConfirmDialog title={`Add ${confirm.skillName} to your profile?`} confirmLabel="Add skill" busyLabel="Adding…" busy={busy} onConfirm={runConfirm} onClose={() => setConfirm(null)}>
          {`There’s no ${confirm.skillName} test yet, so it’s added as self-rated ${Math.min(10, Math.max(1, confirm.needs))}/10 and counts for this job.`}
        </ConfirmDialog>
      )}
    </article>
  );
}
