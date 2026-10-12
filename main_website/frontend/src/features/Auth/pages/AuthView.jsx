import React, { useState } from 'react';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  User,
  Briefcase,
  X,
  CheckCircle2,
  Building2,
  Loader2,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Award,
  Zap,
  TrendingUp,
  Clock,
  Compass,
  Check,
  Star,
  Users,
  Search,
  Filter,
  DollarSign,
  CircleDollarSign,
  Coins,
  Wallet,
  MapPin,
  Laptop,
  GraduationCap,
  HelpCircle,
  FileText,
  BadgeCheck,
  Code2,
  PenTool,
  HeartHandshake,
  CalendarClock,
  BookOpen,
  Play,
  Layers,
  Bot,
  BarChart3,
  Video
} from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import ClickSpark from '../../../components/ui/ClickSpark';
import AnimatedContent from '../../../components/ui/AnimatedContent';
import GoogleAuthButton from '../../../components/ui/GoogleAuthButton';
import { formatErrorMessage } from '../../../utils/errorFormatter';
import { CANDIDATE_URL, RECRUITER_URL } from '../../../config';

// ─── Course Domains & Curriculum Tracks ───
const COURSE_DOMAINS = [
  {
    id: 'fullstack',
    title: 'Full Stack Development',
    level: 'Beginner to Advanced',
    modules: '8 Modules • 48 Lessons',
    description: 'Master end-to-end web engineering with React 19, Next.js, Node.js, Express, PostgreSQL, and scalable cloud architectures.',
    skills: ['React 19', 'Next.js', 'Node.js', 'PostgreSQL', 'System Design'],
    icon: Code2,
    badge: 'Popular Track',
    badgeClass: 'bg-blue-500/10 text-primary border-blue-500/20'
  },
  {
    id: 'data-analytics',
    title: 'Data Analytics & Science',
    level: 'Comprehensive',
    modules: '6 Modules • 36 Lessons',
    description: 'Extract business intelligence through Python data pipelines, advanced SQL querying, automated dashboards, and statistical models.',
    skills: ['Python', 'SQL Mastery', 'Tableau', 'Pandas', 'Predictive Modeling'],
    icon: BarChart3,
    badge: 'High Demand',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
  },
  {
    id: 'ai-agents',
    title: 'AI Agents & LLM Systems',
    level: 'Cutting-Edge',
    modules: '7 Modules • 42 Lessons',
    description: 'Build production autonomous AI agents, LangChain tool-use pipelines, RAG knowledge bases, and multi-agent collaborative workflows.',
    skills: ['AI Agents', 'LangChain', 'RAG Architecture', 'Prompt Systems', 'Vector DBs'],
    icon: Bot,
    badge: 'Trending Now',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing & Growth',
    level: 'All Levels',
    modules: '5 Modules • 30 Lessons',
    description: 'Scale acquisition and revenue with modern performance marketing, organic SEO architecture, funnel optimization, and attribution analytics.',
    skills: ['Performance Marketing', 'SEO Strategy', 'Funnel Optimization', 'Ad Networks', 'Growth Analytics'],
    icon: TrendingUp,
    badge: 'Career Accelerator',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  }
];

// ─── Tabbed FAQs ───
const FAQS = {
  candidates: [
    {
      q: 'How does AlignGrade provide more opportunities than regular job boards?',
      a: 'Unlike traditional portals where resumes get lost in blackholes, AlignGrade unlocks opportunities as soon as you verify your skills. Recruiters proactively search our pre-screened talent directory and invite verified candidates directly for interviews. You can also explore thousands of paid internships and verified freelance gigs without needing prior pedigree.'
    },
    {
      q: 'Are all opportunities on AlignGrade paid?',
      a: 'Yes, 100%. We enforce strict transparency guidelines. All internships have guaranteed stipends (typically ₹25,000 – ₹70,000/month), full-time jobs have clear compensation ranges, and freelance gigs feature verified milestone escrows.'
    },
    {
      q: 'What if I do not pass the 70% threshold on a skill test?',
      a: 'No problem at all! You will receive detailed diagnostic insights showing which subtopics need work. You can study, review the roadmaps, and retake assessments to level up your score. There is zero penalty for learning.'
    },
    {
      q: 'Is AlignGrade completely free for candidates?',
      a: 'Yes. Profile creation, taking skill verification exams, building your verifiable portfolio, and applying to opportunities is 100% free for candidates.'
    }
  ],
  recruiters: [
    {
      q: 'How does AlignGrade guarantee rightful candidate quality?',
      a: 'Every candidate with a verified badge has passed our rigorous, multi-topic assessments drawn from our 4,770+ active question bank. We test real-world technical execution, eliminating inflated resumes and fraudulent claims.'
    },
    {
      q: 'How quickly can I hire through AlignGrade?',
      a: 'Because candidates are pre-assessed and skill-ranked, recruiters cut screening cycles from 3–4 weeks down to 48 hours. You can shortlist candidates based on exact stack alignment and initiate interviews immediately.'
    },
    {
      q: 'Can we hire for full-time roles, internships, and freelance gigs?',
      a: 'Yes. AlignGrade supports full-time engineering hires, high-impact interns, and on-demand freelance talent with built-in milestone reviews and ratings.'
    },
    {
      q: 'How does the algorithmic alignment engine work?',
      a: 'Our engine computes mathematical skill coverage between your exact required threshold levels and the candidate’s verified scores. You receive candidate match percentages (e.g. 96% Match) so you only spend time on high-fit talent.'
    }
  ],
  verification: [
    {
      q: 'Where do the assessment questions come from?',
      a: 'Our question bank comprises 4,770+ curated, peer-reviewed technical questions covering 140+ canonical skill roadmaps. Tests feature balanced difficulty mixes, anti-cheat randomized sequences, and zero duplicate exposure.'
    },
    {
      q: 'What does the Verified Gold Badge signify on a candidate profile?',
      a: 'A score of 70% or higher earns the official Verified Badge. It certifies that the candidate has proven practical proficiency in that specific domain under standardized conditions.'
    },
    {
      q: 'Can candidates manipulate their test scores?',
      a: 'No. Test scoring is conducted strictly on our secure backend. Answers are never sent to the client browser, sessions are single-use, and outcomes are atomically audited.'
    }
  ]
};

export default function AuthView({ setToken, setUser, theme, toggleTheme }) {
  // Navigation & Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // FAQ Tab & Accordion State
  const [faqTab, setFaqTab] = useState('candidates');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Auth Handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const path = isLogin ? '/auth/login' : '/auth/signup';
    const payload = isLogin ? { email, password, role } : { email, password, role, name };

    try {
      const res = await apiFetch(path, {
        method: 'POST',
        json: payload
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerAuthFlow = (mode = 'login', defaultRole = 'STUDENT') => {
    setIsLogin(mode === 'login');
    setRole(defaultRole);
    setIsDrawerOpen(true);
    setError('');
  };

  const navigateToCandidate = (mode = 'login') => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal && CANDIDATE_URL) {
      window.location.href = `${CANDIDATE_URL}/candidate/${mode}`;
    } else {
      window.history.pushState({}, '', `/candidate/${mode}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const navigateToRecruiter = (mode = 'login') => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal && RECRUITER_URL) {
      window.location.href = `${RECRUITER_URL}/recruiter/${mode}`;
    } else {
      window.history.pushState({}, '', `/recruiter/${mode}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const navigateToRoute = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="theme-jobsplanet min-h-screen w-full bg-[#E9EFFA] dark:bg-slate-950 text-on-surface font-sans antialiased overflow-x-hidden relative selection:bg-primary/20 selection:text-primary">
      <ClickSpark
        sparkColor={theme === 'dark' ? '#3B82F6' : '#2563EB'}
        sparkSize={10}
        sparkRadius={16}
        sparkCount={8}
        duration={400}
      >
        {error && formatErrorMessage(error, () => setError(''))}

        {/* ─── 1. TOP NAVIGATION BAR ─── */}
        <header className="relative z-20 flex justify-between items-center w-full px-4 sm:px-8 h-20 sticky top-0 bg-[#E9EFFA]/90 dark:bg-slate-950/90 border-b border-outline-variant/60 shadow-xs backdrop-blur-md transition-colors">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <img
                alt="AlignGrad Logo"
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-102"
                src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
              />
            </a>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <a href="#courses" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors flex items-center gap-1.5">
              <span>Courses &amp; Learning</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary-container text-on-primary-container rounded-full">New</span>
            </a>
            <a href="#recruiters" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">For Recruiters</a>
            <a href="#verification" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Skill Engine</a>
            <a href="#faq" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

            <button
              onClick={() => navigateToCandidate('login')}
              className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all hover:border-primary/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs"
            >
              Candidate Portal
            </button>

            <button
              onClick={() => navigateToRecruiter('login')}
              className="btn-primary px-4 py-2 rounded-xl text-xs font-medium cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Recruiter Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* ─── 2. HERO SECTION ─── */}
        <section className="relative z-10 pt-8 sm:pt-12 pb-14 md:pb-20 px-4 sm:px-8 border-b border-outline-variant/60 overflow-hidden">
          {/* Subtle decorative ambient glow */}
          <div className="ambient-glow -top-32 -left-32 opacity-50"></div>
          <div
            className="ambient-glow top-1/3 -right-32 opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(255, 255, 255, 0) 70%)' }}
          ></div>

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">

              {/* LEFT COLUMN: HERO TEXT, CTAs & THE 3 GUARANTEE PILLS */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                <AnimatedContent distance={30} direction="vertical" duration={0.6}>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-blue-200/60 dark:border-blue-900/50 shadow-2xs mb-5 w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">High-Income Skill Economy:</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Unlock Side Hustles &amp; Gigs</span>
                  </div>
                </AnimatedContent>

                <AnimatedContent distance={40} direction="vertical" duration={0.7} delay={0.1}>
                  <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl xl:text-[45px] font-medium tracking-tight text-heading leading-[1.14] mb-5">
                    Turn Your Skills Into <span className="text-emerald-600 dark:text-emerald-400 font-bold xl:text-7xl">Money</span> And Your Hustle Into a <span className="text-primary font-bold xl:text-7xl">Career !!</span>.
                  </h1>
                  <p className="font-sans text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-7 max-w-xl">
                    Launch lucrative freelance side hustles, unlock guaranteed stipend internships, and get hired for premium engineering roles. We eliminate resume fluff: prove your abilities through 10-question tests and connect with recruiters who pay for rightful talent.
                  </p>
                </AnimatedContent>

                <AnimatedContent distance={40} direction="vertical" duration={0.7} delay={0.2}>
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-7">
                    <button
                      onClick={() => navigateToCandidate('signup')}
                      className="px-6 py-3.5 rounded-xl bg-primary text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:bg-primary/95 transition-all cursor-pointer group"
                    >
                      <Wallet className="w-4 h-4 text-emerald-300" />
                      <span>Start Earning: Explore 5,000+ Opportunities</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => navigateToRecruiter('signup')}
                      className="px-6 py-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-300/80 dark:border-slate-700 font-medium text-sm text-heading hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Building2 className="w-4 h-4 text-primary" />
                      <span>Hire Verified Talent</span>
                    </button>
                  </div>

                  {/* Guaranteed Proof Pills */}
                  {/* <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>₹40k - ₹1.4L / Gig Side Hustles</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>₹30k - ₹70k / Mo Guaranteed Stipends</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>100% Verified Escrow &amp; Offers</span>
                    </span>
                  </div> */}
                </AnimatedContent>
              </div>

              {/* RIGHT COLUMN: CENTRAL HERO EARNING IMAGE + 4 SURROUNDING SATELLITE IMAGES */}
              <div className="lg:col-span-6 flex items-center justify-center pt-6 lg:pt-0">
                <AnimatedContent distance={50} direction="vertical" duration={0.8} delay={0.25} className="w-full">
                  <div className="relative w-full max-w-[500px] sm:max-w-[540px] mx-auto min-h-[440px] sm:min-h-[480px] flex items-center justify-center p-4">
                    {/* Soft background ambient halo */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-300/25 via-emerald-300/20 to-indigo-300/25 rounded-full blur-3xl pointer-events-none"></div>

                    {/* Decorative subtle dot mesh accents behind the cluster (learn.aligngrad.com reference style) */}
                    <div className="absolute top-2 right-4 w-28 h-28 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2563EB 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }}></div>
                    <div className="absolute bottom-2 left-4 w-28 h-28 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10B981 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }}></div>

                    {/* SATELLITE 1: TOP-LEFT (Coder with headphones) */}
                    <div className="absolute top-0 sm:top-2 left-0 sm:left-2 z-20 group">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                          <img
                            src="/hero_satellite_coder.jpg"
                            alt="Student earning from Full-Stack freelance gigs"
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span>₹85k / Gig</span>
                        </div>
                      </div>
                    </div>

                    {/* SATELLITE 2: TOP-RIGHT (Male Intern / Engineer) */}
                    <div className="absolute top-0 sm:top-2 right-0 sm:right-2 z-20 group">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                          <img
                            src="/hero_satellite_intern.jpg"
                            alt="Student hired for high-stipend AI and engineering roles"
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>₹60k / Mo</span>
                        </div>
                      </div>
                    </div>

                    {/* SATELLITE 3: BOTTOM-LEFT (UI/UX Designer in mint sweater) */}
                    <div className="absolute bottom-2 sm:bottom-4 left-0 sm:left-2 z-20 group">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                          <img
                            src="/hero_satellite_designer.jpg"
                            alt="Creative UI/UX Designer earning client payouts"
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>UI/UX Gig</span>
                        </div>
                      </div>
                    </div>

                    {/* SATELLITE 4: BOTTOM-RIGHT (Cloud & Data Engineer) */}
                    <div className="absolute bottom-2 sm:bottom-4 right-0 sm:right-2 z-20 group">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                          <img
                            src="/hero_satellite_analyst.jpg"
                            alt="Data and Cloud engineer securing verified contract"
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          <span>Cloud Dev</span>
                        </div>
                      </div>
                    </div>

                    {/* CENTRAL MAIN IMAGE: "IMAGE NUMBER 1" */}
                    <div className="relative z-10 w-64 sm:w-76 lg:w-80 aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-300 hover:scale-[1.02]">
                      <img
                        src="/hero_earning_main.jpg"
                        alt="Happy student celebrating freelance income on laptop"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] font-medium">
                        <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                          <Coins className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Direct Payouts</span>
                        </span>
                        <span className="bg-emerald-500/90 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                          100% Escrow
                        </span>
                      </div>
                    </div>

                    {/* OVERLAPPING FLOATING CAREER JOURNEY CARD (inspired by learn.aligngrad.com) */}
                    <div className="absolute -bottom-4 sm:-bottom-3 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-xl border border-slate-200/90 dark:border-slate-700 flex items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 shrink-0">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-heading">Your Earning Pathway</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                            Verified Gigs
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> 15-Min Test
                          </span>
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Direct Payouts
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </AnimatedContent>
              </div>

            </div>

            {/* ─── 3. THE MODERN PLAYBOOK & ECOSYSTEM SHOWCASE ─── */}
            <div className="mt-16 sm:mt-24 space-y-8 sm:space-y-12">
              
              {/* ─── ROW 1: Skills & Inclusivity Card (Left) + Image (Right) ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
                {/* CONTAINER 1: Skills & Inclusivity Card */}
                <AnimatedContent distance={40} direction="vertical" duration={0.7} delay={0.15} className="w-full">
                  <div className="relative rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 dark:bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-primary text-[11px] font-bold uppercase tracking-wider mb-3.5">
                      <Sparkles className="w-3.5 h-3.5" /> Skills &amp; Inclusivity
                    </div>

                    <h3 className="font-headline text-2xl sm:text-3xl font-medium text-heading mb-3.5 leading-snug">
                      Not Just Tech Skills. <span className="text-primary font-bold">Every Skill Has Value.</span>
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                      AlignGrade connects technical and non-technical talent with paid gigs, short-term tasks, and career opportunities. Whether you code, design, write, market, or manage, showcase your strengths and find opportunities where your skills can make an impact.
                    </p>

                    {/* Highlight Chips */}
                    <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-5 border-t border-outline-variant/60">
                      <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container/80 border border-outline-variant text-xs font-semibold text-heading">
                        <Code2 className="w-4 h-4 text-primary" /> Technical Skills
                      </span>
                      <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container/80 border border-outline-variant text-xs font-semibold text-heading">
                        <PenTool className="w-4 h-4 text-indigo-500" /> Non-Technical Skills
                      </span>
                      <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container/80 border border-outline-variant text-xs font-semibold text-heading">
                        <HeartHandshake className="w-4 h-4 text-emerald-600" /> Soft Skills Matter
                      </span>
                    </div>
                  </div>
                </AnimatedContent>

                {/* CONTAINER 2: Image Only with subtle corner badge (Right) */}
                <AnimatedContent distance={40} direction="vertical" duration={0.8} delay={0.2} className="w-full">
                  <div className="relative group rounded-[2.25rem] overflow-hidden border-3 sm:border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 aspect-[7/4] w-full transition-all hover:shadow-2xl">
                    <img
                      src="/playbook_stipend_offer.jpg"
                      alt="Student candidate exploring verified paid opportunities"
                      className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                    />
                    {/* Subtle corner badge reading Paid Opportunities */}
                    <div className="absolute top-3.5 right-3.5 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 bg-black/55 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-medium border border-white/20 shadow-sm">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Paid Opportunities</span>
                      </span>
                    </div>
                  </div>
                </AnimatedContent>
              </div>

              {/* ─── ROW 2: Image (Left) + Jobs & Earning Opportunities Card (Right) ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
                {/* CONTAINER 3: Image Only (Left) */}
                <AnimatedContent distance={40} direction="vertical" duration={0.8} delay={0.25} className="w-full order-2 lg:order-1">
                  <div className="relative group rounded-[2.25rem] overflow-hidden border-3 sm:border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 aspect-[7/4] w-full transition-all hover:shadow-2xl">
                    <img
                      src="/playbook_earning_gig.jpg"
                      alt="Professional working on remote tasks and career projects"
                      className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                    />
                    {/* Subtle corner badge reading Verified Tasks & Gigs */}
                    <div className="absolute top-3.5 right-3.5 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 bg-black/55 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-medium border border-white/20 shadow-sm">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Verified Tasks &amp; Gigs</span>
                      </span>
                    </div>
                  </div>
                </AnimatedContent>

                {/* CONTAINER 4: Jobs & Earning Opportunities Card (Right) */}
                <AnimatedContent distance={40} direction="vertical" duration={0.8} delay={0.3} className="w-full order-1 lg:order-2">
                  <div className="relative rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 dark:bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] font-bold uppercase tracking-wider mb-3.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Jobs &amp; Earning Opportunities
                    </div>

                    <h3 className="font-headline text-2xl sm:text-3xl font-medium text-heading mb-3.5 leading-snug">
                      From <span className="text-emerald-600 dark:text-emerald-400 font-bold">Daily Pay</span> to Your <span className="text-primary font-bold">Dream Job</span>.
                    </h3>

                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                      Explore per-day paid tasks, freelance gigs, internships, and full-time roles on AlignGrade. Showcase your technical expertise, communication, creativity, and problem-solving skills while discovering opportunities that match your strengths and career goals.
                    </p>

                    {/* Highlight Chips */}
                    <div className="flex flex-wrap gap-2.5 sm:gap-3 mb-6">
                      <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container/80 border border-outline-variant text-xs font-semibold text-heading">
                        <CalendarClock className="w-4 h-4 text-emerald-600" /> Per-Day Pay
                      </span>
                      <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container/80 border border-outline-variant text-xs font-semibold text-heading">
                        <Briefcase className="w-4 h-4 text-primary" /> Freelance Gigs
                      </span>
                      <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container/80 border border-outline-variant text-xs font-semibold text-heading">
                        <GraduationCap className="w-4 h-4 text-indigo-500" /> Internships &amp; Jobs
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => navigateToCandidate('signup')}
                        className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all flex items-center gap-2 cursor-pointer shadow-sm group"
                      >
                        <span>Explore Opportunities</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Available across diverse roles &amp; experience levels.
                      </span>
                    </div>
                  </div>
                </AnimatedContent>
              </div>

              {/* ─── PLATFORM KEY MILESTONES COUNTER (Cleanly positioned underneath the section) ─── */}
              <AnimatedContent distance={30} direction="vertical" duration={0.8} delay={0.35}>
                <div className="backdrop-blur-md bg-white/90 dark:bg-slate-900/90 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 sm:mt-16">
                  <div className="text-center p-3">
                    <div className="font-headline text-2xl sm:text-3xl font-bold text-emerald-600">₹14.2 Cr+</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">Total Income Earned</div>
                  </div>
                  <div className="text-center p-3">
                    <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">5,000+</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">Active Opportunities &amp; Gigs</div>
                  </div>
                  <div className="text-center p-3">
                    <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">140+</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">Verified Skill Roadmaps</div>
                  </div>
                  <div className="text-center p-3">
                    <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">94.2%</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">Recruiter Alignment Rate</div>
                  </div>
                </div>
              </AnimatedContent>
            </div>
          </div>
        </section>

        {/* ─── 3. CORPORATE PARTNERS & ECOSYSTEM (FROSTED CONTAINER) ─── */}
        {/* <section className="relative z-10 py-12 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="backdrop-blur-md bg-surface-container-lowest/80 dark:bg-surface-container-lowest/80 rounded-3xl p-6 sm:p-8 border border-outline-variant/50 shadow-xs text-center">
              <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold mb-6">
                PARTNERING WITH INDUSTRY INNOVATORS &amp; HIGH-GROWTH STARTUPS
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
                <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-heading">MICROSOFT</span>
                <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-heading">GOOGLE CLOUD</span>
                <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-heading">SWIGGY</span>
                <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-heading">RAZORPAY</span>
                <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-heading">ADOBE</span>
                <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-heading">DECATHLON</span>
                <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-heading">DELOITTE</span>
              </div>
            </div>
          </div>
        </section> */}

        {/* ─── 4. SKILL MATCHING & VERIFICATION ─── */}
        <section id="recruiters" className="relative z-10 py-5 sm:py-7 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* LEFT COLUMN: Explanatory Content & 3 Clear Stages */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                <AnimatedContent distance={25} direction="vertical" duration={0.7} delay={0.15}>
                  <div>
                    {/* Eyebrow */}
                    <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-primary text-[11px] font-bold uppercase tracking-wider mb-3">
                      <Sparkles className="w-3.5 h-3.5" /> SKILLS. TESTED. VERIFIED. MATCHED.
                    </div>

                    {/* Main Heading */}
                    <h2 className="text-3xl sm:text-4xl lg:text-[38px] font-headline font-medium text-heading mb-3 leading-tight">
                      Don't Just List Your Skills. <span className="text-primary font-bold">Prove Them.</span>
                    </h2>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5 sm:mb-6">
                      AlignGrade helps candidates demonstrate their abilities through structured technical skill assessments and detailed profiles. Recruiters can define the skills and proficiency levels their roles require, then discover candidates whose skills align with those requirements. From technical expertise to communication and problem-solving, help talent stand out through more than resume keywords alone.
                    </p>

                    {/* Three Clear Stages */}
                    <div className="space-y-3">
                      {/* 01 — Assess Your Skills */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-container-lowest/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant/80 shadow-xs flex items-start gap-3.5 transition-all hover:border-blue-500/40 group">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0 font-headline font-bold text-xs border border-blue-500/20 group-hover:bg-primary group-hover:text-white transition-colors">
                          01
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <h3 className="font-headline text-sm sm:text-base font-semibold text-heading">Assess Your Skills</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-primary border border-blue-500/20">
                              10 Questions
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Candidates complete 10-question assessments for supported technical skills to demonstrate their knowledge.
                          </p>
                        </div>
                      </div>

                      {/* 02 — Verify Your Proficiency */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-container-lowest/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant/80 shadow-xs flex items-start gap-3.5 transition-all hover:border-emerald-500/40 group">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 font-headline font-bold text-xs border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          02
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <h3 className="font-headline text-sm sm:text-base font-semibold text-heading">Verify Your Proficiency</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              70% Threshold
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Assessment results establish verified status when the candidate meets the platform's 70% passing threshold.
                          </p>
                        </div>
                      </div>

                      {/* 03 — Match Skills to Opportunities */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-container-lowest/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant/80 shadow-xs flex items-start gap-3.5 transition-all hover:border-primary/40 group">
                        <div className="w-9 h-9 rounded-xl bg-primary-container text-primary flex items-center justify-center shrink-0 font-headline font-bold text-xs border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors">
                          03
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <h3 className="font-headline text-sm sm:text-base font-semibold text-heading">Match Skills to Opportunities</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              Recruiter Alignment
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Recruiters define required skills and proficiency levels. AlignGrade helps identify candidates whose available skill ratings and verification results align with those requirements.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => navigateToCandidate('signup')}
                        className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary/95 transition-all flex items-center gap-2 cursor-pointer shadow-sm group"
                      >
                        <span>Take a Skill Assessment</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <button
                        onClick={() => navigateToRecruiter('signup')}
                        className="px-5 py-2.5 rounded-xl bg-surface-container-high border border-outline text-heading text-xs sm:text-sm font-semibold hover:bg-surface-container-highest transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <span>Discover Verified Talent</span>
                        <ChevronRight className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                  </div>
                </AnimatedContent>
              </div>

              {/* RIGHT COLUMN: Two Complementary Product Illustrations (Framed with Crisp White Borders) */}
              <div className="lg:col-span-6 flex flex-col gap-4 sm:gap-5 justify-center">
                {/* Visual 1: Assessment & Matching Workflow Dashboard */}
                <AnimatedContent distance={30} direction="vertical" duration={0.7} delay={0.2}>
                  <div className="relative group rounded-[2rem] sm:rounded-[2.25rem] overflow-hidden border-3 sm:border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 transition-all hover:shadow-2xl">
                    <img
                      src="/skill_matching_workflow.jpg"
                      alt="AlignGrade Skill Assessment, Verification, and Talent Matching Dashboard"
                      className="w-full h-auto object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute top-3.5 right-3.5 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[10px] font-medium border border-white/20 shadow-sm">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        <span>Interactive Assessment Engine</span>
                      </span>
                    </div>
                  </div>
                </AnimatedContent>

                {/* Visual 2: Verified Skill & Alignment Scorecard */}
                <AnimatedContent distance={30} direction="vertical" duration={0.8} delay={0.28}>
                  <div className="relative group rounded-[2rem] sm:rounded-[2.25rem] overflow-hidden border-3 sm:border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 transition-all hover:shadow-2xl">
                    <img
                      src="/skill_scorecard_badge.jpg"
                      alt="Candidate Verified Skill Proficiency and Recruiter Alignment Scorecard"
                      className="w-full h-auto object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute top-3.5 right-3.5 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[10px] font-medium border border-white/20 shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>70%+ Verified Benchmark</span>
                      </span>
                    </div>
                  </div>
                </AnimatedContent>
              </div>

            </div>
          </div>
        </section>

        {/* ─── 5. MULTI-DOMAIN ACADEMY & COURSES SHOWCASE ─── */}
        <section id="courses" className="relative z-10 py-12 sm:py-16 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-7xl mx-auto">
            {/* Header Plate */}
            <AnimatedContent distance={30} direction="vertical" duration={0.7} delay={0.1}>
              <div className="backdrop-blur-md bg-surface-container-lowest/80 dark:bg-surface-container-lowest/80 rounded-3xl p-6 sm:p-8 border border-outline-variant/50 shadow-xs text-center max-w-3xl mx-auto mb-10 sm:mb-12">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/90 px-3 py-1 rounded-full shadow-2xs">
                  <BookOpen className="w-3.5 h-3.5" /> Multi-Domain Academy &amp; Roadmaps
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-[38px] font-headline font-medium text-heading mt-3 mb-3 leading-tight">
                  Master In-Demand Skills. <span className="text-primary font-bold">Learn Across Core Domains.</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  AlignGrade empowers candidates to bridge skill gaps and master high-paying disciplines. Explore modular video courses across Full Stack Development, Data Analytics, AI Agents, and Digital Marketing to build verified competency and unlock direct placement opportunities.
                </p>
              </div>
            </AnimatedContent>

            {/* 4 Core Domain Curriculum Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-12 sm:mb-16">
              {COURSE_DOMAINS.map((domain, idx) => (
                <AnimatedContent key={domain.id} distance={30} direction="vertical" duration={0.7} delay={0.15 + idx * 0.08}>
                  <div className="h-full p-5 rounded-3xl bg-surface-container-lowest/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between group">
                    <div>
                      {/* Top Row: Icon + Badge */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                          <domain.icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${domain.badgeClass}`}>
                          {domain.badge}
                        </span>
                      </div>

                      <h3 className="font-headline text-base font-semibold text-heading mb-1 group-hover:text-primary transition-colors">
                        {domain.title}
                      </h3>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
                        {domain.modules}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        {domain.description}
                      </p>
                    </div>

                    <div>
                      {/* Skill Tag Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-outline-variant/60">
                        {domain.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-surface-container text-slate-700 dark:text-slate-300 border border-outline-variant/60"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </AnimatedContent>
              ))}
            </div>

            {/* ─── DUAL VISUAL SHOWCASE: Course Learning & Platform Experience ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Visual 1: Course Learning Image (Cohort & Hands-On Engineering) */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <AnimatedContent distance={35} direction="vertical" duration={0.8} delay={0.2}>
                  <div className="relative group rounded-[2rem] sm:rounded-[2.25rem] overflow-hidden border-3 sm:border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 transition-all hover:shadow-2xl">
                    <img
                      src="/course_learning_students.jpg"
                      alt="Students learning modern technical skills in Full Stack Development, Data Analytics, AI Agents, and Digital Marketing"
                      className="w-full h-auto object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute top-3.5 right-3.5 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-medium border border-white/20 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>Interactive Cohort Learning</span>
                      </span>
                    </div>
                  </div>
                </AnimatedContent>

                <AnimatedContent distance={20} direction="vertical" duration={0.7} delay={0.25}>
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <h4 className="font-headline text-sm sm:text-base font-semibold text-heading mb-1.5 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <span>Curriculum Across 4 Strategic Domains</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Build full-stack software, automate intelligence with autonomous AI agents, extract insights with data analytics, and drive growth with digital marketing.
                    </p>
                  </div>
                </AnimatedContent>
              </div>

              {/* Visual 2: Course Platform Experience (Video Lectures & Progress Tracking) */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <AnimatedContent distance={35} direction="vertical" duration={0.8} delay={0.28}>
                  <div className="relative group rounded-[2rem] sm:rounded-[2.25rem] overflow-hidden border-3 sm:border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 transition-all hover:shadow-2xl">
                    <img
                      src="/course_platform_experience.jpg"
                      alt="AlignGrade interactive online learning platform with video lessons, module chapters, and progress tracking"
                      className="w-full h-auto object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute top-3.5 right-3.5 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-medium border border-white/20 shadow-sm">
                        <Video className="w-3.5 h-3.5 text-emerald-400" />
                        <span>CloudFront HD Video Player</span>
                      </span>
                    </div>
                  </div>
                </AnimatedContent>

                <AnimatedContent distance={20} direction="vertical" duration={0.7} delay={0.32}>
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <h4 className="font-headline text-sm sm:text-base font-semibold text-heading mb-1.5 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Modular Checkpoints &amp; Verified Progress</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Follow weekly video chapters with live completion tracking, downloadable code notes, and direct integration into AlignGrade 10-Question Skill Assessments.
                    </p>
                  </div>
                </AnimatedContent>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-10 sm:mt-12 text-center flex flex-wrap items-center justify-center gap-3.5">
              <button
                onClick={() => navigateToCandidate('login')}
                className="px-6 py-3 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary/95 transition-all inline-flex items-center gap-2 cursor-pointer shadow-md group"
              >
                <span>Explore All Courses</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigateToCandidate('signup')}
                className="px-6 py-3 rounded-xl bg-surface-container-high border border-outline text-heading text-xs sm:text-sm font-semibold hover:bg-surface-container-highest transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Start Learning Free</span>
                <ChevronRight className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>
        </section>


        {/* ─── 7. THE ALIGNGRADE VERIFICATION ENGINE (HOW IT WORKS - 4 STEPS) ─── */}
        <section id="verification" className="relative z-10 py-10 sm:py-12 px-4 sm:px-8 border-b border-slate-200/80 dark:border-slate-800 bg-transparent">
          <div className="max-w-6xl mx-auto">
            {/* White Header Plate with White Border */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md text-center max-w-3xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/90 px-3 py-1 rounded-full shadow-2xs">
                Objective Meritocracy &amp; Financial Growth
              </span>
              <h2 className="text-3xl sm:text-4xl font-headline font-medium text-heading mt-3 mb-3">
                How AlignGrade Unlocks Money &amp; Verified Placements
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                From self-declaration to high-income payouts. A cheat-resistant, standardized 4-step engine that aligns candidate abilities with recruiter budgets.
              </p>
            </div>

            {/* Featured Badge Highlight Banner (White Card with White Border) */}
            <div className="bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-md flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                <img
                  src="/skill_income_shield.jpg"
                  alt="Verified skill badge and income growth shield"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>The Verified Income Passport</span>
                </div>
                <h3 className="text-lg sm:text-xl font-headline font-medium text-heading">
                  Prove Your Knowledge Once. Unlock Unlimited Gigs &amp; High-Paying Jobs.
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  Recruiters hate reading 500 fake resumes. When candidates earn the Verified Shield (70%+ score), their applications skip HR screening entirely. You are instantly fast-tracked for paid project milestones, lucrative side hustles, and direct full-time offers.
                </p>
              </div>
            </div>

            {/* 4 Step Cards (White Cards with White Borders) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[
                {
                  step: '01',
                  title: 'Select Track & Roadmaps',
                  desc: 'Choose from 140+ canonical skill paths. Recruiters benchmark minimum required scores for active paid roles and milestone gigs.',
                  icon: User
                },
                {
                  step: '02',
                  title: 'Take 10-Question Challenge',
                  desc: 'Served live from our 4,770+ active question bank. Anti-cheat randomized questions test real implementation, not memorization.',
                  icon: Sparkles
                },
                {
                  step: '03',
                  title: 'Unlock Verified Shield',
                  desc: 'Score 70%+ to lock in a golden verified badge. Instantly qualify for escrow-backed side hustles and competitive stipends.',
                  icon: ShieldCheck
                },
                {
                  step: '04',
                  title: 'Earn & Get Hired',
                  desc: 'Get matched through our alignment algorithm. Pocket side hustle money, finish client gigs, and secure top-tier full-time contracts.',
                  icon: TrendingUp
                }
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md hover:shadow-xl flex flex-col justify-between relative transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-headline text-3xl font-bold text-primary/30">{item.step}</span>
                      <div className="w-10 h-10 rounded-2xl bg-primary-container text-primary flex items-center justify-center">
                        <item.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-heading mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ─── 9. SOCIAL PROOF & TESTIMONIALS ─── */}
        <section className="relative z-10 py-10 sm:py-12 px-4 sm:px-8 border-b border-slate-200/80 dark:border-slate-800 bg-transparent">
          <div className="max-w-6xl mx-auto">
            {/* White Header Plate with White Border */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md text-center max-w-3xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/90 px-3 py-1 rounded-full shadow-2xs">
                Community Proof
              </span>
              <h2 className="text-3xl sm:text-4xl font-headline font-medium text-heading mt-3 mb-3">
                Loved by Students, Trusted by Recruiters
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Read how candidates unlock life-changing opportunities and employers build elite engineering teams.
              </p>
            </div>

            {/* Community Earning Spotlight Bento Card (White Card with White Border) */}
            <div className="mb-6 rounded-3xl border-2 sm:border-3 border-white dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                    <Users className="w-3.5 h-3.5" /> High-Earning Student Network
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-headline font-medium text-heading mb-3 leading-snug">
                    Over 50,000+ Students &amp; Freelancers Monetizing Skills Together
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    No gatekeeping. No waiting for college campus drives. Students and junior engineers from 800+ colleges across India are cracking 10-question skill benchmarks, securing escrow-guaranteed freelance payouts, and launching high-income engineering careers.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-headline">₹4.8 Cr+</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">Escrow Paid Out</div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <div className="text-lg sm:text-2xl font-bold text-heading font-headline">12,400+</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">Milestone Gigs Done</div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <div className="text-lg sm:text-2xl font-bold text-primary font-headline">4.9 / 5</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">Candidate Rating</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full overflow-hidden group border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800">
                <img
                  src="/landing_community_earn.jpg"
                  alt="Students collaborating and earning money through side hustles"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-black/85 via-black/25 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 text-[10px] font-bold text-white mb-2 shadow-xs">
                    <ShieldCheck className="w-3 h-3" /> 100% Escrow Protected
                  </div>
                  <p className="text-xs font-semibold leading-snug text-white/95 drop-shadow-sm">
                    "AlignGrade gave me the income freedom I needed to focus on building without financial stress."
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Testimonial Cards (White Cards with White Borders) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold mb-3">
                    ₹45,000 / mo Stipend
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic mb-6">
                    "I attended a tier-3 college and had zero campus placement calls. On AlignGrade, I passed the React assessment with 94% and unlocked high-paying internships. I started earning ₹45,000/month within 4 days of signing up."
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    AS
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-heading">Aman Sharma</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Frontend Intern • Level 9 Certified</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold mb-3">
                    ₹1,85,000 Side Hustle Income
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic mb-6">
                    "I took on three verified freelance side hustles during my 6th semester. Made ₹1,85,000 in pocket money and paid off my entire college laptop bill. The escrow payouts gave me complete peace of mind."
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    RM
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-heading">Riya Mukherjee</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Full-Stack Freelancer • Kolkata</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-primary-container text-primary text-[10px] font-bold mb-3">
                    48h Time-to-Offer
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic mb-6">
                    "AlignGrade reduced our candidate screening cycles by 70%. We used to get hundreds of fake resumes. Here, every engineer is pre-tested on genuine coding problems. We hire rightful talent with zero friction."
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    SK
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-heading">Sneha Kapoor</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Head of Talent • Nexa Tech Labs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 10. TABBED FAQ ACCORDION ─── */}
        <section id="faq" className="relative z-10 py-10 sm:py-12 px-4 sm:px-8 border-b border-slate-200/80 dark:border-slate-800 bg-transparent">
          <div className="max-w-4xl mx-auto">
            {/* White Header Plate with White Border */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md text-center max-w-2xl mx-auto mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/90 px-3 py-1 rounded-full shadow-2xs">
                Got Questions?
              </span>
              <h2 className="text-3xl sm:text-4xl font-headline font-medium text-heading mt-3 mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Everything you need to know about opportunities, hiring, and our skill verification engine.
              </p>
            </div>

            {/* FAQ Tabs (White Card with White Border) */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex p-1.5 rounded-2xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md">
                {[
                  { id: 'candidates', label: 'For Candidates' },
                  { id: 'recruiters', label: 'For Recruiters' },
                  { id: 'verification', label: 'Skill Verification' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setFaqTab(t.id);
                      setOpenFaqIndex(0);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      faqTab === t.id
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-heading'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Accordions (White Cards with White Borders) */}
            <div className="space-y-3">
              {FAQS[faqTab].map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="border-2 sm:border-3 border-white dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 transition-all shadow-md"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-headline font-medium text-sm sm:text-base text-heading hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-primary' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:p-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── 11. FINAL HIGH-CONVERSION CTA BANNER ─── */}
        <section className="relative z-10 py-20 px-4 sm:px-8 border-b border-outline-variant text-center bg-transparent">
          <div className="max-w-4xl mx-auto relative z-10">
            {/* White Header Plate with White Border */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md max-w-3xl mx-auto mb-10 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full shadow-2xs">
                Unlock Your Earning Potential
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-medium text-heading mt-4 mb-4">
                Step Into the Era of Skill Monetization &amp; Rightful Hiring
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Whether you want to earn extra side hustle money from freelance contracts, build recurring monthly stipend income, or hire top pre-screened engineers without resume screening headaches — AlignGrade is your home.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 text-left shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1 text-emerald-600">
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">CANDIDATES &amp; STUDENTS</span>
                  </div>
                  <h3 className="text-base font-bold text-heading mb-2">Prove Skills &amp; Start Earning</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">100% Free forever. Take 10-question tests, earn verified shields, and unlock 5,000+ gigs, side hustles, and jobs.</p>
                </div>
                <button
                  onClick={() => navigateToCandidate('signup')}
                  className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Start Earning Money</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 text-left shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1 text-primary">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">RECRUITERS &amp; COMPANIES</span>
                  </div>
                  <h3 className="text-base font-bold text-heading mb-2">Hire Pre-Screened Talent</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">Post roles, specify required thresholds, and shortlist verified candidates with zero resume inflation in 48 hours.</p>
                </div>
                <button
                  onClick={() => navigateToRecruiter('signup')}
                  className="w-full py-2.5 rounded-xl bg-surface-container-high border border-outline text-heading text-xs font-semibold hover:bg-surface-container-highest transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Discover Rightful Talent</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 12. FOOTER (WHITE CARD & WHITE BORDER CONTAINER) ─── */}
        <footer className="relative z-10 py-10 sm:py-14 px-4 sm:px-8 text-xs bg-transparent">
          <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              {/* Column 1: Brand Info */}
              <div className="space-y-3">
                <a href="/" className="inline-block">
                  <img
                    alt="AlignGrad Logo"
                    className="h-12 w-auto object-contain"
                    src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
                  />
                </a>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
                  AlignGrade is India's premier skill verification network, connecting ambitious talent with rightful recruiters through objective, cheat-resistant assessments.
                </p>
                <div className="pt-2 text-[11px] text-slate-500">
                  Headquarters: Bengaluru, Karnataka, India • Pan-India Placement Reach
                </div>
              </div>

              {/* Column 2: Verification Engine */}
              <div>
                <h4 className="font-bold text-heading mb-3">Verification</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li className="hover:text-primary transition-colors cursor-pointer">140+ Skill Roadmaps</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Question Bank Integrity</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Anti-Cheat Engine</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Assessment Rubrics</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Candidate Trust Score</li>
                </ul>
              </div>

              {/* Column 3: Company & Legal (With Active Routes) */}
              <div>
                <h4 className="font-bold text-heading mb-3">Company &amp; Legal</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li>
                    <a
                      href="/privacy-policy"
                      onClick={(e) => { e.preventDefault(); navigateToRoute('/privacy-policy'); }}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms-and-conditions"
                      onClick={(e) => { e.preventDefault(); navigateToRoute('/terms-and-conditions'); }}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      Terms of Service &amp; Conditions
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms-and-conditions"
                      onClick={(e) => { e.preventDefault(); navigateToRoute('/terms-and-conditions'); }}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      Equal Opportunity Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy-policy"
                      onClick={(e) => { e.preventDefault(); navigateToRoute('/privacy-policy'); }}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      Security Practices
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:support@aligngrade.com"
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      Contact Support
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-[11px]">
              <p>© 2026 AlignGrade Recruitment &amp; Skill Systems. All rights reserved.</p>
              <div className="flex gap-6">
                <span>Empowering Meritocracy in India &amp; Globally</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Systems Operational
                </span>
              </div>
            </div>
          </div>
        </footer>

        {/* ─── 13. AUTH DRAWER / MODAL OVERLAY ─── */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-surface-container border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-outline-variant pb-4">
                <div>
                  <h3 className="text-xl font-headline font-medium text-heading">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isLogin ? 'Sign in to access your AlignGrade dashboard' : 'Join AlignGrade to verify skills & unlock opportunities'}
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-heading rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <Input
                    label="Full Name / Organization Name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma / TechFlow"
                  />
                )}

                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                />

                <div>
                  <label className="block text-[11px] font-headline font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl pl-4 pr-11 py-2.5 text-sm text-heading placeholder-slate-400 transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-heading transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-headline font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Account Classification
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setRole('STUDENT')}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        role === 'STUDENT'
                          ? 'bg-primary-container border-primary text-on-primary-container ring-1 ring-primary'
                          : 'bg-surface-container-low border-outline-variant text-slate-600 dark:text-slate-300 hover:text-heading'
                      }`}
                    >
                      Candidate / Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('RECRUITER')}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        role === 'RECRUITER'
                          ? 'bg-primary-container border-primary text-on-primary-container ring-1 ring-primary'
                          : 'bg-surface-container-low border-outline-variant text-slate-600 dark:text-slate-300 hover:text-heading'
                      }`}
                    >
                      Recruiter / Employer
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="flex justify-between items-center py-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded border-outline-variant text-primary bg-surface-container-low focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400 hover:text-heading transition-colors">Remember me</span>
                    </label>
                  </div>
                )}

                <Button type="submit" loading={loading} fullWidth className="mt-4">
                  {isLogin ? 'Sign In to Dashboard' : 'Create Account'}
                </Button>
              </form>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant"></div>
                </div>
                <span className="relative bg-surface-container px-3 text-[10px] font-headline font-medium text-slate-500 uppercase tracking-wider">
                  OR
                </span>
              </div>

              <GoogleAuthButton
                role={role}
                onSuccess={(data) => {
                  setToken(data.token);
                  setUser(data.user);
                }}
                onError={(msg) => setError(msg)}
              />

              <div className="border-t border-outline-variant pt-4 text-center">
                <button
                  type="button"
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-heading transition-colors cursor-pointer"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? (
                    <span>Don't have an account? <strong className="text-primary hover:underline font-bold">Sign up</strong></span>
                  ) : (
                    <span>Already have an account? <strong className="text-primary hover:underline font-bold">Sign in</strong></span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </ClickSpark>
    </div>
  );
}
