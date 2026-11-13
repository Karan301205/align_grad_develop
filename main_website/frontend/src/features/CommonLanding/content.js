/**
 * Copy and sample data for the common landing page.
 * Source: design/Common landing, desktop-html/Main.dc.html
 *
 * Testimonials, partner logos, sample talents and course figures are the
 * design's sample content. Replace them with real customers before launch.
 */

export const SUPPORT_EMAIL = 'support@aligngrad.com';
export const LEARN_HOST = 'learn.aligngrad.com';
export const LEARN_URL = `https://${LEARN_HOST}`;

/** Design tokens, applied as CSS variables on the page root and read by Tailwind classes like `bg-(--ag-pine)`. */
export const THEME_VARS = {
  '--ag-pine': '#023836',
  '--ag-pine-d': '#012624',
  '--ag-pine-m': '#03443F',
  '--ag-mint': '#7FD8C4',
  '--ag-blue': '#0167F6',
  '--ag-blue-d': '#0052C8',
  '--ag-peri': '#6378F9',
  '--ag-orchid': '#FA91FD',
  '--ag-plum': '#B42FB8',
  '--ag-violet': '#7B3FD0',
  '--ag-ok': '#0F7A55',
  '--ag-ok-bg': '#E3F5EE',
  '--ag-pine-bg': '#E3F1EE',
  '--ag-mist': '#F4F6FE',
  '--ag-line': '#E1E5F2',
  '--ag-mute': '#4A5A68',
  '--ag-soft': '#E7EDFF',
  '--ag-danger': '#C8281C',
  '--ag-sora': "'Sora', ui-sans-serif, system-ui, sans-serif",
  '--ag-geist': "'Geist', ui-sans-serif, system-ui, sans-serif"
};

export const NAV_LINKS = [
  { label: 'For candidates', section: 'student-usp' },
  { label: 'For recruiters', section: 'recruiters' },
  { label: 'Product tour', section: 'tour' },
  { label: 'Courses', section: 'learn' },
  { label: 'Partner with us', section: 'partner' }
];

export const HERO_FACTS = [
  { label: '140+ skill roadmaps', color: 'var(--ag-blue)' },
  { label: '4,770+ test questions', color: 'var(--ag-peri)' },
  { label: 'Same test for every candidate', color: 'var(--ag-orchid)' }
];

/** glyph keys map to shapes in PartnerLogos.jsx */
export const PARTNER_LOGOS = [
  { name: 'Nimbus Labs', glyph: 'circle' },
  { name: 'Quantleaf', glyph: 'triangle' },
  { name: 'Orbit Systems', glyph: 'ring' },
  { name: 'Kestrel AI', glyph: 'slab' },
  { name: 'Fernway', glyph: 'diamond' },
  { name: 'Bluecart', glyph: 'square' },
  { name: 'Aster Health', glyph: 'ring' },
  { name: 'Monsoon Media', glyph: 'circle' },
  { name: 'Tessel', glyph: 'diamond' },
  { name: 'Northgate', glyph: 'slab' }
];

export const STUDENT_FEATURES = [
  {
    key: 'jobs',
    title: 'Jobs that match your skills',
    subtitle: 'A match % on every role',
    body: 'We show you jobs and internships whose skill requirements line up with your verified scores, ranked by how well you fit.',
    points: [
      'A match percentage on every job and internship',
      'See which required skills you already meet',
      'Your best-fit roles, picked out for you'
    ],
    link: { label: 'Browse matched jobs', to: 'candidate' },
    accent: 'blue'
  },
  {
    key: 'courses',
    title: 'Courses that help you upskill',
    subtitle: 'Close the gap, then prove it',
    body: 'Short on a skill? We point you to the related course, then a fresh test so you can prove you’ve levelled up.',
    points: [
      'The right course for the skill you’re short on',
      'Lessons count as done at 50% watched',
      'Retake with a brand-new 10-question set'
    ],
    link: { label: 'Explore courses', to: 'learn' },
    accent: 'violet'
  },
  {
    key: 'gigs',
    title: 'Mini gigs to start earning',
    subtitle: 'Earn while you learn',
    body: 'Pick up short paid tasks that fit your skills, work with the client in one place, and get paid when your work is accepted.',
    points: [
      'Short tasks with a fixed budget and deadline',
      'Brief, chat and submission in one workspace',
      'Every finished gig adds a review to your profile'
    ],
    link: { label: 'Browse gigs', to: 'candidate' },
    accent: 'plum'
  }
];

export const RECRUITER_FEATURES = [
  {
    key: 'matches',
    title: 'Matched with the right candidates',
    subtitle: 'Ranked by verified skill',
    body: 'Every applicant and suggested talent comes with a match percentage, worked out from how well their verified scores cover your role.',
    points: [
      'A match percentage for every candidate',
      'Ranked by how much of the role they cover',
      'Verified skill badges at a glance'
    ],
    accent: 'mint'
  },
  {
    key: 'levels',
    title: 'Ask for skills, with a rating',
    subtitle: 'Levels from 1 to 10',
    body: 'Choose the skills a role needs and the minimum rating for each, from level 1 to 10. Only people whose verified scores clear it count as a match.',
    points: [
      'A level from 1 to 10 for every skill',
      'The same bar applied to every candidate',
      'Shortlists that start from proven skill'
    ],
    accent: 'mint'
  },
  {
    key: 'gig',
    title: 'Post an urgent need as a gig',
    subtitle: 'Done in days, not months',
    body: 'Need something done this week? Post it as a gig with a budget and deadline, then pick from skilled candidates who pitch for it.',
    points: [
      'Gigs never use your job post credits',
      'Budget, deadline and skills in one short form',
      'Chat, submissions and reviews in one workspace'
    ],
    accent: 'mint'
  }
];

export const STUDENT_TESTIMONIALS = [
  { name: 'Ananya Rao', role: 'Final-year B.Tech, Hyderabad', initials: 'AR', bg: '#0167F6', duration: '0:42', tag: 'React, verified at 84%', quote: 'I had no campus placement calls. Passing the React test put my profile in front of recruiters who were already looking for exactly that skill.' },
  { name: 'Sana Qureshi', role: 'BCA graduate, Pune', initials: 'SQ', bg: '#6378F9', duration: '0:38', tag: 'SQL, from 48 to 78', quote: 'The SQL test showed me exactly where I was weak. I took the course, retook a fresh test, and cleared it the second time.' },
  { name: 'Rohit Das', role: 'Freelance UI designer, Kolkata', initials: 'RD', bg: '#B42FB8', duration: '0:51', tag: 'First paid gig', quote: 'My first paid gig came through AlignGrad. The brief, the chat and my submission all lived in one place.' },
  { name: 'Meera Joshi', role: 'MBA student, Indore', initials: 'MJ', bg: '#7B3FD0', duration: '0:45', tag: 'Course plus two gigs', quote: 'The communication course and two small gigs gave me real examples to talk about in my internship interviews.' },
  { name: 'Dr. Ramesh Iyer', role: 'Placement Officer, partner college', initials: 'RI', bg: '#0052C8', duration: '0:56', tag: 'Campus partner', quote: 'Our students now leave with verified scores they can show any employer, not just a list of subjects.' }
];

export const RECRUITER_TESTIMONIALS = [
  { name: 'Karthik Menon', role: 'Engineering Manager, Nimbus Labs', initials: 'KM', bg: '#023836', duration: '0:47', tag: 'Frontend intern hire', quote: 'We set React and JavaScript at level 7 for our intern role. Every applicant we spoke to could actually do the work.' },
  { name: 'Vikram Shah', role: 'CTO, Bluecart', initials: 'VS', bg: '#03443F', duration: '0:33', tag: 'Backend hiring', quote: 'The match percentage is the first thing I look at. In a second it tells me who is worth a call.' },
  { name: 'Priya Nair', role: 'Head of Talent, Quantleaf', initials: 'PN', bg: '#0A5A53', duration: '0:52', tag: 'Data analyst hiring', quote: 'Seeing scorecards and the intro video before the first call saved our team a whole round of screening.' },
  { name: 'Arjun Bhatia', role: 'Founder, Kestrel AI', initials: 'AB', bg: '#14524C', duration: '0:40', tag: 'Urgent gig', quote: 'We needed a dashboard fix before a client demo. We posted it as a gig, picked a pitch the same day and shipped that week.' },
  { name: 'Neha Kulkarni', role: 'HR Lead, Fernway', initials: 'NK', bg: '#2E6B64', duration: '0:44', tag: 'Campus hiring', quote: 'Setting a level for each skill replaced our long screening test. Our shortlists now start with people who already passed.' }
];

export const CANDIDATE_TOUR_STEPS = [
  { label: 'See your alignment', caption: 'Your dashboard shows how your verified skills line up with every active role, and where each application stands.' },
  { label: 'Take a skill test', caption: 'Ten fresh questions in a 30-minute session. Score 70% and the skill is verified on your profile.' },
  { label: 'Apply when you clear the bar', caption: 'Each job brief shows its skill bar. Meet every minimum and the Apply button unlocks.' }
];

export const RECRUITER_TOUR_STEPS = [
  { label: 'Post a role with skill levels', caption: 'Describe the role and set a minimum level, out of 10, for every skill it needs.' },
  { label: 'Review top matches', caption: 'AlignGrad ranks candidates by how well their verified scores cover your requirements.' },
  { label: 'Run your rounds', caption: 'Move applicants through each round and leave feedback they can see, all in one pipeline.' }
];

export const SAMPLE_TALENTS = [
  { initials: 'AK', name: 'Ananya K.', skills: 'React Lvl 9, Node.js Lvl 7, SQL Lvl 6', match: 96, ringOffset: 12.6, bg: '#0167F6' },
  { initials: 'RM', name: 'Rahul M.', skills: 'React Lvl 8, Node.js Lvl 7, SQL Lvl 5', match: 91, ringOffset: 28.3, bg: '#6378F9' },
  { initials: 'SP', name: 'Sneha P.', skills: 'React Lvl 7, Node.js Lvl 6, SQL Lvl 6', match: 87, ringOffset: 40.8, bg: '#023836' }
];

/** Skills the "Ask for skills, with a rating" demo lets visitors set, with their starting level. */
export const LEVEL_SKILLS = [
  { key: 'react', label: 'React', level: 7 },
  { key: 'node', label: 'Node.js', level: 6 },
  { key: 'sql', label: 'SQL', level: 5 }
];

/** Sample pool for the level demo: each row is [react, node, sql] scores out of 100. */
export const SAMPLE_CANDIDATE_POOL = [
  [82, 70, 65], [74, 66, 58], [91, 85, 72], [65, 72, 80], [58, 50, 45], [77, 61, 70],
  [88, 79, 60], [70, 74, 66], [62, 58, 75], [95, 88, 82], [71, 64, 55], [54, 47, 62],
  [80, 75, 68], [68, 60, 49], [73, 69, 71], [86, 81, 77], [59, 55, 53], [90, 84, 74],
  [76, 72, 64], [64, 57, 59], [83, 77, 69], [69, 63, 48], [78, 68, 73], [61, 52, 57]
];

export const PIPELINE_LANES = [
  { label: 'Applied', count: 8, cards: ['#E7EDFF', '#E7EDFF', '#E7EDFF'] },
  { label: 'Shortlisted', count: 5, cards: ['#D9DEFF', '#D9DEFF'] },
  { label: 'Interview', count: 3, cards: ['#F3E9FF', '#F3E9FF'] },
  { label: 'Hired', count: 1, cards: ['#7FD8C4'] }
];

export const COURSES = [
  { title: 'Full Stack Development', meta: '8 modules, 48 lessons', badge: 'Popular track', slug: 'full-stack-development', progress: 64, bg: '#0167F6', dot: '#0167F6', tags: ['React 19', 'Next.js', 'Node.js', 'PostgreSQL', 'System Design'] },
  { title: 'AI Agents & LLM Systems', meta: '7 modules, 42 lessons', badge: 'Trending now', slug: 'ai-agents-llm-systems', progress: 38, bg: '#6378F9', dot: '#6378F9', tags: ['AI Agents', 'LangChain', 'RAG', 'Prompt systems', 'Vector DBs'] },
  { title: 'Communication & Soft Skills', meta: '6 modules, 36 lessons', badge: 'High demand', slug: 'communication-soft-skills', progress: 52, bg: '#7B3FD0', dot: '#7B3FD0', tags: ['Active listening', 'Public speaking', 'Business writing', 'Team collaboration'] },
  { title: 'Interview Readiness', meta: '5 modules, 30 lessons', badge: 'Career accelerator', slug: 'interview-readiness', progress: 21, bg: '#023836', dot: '#FA91FD', tags: ['Resume building', 'Mock interviews', 'Behavioural prep', 'Communication'] }
];

export const PARTNER_TYPES = [
  { label: 'Hiring partner', name: 'hiring partnership', orgLabel: 'Company name', orgPlaceholder: 'e.g. Acme Technologies', sizeLabel: 'Roles you plan to hire for this year', sizeOptions: ['1–5 roles', '6–20 roles', '21–50 roles', '50+ roles'], messagePlaceholder: 'Roles, locations, timelines or skills you hire for…' },
  { label: 'Campus', name: 'campus partnership', orgLabel: 'College or university', orgPlaceholder: 'e.g. Institute of Technology, Pune', sizeLabel: 'Students per graduating batch', sizeOptions: ['Under 200', '200–500', '500–1,000', '1,000+'], messagePlaceholder: 'Programmes, placement goals or skills your students focus on…' },
  { label: 'Learning partner', name: 'learning partnership', orgLabel: 'Organisation or creator name', orgPlaceholder: 'e.g. Skillforge Academy', sizeLabel: 'Courses you’d like to publish', sizeOptions: ['1 course', '2–5 courses', '6–10 courses', '10+ courses'], messagePlaceholder: 'Topics you teach and how you’d like to work with us…' }
];

export const PARTNER_PERKS = [
  { icon: 'briefcase', title: 'Hiring partners', body: 'Post roles with skill bars and meet verified talent first.' },
  { icon: 'graduation', title: 'Campus partners', body: 'Give your students verified scores they can show anywhere.' },
  { icon: 'book', title: 'Learning partners', body: `Publish courses on ${LEARN_HOST} that lead into tests.` }
];
