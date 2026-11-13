import { STUDENT_FEATURES } from '../content';
import { Icon, FilledIcon } from '../../../components/landing/Icon';
import SkillTabs, { VisualBox, MiniCard } from './SkillTabs';
import { SectionHead, Pill, ScoreRing } from '../../../components/landing/ui';
import { WRAP, SECTION, ANCHOR, SORA, SLAB, GRADIENT, buttonClass } from '../../../components/landing/classNames';

const CARD_TITLE = `${SORA} text-[14.5px] font-semibold tracking-[-.02em]`;

function JobMatchVisual() {
  return (
    <VisualBox className="bg-(--ag-blue)">
      <span aria-hidden="true" className={`absolute -right-[50px] -top-10 h-[170px] w-[230px] opacity-55 ${SLAB} ${GRADIENT}`} />
      <MiniCard>
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={`flex size-[38px] flex-none items-center justify-center bg-(--ag-blue) font-bold text-white ${SORA}`}>N</span>
            <div className="min-w-0">
              <div className={`${CARD_TITLE} leading-[1.2]`}>Frontend developer intern</div>
              <div className="text-[12px] text-(--ag-mute)">Nimbus Labs, Bengaluru</div>
            </div>
          </div>
          <ScoreRing size={52} strokeWidth={13} trackColor="var(--ag-soft)" color="var(--ag-blue)" offset={25} label="92%" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill tone="ok">React ✓</Pill>
          <Pill tone="ok">JavaScript ✓</Pill>
          <Pill tone="ok">Figma ✓</Pill>
        </div>
        <span className={buttonClass('blue', 'card')}>Apply now</span>
      </MiniCard>
    </VisualBox>
  );
}

function CourseVisual() {
  return (
    <VisualBox className="flex-col gap-2.5 bg-[#F1ECFF]">
      <MiniCard gap={2}>
        <div className="flex justify-between text-[12.5px]">
          <strong className="font-semibold">SQL</strong>
          <span className="text-(--ag-mute)">48 of 65 needed</span>
        </div>
        <div className="relative h-[7px] rounded-[4px] bg-(--ag-mist)">
          <i className="absolute inset-y-0 left-0 w-[48%] rounded-[4px] bg-(--ag-peri)" />
          <b className="absolute -top-[5px] left-[65%] -ml-[1.5px] h-[17px] w-[3px] rounded-[2px] bg-(--ag-plum)" />
        </div>
      </MiniCard>
      <Icon name="arrowDown" className="relative size-5 text-(--ag-violet)" />
      <MiniCard>
        <div className="flex items-center gap-2.5">
          <span className="flex size-[38px] flex-none items-center justify-center rounded-[10px] bg-(--ag-violet) text-white">
            <FilledIcon name="play" className="ml-0.5 size-3.5" />
          </span>
          <div>
            <div className={CARD_TITLE}>SQL for data analysis</div>
            <div className="text-[12px] text-(--ag-mute)">Lesson 3 of 12</div>
          </div>
        </div>
        <div className="h-1.5 rounded-[3px] bg-(--ag-mist)">
          <div className="h-full w-[40%] rounded-[3px] bg-(--ag-violet)" />
        </div>
        <span className="text-[12px] text-(--ag-mute)">Leads into a fresh SQL test</span>
      </MiniCard>
    </VisualBox>
  );
}

function GigVisual() {
  return (
    <VisualBox className="bg-[#FFF0FE]">
      <span aria-hidden="true" className="absolute -bottom-6 -left-6 size-[110px] bg-[rgba(250,145,253,.35)]" />
      <MiniCard>
        <div className="flex items-center justify-between gap-2.5">
          <span className="flex size-[38px] flex-none items-center justify-center bg-(--ag-orchid) text-(--ag-pine)">
            <Icon name="bolt" className="size-[18px]" />
          </span>
          <Pill tone="pine">₹3,500 fixed</Pill>
        </div>
        <div>
          <div className={CARD_TITLE}>Logo refresh for a local café</div>
          <div className="text-[12px] text-(--ag-mute)">Freelance gig, delivery in 3 days</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill tone="ok">Figma ✓</Pill>
          <Pill tone="ok">Branding ✓</Pill>
        </div>
        <span className={buttonClass('plum', 'card')}>Pitch &amp; apply</span>
      </MiniCard>
    </VisualBox>
  );
}

const VISUALS = { jobs: JobMatchVisual, courses: CourseVisual, gigs: GigVisual };

export default function StudentUspSection({ nav }) {
  const linkProps = (to) => (to === 'learn' ? nav.section('learn') : nav.candidate);

  return (
    <section id="student-usp" aria-labelledby="student-usp-title" className={`${SECTION} ${ANCHOR} pt-[88px] max-[900px]:pt-[88px]`}>
      <div className={WRAP}>
        <SectionHead
          kicker="Why students choose AlignGrad"
          titleId="student-usp-title"
          bold="Get matched. Get better."
          light="Get paid."
          lede="Three things every student gets from day one, all built around the skills you can prove."
        />
        <SkillTabs
          idPrefix="student-usp"
          label="Jobs that match your skills and more"
          features={STUDENT_FEATURES}
          renderVisual={(feature) => {
            const Visual = VISUALS[feature.key];
            return <Visual />;
          }}
          linkProps={linkProps}
        />
      </div>
    </section>
  );
}
