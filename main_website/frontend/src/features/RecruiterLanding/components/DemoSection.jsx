import { useState } from 'react';
import {
  DEMO_SKILLS, DEMO_MAX_SKILLS, DEMO_DEFAULT_SELECTION, DEMO_DEFAULT_LEVELS, DEMO_MATCH_MIN, DEMO_POOL
} from '../content';
import { rankCandidates } from '../matching';
import { Icon } from '../../../components/landing/Icon';
import { SectionHead, ScoreRing } from '../../../components/landing/ui';
import { WRAP, ANCHOR, HEADING, BOLD, SORA } from '../../../components/landing/classNames';
import { SECTION, SWAP } from '../../../components/landing/portalLayout';

const sliderId = (skill) => `lv-${skill.replace(/[^a-z]/gi, '')}`;

function SkillChips({ selected, onToggle }) {
  const atLimit = selected.length >= DEMO_MAX_SKILLS;
  return (
    <div role="group" aria-label="Skills" className="flex flex-wrap gap-2">
      {DEMO_SKILLS.map((skill) => {
        const isOn = selected.includes(skill);
        return (
          <button
            key={skill}
            type="button"
            aria-pressed={isOn}
            disabled={!isOn && atLimit}
            onClick={() => onToggle(skill)}
            className={`inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-full border-0 px-3.5 text-[14px] font-medium leading-[normal] transition-[background-color,color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none ${
              isOn ? 'bg-(--ag-pine) text-white' : 'bg-(--ag-mist) text-(--ag-pine) hover:shadow-[inset_0_0_0_1.5px_var(--ag-pine)]'
            }`}
          >
            <Icon name={isOn ? 'check' : 'plus'} className="size-[15px]" />
            {skill}
          </button>
        );
      })}
    </div>
  );
}

function LevelSlider({ skill, level, onChange }) {
  const id = sliderId(skill);
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] bg-(--ag-mist) px-4 py-3.5">
      <div className="flex items-baseline justify-between text-[14px]">
        <label htmlFor={id} className="font-semibold">{skill}</label>
        <span>Lvl <strong className={`text-[18px] leading-[.98] tracking-[-.045em] ${BOLD}`}>{level}</strong>/10</span>
      </div>
      <input
        id={id}
        type="range"
        min="1"
        max="10"
        step="1"
        value={level}
        onChange={(event) => onChange(skill, Number(event.target.value))}
        className="m-0 h-[26px] w-full cursor-pointer accent-(--ag-pine)"
      />
    </div>
  );
}

function MatchRow({ candidate }) {
  return (
    <li className={`grid grid-cols-[40px_minmax(0,1fr)_56px] items-center gap-3 rounded-[16px] bg-white/6 p-3 ${SWAP}`}>
      <span className={`flex size-10 items-center justify-center text-[13px] font-semibold text-white ${SORA}`} style={{ background: candidate.color }}>
        {candidate.initials}
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-[14px]">
          <strong className="font-semibold">{candidate.name}</strong>{' '}
          <span className="text-[12.5px] text-white/60">{candidate.barsMet} of {candidate.parts.length} bars met</span>
        </span>
        <span className="flex flex-wrap gap-1">
          {candidate.parts.map((part) => (
            <span
              key={part.skill}
              className={`inline-flex items-center rounded-[6px] px-2 py-[3px] text-[11.5px] font-medium ${
                part.met ? 'bg-[rgba(127,216,196,.18)] text-[#7FD8C4]' : 'bg-[rgba(250,145,253,.16)] text-[#FFB8FF]'
              }`}
            >
              {part.skill} {part.score}
            </span>
          ))}
        </span>
      </div>
      <ScoreRing
        size={52}
        strokeWidth={13}
        trackColor="rgba(255,255,255,.12)"
        color="#7FD8C4"
        offset={candidate.ringOffset}
        label={`${candidate.match}%`}
        labelClassName="text-[13px] font-semibold"
        animated
      />
    </li>
  );
}

function ResultsPanel({ results }) {
  return (
    <div aria-live="polite" className="flex min-w-0 flex-col gap-3.5 bg-(--ag-pine-m) p-8 max-[900px]:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <output className={`text-[64px] leading-[.9] tracking-[-.06em] ${BOLD}`}>{results.aboveCount}</output>
          <span className="pb-1.5 text-[14px] text-white/78">
            of {DEMO_POOL.length} candidates
            <br />
            above {DEMO_MATCH_MIN}% match
          </span>
        </div>
        <div className="text-right">
          <output className={`block text-[30px] leading-[.98] tracking-[-.045em] text-(--ag-mint) ${BOLD}`}>{results.average}%</output>
          <div className="text-[12.5px] text-white/70">average match shown</div>
        </div>
      </div>

      <div>
        <div className="relative h-2.5 rounded-[5px] bg-white/12">
          <i className="absolute inset-y-0 left-0 rounded-[5px] bg-(--ag-mint) transition-[width] duration-600 ease-[cubic-bezier(.2,.7,.2,1)]" style={{ width: `${results.average}%` }} />
          <b className="absolute -top-1.5 left-[80%] -ml-[1.5px] h-[22px] w-[3px] rounded-[2px] bg-(--ag-orchid)" />
        </div>
        <div className="mt-1.5 flex justify-between text-[11.5px] text-white/60">
          <span>0%</span>
          <span className="ml-auto mr-[14%]">{DEMO_MATCH_MIN}% minimum</span>
          <span>100%</span>
        </div>
      </div>

      {results.top.length > 0 ? (
        <ul className="flex flex-col gap-3.5">
          {results.top.map((candidate) => <MatchRow key={candidate.name} candidate={candidate} />)}
        </ul>
      ) : (
        <div className="rounded-[16px] bg-white/6 p-6 text-center text-[14.5px] text-white/80">
          No one clears an {DEMO_MATCH_MIN}% match at these levels yet. Try lowering one of the bars.
        </div>
      )}

      <p className="mt-auto text-[12.5px] text-white/60">Showing the top {results.top.length || 5} from a sample pool of {DEMO_POOL.length} verified candidates.</p>
    </div>
  );
}

/** "Set the bar. See who clears it.": pick skills and levels, watch the sample pool re-rank. */
export default function DemoSection() {
  const [selected, setSelected] = useState(DEMO_DEFAULT_SELECTION);
  const [levels, setLevels] = useState(DEMO_DEFAULT_LEVELS);
  const results = rankCandidates(selected, levels);

  // Keep at least one skill; never more than DEMO_MAX_SKILLS.
  const toggleSkill = (skill) => {
    setSelected((current) => {
      if (current.includes(skill)) return current.length > 1 ? current.filter((s) => s !== skill) : current;
      return current.length < DEMO_MAX_SKILLS ? [...current, skill] : current;
    });
  };

  return (
    <section id="demo" aria-labelledby="demo-title" className={`bg-(--ag-pine) text-white ${SECTION} ${ANCHOR}`}>
      <div className={WRAP}>
        <SectionHead
          kicker="Try it yourself"
          kickerTone="mint"
          titleId="demo-title"
          bold="Set the bar."
          light="See who clears it."
          titleWidth="13ch"
          lede="Pick any skills, set the level you need, and watch the matches update. We only put candidates above an 80% match in front of you."
          ledeTone="onDarkStrong"
          ledeWidth="42ch"
          spacing="compact"
        />
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] overflow-hidden rounded-[28px] shadow-[0_0_0_1px_rgba(255,255,255,.08)] max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:rounded-[22px]">
          <div className="flex flex-col gap-5 bg-white p-8 text-(--ag-pine) max-[900px]:p-5">
            <div>
              <h3 className={`${HEADING} text-[22px] leading-[.98] tracking-[-.03em]`}>
                <span className={BOLD}>Your requirements</span>
              </h3>
              <p className="mt-1 text-[14px] text-(--ag-mute)">Choose up to {DEMO_MAX_SKILLS} skills, then set a minimum level for each.</p>
            </div>
            <SkillChips selected={selected} onToggle={toggleSkill} />
            <div className="flex flex-col gap-2.5">
              {selected.map((skill) => (
                <LevelSlider key={skill} skill={skill} level={levels[skill]} onChange={(key, value) => setLevels((prev) => ({ ...prev, [key]: value }))} />
              ))}
            </div>
            <p className="mt-auto text-[12.5px] text-(--ag-mute)">Level 7 means a verified test score of 70 or more.</p>
          </div>
          <ResultsPanel results={results} />
        </div>
      </div>
    </section>
  );
}
