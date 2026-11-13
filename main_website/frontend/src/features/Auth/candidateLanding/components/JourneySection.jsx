import { Icon, FilledIcon } from '../../../../components/landing/Icon';
import { SectionTitle, Pill } from '../../../../components/landing/ui';
import { WRAP, ANCHOR, HEADING, BOLD, SORA } from '../../../../components/landing/classNames';
import { CARD_SURFACE, liftClass, MOBILE_CAROUSEL } from '../../../../components/landing/portalLayout';

const VISUAL = 'relative flex aspect-[4/3] overflow-hidden rounded-[16px]';

function ProfileVisual() {
  return (
    <div className={`${VISUAL} items-center justify-center bg-(--ag-blue)`}>
      <span className="flex aspect-square w-[58%] items-center justify-center rounded-full bg-white/8 text-white">
        <Icon name="user" strokeWidth={1.5} className="size-[38px]" />
      </span>
      <Pill tone="orchid" className="absolute bottom-3 left-3">
        <FilledIcon name="dot" className="size-2.5" />
        0:48 intro
      </Pill>
    </div>
  );
}

function TestVisual() {
  return (
    <div className={`${VISUAL} flex-col items-center justify-center gap-3 bg-(--ag-soft)`}>
      <div aria-hidden="true" className="grid grid-cols-[repeat(5,20px)] gap-[5px]">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} className={`h-5 ${i < 8 ? 'bg-(--ag-blue)' : 'shadow-[inset_0_0_0_1.5px_var(--ag-peri)]'}`} />
        ))}
      </div>
      <span className={`text-[30px] leading-[.98] tracking-[-.045em] text-(--ag-blue) ${BOLD}`}>80%</span>
    </div>
  );
}

function QualifyVisual() {
  return (
    <div className={`${VISUAL} flex-col items-center justify-center gap-2.5 bg-(--ag-mist)`}>
      <Pill tone="whiteMute" className="line-through shadow-[0_0_0_1.5px_var(--ag-plum)]">SQL 48 / 65</Pill>
      <Icon name="arrowDown" className="size-5 text-(--ag-mute)" />
      <Pill tone="blue">SQL 82 / 65 ✓</Pill>
    </div>
  );
}

const ROUNDS = [
  { label: 'Applied', dot: 'bg-(--ag-blue)', line: 'bg-(--ag-blue)' },
  { label: 'Shortlisted', dot: 'bg-(--ag-blue)', line: 'bg-(--ag-blue)' },
  { label: 'Round 2', dot: 'bg-(--ag-orchid)', line: 'bg-(--ag-line)' },
  { label: 'Hired', dot: 'bg-(--ag-line)', line: 'bg-(--ag-line)', muted: true }
];

function TrackVisual() {
  return (
    <div className={`${VISUAL} items-center justify-center bg-(--ag-mist) p-4`}>
      <div aria-hidden="true" className="flex w-full flex-col gap-2">
        {ROUNDS.map((round) => (
          <div key={round.label} className={`flex items-center gap-2 text-[12.5px] ${round.muted ? 'text-(--ag-mute)' : ''}`}>
            <i className={`size-2.5 flex-none ${round.dot}`} />
            <i className={`h-0.5 flex-1 ${round.line}`} />
            <span className="w-[74px]">{round.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { title: 'Set up your profile', body: 'Basics plus a 40–60 second intro video.', Visual: ProfileVisual },
  { title: 'Take skill tests', body: '10 questions each. Retake whenever you like.', Visual: TestVisual },
  { title: 'Apply where you qualify', body: 'Each role shows which skill is short.', Visual: QualifyVisual },
  { title: 'Track every round', body: 'See where each application stands.', Visual: TrackVisual }
];

/** "From sign-up to shortlisted": four illustrated steps. */
export default function JourneySection() {
  return (
    <section id="how" aria-labelledby="how-title" className={`pb-10 pt-[120px] max-[900px]:pt-[76px] ${ANCHOR}`}>
      <div className={WRAP}>
        <div className="mb-12">
          <SectionTitle id="how-title" bold="From sign-up" light="to shortlisted." width="16ch" />
        </div>
        <div className={`grid grid-cols-4 gap-5 ${MOBILE_CAROUSEL}`}>
          {STEPS.map(({ title, body, Visual }, i) => (
            <article key={title} className={`flex flex-col gap-5 rounded-[24px] px-4 pb-6 pt-4 max-[900px]:snap-start ${CARD_SURFACE} ${liftClass()}`}>
              <Visual />
              <div className="px-1.5">
                <span className={`text-[14px] font-semibold text-(--ag-blue) ${SORA}`}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className={`${HEADING} mt-1.5 text-[21px] leading-[.98] tracking-[-.03em]`}>
                  <span className={BOLD}>{title}</span>
                </h3>
                <p className="mt-1.5 text-[14.5px] text-(--ag-mute)">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
