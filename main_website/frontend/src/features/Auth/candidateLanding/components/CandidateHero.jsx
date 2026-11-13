import { HERO_FACTS } from '../content';
import { Icon } from '../../../../components/landing/Icon';
import { Pill } from '../../../../components/landing/ui';
import { HEADING, BOLD, LIGHT, SORA } from '../../../../components/landing/classNames';
import { HERO_GRID, CARD_SURFACE, liftClass, RISE, FAN, MOBILE_CAROUSEL } from '../../../../components/landing/portalLayout';

/* Three sample opportunities: two unlocked, one a test away (design `.op` cards). */
const OPPORTUNITIES = [
  {
    title: 'Landing page build',
    detail: 'Freelance gig, paid per milestone',
    icon: 'bolt',
    iconClass: 'bg-(--ag-soft) text-(--ag-blue)',
    badge: { label: 'Unlocked', tone: 'blue' },
    skills: [{ label: 'React ✓' }, { label: 'Figma ✓' }],
    delay: 'delay-500'
  },
  {
    title: 'Frontend intern',
    detail: 'Internship with stipend',
    icon: 'graduation',
    iconClass: 'bg-[#F3E9FF] text-(--ag-violet)',
    badge: { label: 'Unlocked', tone: 'blue' },
    skills: [{ label: 'React ✓' }, { label: 'JavaScript ✓' }],
    delay: 'delay-620'
  },
  {
    title: 'Data analyst',
    detail: 'Full-time role',
    icon: 'briefcaseRect',
    iconClass: 'bg-white text-(--ag-violet)',
    badge: { label: '1 test away', tone: 'pinkSoft', locked: true },
    skills: [{ label: 'Python ✓', tone: 'white' }, { label: 'SQL needs 65', tone: 'whitePlum' }],
    delay: 'delay-740',
    highlight: true
  }
];

function OpportunityCard({ item }) {
  const surface = item.highlight ? 'bg-[#F1ECFF] shadow-[0_0_0_1.5px_#D9CCFA]' : CARD_SURFACE;
  return (
    // Outer element runs the fan-in; the card itself owns the hover lift (both animate `translate`).
    <div className={`max-[900px]:snap-start ${FAN} ${item.delay}`}>
      <div className={`flex h-full min-h-[200px] flex-col gap-2.5 rounded-[18px] p-[18px] ${surface} ${liftClass()}`}>
        <div className="flex items-center justify-between">
          <span className={`flex size-11 items-center justify-center ${item.iconClass}`}>
            <Icon name={item.icon} />
          </span>
          <Pill tone={item.badge.tone}>
            {item.badge.locked && <Icon name="lock" className="size-[13px]" />}
            {item.badge.label}
          </Pill>
        </div>
        <strong className={`mt-1.5 text-[16px] font-semibold tracking-[-.02em] ${SORA}`}>{item.title}</strong>
        <span className="text-[13px] text-(--ag-mute)">{item.detail}</span>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {item.skills.map((skill) => <Pill key={skill.label} tone={skill.tone}>{skill.label}</Pill>)}
        </div>
      </div>
    </div>
  );
}

/**
 * Hero: headline + facts (area a), opportunity cards (area c), auth card (area b).
 */
export default function CandidateHero({ authCard }) {
  return (
    <section className={HERO_GRID}>
      <div className="flex flex-col gap-[26px] [grid-area:a]">
        <h1 className={`${HEADING} text-[clamp(46px,6vw,84px)] leading-[.98] tracking-[-.045em] ${RISE}`}>
          <span className={BOLD}>Turn verified skills</span> <span className={LIGHT}>into paid work.</span>
        </h1>
        <p className={`max-w-[48ch] text-[18px] text-pretty text-(--ag-mute) max-[900px]:text-[16px] ${RISE} delay-120`}>
          Jobs and internships matched to your skills, courses to close any gap, and paid gigs for side income. All in one place.
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

      <div className={`[grid-area:c] ${RISE} delay-300`}>
        <div className={`grid grid-cols-3 gap-4 ${MOBILE_CAROUSEL}`}>
          {OPPORTUNITIES.map((item) => <OpportunityCard key={item.title} item={item} />)}
        </div>
      </div>

      {authCard}
    </section>
  );
}
