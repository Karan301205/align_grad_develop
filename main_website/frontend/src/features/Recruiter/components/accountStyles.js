// Shared Tailwind classes for the recruiter account pages (Company profile, Plan & billing).
// Values come from design/Company profile & verification-html and
// design/Plan & billing — job credits-html.
//
// The global stylesheet forces Inter 500 (!important) on h1–h6 and Geist on buttons,
// so headings carry their weight on an inner <span> and buttons set the family here.

// The recruiter app follows the landing pages (RecruiterLanding/content.js THEME_VARS): pine green
// #023836 (the logo wordmark) for buttons and headings, green #0F7A55 for links and highlights,
// pine tint #E3F1EE for selected states, with blue / violet / orchid / mint as accents.
// The logo mark's gradient (violet #E18EFF → periwinkle #707BFA → blue #0167F6) is used sparingly:
// sidebar marker, the top line, a soft page glow.
export const BRAND_GRADIENT = 'bg-[linear-gradient(135deg,#E18EFF_0%,#707BFA_48%,#0167F6_100%)]';
export const BRAND_GRADIENT_X = 'bg-[linear-gradient(90deg,#E18EFF_0%,#707BFA_45%,#0167F6_100%)]';
export const BRAND_GRADIENT_Y = 'bg-[linear-gradient(180deg,#E18EFF_0%,#707BFA_50%,#0167F6_100%)]';

const AVATAR_TINTS = [
  'bg-[#E3F1EE] text-[#023836]',
  'bg-[#E7EDFF] text-[#0052C8]',
  'bg-[#EFE8FB] text-[#5B3FB0]',
  'bg-[#FBE9FC] text-[#B42FB8]',
  'bg-[#DDF4EE] text-[#0B6B55]'
];
/** Initials-avatar colours from the landing palette; the same name always gets the same one. */
export const avatarTint = (name) => {
  let hash = 0;
  for (const char of String(name || '')) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
};
/** Faint violet / periwinkle glow at the top of a page, over the page grey. */
export const PAGE_GLOW =
  'bg-[#F4F8F6] bg-[radial-gradient(900px_280px_at_100%_-120px,rgba(112,123,250,0.10),transparent_70%),radial-gradient(700px_240px_at_0%_-100px,rgba(225,142,255,0.08),transparent_70%)] bg-no-repeat';

export const ACCOUNT_PAGE =
  `min-h-full ${PAGE_GLOW} px-4 pb-12 pt-6 font-(family-name:--font-headline) text-sm leading-[1.45] text-[#023836] antialiased sm:px-10 sm:pt-8`;

export const CARD = 'rounded-[12px] border border-[#E4E6EA] bg-white';

export const MUTED = 'text-[#4B5563]';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7A55]';

const BUTTON =
  `inline-flex items-center justify-center gap-2 rounded-[8px] font-(family-name:--font-headline) text-sm font-semibold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;

export const PRIMARY_BUTTON = `${BUTTON} bg-[#023836] text-white hover:bg-[#03443F]`;

export const SECONDARY_BUTTON = `${BUTTON} border border-[#D5D9E0] bg-white text-[#023836] hover:bg-[#F4F8F6]`;

export const LINK = `rounded-[4px] font-semibold text-[#0F7A55] hover:text-[#023836] ${FOCUS}`;

export const PAGE_TITLE = 'm-0 text-[28px] leading-[1.2] tracking-[-0.01em] text-[#023836]';

export const CARD_TITLE = 'm-0 text-base leading-[1.45] tracking-normal text-[#023836]';
