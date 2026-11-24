// The Help & support page is shared by the candidate and recruiter apps. Each app passes
// its own look: candidate tokens come from Student/profile/profileTheme.js, recruiter
// tokens from Recruiter/components/accountStyles.js.
import { BODY, CARD as CANDIDATE_CARD, LINK as CANDIDATE_LINK, MUTED as CANDIDATE_MUTED, PAGE, PRIMARY, SECONDARY, fieldClass } from '../Student/profile/profileTheme';
import { ACCOUNT_PAGE, CARD as RECRUITER_CARD, LINK as RECRUITER_LINK, MUTED as RECRUITER_MUTED, PAGE_TITLE, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../Recruiter/components/accountStyles';
import { controlClass } from '../Recruiter/components/formControls';

const CHIP = 'inline-flex cursor-pointer items-center rounded-full border px-3.5 py-1.5 text-[14px] font-medium transition-colors';

export const SUPPORT_THEMES = {
  candidate: {
    page: PAGE,
    inner: 'mx-auto flex max-w-[1180px] flex-col gap-5',
    title: 'm-0 text-[28px] leading-tight text-[#0E1B3D]',
    body: BODY,
    muted: CANDIDATE_MUTED,
    card: CANDIDATE_CARD,
    cardTitle: 'm-0 text-[17px] leading-snug text-[#0E1B3D]',
    divider: 'border-[#E1E5F2]',
    primary: `${PRIMARY} h-11 px-5`,
    secondary: `${SECONDARY} h-11 px-4`,
    smallSecondary: `${SECONDARY} h-9 px-3 text-[14px]!`,
    link: CANDIDATE_LINK,
    field: (error) => fieldClass(error, 'py-2.5'),
    chip: `${CHIP} border-[#C9D1E3] bg-white text-[#1B2B55] hover:border-[#6378F9] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#0167F6]`,
    chipOn: 'border-[#0167F6]! bg-[#E8EEFF]! text-[#0B3FA8]!',
    row: 'border-transparent hover:bg-[#F4F6FE] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0167F6]',
    rowOn: 'border-[#0167F6]! bg-[#F4F6FE]',
    mine: 'border-[#D5DEFF] bg-[#E8EEFF]',
    theirs: 'border-[#E1E5F2] bg-white',
    accentText: 'text-[#0167F6]',
    error: 'border-[#F3C5C0] bg-[#FFF5F4] text-[#8C1D14]',
    note: 'border-[#D5DEFF] bg-[#F4F6FE] text-[#1B2B55]',
    status: {
      OPEN: 'bg-[#E8EEFF] text-[#0B3FA8]',
      PENDING: 'bg-[#FFF3E0] text-[#8A3F06]',
      RESOLVED: 'bg-[#E3F5EE] text-[#0B5E41]'
    }
  },
  recruiter: {
    page: ACCOUNT_PAGE,
    inner: 'mx-auto flex max-w-[1180px] flex-col gap-[22px]',
    title: PAGE_TITLE,
    body: 'text-[#023836]',
    muted: RECRUITER_MUTED,
    card: RECRUITER_CARD,
    cardTitle: 'm-0 text-base leading-[1.45] tracking-normal text-[#023836]',
    divider: 'border-[#EEF0F3]',
    primary: `${PRIMARY_BUTTON} h-11 px-[18px]`,
    secondary: `${SECONDARY_BUTTON} h-11 px-4`,
    smallSecondary: `${SECONDARY_BUTTON} h-9 px-3 text-[13px]`,
    link: RECRUITER_LINK,
    field: (error) => controlClass(error, 'px-3 py-2.5'),
    chip: `${CHIP} border-[#D5D9E0] bg-white text-[#023836] hover:border-[#0F7A55] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#0F7A55]`,
    chipOn: 'border-[#0F7A55]! bg-[#E3F1EE]! text-[#023836]!',
    row: 'border-transparent hover:bg-[#F4F8F6] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0F7A55]',
    rowOn: 'border-[#7FD8C4]! bg-[#E3F1EE]/60',
    mine: 'border-[#CDE7E0] bg-[#E3F1EE]',
    theirs: 'border-[#E4E6EA] bg-white',
    accentText: 'text-[#0F7A55]',
    error: 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]',
    note: 'border-[#CDE7E0] bg-[#F4F8F6] text-[#023836]',
    status: {
      OPEN: 'bg-[#E7EDFF] text-[#0052C8]',
      PENDING: 'bg-[#FEF3C7] text-[#92400E]',
      RESOLVED: 'bg-[#DCFCE7] text-[#166534]'
    }
  }
};

// How the requester sees each status (the admin portal words them from its side).
export const STATUS_TEXT = {
  OPEN: { label: 'Open', hint: 'We’re looking into it.' },
  PENDING: { label: 'AlignGrad replied', hint: 'We replied. Reply here if you still need help.' },
  RESOLVED: { label: 'Resolved', hint: 'Reply here if you still need help; it will reopen.' }
};
