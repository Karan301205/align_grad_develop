import { useState } from 'react';
import { JOB_CATEGORIES, MATCHED_JOBS, JOBS_SHOWN, JOB_PERKS } from '../content';
import { Icon } from '../../../../components/landing/Icon';
import { SectionHead, Pill, ScoreRing } from '../../../../components/landing/ui';
import { WRAP, ANCHOR, HEADING, BOLD, SORA, buttonClass, BUTTON_ICON } from '../../../../components/landing/classNames';
import { CARD_SURFACE, liftClass, SWAP } from '../../../../components/landing/portalLayout';

const ALL = JOB_CATEGORIES[0];
const RING_CIRCUMFERENCE = 314;

function CategoryFilter({ active, onPick }) {
  return (
    <div role="group" aria-label="Job categories" className="mb-6 flex flex-wrap gap-2">
      {JOB_CATEGORIES.map((category) => {
        const isOn = category === active;
        const count = category === ALL ? MATCHED_JOBS.length : MATCHED_JOBS.filter((job) => job.category === category).length;
        return (
          <button
            key={category}
            type="button"
            aria-pressed={isOn}
            onClick={() => onPick(category)}
            className={`min-h-[42px] cursor-pointer rounded-full border-0 px-4 text-[14px] font-medium leading-[normal] transition-[background-color,color,box-shadow] duration-200 ${
              isOn
                ? 'bg-(--ag-blue) text-white shadow-[0_10px_22px_-14px_rgba(1,103,246,.9)]'
                : 'bg-white text-(--ag-mute) shadow-[inset_0_0_0_1.5px_var(--ag-line)] hover:text-(--ag-pine) hover:shadow-[inset_0_0_0_1.5px_var(--ag-blue)]'
            }`}
          >
            {category} <span className="opacity-70">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function JobCard({ job, onView }) {
  return (
    <article className={`flex h-full flex-col gap-3 rounded-[24px] p-5 ${CARD_SURFACE} ${liftClass(4)}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`flex size-[46px] flex-none items-center justify-center text-[17px] font-bold text-white ${SORA}`} style={{ background: job.color }}>
          {job.initial}
        </span>
        <ScoreRing
          size={56}
          strokeWidth={13}
          trackColor="var(--ag-soft)"
          color="var(--ag-blue)"
          offset={(RING_CIRCUMFERENCE * (1 - job.match / 100)).toFixed(1)}
          label={`${job.match}%`}
          labelClassName="text-[13px] font-semibold"
        />
      </div>
      <div>
        <h3 className={`${HEADING} text-[19px] leading-[1.15] tracking-[-.03em]`}>
          <span className={BOLD}>{job.title}</span>
        </h3>
        <div className="mt-1 text-[14px] font-medium">{job.company}</div>
        <div className="mt-0.5 text-[13px] text-(--ag-mute)">{job.location}</div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Pill tone="soft">{job.type}</Pill>
        {job.skills.map((skill) => <Pill key={skill} tone="ok">{skill} ✓</Pill>)}
      </div>
      <a href="#auth" onClick={onView} className={buttonClass('line', 'sm', 'mt-auto')}>
        View role <Icon name="arrowRight" className={`size-5 ${BUTTON_ICON}`} />
      </a>
    </article>
  );
}

export default function JobsSection({ openAuth }) {
  const [category, setCategory] = useState(ALL);
  const shown = MATCHED_JOBS.filter((job) => category === ALL || job.category === category).slice(0, JOBS_SHOWN);

  const viewRole = (event) => {
    event.preventDefault();
    openAuth('signup');
  };

  return (
    <section id="jobs" aria-labelledby="jobs-title" className={`pb-[120px] pt-6 max-[900px]:pb-[76px] ${ANCHOR}`}>
      <div className={WRAP}>
        <SectionHead
          kicker="Matching jobs"
          titleId="jobs-title"
          bold="Every kind of job."
          light="Matched to you."
          lede="Engineering, data, design, marketing, business and more. We line roles up with your skills, so you never have to go hunting."
          ledeWidth="42ch"
          spacing="compact"
        />
        <CategoryFilter active={category} onPick={setCategory} />

        <div aria-live="polite" className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1 max-[900px]:gap-3">
          {shown.map((job) => (
            // Keyed by category so cards fade in again when the filter changes.
            <div key={`${category}-${job.title}`} className={SWAP}>
              <JobCard job={job} onView={viewRole} />
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 max-[900px]:grid-cols-1 max-[900px]:gap-3">
          {JOB_PERKS.map((perk) => (
            <div key={perk.title} className="flex items-start gap-3 rounded-[18px] bg-(--ag-soft) px-5 py-[18px]">
              <span className="flex size-10 flex-none items-center justify-center bg-(--ag-blue) text-white">
                <Icon name={perk.icon} />
              </span>
              <div>
                <strong className="font-semibold">{perk.title}</strong>
                <div className="text-[14px] text-(--ag-mute)">{perk.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
