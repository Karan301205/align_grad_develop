import { useState } from 'react';
import developerPhoto from '../../../../assets/landing/hero-developer.jpg';
import { COURSE_DOMAINS, LESSON_COMPLETE_AT } from '../content';
import { Icon, FilledIcon } from '../../../../components/landing/Icon';
import { Kicker, Lede, SectionTitle, Pill } from '../../../../components/landing/ui';
import { WRAP, ANCHOR, SORA, SLAB, GRADIENT } from '../../../../components/landing/classNames';
import { SECTION, CARD_SURFACE, SWAP } from '../../../../components/landing/portalLayout';

/** Slanted photo with the lesson-progress card (left column). */
function LessonVisual({ domain }) {
  const complete = domain.progress >= LESSON_COMPLETE_AT;
  return (
    <div className="relative aspect-square">
      <span aria-hidden="true" className={`absolute left-[22px] top-[18px] h-[78%] w-full opacity-90 ${SLAB} ${GRADIENT}`} />
      <img
        src={developerPhoto}
        alt="A young developer smiling while coding at her desk"
        className={`absolute left-0 top-0 h-[78%] w-full object-cover object-[35%_30%] ${SLAB}`}
      />
      <div aria-hidden="true" className="absolute left-0 top-[78%] aspect-square w-[24%] bg-(--ag-blue)" />
      <div className={`absolute bottom-0 right-0 flex w-[min(330px,74%)] flex-col gap-3 rounded-[18px] p-[18px] ${CARD_SURFACE} ${SWAP}`}>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-(--ag-blue) text-white">
            <FilledIcon name="play" className="ml-0.5 size-4" />
          </span>
          <div>
            <div className={`text-[15px] font-semibold tracking-[-.02em] ${SORA}`}>{domain.lesson}</div>
            <div className="text-[12.5px] text-(--ag-mute)">{domain.label}</div>
          </div>
        </div>
        <div className="relative h-1.5 rounded-[3px] bg-(--ag-mist)">
          <div className="absolute inset-y-0 left-0 rounded-[3px] bg-(--ag-blue) transition-[width] duration-600 ease-in-out" style={{ width: `${domain.progress}%` }} />
          {/* marks the 50% "lesson complete" point */}
          <div className="absolute -top-1 left-1/2 h-3.5 w-[3px] bg-(--ag-plum)" />
        </div>
        <div className="flex justify-between text-[12px] text-(--ag-mute)">
          <span>{domain.progress}% watched</span>
          <span>{complete ? 'Lesson complete' : `Completes at ${LESSON_COMPLETE_AT}%`}</span>
        </div>
      </div>
    </div>
  );
}

function DomainPicker({ active, onPick }) {
  return (
    <div role="group" aria-label="Course domains" className="grid grid-cols-2 gap-2.5">
      {COURSE_DOMAINS.map((domain, i) => {
        const isOn = i === active;
        return (
          <button
            key={domain.label}
            type="button"
            aria-pressed={isOn}
            onClick={() => onPick(i)}
            className={`flex min-h-[60px] w-full cursor-pointer items-center gap-3 rounded-[16px] border-0 px-4 py-3 text-left text-[15px] font-semibold leading-[normal] tracking-[-.02em] transition-[background-color,box-shadow,color] duration-200 ${SORA} ${
              isOn
                ? 'bg-(--ag-blue) text-white shadow-[0_12px_24px_-14px_rgba(1,103,246,.9)]'
                : 'bg-white text-(--ag-pine) shadow-[inset_0_0_0_1.5px_var(--ag-line)] hover:shadow-[inset_0_0_0_1.5px_var(--ag-blue)]'
            }`}
          >
            <i className="size-2.5 flex-none" style={{ background: domain.color }} />
            {domain.label}
          </button>
        );
      })}
    </div>
  );
}

export default function CoursesSection() {
  const [active, setActive] = useState(0);
  const domain = COURSE_DOMAINS[active];

  return (
    <section id="courses" aria-labelledby="courses-title" className={`${SECTION} ${ANCHOR}`}>
      <div className={`${WRAP} grid grid-cols-2 items-center gap-14 max-[900px]:grid-cols-[minmax(0,1fr)]`}>
        <LessonVisual domain={domain} />
        <div className="flex flex-col gap-[26px]">
          <div className="flex flex-col gap-[18px]">
            <Kicker tone="violet">Courses to upskill</Kicker>
            <SectionTitle id="courses-title" bold="Missing a skill?" light="Don’t worry." width="none" />
          </div>
          <Lede width="48ch">
            Every role shows what it needs. If you’re not there yet, a related course takes you from the gap to a verified skill.
          </Lede>
          <div aria-hidden="true" className="flex flex-wrap items-center gap-2">
            <Pill tone="plumSoft">SQL 48 / 65 needed</Pill>
            <Icon name="arrowRight" className="size-4 text-(--ag-mute)" />
            <Pill tone="violetSoft">Take the course</Pill>
            <Icon name="arrowRight" className="size-4 text-(--ag-mute)" />
            <Pill tone="blue">SQL 78 ✓ verified</Pill>
          </div>
          <DomainPicker active={active} onPick={setActive} />
          <div className="flex flex-wrap items-center gap-2 text-[14px] text-(--ag-mute)">
            Leads into
            {domain.tests.map((test) => (
              <Pill key={test} tone="white" className="shadow-[0_0_0_1px_var(--ag-line)]">{test} test</Pill>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
