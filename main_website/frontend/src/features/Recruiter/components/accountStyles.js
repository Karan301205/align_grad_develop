// Shared Tailwind classes for the recruiter account pages (Company profile, Plan & billing).
// Values come from design/Company profile & verification-html and
// design/Plan & billing — job credits-html.
//
// The global stylesheet forces Inter 500 (!important) on h1–h6 and Geist on buttons,
// so headings carry their weight on an inner <span> and buttons set the family here.

// AlignGrad logo colours, sampled from assets/landing/aligngrad-logo.png: the mark runs
// violet #E18EFF → periwinkle #707BFA → blue #0167F6, the wordmark is teal #003833.
// Used sparingly (sidebar, the top line, a soft page glow, initials) so pages stay calm.
export const BRAND = { violet: '#E18EFF', periwinkle: '#707BFA', blue: '#0167F6', teal: '#003833' };
export const BRAND_GRADIENT = 'bg-[linear-gradient(135deg,#E18EFF_0%,#707BFA_48%,#0167F6_100%)]';
export const BRAND_GRADIENT_X = 'bg-[linear-gradient(90deg,#E18EFF_0%,#707BFA_45%,#0167F6_100%)]';
export const BRAND_GRADIENT_Y = 'bg-[linear-gradient(180deg,#E18EFF_0%,#707BFA_50%,#0167F6_100%)]';
/** Light tint of the logo colours for initials avatars. */
export const BRAND_TINT = 'bg-[linear-gradient(135deg,#F7EDFF_0%,#E8ECFF_100%)] text-[#3446D4]';
/** Faint violet / periwinkle glow at the top of a page, over the page grey. */
export const PAGE_GLOW =
  'bg-[#F8F8F6] bg-[radial-gradient(900px_280px_at_100%_-120px,rgba(112,123,250,0.10),transparent_70%),radial-gradient(700px_240px_at_0%_-100px,rgba(225,142,255,0.08),transparent_70%)] bg-no-repeat';

export const ACCOUNT_PAGE =
  `min-h-full ${PAGE_GLOW} px-4 pb-12 pt-6 font-(family-name:--font-headline) text-sm leading-[1.45] text-[#0F172A] antialiased sm:px-10 sm:pt-8`;

export const CARD = 'rounded-[12px] border border-[#E4E6EA] bg-white';

export const MUTED = 'text-[#4B5563]';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6]';

const BUTTON =
  `inline-flex items-center justify-center gap-2 rounded-[8px] font-(family-name:--font-headline) text-sm font-semibold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;

export const PRIMARY_BUTTON = `${BUTTON} bg-[#1447E6] text-white hover:bg-[#0F38B8]`;

export const SECONDARY_BUTTON = `${BUTTON} border border-[#D5D9E0] bg-white text-[#0F172A] hover:bg-[#F8F8F6]`;

export const LINK = `rounded-[4px] font-semibold text-[#1447E6] hover:text-[#0F38B8] ${FOCUS}`;

export const PAGE_TITLE = 'm-0 text-[28px] leading-[1.2] tracking-[-0.01em] text-[#0F172A]';

export const CARD_TITLE = 'm-0 text-base leading-[1.45] tracking-normal text-[#0F172A]';
