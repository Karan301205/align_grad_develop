import { GIG_STEPS, SAMPLE_GIGS } from '../content';
import { Icon } from '../../../../components/landing/Icon';
import { Kicker, Lede, SectionTitle, Pill } from '../../../../components/landing/ui';
import { WRAP, ANCHOR, SORA, BOLD, SLAB, GRADIENT, buttonClass, BUTTON_ICON } from '../../../../components/landing/classNames';
import { SECTION } from '../../../../components/landing/portalLayout';

const STEP_TITLE = `block ${SORA} text-[17px] font-semibold tracking-[-.02em]`;

function EarningsStack() {
  return (
    <div className="relative flex flex-col gap-3.5 overflow-hidden rounded-[28px] bg-[#FFF0FE] p-7 max-[900px]:rounded-[22px] max-[900px]:p-[18px]">
      <span aria-hidden="true" className={`absolute -right-[70px] -top-[50px] h-[220px] w-[300px] opacity-35 ${SLAB} ${GRADIENT}`} />
      <div className="relative flex items-center justify-between gap-4 rounded-[18px] bg-(--ag-pine) px-5 py-[18px] text-white">
        <div>
          <div className="text-[13px] opacity-75">Earned this month</div>
          <div className={`text-[34px] leading-[.98] tracking-[-.05em] ${BOLD}`}>₹8,500</div>
        </div>
        <div className="text-right text-[13px] opacity-85">
          3 gigs completed
          <br />
          2 five-star reviews
        </div>
      </div>
      {SAMPLE_GIGS.map((gig) => (
        <div
          key={gig.title}
          className="relative grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[18px] bg-white p-4 shadow-[0_0_0_1px_var(--ag-line),0_20px_36px_-26px_rgba(14,27,61,.45)] transition-[translate] duration-[220ms] ease-in-out hover:translate-x-1.5 max-[900px]:grid-cols-[40px_minmax(0,1fr)] max-[900px]:gap-3"
        >
          <span className="flex size-11 items-center justify-center" style={{ background: gig.bg, color: gig.fg }}>
            <Icon name={gig.icon} />
          </span>
          <div className="min-w-0">
            <div className={`text-[15px] font-semibold tracking-[-.02em] ${SORA}`}>{gig.title}</div>
            <div className="text-[12.5px] text-(--ag-mute)">{gig.meta}</div>
          </div>
          <Pill tone="pine" className="justify-self-start max-[900px]:col-span-full">{gig.budget}</Pill>
        </div>
      ))}
    </div>
  );
}

export default function GigsSection({ openAuth }) {
  const browseGigs = (event) => {
    event.preventDefault();
    openAuth('signup');
  };

  return (
    <section id="gigs" aria-labelledby="gigs-title" className={`bg-white ${SECTION} ${ANCHOR}`}>
      <div className={`${WRAP} grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-14 max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:gap-8`}>
        <div className="flex flex-col gap-[26px]">
          <div className="flex flex-col gap-[18px]">
            <Kicker tone="plum">Gigs</Kicker>
            <SectionTitle id="gigs-title" bold="Earn on the side" light="with gigs." width="13ch" />
          </div>
          <Lede width="48ch">
            Not ready for a full-time role, or want extra income while you study? Pick up short paid gigs that use the skills you already have.
          </Lede>
          <ol className="flex flex-col gap-3.5">
            {GIG_STEPS.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3.5">
                <span className={`flex size-11 items-center justify-center bg-[#FFF0FE] text-[15px] font-semibold text-(--ag-plum) ${SORA}`}>{i + 1}</span>
                <div>
                  <strong className={STEP_TITLE}>{step.title}</strong>
                  <span className="text-[15px] text-(--ag-mute)">{step.body}</span>
                </div>
              </li>
            ))}
          </ol>
          <a href="#auth" onClick={browseGigs} className={buttonClass('plumGlow', 'md', 'self-start')}>
            Browse gigs <Icon name="arrowRight" className={`size-5 ${BUTTON_ICON}`} />
          </a>
        </div>
        <EarningsStack />
      </div>
    </section>
  );
}
