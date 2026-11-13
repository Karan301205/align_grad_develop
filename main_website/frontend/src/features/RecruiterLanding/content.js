/**
 * Copy and sample data for the recruiter landing page (/for-recruiters).
 * Source: design/Recruiter landing, desktop-html/Recruiter.dc.html
 *
 * Candidate names, scores and gigs are the design's sample content to show how
 * matching works; they are not real people or live listings.
 */

export const SUPPORT_EMAIL = 'support@aligngrad.com';

/** Recruiter palette (pine), read by the shared landing components. `--ag-accent` is pine here. */
export const THEME_VARS = {
  '--ag-pine': '#023836',
  '--ag-pine-d': '#012624',
  '--ag-pine-m': '#03443F',
  '--ag-mint': '#7FD8C4',
  '--ag-pine-bg': '#E3F1EE',
  '--ag-blue': '#0167F6',
  '--ag-blue-d': '#0052C8',
  '--ag-accent': '#023836',
  '--ag-peri': '#6378F9',
  '--ag-orchid': '#FA91FD',
  '--ag-plum': '#B42FB8',
  '--ag-violet': '#7B3FD0',
  '--ag-ok': '#0F7A55',
  '--ag-ok-bg': '#E3F5EE',
  '--ag-mist': '#F2F5F9',
  '--ag-line': '#DCE3EC',
  '--ag-mute': '#4A5A68',
  '--ag-soft': '#E7EDFF',
  '--ag-danger': '#C8281C',
  '--ag-sora': "'Sora', ui-sans-serif, system-ui, sans-serif",
  '--ag-geist': "'Geist', ui-sans-serif, system-ui, sans-serif"
};

export const NAV_LINKS = [
  { label: 'Matching', section: 'match' },
  { label: 'Try it', section: 'demo' },
  { label: 'Job posts', section: 'post' },
  { label: 'Gigs', section: 'gigs' },
  { label: 'FAQ', section: 'faq' }
];

/** Header settings for the shared PortalNav. */
export const NAV = {
  tag: { label: 'Recruiters', className: 'bg-(--ag-pine-bg) text-(--ag-pine)' },
  secondary: { label: 'Sign in' },
  primary: { label: 'Register company', mobileLabel: 'Register', variant: 'pineGlow' }
};

/** Wording and look of the shared LandingAuthCard. The company name is sent as the account `name`. */
export const AUTH_CONFIG = {
  idPrefix: 'r',
  tabs: { signup: 'Register company', login: 'Sign in' },
  copy: {
    signup: {
      title: 'Create your company workspace',
      subtitle: 'Set up your workspace and post your first role free.',
      cta: 'Register company',
      switchText: 'Already registered?',
      switchCta: 'Sign in'
    },
    login: {
      title: 'Welcome back',
      subtitle: 'Sign in to your hiring workspace.',
      cta: 'Sign in to workspace',
      switchText: 'New employer?',
      switchCta: 'Register your company'
    }
  },
  nameField: { label: 'Company name', icon: 'building', placeholder: 'e.g. Acme Technologies', autoComplete: 'organization' },
  emailLabel: 'Work email',
  emailPlaceholder: 'you@company.com',
  ctaVariant: 'pineGlow',
  signupNote: { icon: 'shieldCheck', text: 'Our team reviews every company before its first post. You’ll get an email with the decision.' }
};

export const HERO_FACTS = [
  { label: 'First job post free', color: 'var(--ag-pine)' },
  { label: 'One test standard for everyone', color: 'var(--ag-blue)' },
  { label: 'Every company verified', color: 'var(--ag-orchid)' }
];

/* barClass is a literal Tailwind width so the bar can grow in from 0 with @starting-style. */
export const HERO_SHORTLIST = [
  { initials: 'AK', name: 'Ananya K.', match: 96, barClass: 'w-[92%]', color: '#0167F6' },
  { initials: 'RM', name: 'Rahul M.', match: 91, barClass: 'w-[85%]', color: '#6378F9' },
  { initials: 'SP', name: 'Sneha P.', match: 87, barClass: 'w-[78%]', color: '#023836' }
];

export const MATCH_POINTS = [
  'A match % for every candidate, worked out from verified test scores',
  'Best fit first, so you start with the strongest people',
  'Scorecard, résumé and intro video one click away'
];

export const BEST_MATCHES = [
  { initials: 'RW', name: 'Riya W.', match: 97, color: '#023836' },
  { initials: 'KV', name: 'Karan V.', match: 94, color: '#03443F' },
  { initials: 'TH', name: 'Tanvi H.', match: 92, color: '#0167F6' },
  { initials: 'AZ', name: 'Aisha Z.', match: 90, color: '#6378F9' }
];

/* ── "Set the bar" demo ── */

export const DEMO_SKILLS = ['React', 'Node.js', 'SQL', 'Python', 'Figma', 'Java', 'Excel', 'Communication'];
export const DEMO_MAX_SKILLS = 4;
export const DEMO_DEFAULT_SELECTION = ['React', 'Node.js', 'SQL'];
export const DEMO_DEFAULT_LEVELS = { React: 7, 'Node.js': 6, SQL: 6, Python: 6, Figma: 6, Java: 6, Excel: 6, Communication: 6 };
export const DEMO_MATCH_MIN = 80;
export const DEMO_SHOWN = 5;
export const DEMO_AVATAR_COLORS = ['#023836', '#03443F', '#0167F6', '#6378F9', '#0A5A53', '#7B3FD0'];

/** Sample pool of 24 candidates: scores out of 100, in DEMO_SKILLS order. */
export const DEMO_POOL = [
  ['Ananya K.', [66, 82, 60, 61, 63, 80, 60, 89]], ['Rahul M.', [52, 55, 77, 76, 54, 65, 55, 77]],
  ['Sneha P.', [47, 54, 43, 65, 43, 54, 42, 48]], ['Arjun S.', [81, 64, 62, 74, 66, 61, 67, 78]],
  ['Kavya R.', [47, 46, 56, 74, 70, 63, 72, 72]], ['Rohan D.', [79, 75, 71, 75, 65, 79, 91, 81]],
  ['Isha T.', [83, 69, 72, 97, 91, 75, 86, 74]], ['Vikram N.', [94, 70, 72, 88, 89, 90, 98, 97]],
  ['Meera J.', [46, 58, 71, 45, 44, 60, 69, 59]], ['Aditya B.', [83, 62, 90, 83, 71, 68, 92, 64]],
  ['Pooja G.', [68, 58, 65, 75, 75, 81, 55, 60]], ['Karan V.', [90, 82, 73, 92, 82, 91, 87, 89]],
  ['Nisha A.', [60, 56, 62, 60, 65, 65, 51, 82]], ['Siddharth L.', [64, 66, 48, 57, 74, 71, 68, 56]],
  ['Tanvi H.', [72, 98, 94, 94, 94, 94, 75, 98]], ['Yash C.', [65, 74, 66, 75, 90, 72, 69, 83]],
  ['Divya E.', [46, 40, 49, 46, 63, 41, 44, 53]], ['Harsh F.', [70, 77, 83, 84, 91, 68, 68, 92]],
  ['Riya W.', [96, 96, 85, 71, 75, 72, 87, 82]], ['Neel O.', [77, 68, 80, 90, 76, 68, 86, 72]],
  ['Sana Q.', [76, 63, 75, 67, 85, 74, 67, 65]], ['Manav I.', [77, 66, 64, 83, 74, 53, 53, 69]],
  ['Aisha Z.', [83, 79, 89, 95, 89, 90, 72, 81]], ['Dev U.', [57, 73, 55, 64, 56, 73, 43, 73]]
];

/* ── Job posts ── */

export const POST_POINTS = [
  'Full-time, part-time and internship roles',
  'Applicants see your skill levels before applying',
  'Every applicant arrives with a match %, scorecard and intro video',
  'Move people through each round in one pipeline'
];

/* barClass is a literal Tailwind width (level × 10%). */
export const SAMPLE_POST_SKILLS = [
  { skill: 'React', level: 7, barClass: 'w-[70%]' },
  { skill: 'JavaScript', level: 7, barClass: 'w-[70%]' },
  { skill: 'Figma', level: 4, barClass: 'w-[40%]' }
];

/* ── Gigs ── */

export const SAMPLE_GIGS = [
  { title: 'Fix checkout bugs before launch', budget: '₹5,000 fixed', time: 'Done in 3 days', skills: ['React', 'Node.js'], icon: 'code', color: '#023836' },
  { title: 'Social media creatives for a sale', budget: '₹2,500 fixed', time: 'Done in 2 days', skills: ['Figma', 'Branding'], icon: 'image', color: '#B42FB8' },
  { title: 'Clean up a customer dataset', budget: '₹1,800 fixed', time: 'Done in 1 day', skills: ['Excel', 'SQL'], icon: 'sheet', color: '#0167F6' }
];

export const GIG_STEPS = [
  { title: 'Post the task', body: 'Describe it, set a budget and a deadline.' },
  { title: 'Pick a pitch', body: 'Verified candidates pitch, and you choose who fits.' },
  { title: 'Approve and pay', body: 'Review the submission, then release payment.' }
];

export const FAQS = [
  { q: 'How do you verify a candidate’s skills?', a: 'Each test is 10 questions drawn fresh from our bank. Scoring 70% or higher verifies the skill, and answer keys never reach the candidate’s browser.' },
  { q: 'Who reviews my company?', a: 'Our team checks your company profile and two legal documents, then emails you the decision. If something is missing you’ll see why, and you can resubmit.' },
  { q: 'What can I do before approval?', a: 'Complete your company profile and use the community feed. Posting, candidate search and hiring rounds open once you’re approved.' },
  { q: 'What does a 5-job pack include?', a: 'Five more job posts on top of your free one, for a one-time ₹2,500. Packs stack and never expire.' },
  { q: 'Do gigs use job credits?', a: 'No. Once you’re approved you can post gigs, hire, chat and leave reviews without buying a pack.' }
];
