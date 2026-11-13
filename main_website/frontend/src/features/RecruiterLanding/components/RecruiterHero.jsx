import recruitersPhoto from '../../../assets/landing/hero-recruiters.jpg';
import { HERO_FACTS, HERO_SHORTLIST } from '../content';
import { Pill } from '../../../components/landing/ui';
import { HEADING, SORA, SLAB } from '../../../components/landing/classNames';
import { HERO_GRID, CARD_SURFACE, RISE, SLIDE_IN } from '../../../components/landing/portalLayout';

const POPPINS = '[font-family:Poppins,sans-serif]';
/* Match bars grow in from 0 after the card slides in (design `grow` keyframe). */
const GROW = 'transition-[width] duration-1200 delay-1100 ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none starting:w-0';

function ShortlistCard() {
  return (
    <div
      className={`absolute bottom-0 right-0 flex w-[58%] flex-col gap-3 rounded-[18px] p-[18px] max-[900px]:relative max-[900px]:bottom-auto max-[900px]:right-auto max-[900px]:-mt-7 max-[900px]:w-full ${CARD_SURFACE} ${SLIDE_IN}`}
    >
      <div className="flex items-center justify-between gap-2.5">
        <strong className={`text-[15px] font-semibold tracking-[-.02em] ${SORA}`}>Frontend intern shortlist</strong>
        <Pill tone="pineSoft" size="sm">3 clear the bar</Pill>
      </div>
      <div className="flex gap-1.5">
        <Pill size="sm">React 70+</Pill>
        <Pill size="sm">JavaScript 70+</Pill>
      </div>
      {HERO_SHORTLIST.map((person) => (
        <div key={person.initials} className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 border-t border-(--ag-mist) pt-2.5">
          <span className={`flex size-[34px] items-center justify-center text-[13px] font-semibold text-white ${SORA}`} style={{ background: person.color }}>
            {person.initials}
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[13px] font-semibold">{person.name}</span>
            <div className="relative h-1.5 rounded-[3px] bg-(--ag-mist)">
              <i className={`absolute inset-y-0 left-0 rounded-[3px] bg-(--ag-blue) ${person.barClass} ${GROW}`} />
            </div>
          </div>
          <span className={`text-[15px] font-semibold ${SORA}`}>{person.match}%</span>
        </div>
      ))}
    </div>
  );
}

/** Hero: headline + facts (area a), photo + shortlist (area c), auth card (area b). */
export default function RecruiterHero({ authCard }) {
  return (
    <section className={HERO_GRID}>
      <div className="flex flex-col gap-[26px] [grid-area:a]">
        <h1 className={`${HEADING} text-[clamp(46px,6vw,84px)] leading-[.98] tracking-[-.045em] ${RISE}`}>
          <span className={`${POPPINS} font-bold`}>Hire on proof,</span> <span className={`${POPPINS} font-light`}>not keywords.</span>
        </h1>
        <p className={`max-w-[48ch] text-[18px] text-pretty text-(--ag-mute) max-[900px]:text-[16px] ${RISE} delay-120`}>
          Set the skill bar for a role. Meet the candidates who already clear it, with scorecards to show for it.
        </p>
        <div className={`flex flex-wrap gap-x-[26px] gap-y-3 text-[14px] text-(--ag-mute) ${RISE} delay-120`}>
          {HERO_FACTS.map((fact) => (
            <span key={fact.label} className="inline-flex items-center gap-2">
              <i className="size-2.5 flex-none" style={{ background: fact.color }} />
              {fact.label}
            </span>
          ))}
        </div>
      </div>

      <div className={`relative aspect-[650/440] [grid-area:c] max-[900px]:flex max-[900px]:aspect-auto max-[900px]:flex-col ${RISE} delay-300`}>
        <img
          src={recruitersPhoto}
          alt="A recruiter and a hiring lead reviewing a candidate scorecard on a tablet"
          className={`absolute left-0 top-0 h-[76%] w-[80%] object-cover object-[50%_35%] max-[900px]:relative max-[900px]:aspect-[16/10] max-[900px]:h-auto max-[900px]:w-full ${SLAB}`}
        />
        <div aria-hidden="true" className="absolute left-0 top-[76%] aspect-square w-[19.2%] bg-(--ag-pine) max-[900px]:hidden" />
        <ShortlistCard />
      </div>

      {authCard}
    </section>
  );
}
