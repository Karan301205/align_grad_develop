import { POST_POINTS, SAMPLE_POST_SKILLS } from '../content';
import { Icon } from '../../../components/landing/Icon';
import { Kicker, Lede, SectionTitle, Pill } from '../../../components/landing/ui';
import { WRAP, ANCHOR, BOLD, buttonClass, BUTTON_ICON } from '../../../components/landing/classNames';
import { SECTION } from '../../../components/landing/portalLayout';
import PointList from './PointList';

const FAKE_INPUT = 'rounded-[11px] px-3.5 py-[11px] text-[14px] font-normal shadow-[inset_0_0_0_1.5px_var(--ag-line)]';
const FIELD_LABEL = 'flex flex-col gap-1.5 text-[12.5px] font-medium';

/** Illustration of the job post form (not interactive, hidden from screen readers). */
function JobPostMock() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3.5 rounded-[24px] bg-white p-[26px] shadow-[0_0_0_1px_var(--ag-line),0_50px_90px_-50px_rgba(2,56,54,.6)]">
      <div className="flex items-center justify-between">
        <strong className={`text-[20px] leading-[.98] tracking-[-.03em] ${BOLD}`}>New job post</strong>
        <Pill>Draft</Pill>
      </div>
      <div className={FIELD_LABEL}>
        Job title
        <span className={FAKE_INPUT}>Frontend developer</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Pill tone="pine">Full-time</Pill>
        <Pill>Internship</Pill>
        <Pill>Part-time</Pill>
      </div>
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2.5">
        <div className={FIELD_LABEL}>
          Location
          <span className={FAKE_INPUT}>Bengaluru, hybrid</span>
        </div>
        <div className={FIELD_LABEL}>
          Openings
          <span className={FAKE_INPUT}>2</span>
        </div>
      </div>
      <div className="text-[12.5px] font-semibold text-(--ag-mute)">Required skills and levels</div>
      <div className="flex flex-col gap-2.5">
        {SAMPLE_POST_SKILLS.map((row) => (
          <div key={row.skill} className="grid grid-cols-[90px_minmax(0,1fr)_56px] items-center gap-2.5 text-[13px]">
            <span className="font-semibold">{row.skill}</span>
            <span className="relative h-1.5 rounded-[3px] bg-(--ag-mist)">
              <i className={`absolute inset-y-0 left-0 rounded-[3px] bg-(--ag-pine) ${row.barClass}`} />
            </span>
            <span className="text-right">Lvl {row.level}/10</span>
          </div>
        ))}
      </div>
      <span className={buttonClass('pineGlow', 'mdShort')}>Publish job</span>
      <div className="flex items-center gap-2.5 rounded-[12px] bg-(--ag-pine-bg) px-3.5 py-2.5 text-[13px]">
        <i className="size-2 flex-none rounded-full bg-(--ag-ok)" />
        Matched candidates appear as soon as it’s live
      </div>
    </div>
  );
}

export default function JobPostSection({ openAuth }) {
  const postJob = (event) => {
    event.preventDefault();
    openAuth('signup');
  };

  return (
    <section id="post" aria-labelledby="post-title" className={`${SECTION} ${ANCHOR}`}>
      <div className={`${WRAP} grid grid-cols-2 items-center gap-14 max-[900px]:grid-cols-[minmax(0,1fr)]`}>
        <JobPostMock />
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-[18px]">
            <Kicker tone="pine">Job posts</Kicker>
            <SectionTitle id="post-title" bold="Post a job." light="Attract better candidates." width="14ch" />
          </div>
          <Lede width="48ch">
            Your post carries its skill bar, so candidates know exactly what you need before they apply, and you see how well each one fits.
          </Lede>
          <PointList items={POST_POINTS} />
          <div className="flex flex-wrap items-center gap-3.5">
            <a href="#auth" onClick={postJob} className={buttonClass('pineGlow')}>
              Post your first job free <Icon name="arrowRight" className={`size-5 ${BUTTON_ICON}`} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
