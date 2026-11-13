import { useState } from 'react';
import { COURSES, LEARN_HOST, LEARN_URL } from '../content';
import { Icon, FilledIcon } from '../../../components/landing/Icon';
import { Kicker, Lede, SectionTitle, Pill, BrowserWindow } from '../../../components/landing/ui';
import { WRAP, SECTION, ANCHOR, SORA, SLAB, GRADIENT, SWAP, buttonClass, BUTTON_ICON } from '../../../components/landing/classNames';

/* The reference design shows "Interview Readiness" selected. */
const INITIAL_COURSE = 3;

const COURSE_PERKS = [
  { icon: 'clock', label: 'Done at 50% watched' },
  { icon: 'download', label: 'Download notes' },
  { icon: 'quiz', label: 'End-of-video quiz' }
];

function CoursePicker({ active, onPick }) {
  return (
    <div role="group" aria-label="Courses" className="flex flex-col gap-2.5">
      {COURSES.map((course, i) => {
        const isOn = i === active;
        return (
          <button
            key={course.slug}
            type="button"
            aria-pressed={isOn}
            onClick={() => onPick(i)}
            className={`flex w-full cursor-pointer items-center gap-3.5 rounded-[16px] border-0 px-4 py-3.5 text-left font-normal leading-[normal] transition-[background-color,box-shadow,color] duration-200 ${
              isOn
                ? 'bg-(--ag-blue) text-white shadow-[0_16px_30px_-18px_rgba(1,103,246,.9)]'
                : 'bg-white text-(--ag-pine) shadow-[inset_0_0_0_1.5px_var(--ag-line)] hover:shadow-[inset_0_0_0_1.5px_var(--ag-blue)]'
            }`}
          >
            <i className="size-3.5 flex-none" style={{ background: isOn ? '#fff' : course.dot }} />
            <span className="min-w-0 flex-1">
              <span className={`block text-[16px] font-semibold tracking-[-.02em] ${SORA}`}>{course.title}</span>
              <span className="text-[12.5px] opacity-75">{course.meta}</span>
            </span>
            <Pill tone={isOn ? 'onBlue' : 'mist'}>{course.badge}</Pill>
          </button>
        );
      })}
    </div>
  );
}

function CoursePreview({ course }) {
  return (
    <BrowserWindow
      glow="blue"
      className={SWAP}
      address={<><strong className="font-semibold text-(--ag-pine)">{LEARN_HOST}</strong>/{course.slug}</>}
    >
      <div className="relative flex aspect-[16/7.5] items-center justify-center overflow-hidden" style={{ background: course.bg }}>
        <span aria-hidden="true" className={`absolute -right-10 -top-[30px] h-[190px] w-[260px] opacity-55 ${SLAB} ${GRADIENT}`} />
        <span aria-hidden="true" className="absolute -bottom-5 left-7 size-[90px] bg-white/12" />
        <span aria-hidden="true" className="relative flex size-[68px] items-center justify-center rounded-full bg-white text-(--ag-blue)">
          <FilledIcon name="play" className="ml-[3px] size-6" />
        </span>
        <Pill tone="glassLight" className="absolute left-[18px] top-[18px]">{course.badge}</Pill>
      </div>

      <div className="flex flex-col gap-3.5 p-[22px]">
        <div className="flex flex-wrap items-start justify-between gap-3.5">
          <div>
            <div className={`text-[22px] font-bold leading-[.98] tracking-[-.03em] ${SORA}`}>{course.title}</div>
            <div className="mt-1 text-[13.5px] text-(--ag-mute)">{course.meta}</div>
          </div>
          <Pill tone="soft">Progress {course.progress}%</Pill>
        </div>
        <div className="h-1.5 rounded-[3px] bg-(--ag-mist)">
          <div className="h-full rounded-[3px] bg-(--ag-blue) transition-[width] duration-600 ease-in-out" style={{ width: `${course.progress}%` }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {course.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-(--ag-line) pt-3.5 text-[12.5px] text-(--ag-mute)">
          {COURSE_PERKS.map((perk) => (
            <span key={perk.label} className="flex flex-col gap-1">
              <Icon name={perk.icon} className="size-[18px] text-(--ag-blue)" />
              {perk.label}
            </span>
          ))}
        </div>
      </div>
    </BrowserWindow>
  );
}

export default function LearnSection({ nav }) {
  const [active, setActive] = useState(INITIAL_COURSE);

  return (
    <section id="learn" aria-labelledby="learn-title" className={`${SECTION} ${ANCHOR} bg-white`}>
      <div className={`${WRAP} grid grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)] items-center gap-14 max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:gap-8`}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-[18px]">
            <Kicker>AlignGrad Learn</Kicker>
            <SectionTitle id="learn-title" bold="Learn it there." light="Prove it here." width="none" />
          </div>
          <Lede>
            Every course lives on <strong className="font-semibold text-(--ag-pine)">{LEARN_HOST}</strong> and leads straight into the matching skill tests.
          </Lede>
          <CoursePicker active={active} onPick={setActive} />
          <div className="flex flex-wrap gap-3">
            <a href={LEARN_URL} target="_blank" rel="noopener noreferrer" className={buttonClass('blue')}>
              Visit {LEARN_HOST} <Icon name="external" className={`size-5 ${BUTTON_ICON}`} />
            </a>
            <a {...nav.candidate} className={buttonClass('line')}>Start learning free</a>
          </div>
        </div>
        <CoursePreview course={COURSES[active]} />
      </div>
    </section>
  );
}
