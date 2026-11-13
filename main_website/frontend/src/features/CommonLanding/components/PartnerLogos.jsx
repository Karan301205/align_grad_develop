import { PARTNER_LOGOS } from '../content';
import { loopAnimation, pauseAnimations, resumeAnimations } from '../utils/loopAnimation';
import { Icon } from '../../../components/landing/Icon';
import { WRAP, SORA } from '../../../components/landing/classNames';

const GLYPHS = {
  square: 'bg-current rounded-[4px]',
  circle: 'bg-current rounded-full',
  ring: 'rounded-full bg-transparent shadow-[inset_0_0_0_4px_currentColor]',
  triangle: 'bg-current [clip-path:polygon(50%_0,100%_100%,0_100%)]',
  diamond: 'bg-current rotate-45 scale-[.8] rounded-[3px]',
  slab: 'bg-current [clip-path:polygon(0_0,60%_0,100%_100%,40%_100%)]'
};

/* The track holds the list twice, so sliding it by half loops seamlessly. */
const scrollMarquee = loopAnimation(
  [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
  { duration: 44000, easing: 'linear' }
);

const FADE_EDGES =
  '[mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] ' +
  '[-webkit-mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]';

function LogoChip({ name, glyph, hidden = false }) {
  return (
    <span
      aria-hidden={hidden || undefined}
      className={`inline-flex h-16 items-center gap-2.5 whitespace-nowrap rounded-[16px] bg-white px-[26px] text-[19px] font-bold tracking-[-.04em] text-[#6B7787] shadow-[0_0_0_1px_var(--ag-line)] ${SORA}`}
    >
      <i className={`block size-5 flex-none ${GLYPHS[glyph]}`} />
      {name}
    </span>
  );
}

export default function PartnerLogos({ nav }) {
  return (
    <section id="partners" className="pt-[72px]">
      <div className={`${WRAP} mb-[22px] flex flex-wrap items-center justify-between gap-x-8 gap-y-3`}>
        <p className="text-[15px] text-(--ag-mute)">
          <strong className="font-semibold text-(--ag-pine)">Hiring partners.</strong> Teams preparing to hire on verified skill.
        </p>
        <a {...nav.section('partner')} className="inline-flex min-h-10 items-center gap-1.5 text-[14px] font-semibold text-(--ag-blue)">
          Put your logo here
          <Icon name="arrowRight" className="size-4" />
        </a>
      </div>

      <div
        aria-label="Partner company logos"
        className={`overflow-hidden ${FADE_EDGES}`}
        onMouseEnter={(event) => pauseAnimations(event.currentTarget.firstElementChild)}
        onMouseLeave={(event) => resumeAnimations(event.currentTarget.firstElementChild)}
      >
        <div ref={scrollMarquee} className="flex w-max gap-3 pb-1.5 pt-1">
          {PARTNER_LOGOS.map((logo) => (
            <LogoChip key={logo.name} {...logo} />
          ))}
          {/* Second copy for the seamless loop, hidden from screen readers */}
          {PARTNER_LOGOS.map((logo) => (
            <LogoChip key={`${logo.name}-loop`} {...logo} hidden />
          ))}
        </div>
      </div>
    </section>
  );
}
