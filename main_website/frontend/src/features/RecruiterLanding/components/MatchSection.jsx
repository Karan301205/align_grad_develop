import { MATCH_POINTS, BEST_MATCHES } from '../content';
import { Icon } from '../../../components/landing/Icon';
import { Kicker, Lede, SectionTitle, Pill } from '../../../components/landing/ui';
import { WRAP, ANCHOR, SORA, BOLD, SLAB, GRADIENT } from '../../../components/landing/classNames';
import { SECTION, CARD_SURFACE } from '../../../components/landing/portalLayout';
import PointList from './PointList';

function MatchIllustration() {
  return (
    <div aria-hidden="true" className="relative flex flex-col gap-3.5 rounded-[28px] bg-(--ag-mist) p-[clamp(18px,3vw,32px)]">
      <div className="relative flex flex-col gap-3 overflow-hidden rounded-[18px] bg-(--ag-pine) px-5 py-[18px] text-white">
        <span className={`absolute -right-[50px] -top-10 h-40 w-[220px] opacity-40 ${SLAB} ${GRADIENT}`} />
        <span className="relative text-[12.5px] opacity-75">Your requirement</span>
        <strong className={`relative text-[22px] leading-[.98] tracking-[-.03em] ${BOLD}`}>Full-stack developer</strong>
        <div className="relative flex flex-wrap gap-1.5">
          <Pill tone="glassDim">React Lvl 7</Pill>
          <Pill tone="glassDim">Node.js Lvl 6</Pill>
          <Pill tone="glassDim">SQL Lvl 6</Pill>
        </div>
      </div>
      <div className="flex justify-center text-(--ag-mute)">
        <Icon name="arrowDown" />
      </div>
      <div className={`flex flex-col gap-3.5 rounded-[24px] px-5 py-[18px] ${CARD_SURFACE}`}>
        <div className="flex items-center justify-between">
          <strong className={`text-[15px] font-semibold ${SORA}`}>Best matches</strong>
          <Pill tone="pineSoft" strong>All above 80%</Pill>
        </div>
        {BEST_MATCHES.map((person) => (
          <div key={person.initials} className="grid grid-cols-[38px_minmax(0,1fr)_48px] items-center gap-3">
            <span className={`flex size-[38px] items-center justify-center text-[13px] font-semibold text-white ${SORA}`} style={{ background: person.color }}>
              {person.initials}
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="flex items-center gap-2 text-[14px] font-semibold">
                {person.name}
                <Pill tone="pineSoft" size="xs">Verified</Pill>
              </span>
              <span className="relative h-1.5 rounded-[3px] bg-(--ag-mist)">
                <i className="absolute inset-y-0 left-0 rounded-[3px] bg-(--ag-pine)" style={{ width: `${person.match}%` }} />
              </span>
            </div>
            <strong className={`text-right text-[18px] leading-[.98] tracking-[-.045em] ${BOLD}`}>{person.match}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MatchSection() {
  return (
    <section id="match" aria-labelledby="match-title" className={`bg-white ${SECTION} ${ANCHOR}`}>
      <div className={`${WRAP} grid grid-cols-2 items-center gap-14 max-[900px]:grid-cols-[minmax(0,1fr)]`}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-[18px]">
            <Kicker tone="pine">Matched candidates</Kicker>
            <SectionTitle id="match-title" bold="Candidates for what you need" light="right now." width="14ch" />
          </div>
          <Lede width="48ch">
            Tell us the skills a role needs today. We rank candidates by how well their verified scores cover it, and give every one of them a match percentage.
          </Lede>
          <PointList items={MATCH_POINTS} />
        </div>
        <MatchIllustration />
      </div>
    </section>
  );
}
