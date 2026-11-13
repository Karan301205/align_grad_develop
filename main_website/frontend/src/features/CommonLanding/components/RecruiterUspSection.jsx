import { useState } from 'react';
import { RECRUITER_FEATURES, SAMPLE_TALENTS, LEVEL_SKILLS, SAMPLE_CANDIDATE_POOL } from '../content';
import { Icon } from '../../../components/landing/Icon';
import SkillTabs, { VisualBox, MiniCard } from './SkillTabs';
import { SectionHead, Pill, ScoreRing } from '../../../components/landing/ui';
import { WRAP, SECTION, ANCHOR, SORA, SLAB, GRADIENT, SWAP, buttonClass, BUTTON_ICON } from '../../../components/landing/classNames';

const CARD_TITLE = `${SORA} text-[14.5px] font-semibold tracking-[-.02em]`;
const INITIAL_LEVELS = Object.fromEntries(LEVEL_SKILLS.map((skill) => [skill.key, skill.level]));

/** How many sample candidates clear every chosen level (scores are out of 100, levels out of 10). */
function countQualified(levels) {
  return SAMPLE_CANDIDATE_POOL.filter(([react, node, sql]) =>
    react >= levels.react * 10 && node >= levels.node * 10 && sql >= levels.sql * 10
  ).length;
}

function TopMatchesVisual() {
  return (
    <VisualBox className="bg-(--ag-pine)">
      <span aria-hidden="true" className={`absolute -right-[50px] -top-10 h-[170px] w-[240px] opacity-40 ${SLAB} ${GRADIENT}`} />
      <MiniCard>
        <div className="flex items-center justify-between gap-2.5">
          <div>
            <div className={CARD_TITLE}>Top matches</div>
            <div className="text-[12px] text-(--ag-mute)">Full-stack developer</div>
          </div>
          <Pill tone="pineSoft">3 of 24</Pill>
        </div>
        {SAMPLE_TALENTS.map((talent) => (
          <div key={talent.initials} className="grid grid-cols-[36px_minmax(0,1fr)_46px] items-center gap-2.5 rounded-[12px] bg-(--ag-mist) p-2">
            <span className={`flex size-9 items-center justify-center text-[12.5px] font-semibold text-white ${SORA}`} style={{ background: talent.bg }}>
              {talent.initials}
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold">{talent.name}</div>
              <div className="truncate text-[11.5px] text-(--ag-mute)">{talent.skills}</div>
            </div>
            <ScoreRing
              size={46}
              strokeWidth={14}
              trackColor="#DDE9E6"
              color="var(--ag-pine)"
              offset={talent.ringOffset}
              label={`${talent.match}%`}
              labelClassName="text-[11.5px] font-semibold"
            />
          </div>
        ))}
      </MiniCard>
    </VisualBox>
  );
}

function SkillLevelsVisual({ levels, onLevelChange }) {
  return (
    <VisualBox className="bg-(--ag-pine-bg)">
      <MiniCard gap={3.5}>
        <div className="flex items-center justify-between gap-2.5">
          <div className={CARD_TITLE}>Skill requirements</div>
          <span className="text-[12px] text-(--ag-mute)">Tap to set a level</span>
        </div>
        {LEVEL_SKILLS.map((skill) => (
          <div key={skill.key} className="flex flex-col gap-[7px]">
            <div className="flex justify-between text-[13px]">
              <span className="font-semibold">{skill.label}</span>
              <span>Lvl <strong>{levels[skill.key]}</strong>/10</span>
            </div>
            <div role="group" aria-label={`Minimum level for ${skill.label}`} className="grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => {
                const level = i + 1;
                return (
                  <button
                    key={level}
                    type="button"
                    aria-label={`${skill.label} level ${level}`}
                    aria-pressed={level === levels[skill.key]}
                    onClick={() => onLevelChange(skill.key, level)}
                    className={`h-[22px] cursor-pointer rounded-[4px] border-0 p-0 transition-[background-color,scale] duration-200 hover:scale-y-[1.15] ${level <= levels[skill.key] ? 'bg-(--ag-pine)' : 'bg-(--ag-mist)'}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <div aria-live="polite" className="flex items-center justify-between gap-2.5 rounded-[12px] bg-(--ag-pine) px-3 py-2.5 text-[13px] text-white">
          <span>
            <strong className={`${SORA} text-[20px] font-bold tracking-[-.045em]`}>{countQualified(levels)}</strong> of 24 sample candidates qualify
          </span>
          <Icon name="usersCheck" className="size-[18px] text-(--ag-mint)" />
        </div>
      </MiniCard>
    </VisualBox>
  );
}

function PostGigVisual({ isLive, onPost, onReset }) {
  return (
    <VisualBox className="bg-(--ag-pine)">
      <span aria-hidden="true" className="absolute -bottom-[26px] -left-[26px] size-[120px] bg-[rgba(127,216,196,.14)]" />
      <MiniCard>
        <div className="flex items-center justify-between gap-2.5">
          <div className={CARD_TITLE}>Post a gig</div>
          <Pill tone="pineSoft">No job credits used</Pill>
        </div>
        <div className="rounded-[10px] px-3 py-[9px] text-[13px] shadow-[inset_0_0_0_1.5px_var(--ag-line)]">Fix checkout bugs before launch</div>
        <div className="grid grid-cols-2 gap-2 text-[12.5px]">
          <div className="rounded-[10px] bg-(--ag-mist) px-3 py-[9px]">
            <span className="block text-[11px] text-(--ag-mute)">Budget</span>
            <strong>₹5,000 fixed</strong>
          </div>
          <div className="rounded-[10px] bg-(--ag-mist) px-3 py-[9px]">
            <span className="block text-[11px] text-(--ag-mute)">Deadline</span>
            <strong>3 days</strong>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill>React</Pill>
          <Pill>Node.js</Pill>
        </div>
        {isLive ? (
          <div className={`flex items-center justify-between gap-2.5 rounded-[10px] bg-(--ag-pine-bg) px-3 py-[9px] text-[13px] ${SWAP}`}>
            <span className="inline-flex items-center gap-2 font-semibold">
              <i className="size-2 rounded-full bg-(--ag-ok)" />
              Live now
            </span>
            <button type="button" onClick={onReset} className="min-h-8 cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-normal text-(--ag-mute) underline">
              Reset
            </button>
          </div>
        ) : (
          <button type="button" onClick={onPost} className={buttonClass('pine', 'cardTall', 'w-full')}>Post gig</button>
        )}
      </MiniCard>
    </VisualBox>
  );
}

export default function RecruiterUspSection({ nav }) {
  const [levels, setLevels] = useState(INITIAL_LEVELS);
  const [gigLive, setGigLive] = useState(false);

  const renderVisual = (feature) => {
    if (feature.key === 'levels') {
      return <SkillLevelsVisual levels={levels} onLevelChange={(key, level) => setLevels((prev) => ({ ...prev, [key]: level }))} />;
    }
    if (feature.key === 'gig') {
      return <PostGigVisual isLive={gigLive} onPost={() => setGigLive(true)} onReset={() => setGigLive(false)} />;
    }
    return <TopMatchesVisual />;
  };

  return (
    <section id="recruiters" aria-labelledby="recruiters-title" className={`${SECTION} ${ANCHOR} bg-(--ag-pine) text-white`}>
      <div className={WRAP}>
        <SectionHead
          kicker="For recruiters"
          kickerTone="mint"
          titleId="recruiters-title"
          bold="How hiring works"
          light="on AlignGrad."
          lede="Three tools that take you from an open role to the right person, without the résumé guesswork."
          ledeTone="onDark"
        />
        <SkillTabs
          idPrefix="recruiter-usp"
          label="Matched with the right candidates and more"
          features={RECRUITER_FEATURES}
          tone="dark"
          renderVisual={renderVisual}
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <a {...nav.recruiter} className={buttonClass('white')}>
            Explore as a recruiter <Icon name="arrowRight" className={`size-5 ${BUTTON_ICON}`} />
          </a>
        </div>
      </div>
    </section>
  );
}
