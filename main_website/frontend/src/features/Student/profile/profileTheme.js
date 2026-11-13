// Candidate-side look, taken from the candidate landing page palette
// (candidateLanding/content.js THEME_VARS): navy ink, AlignGrad blue, periwinkle,
// violet and orchid, on a soft blue "mist" page. Text stays dark for readability.

export const C = {
  ink: '#0E1B3D',
  body: '#1B2B55',
  muted: '#475373',
  line: '#E1E5F2',
  field: '#C9D1E3',
  mist: '#F4F6FE',
  soft: '#E8EEFF',
  blue: '#0167F6',
  blueDark: '#0052C8',
  peri: '#6378F9',
  violet: '#7B3FD0',
  plum: '#B42FB8',
  orchid: '#FA91FD',
  ok: '#0F7A55',
  okBg: '#E3F5EE',
  danger: '#C8281C'
};

export const INK = 'text-[#0E1B3D]';
export const BODY = 'text-[#1B2B55]';
export const MUTED = 'text-[#475373]';
export const HEADING_FONT = 'font-(family-name:--font-headline)';

export const GRADIENT = 'bg-[linear-gradient(135deg,#FA91FD_0%,#B386F9_30%,#6378F9_62%,#0167F6_100%)]';
export const GRADIENT_X = 'bg-[linear-gradient(90deg,#0167F6_0%,#6378F9_60%,#B386F9_85%,#FA91FD_100%)]';

export const PAGE =
  'min-h-full bg-[#F4F6FE] bg-[radial-gradient(900px_320px_at_100%_-140px,rgba(250,145,253,0.20),transparent_70%),radial-gradient(800px_300px_at_0%_-120px,rgba(1,103,246,0.14),transparent_70%)] bg-no-repeat px-4 pb-14 pt-6 text-[15px] leading-[1.5] text-[#0E1B3D] sm:px-6 lg:px-10 lg:pt-8';

export const CARD = 'rounded-[16px] border border-[#E1E5F2] bg-white shadow-[0_1px_2px_rgba(14,27,61,0.04),0_8px_24px_-18px_rgba(14,27,61,0.25)]';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]';
const BUTTON = `inline-flex items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${FOCUS}`;

export const PRIMARY = `${BUTTON} bg-[#0167F6] text-white shadow-[0_6px_16px_-8px_rgba(1,103,246,0.7)] hover:bg-[#0052C8]`;
export const SECONDARY = `${BUTTON} border border-[#C9D1E3] bg-white text-[#0E1B3D] hover:border-[#6378F9] hover:bg-[#F4F6FE]`;
export const DANGER = `${BUTTON} bg-[#C8281C] text-white hover:bg-[#A61F15]`;
export const GHOST_DANGER = `${BUTTON} text-[#C8281C] hover:bg-[#FDECEA]`;
export const LINK = `rounded-[6px] font-semibold text-[#0167F6] hover:text-[#0052C8] hover:underline ${FOCUS}`;
/** Red outlined button for Remove / Discard actions. */
export const DANGER_OUTLINE = `${BUTTON} border border-[#F1B9B3] bg-white text-[#C8281C] hover:border-[#C8281C] hover:bg-[#FDECEA]`;
/** Tinted button for small in-card actions (Code, Live, View certificate…). */
export const SOFT = `${BUTTON} border border-[#D5DEFF] bg-[#F4F6FE] text-[#0B3FA8] hover:border-[#0167F6] hover:bg-[#E8EEFF]`;
/** Size for the small buttons inside cards and lists. */
export const SMALL = 'h-9 px-3 text-[14px]!';

/** Text inputs, selects and text areas. */
export function fieldClass(error, extra = '') {
  return [
    'w-full min-w-0 rounded-[10px] border bg-white px-3.5 text-[15px] text-[#0E1B3D] placeholder:text-[#6B7591] transition-[border-color,box-shadow]',
    'focus:outline-none focus:ring-[3px] disabled:cursor-not-allowed disabled:bg-[#F4F6FE] disabled:text-[#475373]',
    error
      ? 'border-[#C8281C] bg-[#FFF8F7] focus:border-[#C8281C] focus:ring-[#C8281C]/15'
      : 'border-[#C9D1E3] hover:border-[#9AA6C8] focus:border-[#0167F6] focus:ring-[#0167F6]/15',
    extra
  ].join(' ');
}

/** Colour sets for the profile sections, so each one is easy to tell apart. */
export const TONES = {
  blue: { icon: 'bg-[#E8EEFF] text-[#0167F6]', chip: 'bg-[#E8EEFF] text-[#0B3FA8]', bar: 'bg-[#0167F6]' },
  violet: { icon: 'bg-[#F1ECFF] text-[#7B3FD0]', chip: 'bg-[#F1ECFF] text-[#5B2AA6]', bar: 'bg-[#7B3FD0]' },
  plum: { icon: 'bg-[#FFF0FE] text-[#B42FB8]', chip: 'bg-[#FFF0FE] text-[#8E1F91]', bar: 'bg-[#B42FB8]' },
  green: { icon: 'bg-[#E3F5EE] text-[#0F7A55]', chip: 'bg-[#E3F5EE] text-[#0B5E41]', bar: 'bg-[#0F7A55]' },
  amber: { icon: 'bg-[#FFF3E0] text-[#B45309]', chip: 'bg-[#FFF3E0] text-[#8A3F06]', bar: 'bg-[#B45309]' },
  peri: { icon: 'bg-[#EEF0FF] text-[#4F5FE0]', chip: 'bg-[#EEF0FF] text-[#3343C2]', bar: 'bg-[#6378F9]' }
};
