import heroTeam from '../assets/hero-team.jpg';
import heroDeveloper from '../../../assets/landing/hero-developer.jpg';
import heroRecruiters from '../../../assets/landing/hero-recruiters.jpg';
import { HERO_FACTS } from '../content';
import { loopAnimation } from '../utils/loopAnimation';
import { Icon } from '../../../components/landing/Icon';
import { Kicker } from '../../../components/landing/ui';
import {
  SORA, HEADING, SLAB, GRADIENT, RISE, SLIDE, DROP, POP, buttonClass, BUTTON_ICON
} from '../../../components/landing/classNames';

/* Floating photos bob up and down after they pop in (design `bob` keyframe). */
const BOB_KEYFRAMES = [
  { transform: 'translateY(0)', easing: 'ease-in-out' },
  { transform: 'translateY(-7px)', easing: 'ease-in-out' },
  { transform: 'translateY(0)' }
];
const bobCandidatePhoto = loopAnimation(BOB_KEYFRAMES, { duration: 6500, delay: 2300 });
const bobRecruiterPhoto = loopAnimation(BOB_KEYFRAMES, { duration: 7500, delay: 2600 });

const BAND_CLIP = '[clip-path:polygon(0_0,100%_0,100%_100%,16%_100%)]';
const FLOAT_CARD =
  'block overflow-hidden rounded-[4px] bg-white transition-shadow duration-300 ' +
  'shadow-[0_0_0_4px_#fff,0_36px_64px_-22px_rgba(2,56,54,.62),0_14px_28px_-14px_rgba(2,56,54,.4)] ' +
  'hover:shadow-[0_0_0_4px_#fff,0_48px_84px_-22px_rgba(2,56,54,.72),0_18px_34px_-14px_rgba(2,56,54,.48)]';

export default function HeroSection({ nav }) {
  return (
    <div className="relative">
      {/* Right-hand backdrop: gradient edge with the pine panel over it (desktop only) */}
      <div aria-hidden="true" className={`pointer-events-none absolute inset-y-0 left-[calc(50%-14px)] right-0 bg-[linear-gradient(180deg,#FA91FD,#6378F9_55%,#0167F6)] ${BAND_CLIP} max-[900px]:hidden`} />
      <div aria-hidden="true" className={`pointer-events-none absolute inset-y-0 left-1/2 right-0 bg-(--ag-pine) ${BAND_CLIP} max-[900px]:hidden`} />

      {/* Wider than WRAP on desktop: the design's hero padding drops the side gutter. */}
      <section className={`mx-auto w-full max-w-[1240px] max-[900px]:px-5 relative z-[1] grid grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] items-center gap-16 pb-14 pt-16 max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:gap-10 max-[900px]:pb-10 max-[900px]:pt-9`}>
        <div className="flex flex-col gap-[30px]">
          <Kicker className={`-mb-2.5 ${RISE}`}>The skill-based opportunity platform</Kicker>
          <h1 className={`${HEADING} text-[clamp(52px,7vw,100px)] leading-[1.1] tracking-[-.045em] ${RISE}`}>
            <span className="[font-family:Poppins,sans-serif] font-bold">Prove your skills.</span>{' '}
            <span className="[font-family:Poppins,sans-serif] font-light">Find your fit.</span>
          </h1>
          <p className={`max-w-[50ch] text-[18px] text-pretty text-(--ag-mute) max-[900px]:text-[16px] ${RISE} delay-120`}>
            Pass a 10-question test, earn a verified score, and get matched to gigs, internships and jobs that need exactly what you can do.
          </p>
          <div className={`flex flex-wrap gap-3 max-[900px]:flex-col max-[900px]:items-stretch ${RISE} delay-240`}>
            <a {...nav.candidate} className={buttonClass('blue')}>
              I’m a candidate <Icon name="arrowRight" className={`size-5 ${BUTTON_ICON}`} />
            </a>
            <a {...nav.recruiter} className={buttonClass('pine')}>
              <Icon name="building" className={`size-5 ${BUTTON_ICON}`} /> I’m hiring
            </a>
          </div>
          <div className={`flex flex-wrap gap-x-7 gap-y-3 text-[14px] text-(--ag-mute) ${RISE} delay-240`}>
            {HERO_FACTS.map((fact) => (
              <span key={fact.label} className="inline-flex items-center gap-2">
                <i className="size-2.5 flex-none" style={{ background: fact.color }} />
                {fact.label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative aspect-[580/620] w-full max-[900px]:isolate">
          {/* Mobile-only pine backdrop behind the artwork */}
          <div aria-hidden="true" className="absolute -inset-x-5 -bottom-[30px] -top-[26px] -z-10 hidden bg-(--ag-pine) [clip-path:polygon(0_9%,100%_0,100%_100%,0_100%)] max-[900px]:block" />
          <div aria-hidden="true" className={`absolute left-[calc(6.9%+22px)] top-[18px] h-[71%] w-[93.1%] opacity-95 ${SLAB} ${GRADIENT} ${SLIDE} delay-50`} />
          <img
            src={heroTeam}
            alt="Two young professionals reviewing work together on a laptop in a bright office"
            className={`absolute left-[6.9%] top-0 h-[71%] w-[93.1%] object-cover object-[45%_40%] ${SLAB} ${SLIDE} delay-200`}
          />
          <div className={`absolute left-0 top-[71%] flex aspect-square w-[29.2%] flex-col justify-end gap-1.5 bg-(--ag-blue) p-[7%] text-white ${DROP}`}>
            <div className={`${SORA} text-[clamp(30px,3.4vw,50px)] font-bold leading-[.98] tracking-[-.05em]`}>70%</div>
            <div className="text-[clamp(11px,1vw,13px)] leading-[1.3] opacity-92">passes the test and verifies the skill</div>
          </div>

          <div ref={bobCandidatePhoto} className={`absolute -left-[3%] top-[5%] w-[31%] ${POP} delay-1450`}>
            <a {...nav.candidate} aria-label="Explore as a candidate" className={FLOAT_CARD}>
              <img src={heroDeveloper} alt="A young developer coding at her desk" className="aspect-[16/10] w-full object-cover object-[30%_30%]" />
            </a>
          </div>
          <div ref={bobRecruiterPhoto} className={`absolute -right-[4%] top-[48%] w-[36%] ${POP} delay-1600`}>
            <a {...nav.recruiter} aria-label="Explore as a recruiter" className={FLOAT_CARD}>
              <img src={heroRecruiters} alt="A recruiter and a hiring lead reviewing a scorecard on a tablet" className="aspect-[16/10] w-full object-cover object-[50%_35%]" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
