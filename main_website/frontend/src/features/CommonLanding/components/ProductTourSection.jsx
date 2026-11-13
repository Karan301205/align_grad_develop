import { useEffect, useState } from 'react';
import { CANDIDATE_TOUR_STEPS, RECRUITER_TOUR_STEPS, SAMPLE_TALENTS, PIPELINE_LANES } from '../content';
import { Kicker, Lede, SectionTitle, Pill, ScoreRing, BrowserWindow } from '../../../components/landing/ui';
import { WRAP, SECTION, ANCHOR, SORA, SWAP, buttonClass } from '../../../components/landing/classNames';

const AUTO_ADVANCE_MS = 5200;
const WIN_TITLE = `${SORA} text-[16px] font-semibold tracking-[-.02em]`;
const STAT = `${SORA} text-[22px] font-bold leading-[.98] tracking-[-.045em]`;

/* ── Candidate workspace screens ── */

function AlignmentScreen() {
  return (
    <>
      <div className={WIN_TITLE}>Welcome back, Priya</div>
      <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-3.5 rounded-[14px] bg-(--ag-blue) p-3.5 text-white">
        <ScoreRing
          size={104}
          strokeWidth={12}
          trackColor="rgba(255,255,255,.2)"
          color="#fff"
          offset={113}
          label="64%"
          labelClassName="text-[24px] font-bold tracking-[-.045em]"
        />
        <div className="text-[13px] leading-[1.4]">
          <strong className="block text-[15px]">Market alignment</strong>
          Your skills against 12 active roles
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[12px] bg-(--ag-mist) p-3"><div className={`${STAT} text-(--ag-peri)`}>2</div><div className="text-[11.5px] text-(--ag-mute)">Applied</div></div>
        <div className="rounded-[12px] bg-(--ag-mist) p-3"><div className={`${STAT} text-(--ag-violet)`}>2</div><div className="text-[11.5px] text-(--ag-mute)">Shortlisted</div></div>
        <div className="rounded-[12px] bg-(--ag-mist) p-3"><div className={`${STAT} text-(--ag-ok)`}>1</div><div className="text-[11.5px] text-(--ag-mute)">Hired</div></div>
      </div>
    </>
  );
}

function SkillTestScreen() {
  return (
    <>
      <div className="flex items-center justify-between text-[12.5px]">
        <Pill tone="soft">React test</Pill>
        <span className="text-(--ag-mute)">Question 3 of 10, 24:10 left</span>
      </div>
      <div className="h-[5px] rounded-[3px] bg-(--ag-mist)">
        <div className="h-full w-[30%] rounded-[3px] bg-(--ag-blue)" />
      </div>
      <div className={`${WIN_TITLE} leading-[1.3]`}>What does useEffect(fn, []) do?</div>
      <div className="flex flex-col gap-[7px] text-[13.5px]">
        <div className="rounded-[10px] px-3 py-2.5 shadow-[inset_0_0_0_1.5px_var(--ag-line)]">A. Runs after every render</div>
        <div className="rounded-[10px] bg-(--ag-blue) px-3 py-2.5 text-white">B. Runs once, after the first render ✓</div>
        <div className="rounded-[10px] px-3 py-2.5 shadow-[inset_0_0_0_1.5px_var(--ag-line)]">C. Runs before the component mounts</div>
      </div>
    </>
  );
}

function ApplyScreen() {
  const requirements = ['React, Lvl 7/10', 'JavaScript, Lvl 7/10', 'Figma, Lvl 4/10'];
  return (
    <>
      <div className="flex items-center gap-3">
        <span className={`flex size-[42px] items-center justify-center bg-(--ag-blue) font-bold text-white ${SORA}`}>N</span>
        <div>
          <div className={WIN_TITLE}>Frontend developer intern</div>
          <div className="text-[12.5px] text-(--ag-mute)">Nimbus Labs, Bengaluru</div>
        </div>
      </div>
      <div className="text-[12.5px] font-semibold text-(--ag-mute)">Required skills</div>
      <div className="flex flex-col gap-[7px] text-[13px]">
        {requirements.map((req) => (
          <div key={req} className="flex justify-between rounded-[10px] bg-(--ag-ok-bg) px-3 py-[9px]">
            <span>{req}</span>
            <strong className="text-(--ag-ok)">Met ✓</strong>
          </div>
        ))}
      </div>
      <span className={buttonClass('blue', 'tour')}>Apply now</span>
    </>
  );
}

/* ── Recruiter workspace screens ── */

function PostJobScreen() {
  const thresholds = [
    { skill: 'React', level: 7, width: 'w-[70%]' },
    { skill: 'Node.js', level: 6, width: 'w-[60%]' },
    { skill: 'SQL', level: 5, width: 'w-[50%]' }
  ];
  return (
    <>
      <div className="flex items-center justify-between">
        <div className={WIN_TITLE}>Post a job</div>
        <Pill tone="pineSoft">Quota 1 / 6 used</Pill>
      </div>
      <div className="rounded-[10px] px-3 py-2.5 text-[13.5px] shadow-[inset_0_0_0_1.5px_var(--ag-line)]">Full-stack developer</div>
      <div className="text-[12.5px] font-semibold text-(--ag-mute)">Required stacks and rating thresholds</div>
      <div className="flex flex-col gap-3 text-[13px]">
        {thresholds.map((row) => (
          <div key={row.skill}>
            <div className="mb-[7px] flex justify-between">
              <span>{row.skill}</span>
              <strong>Lvl {row.level}/10</strong>
            </div>
            <div className="relative h-1.5 rounded-[3px] bg-(--ag-mist)">
              <i className={`absolute inset-y-0 left-0 rounded-[3px] bg-(--ag-pine) ${row.width}`} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TopTalentScreen() {
  return (
    <>
      <div className={WIN_TITLE}>Top matching talents</div>
      <div className="text-[12.5px] text-(--ag-mute)">Ranked by skill coverage across your active jobs</div>
      {SAMPLE_TALENTS.map((talent) => (
        <div key={talent.initials} className="grid grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-3 rounded-[12px] bg-(--ag-mist) p-2.5">
          <span className={`flex size-[38px] items-center justify-center text-[13px] font-semibold text-white ${SORA}`} style={{ background: talent.bg }}>
            {talent.initials}
          </span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold">{talent.name}</div>
            <div className="truncate text-[12px] text-(--ag-mute)">{talent.skills}</div>
          </div>
          <Pill tone="pineSoft" strong>{talent.match}% match</Pill>
        </div>
      ))}
    </>
  );
}

function PipelineScreen() {
  return (
    <>
      <div className={WIN_TITLE}>Candidate applications</div>
      <div className="grid grid-cols-4 gap-2">
        {PIPELINE_LANES.map((lane) => (
          <div key={lane.label} className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-[11.5px] font-semibold text-(--ag-mute)">
              <span>{lane.label}</span>
              <span className="text-(--ag-pine)">{lane.count}</span>
            </div>
            {lane.cards.map((color, i) => (
              <i key={i} className="block h-[26px] rounded-[6px]" style={{ background: color }} />
            ))}
          </div>
        ))}
      </div>
      <div className="rounded-[10px] bg-(--ag-mist) px-3 py-2.5 text-[12.5px] text-(--ag-mute)">
        Round 2: Technical interview, <strong className="text-(--ag-pine)">Cleared</strong>
      </div>
    </>
  );
}

const CANDIDATE_SCREENS = [AlignmentScreen, SkillTestScreen, ApplyScreen];
const RECRUITER_SCREENS = [PostJobScreen, TopTalentScreen, PipelineScreen];

const SIDE = {
  light: {
    half: 'bg-white',
    kicker: 'blue',
    tryIt: 'text-(--ag-blue)',
    firstSideIcon: 'bg-(--ag-blue)',
    caption: 'text-(--ag-mute)',
    step: { off: 'bg-transparent text-(--ag-mute) hover:text-(--ag-pine)', on: 'bg-(--ag-soft) text-(--ag-pine)' },
    number: { off: 'bg-(--ag-mist) text-(--ag-pine)', on: 'bg-(--ag-blue) text-white' }
  },
  dark: {
    half: 'bg-(--ag-pine) text-white',
    kicker: 'mint',
    tryIt: 'text-(--ag-mint)',
    firstSideIcon: 'bg-(--ag-pine)',
    caption: 'text-white/76',
    step: { off: 'bg-transparent text-white/70 hover:text-white', on: 'bg-white/10 text-white' },
    number: { off: 'bg-white/10 text-white', on: 'bg-(--ag-mint) text-(--ag-pine)' }
  }
};

/** One half of the tour: step picker, mock app window, caption. */
function TourSide({ tone, title, address, steps, screens, active, onPick, link }) {
  const side = SIDE[tone];
  const Screen = screens[active];

  return (
    <div className={`flex min-w-0 flex-col gap-[22px] p-10 max-[900px]:px-[18px] max-[900px]:py-6 ${side.half}`}>
      <div className="flex items-center justify-between gap-3">
        <Kicker tone={side.kicker}>{title}</Kicker>
        <a {...link} className={`inline-flex min-h-10 items-center text-[14px] font-semibold ${side.tryIt}`}>Try it</a>
      </div>

      <div role="group" aria-label={`${title} tour steps`} className="flex flex-col gap-1.5 max-[900px]:flex-row max-[900px]:overflow-x-auto max-[900px]:[scrollbar-width:none]">
        {steps.map((step, i) => {
          const state = i === active ? 'on' : 'off';
          return (
            <button
              key={step.label}
              type="button"
              aria-pressed={i === active}
              onClick={() => onPick(i)}
              className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-[14px] border-0 py-1.5 pl-1.5 pr-3.5 text-left text-[15px] font-medium leading-[normal] transition-colors duration-200 max-[900px]:w-auto max-[900px]:flex-none ${side.step[state]}`}
            >
              <span className={`flex size-[34px] flex-none items-center justify-center rounded-[10px] text-[13px] font-semibold transition-colors duration-200 ${SORA} ${side.number[state]}`}>{i + 1}</span>
              <span className="max-[900px]:hidden">{step.label}</span>
            </button>
          );
        })}
      </div>

      <BrowserWindow address={address}>
        <div className="grid min-h-[318px] grid-cols-[46px_minmax(0,1fr)] max-[900px]:grid-cols-[minmax(0,1fr)]">
          <div aria-hidden="true" className="flex flex-col items-center gap-2.5 border-r border-(--ag-line) py-3.5 max-[900px]:hidden">
            <i className={`size-[22px] rounded-[6px] ${side.firstSideIcon}`} />
            <i className="size-[22px] rounded-[6px] bg-(--ag-mist)" />
            <i className="size-[22px] rounded-[6px] bg-(--ag-mist)" />
            <i className="size-[22px] rounded-[6px] bg-(--ag-mist)" />
            <i className="size-[22px] rounded-[6px] bg-(--ag-mist)" />
          </div>
          <div key={active} className={`flex min-w-0 flex-col gap-3 p-[18px] ${SWAP}`}>
            <Screen />
          </div>
        </div>
      </BrowserWindow>

      <p className={`text-[15px] ${side.caption}`}>{steps[active].caption}</p>
    </div>
  );
}

export default function ProductTourSection({ nav }) {
  const [candidateStep, setCandidateStep] = useState(0);
  const [recruiterStep, setRecruiterStep] = useState(0);
  const [candidateHeld, setCandidateHeld] = useState(false);
  const [recruiterHeld, setRecruiterHeld] = useState(false);

  // Each side cycles on its own until the visitor picks a step there.
  useEffect(() => {
    if (candidateHeld && recruiterHeld) return undefined;
    const timer = setInterval(() => {
      if (!candidateHeld) setCandidateStep((step) => (step + 1) % CANDIDATE_TOUR_STEPS.length);
      if (!recruiterHeld) setRecruiterStep((step) => (step + 1) % RECRUITER_TOUR_STEPS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [candidateHeld, recruiterHeld]);

  return (
    <section id="tour" aria-labelledby="tour-title" className={`${SECTION} ${ANCHOR}`}>
      <div className={WRAP}>
        <div className="mb-12 flex flex-col items-center gap-[18px] text-center">
          <Kicker>Product tour</Kicker>
          <SectionTitle id="tour-title" bold="Two workspaces." light="One shared truth." width="18ch" />
          <Lede>Take a 30-second walk through each side. The same verified scores power both.</Lede>
        </div>

        <div className="relative grid grid-cols-2 overflow-hidden rounded-[32px] shadow-[0_0_0_1px_var(--ag-line),0_40px_80px_-50px_rgba(2,56,54,.6)] max-[900px]:grid-cols-1 max-[900px]:rounded-[24px]">
          <TourSide
            tone="light"
            title="Candidate platform"
            address="aligngrad.com/dashboard"
            steps={CANDIDATE_TOUR_STEPS}
            screens={CANDIDATE_SCREENS}
            active={candidateStep}
            onPick={(i) => { setCandidateStep(i); setCandidateHeld(true); }}
            link={nav.candidate}
          />
          <TourSide
            tone="dark"
            title="Recruiter platform"
            address="aligngrad.com/recruiter"
            steps={RECRUITER_TOUR_STEPS}
            screens={RECRUITER_SCREENS}
            active={recruiterStep}
            onPick={(i) => { setRecruiterStep(i); setRecruiterHeld(true); }}
            link={nav.recruiter}
          />
        </div>
      </div>
    </section>
  );
}
