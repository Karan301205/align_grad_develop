import { SAMPLE_GIGS, GIG_STEPS } from '../content';
import { Icon } from '../../../components/landing/Icon';
import { SectionHead, Pill } from '../../../components/landing/ui';
import { WRAP, ANCHOR, HEADING, BOLD, SORA, buttonClass, BUTTON_ICON } from '../../../components/landing/classNames';
import { SECTION, CARD_SURFACE, liftClass } from '../../../components/landing/portalLayout';

export default function GigsSection({ openAuth }) {
  const postGig = (event) => {
    event.preventDefault();
    openAuth('signup');
  };

  return (
    <section id="gigs" aria-labelledby="gigs-title" className={`bg-(--ag-pine-bg) ${SECTION} ${ANCHOR}`}>
      <div className={WRAP}>
        <SectionHead
          kicker="Gigs"
          kickerTone="pine"
          titleId="gigs-title"
          bold="Small task?"
          light="Post a gig."
          titleWidth="13ch"
          lede="For work you need done in days, not months. Post a short task with a budget and a deadline, and pick from verified candidates who pitch for it."
          ledeWidth="44ch"
          spacing="compact"
        />

        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1 max-[900px]:gap-3">
          {SAMPLE_GIGS.map((gig) => (
            <article key={gig.title} className={`flex flex-col gap-3 rounded-[24px] p-[22px] ${CARD_SURFACE} ${liftClass()}`}>
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center text-white" style={{ background: gig.color }}>
                  <Icon name={gig.icon} />
                </span>
                <Pill tone="pine">{gig.budget}</Pill>
              </div>
              <h3 className={`${HEADING} text-[19px] leading-[1.2] tracking-[-.03em]`}>
                <span className={BOLD}>{gig.title}</span>
              </h3>
              <div className="flex items-center gap-1.5 text-[13.5px] text-(--ag-mute)">
                <Icon name="clock" className="size-4" />
                {gig.time}
              </div>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {gig.skills.map((skill) => <Pill key={skill}>{skill}</Pill>)}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 max-[900px]:grid-cols-1 max-[900px]:gap-3">
          {GIG_STEPS.map((step, i) => (
            <div key={step.title} className="flex items-start gap-3.5 rounded-[18px] bg-white px-5 py-[18px]">
              <span className={`flex size-[38px] flex-none items-center justify-center bg-(--ag-pine) font-semibold text-white ${SORA}`}>{i + 1}</span>
              <div>
                <strong className="block font-semibold">{step.title}</strong>
                <span className="text-[14px] text-(--ag-mute)">{step.body}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3.5">
          <a href="#auth" onClick={postGig} className={buttonClass('pineGlow')}>
            Post your first gig <Icon name="arrowRight" className={`size-5 ${BUTTON_ICON}`} />
          </a>
        </div>
      </div>
    </section>
  );
}
