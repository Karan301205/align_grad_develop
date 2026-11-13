import { Icon } from './Icon';
import { H2, BOLD, LIGHT, SORA, GRADIENT } from './classNames';

const KICKER_TONES = {
  blue: 'text-(--ag-blue)',
  mint: 'text-(--ag-mint)',
  pine: 'text-(--ag-pine)',
  plum: 'text-(--ag-plum)',
  violet: 'text-(--ag-violet)'
};

/** Small coloured label with a square bullet (design `.kick`). */
export function Kicker({ children, tone = 'blue', className = '' }) {
  return (
    <p className={`inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-[-.01em] max-[900px]:text-[14px] ${KICKER_TONES[tone]} ${className}`}>
      <span aria-hidden="true" className="size-[9px] flex-none bg-current" />
      {children}
    </p>
  );
}

const LEDE_TONES = {
  mute: 'text-(--ag-mute)',
  onDark: 'text-white/74',
  onDarkStrong: 'text-white/76'
};

const LEDE_WIDTHS = {
  '38ch': 'max-w-[38ch]',
  '40ch': 'max-w-[40ch]',
  '42ch': 'max-w-[42ch]',
  '44ch': 'max-w-[44ch]',
  '48ch': 'max-w-[48ch]',
  '50ch': 'max-w-[50ch]'
};

/** Intro paragraph (design `.lede`). */
export function Lede({ children, tone = 'mute', width = '50ch', className = '' }) {
  return (
    <p className={`text-[18px] text-pretty max-[900px]:text-[16px] ${LEDE_TONES[tone]} ${LEDE_WIDTHS[width]} ${className}`}>
      {children}
    </p>
  );
}

const TITLE_WIDTHS = {
  '12ch': 'max-w-[12ch]',
  '13ch': 'max-w-[13ch]',
  '14ch': 'max-w-[14ch]',
  '15ch': 'max-w-[15ch]',
  '16ch': 'max-w-[16ch]',
  '18ch': 'max-w-[18ch]',
  none: ''
};

/**
 * Two-weight section title: bold lead-in, light finish.
 * The width cap sits on the inner Sora span so `ch` is measured in Sora, as in
 * the design (the <h2> itself is forced to another font by index.css).
 */
export function SectionTitle({ id, bold, light, width = '15ch' }) {
  return (
    <h2 id={id} className={H2}>
      <span className={`block text-balance ${BOLD} ${TITLE_WIDTHS[width]}`}>
        {bold} <span className={LIGHT}>{light}</span>
      </span>
    </h2>
  );
}

const HEAD_SPACING = {
  default: 'mb-12 max-[900px]:mb-8',
  compact: 'mb-10 max-[900px]:mb-7'
};

/** Heading block with the lede pushed to the right (design `.head-row`). */
export function SectionHead({ kicker, kickerTone, titleId, bold, light, titleWidth = '15ch', lede, ledeTone, ledeWidth = '40ch', spacing = 'default' }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-12 gap-y-6 ${HEAD_SPACING[spacing]}`}>
      <div className="flex flex-col gap-[18px]">
        <Kicker tone={kickerTone}>{kicker}</Kicker>
        <SectionTitle id={titleId} bold={bold} light={light} width={titleWidth} />
      </div>
      <Lede tone={ledeTone} width={ledeWidth}>{lede}</Lede>
    </div>
  );
}

const PILL_TONES = {
  mist: 'bg-(--ag-mist) text-(--ag-pine)',
  ok: 'bg-(--ag-ok-bg) text-(--ag-ok)',
  pine: 'bg-(--ag-pine) text-white',
  pineSoft: 'bg-(--ag-pine-bg) text-(--ag-pine)',
  soft: 'bg-(--ag-soft) text-(--ag-blue)',
  blue: 'bg-(--ag-blue) text-white',
  white: 'bg-white text-(--ag-pine)',
  orchid: 'bg-(--ag-orchid) text-(--ag-pine)',
  pinkSoft: 'bg-[#FFE6FE] text-[#8E1F91]',
  whitePlum: 'bg-white text-[#8E1F91]',
  whiteMute: 'bg-white text-(--ag-mute)',
  plumSoft: 'bg-[#FFF0FE] text-[#8E1F91]',
  violetSoft: 'bg-[#F1ECFF] text-(--ag-violet)',
  glass: 'bg-white/14 text-white',
  glassDim: 'bg-white/12 text-white',
  glassLight: 'bg-white/16 text-white',
  onBlue: 'bg-white/18 text-white'
};

const PILL_SIZES = {
  md: 'px-[11px] py-1.5 text-[12.5px]',
  sm: 'px-2 py-1 text-[11.5px]',
  xs: 'px-[7px] py-0.5 text-[11px]'
};

/**
 * Small rounded tag (design `.pill`). Use `size` / `strong` rather than
 * padding or weight classes in `className`, which would fight the defaults.
 */
export function Pill({ children, tone = 'mist', size = 'md', strong = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[8px] ${PILL_SIZES[size]} ${strong ? 'font-semibold' : 'font-medium'} ${PILL_TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** Bulleted list with check icons in the accent colour. */
export function CheckList({ items, accentClass }) {
  return (
    <ul className="mt-0.5 flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[15px]">
          <Icon name="check" className={`mt-0.5 size-[18px] ${accentClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Circular progress ring with a centred label (r=50 on a 120 viewBox, circumference ≈ 314). */
export function ScoreRing({ size, strokeWidth, trackColor, color, offset, label, labelClassName = 'text-[12.5px] font-semibold', animated = false }) {
  return (
    <span className="relative block flex-none" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true" className="block -rotate-90">
        <circle cx="60" cy="60" r="50" fill="none" style={{ stroke: trackColor, strokeWidth }} />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          style={{ stroke: color, strokeWidth, strokeLinecap: 'round', strokeDasharray: 314, strokeDashoffset: offset, transition: animated ? 'stroke-dashoffset .6s ease' : undefined }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center ${SORA} ${labelClassName}`}>{label}</span>
    </span>
  );
}

const WINDOW_SHADOWS = {
  pine: 'shadow-[0_0_0_1px_var(--ag-line),0_40px_70px_-40px_rgba(2,56,54,.6)]',
  blue: 'shadow-[0_0_0_1px_var(--ag-line),0_50px_90px_-50px_rgba(1,103,246,.6)]'
};

/** Mock browser window frame with traffic-light dots and an address bar. */
export function BrowserWindow({ address, glow = 'pine', className = '', children }) {
  return (
    <div className={`overflow-hidden rounded-[18px] bg-white text-(--ag-pine) ${WINDOW_SHADOWS[glow]} ${className}`}>
      <div className="flex h-[38px] items-center gap-1.5 border-b border-(--ag-line) bg-(--ag-mist) px-3.5">
        <i className="size-[9px] rounded-full bg-[#D5DBE7]" />
        <i className="size-[9px] rounded-full bg-[#D5DBE7]" />
        <i className="size-[9px] rounded-full bg-[#D5DBE7]" />
        <span className="ml-2.5 flex h-6 min-w-0 flex-1 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-[7px] bg-white px-2.5 text-[12px] text-(--ag-mute) shadow-[0_0_0_1px_var(--ag-line)]">
          <Icon name="lock" className="size-3" />
          {address}
        </span>
      </div>
      {children}
    </div>
  );
}

/** Small AlignGrad mark drawn from two shapes plus the "AlignGrad" wordmark (dark footers). */
export function BrandLockup() {
  return (
    <>
      <span aria-hidden="true" className="relative inline-block h-8 w-[26px] flex-none">
        <i className={`absolute left-[2px] top-0 block h-[19.5px] w-6 [clip-path:polygon(0_0,55%_0,100%_100%,45%_100%)] ${GRADIENT}`} />
        <i className="absolute left-0 top-5 block h-[11.6px] w-[12.4px] bg-[#0167F6]" />
      </span>
      <span className={`text-[22px] tracking-[-.04em] ${SORA}`}>
        <strong className="font-bold">Align</strong><span className="font-normal">Grad</span>
      </span>
    </>
  );
}

/** Large AlignGrad mark used beside closing CTAs; `squareClass` colours the square. */
export function CtaMark({ squareClass = 'bg-white' }) {
  return (
    <div aria-hidden="true" className="relative h-[118px] w-24 flex-none">
      <span className={`absolute left-2 top-0 h-[72px] w-[88px] [clip-path:polygon(0_0,55%_0,100%_100%,45%_100%)] ${GRADIENT}`} />
      <span className={`absolute left-0 top-[74px] h-11 w-[46px] ${squareClass}`} />
    </div>
  );
}
