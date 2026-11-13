/**
 * Copy and sample data for the candidate landing page (/for-candidates).
 * Source: design/Candidate landing, desktop-html/Candidate.dc.html
 *
 * The job cards, gig earnings and course progress are the design's sample
 * content to illustrate matching; they are not live listings.
 */

export const SUPPORT_EMAIL = 'support@aligngrad.com';

/** Candidate palette (navy instead of the common page's pine), read by the shared landing components. */
export const THEME_VARS = {
  '--ag-pine': '#0E1B3D',
  '--ag-pine-d': '#0E1B3D',
  '--ag-pine-m': '#1B2B55',
  '--ag-blue': '#0167F6',
  '--ag-blue-d': '#0052C8',
  '--ag-accent': '#0167F6',
  '--ag-peri': '#6378F9',
  '--ag-orchid': '#FA91FD',
  '--ag-plum': '#B42FB8',
  '--ag-violet': '#7B3FD0',
  '--ag-ok': '#0F7A55',
  '--ag-ok-bg': '#E3F5EE',
  '--ag-mist': '#F4F6FE',
  '--ag-line': '#E1E5F2',
  '--ag-mute': '#56607A',
  '--ag-soft': '#E8EEFF',
  '--ag-danger': '#C8281C',
  '--ag-sora': "'Sora', ui-sans-serif, system-ui, sans-serif",
  '--ag-geist': "'Geist', ui-sans-serif, system-ui, sans-serif"
};

/** Header settings for the shared PortalNav. */
export const NAV = {
  tag: { label: 'Candidates', className: 'bg-(--ag-soft) text-(--ag-blue)' },
  secondary: { label: 'Log in' },
  primary: { label: 'Sign up free', variant: 'blue' }
};

/** Wording and look of the shared LandingAuthCard. */
export const AUTH_CONFIG = {
  idPrefix: 'k',
  tabs: { signup: 'Create account', login: 'Sign in' },
  copy: {
    signup: {
      title: 'Create your free account',
      subtitle: 'Takes a minute. Your first test can start today.',
      cta: 'Create account',
      switchText: 'Already registered?',
      switchCta: 'Sign in'
    },
    login: {
      title: 'Welcome back',
      subtitle: 'Sign in to see your matches and tests.',
      cta: 'Sign in',
      switchText: 'New to AlignGrad?',
      switchCta: 'Create an account'
    }
  },
  nameField: { label: 'Full name', icon: 'user', placeholder: 'e.g. Priya Sharma', autoComplete: 'name' },
  emailLabel: 'Email address',
  emailPlaceholder: 'name@domain.com',
  ctaVariant: 'blue',
  signupNote: { icon: 'mail', text: 'We’ll email you a 6-digit PIN to confirm your address.' }
};

/* The design's "Your dashboard" link targets a section it never draws; it points at the sign-up-to-shortlisted journey instead. */
export const NAV_LINKS = [
  { label: 'Jobs', section: 'jobs' },
  { label: 'Gigs', section: 'gigs' },
  { label: 'Courses', section: 'courses' },
  { label: 'Your dashboard', section: 'how' },
  { label: 'FAQ', section: 'faq' }
];

export const HERO_FACTS = [
  { label: 'Jobs matched to you', color: 'var(--ag-blue)' },
  { label: 'Courses to upskill', color: 'var(--ag-violet)' },
  { label: 'Gigs for side income', color: 'var(--ag-orchid)' }
];

export const JOB_CATEGORIES = ['All roles', 'Engineering', 'Data & AI', 'Design', 'Marketing', 'Business'];

export const MATCHED_JOBS = [
  { title: 'Frontend developer intern', company: 'Nimbus Labs', location: 'Bengaluru', type: 'Internship', category: 'Engineering', match: 92, skills: ['React', 'JavaScript'], initial: 'N', color: '#0167F6' },
  { title: 'Data analyst', company: 'Quantleaf', location: 'Hyderabad', type: 'Full-time', category: 'Data & AI', match: 84, skills: ['SQL', 'Excel'], initial: 'Q', color: '#6378F9' },
  { title: 'UI/UX designer', company: 'Tessel', location: 'Remote', type: 'Part-time', category: 'Design', match: 88, skills: ['Figma'], initial: 'T', color: '#7B3FD0' },
  { title: 'Backend engineer', company: 'Orbit Systems', location: 'Pune', type: 'Full-time', category: 'Engineering', match: 81, skills: ['Node.js', 'SQL'], initial: 'O', color: '#0E1B3D' },
  { title: 'Content writer', company: 'Fernway', location: 'Remote', type: 'Part-time', category: 'Marketing', match: 86, skills: ['Writing'], initial: 'F', color: '#B42FB8' },
  { title: 'Business analyst intern', company: 'Northgate', location: 'Gurugram', type: 'Internship', category: 'Business', match: 77, skills: ['Excel', 'Communication'], initial: 'N', color: '#0052C8' },
  { title: 'AI engineer intern', company: 'Kestrel AI', location: 'Bengaluru', type: 'Internship', category: 'Data & AI', match: 73, skills: ['Python'], initial: 'K', color: '#6378F9' },
  { title: 'Digital marketing associate', company: 'Monsoon Media', location: 'Mumbai', type: 'Full-time', category: 'Marketing', match: 79, skills: ['SEO', 'Content'], initial: 'M', color: '#B42FB8' },
  { title: 'Sales development rep', company: 'Bluecart', location: 'Chennai', type: 'Full-time', category: 'Business', match: 70, skills: ['Communication'], initial: 'B', color: '#0E1B3D' }
];

/** The jobs grid shows at most this many cards per category. */
export const JOBS_SHOWN = 6;

export const JOB_PERKS = [
  { icon: 'sparkle', title: 'New matches come to you', body: 'Every new role is checked against your profile.' },
  { icon: 'clock', title: 'See your fit at a glance', body: 'A match % on every job and internship.' },
  { icon: 'check', title: 'Apply when you’re ready', body: 'Full-time, part-time, internships and remote roles.' }
];

export const GIG_STEPS = [
  { title: 'Pick a gig that fits', body: 'Short tasks matched to your skills, each with a clear budget and deadline.' },
  { title: 'Pitch and do the work', body: 'The brief, chat with the client and your submission all live in one workspace.' },
  { title: 'Get paid, get reviewed', body: 'Payment when your work is accepted, plus a review that strengthens your profile.' }
];

export const SAMPLE_GIGS = [
  { title: 'Landing page for a bakery', meta: 'Web design, 4 days', budget: '₹4,000', bg: '#E8EEFF', fg: '#0167F6', icon: 'screen' },
  { title: 'Clean up a sales spreadsheet', meta: 'Excel, 2 days', budget: '₹1,500', bg: '#F1ECFF', fg: '#7B3FD0', icon: 'sheet' },
  { title: 'Write 5 blog posts', meta: 'Content writing, 1 week', budget: '₹3,000', bg: '#FFF0FE', fg: '#B42FB8', icon: 'pen' }
];

export const COURSE_DOMAINS = [
  { label: 'Full stack development', color: '#0167F6', lesson: 'Building with React', progress: 64, tests: ['React', 'Node.js'] },
  { label: 'Data analytics', color: '#6378F9', lesson: 'Joins and aggregates', progress: 38, tests: ['SQL', 'Python'] },
  { label: 'AI agents', color: '#023836', lesson: 'Calling tools from a model', progress: 52, tests: ['Python'] },
  { label: 'Digital marketing', color: '#FA91FD', lesson: 'Search basics', progress: 21, tests: ['Digital marketing'] }
];

/** Lessons count as complete at 50% watched. */
export const LESSON_COMPLETE_AT = 50;

export const FAQS = [
  { q: 'Is AlignGrad free to join?', a: 'Yes. Creating your profile, uploading your intro video, taking skill tests, browsing courses and using your dashboard are all free.' },
  { q: 'What kinds of jobs are on AlignGrad?', a: 'Full-time, part-time, internships and remote roles across engineering, data and AI, design, marketing and business. Each one shows how well you match.' },
  { q: 'Can I do gigs while I study?', a: 'Yes. Gigs are short, paid tasks with their own deadlines, so you can fit them around classes and earn on the side.' },
  { q: 'What if I score under 70%?', a: 'The skill stays unverified for now. Review the topic and take a fresh 10-question test whenever you’re ready.' },
  { q: 'What about skills with no test?', a: 'Soft skills and some tools don’t have a test yet. You can add them to your profile as self-rated.' },
  { q: 'Why do I need an intro video?', a: 'Recruiters see it first. A 40–60 second clip, plus the basics on your profile, unlocks the rest of the portal.' },
  { q: 'How do I sign in?', a: 'With email and password (we email a 6-digit PIN to confirm your address), or in one click with Google.' }
];
