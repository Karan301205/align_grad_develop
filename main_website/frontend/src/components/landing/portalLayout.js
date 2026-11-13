/**
 * Tailwind class strings shared by the two portal landing pages
 * (candidate /for-candidates and recruiter /for-recruiters).
 * Colours come from each page's THEME_VARS; `--ag-accent` is blue for
 * candidates and pine for recruiters.
 */

/** Section rhythm: 120px desktop, 76px mobile (design `.sec`). */
export const SECTION = 'py-[120px] max-[900px]:py-[76px]';

/**
 * Portal hero grid (design `.k-hero`): text (area a) and art (area c) on the left,
 * auth card (area b) on the right. Desktop spans the full 1240px with no side
 * gutter, as in the designs; mobile stacks a, b, c with a 20px gutter.
 */
export const HERO_GRID =
  'mx-auto grid w-full max-w-[1240px] grid-cols-[minmax(0,1.12fr)_minmax(0,.88fr)] items-start gap-x-16 gap-y-10 pb-[88px] pt-16 ' +
  "[grid-template-areas:'a_b'_'c_b'] max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:gap-8 max-[900px]:px-5 max-[900px]:pb-14 max-[900px]:pt-8 " +
  "max-[900px]:[grid-template-areas:'a'_'b'_'c']";

/** White card with hairline ring and soft drop (design `.card`). */
export const CARD_SURFACE = 'bg-white shadow-[0_0_0_1px_var(--ag-line),0_28px_50px_-36px_rgba(2,56,54,.4)]';

/** Hover lift for cards (design `.lift`); `distance` picks the design's -5px or the job card's -4px. */
export function liftClass(distance = 5) {
  return distance === 4
    ? 'transition-[translate,box-shadow] duration-250 ease-in-out hover:-translate-y-1 hover:shadow-[0_0_0_1px_var(--ag-line),0_36px_60px_-32px_rgba(2,56,54,.5)]'
    : 'transition-[translate,box-shadow] duration-250 ease-in-out hover:-translate-y-[5px] hover:shadow-[0_0_0_1px_var(--ag-line),0_36px_60px_-32px_rgba(2,56,54,.5)]';
}

const EASE_OUT = 'ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none';

/** Hero entrances (design `rise` / `fan` / `slide` keyframes) as @starting-style transitions. */
export const RISE = `transition-[opacity,translate] duration-900 ${EASE_OUT} starting:opacity-0 starting:translate-y-[22px]`;
export const RISE_AUTH = `transition-[opacity,translate] duration-1000 delay-200 ${EASE_OUT} starting:opacity-0 starting:translate-y-[22px]`;
export const FAN = `transition-[opacity,translate] duration-800 ${EASE_OUT} starting:opacity-0 starting:translate-y-[30px]`;
export const SLIDE_IN = `transition-[opacity,translate] duration-900 delay-700 ${EASE_OUT} starting:opacity-0 starting:translate-x-10`;

/** Content swap fade (design `.swap`, 0.35s). */
export const SWAP = 'transition-[opacity,translate] duration-350 ease-in-out motion-reduce:transition-none starting:opacity-0 starting:translate-y-2';

/** Inline text button (design `.linkb`), in the page's accent colour. */
export const LINK_BUTTON =
  'min-h-8 cursor-pointer border-0 bg-transparent p-0 font-semibold leading-[normal] text-(--ag-accent) underline underline-offset-3 [font-size:inherit]';

/** Mobile: a grid becomes a horizontal snap carousel (design `.g3` / `.g4` under 900px). */
export const MOBILE_CAROUSEL =
  'max-[900px]:-mx-5 max-[900px]:grid-flow-col max-[900px]:grid-cols-none max-[900px]:auto-cols-[78%] max-[900px]:snap-x ' +
  'max-[900px]:snap-mandatory max-[900px]:overflow-x-auto max-[900px]:px-5 max-[900px]:pb-[18px] max-[900px]:pt-1.5 max-[900px]:[scrollbar-width:none] ' +
  // snap to the 20px gutter, not the screen edge
  'max-[900px]:scroll-px-5';

/** Bulleted check list used in the recruiter sections (design `.pts3`). */
export const CHECK_ITEM = 'flex items-start gap-3 text-[16px]';
