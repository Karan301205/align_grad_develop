/**
 * Shared Tailwind class strings for the common landing page.
 * Colours come from the CSS variables in THEME_VARS (content.js).
 * Keep every class written out in full so Tailwind can find it.
 */

export const WRAP = 'mx-auto w-full max-w-[1240px] px-10 max-[900px]:px-5';
export const SECTION = 'py-28 max-[900px]:py-[76px]';
export const ANCHOR = 'scroll-mt-[76px] max-[900px]:scroll-mt-16';

export const SORA = '[font-family:var(--ag-sora)]';
export const GEIST = '[font-family:var(--ag-geist)]';

/*
 * Headings: src/styles/index.css forces `font-family` and `font-weight` with
 * !important on every h1–h6, which no utility can beat. So heading tags only
 * carry size/spacing/colour (HEADING), and the font + weight go on an inner
 * <span> (BOLD / LIGHT): a child's own value always wins over inheritance.
 */
export const HEADING = 'text-inherit text-balance';
export const BOLD = `${SORA} font-bold`;
export const LIGHT = `${SORA} font-light`;

/** Section heading size (design `.disp .h2`) */
export const H2 = `${HEADING} tracking-[-.045em] leading-[.98] text-[clamp(36px,4.6vw,62px)]`;

export const SLAB = '[clip-path:polygon(0_0,76%_0,100%_100%,24%_100%)]';
export const GRADIENT = 'bg-[linear-gradient(135deg,#FA91FD_0%,#B386F9_30%,#6378F9_62%,#0167F6_100%)]';

/* Entrance motion, using @starting-style so no keyframes are needed */
const EASE_OUT = 'ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none';
export const RISE = `transition-[opacity,translate] duration-900 ${EASE_OUT} starting:opacity-0 starting:translate-y-[22px]`;
export const SLIDE = `transition-[opacity,translate] duration-1000 ${EASE_OUT} starting:opacity-0 starting:translate-x-12`;
export const DROP = `transition-[opacity,translate] duration-800 delay-750 ${EASE_OUT} starting:opacity-0 starting:-translate-x-7 starting:translate-y-7`;
export const POP = `transition-[opacity,translate,scale] duration-700 ${EASE_OUT} starting:opacity-0 starting:translate-y-2.5 starting:scale-90`;
export const SWAP = 'transition-[opacity,translate] duration-400 ease-in-out motion-reduce:transition-none starting:opacity-0 starting:translate-y-2';

/* Buttons (design `.btn` + colour variants) */
const BTN_BASE =
  'group inline-flex items-center justify-center gap-2.5 border-0 font-semibold whitespace-nowrap cursor-pointer ' +
  'transition-[translate,background-color,box-shadow] duration-180 ease-in-out hover:-translate-y-0.5';

const BTN_SIZES = {
  md: 'min-h-[54px] px-6 rounded-[14px] text-[15px]',
  mdShort: 'min-h-[46px] px-6 rounded-[14px] text-[15px]',
  sm: 'min-h-11 px-4 rounded-[12px] text-[14px]',
  card: 'min-h-[38px] px-4 rounded-[12px] text-[13px]',
  cardTall: 'min-h-10 px-4 rounded-[12px] text-[13px]',
  tour: 'min-h-10 px-4 rounded-[12px] text-[14px]'
};

const BTN_VARIANTS = {
  blue: 'bg-(--ag-blue) text-white shadow-[0_12px_26px_-14px_rgba(1,103,246,.95)] hover:bg-(--ag-blue-d)',
  pine: 'bg-(--ag-pine) text-white hover:bg-[#05514C]',
  pineGlow: 'bg-(--ag-pine) text-white shadow-[0_12px_26px_-14px_rgba(2,56,54,.9)] hover:bg-[#05514C]',
  line: 'bg-white text-(--ag-pine) shadow-[inset_0_0_0_1.5px_var(--ag-line)] hover:shadow-[inset_0_0_0_1.5px_var(--ag-pine)]',
  white: 'bg-white text-(--ag-pine)',
  whiteBlue: 'bg-white text-(--ag-blue)',
  plum: 'bg-(--ag-plum) text-white',
  plumGlow: 'bg-(--ag-plum) text-white shadow-[0_12px_26px_-14px_rgba(180,47,184,.9)]'
};

export function buttonClass(variant = 'blue', size = 'md', extra = '') {
  return `${BTN_BASE} ${BTN_SIZES[size]} ${BTN_VARIANTS[variant]} ${extra}`.trim();
}

/** Arrow icon inside a button nudges right on hover. */
export const BUTTON_ICON = 'transition-[translate] duration-180 group-hover:translate-x-[3px]';

/** Accent colours used by the feature tabs. */
export const ACCENT_TEXT = {
  blue: 'text-(--ag-blue)',
  violet: 'text-(--ag-violet)',
  plum: 'text-(--ag-plum)',
  mint: 'text-(--ag-mint)'
};
