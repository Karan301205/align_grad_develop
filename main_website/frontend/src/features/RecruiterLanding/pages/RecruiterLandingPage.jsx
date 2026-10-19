import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  Briefcase,
  GraduationCap,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronDown,
  Layers,
  Search,
  Award,
  Lock,
  BarChart3,
  UserCheck,
  Check,
  Target,
  FileText,
  BadgeCheck,
  HelpCircle,
  TrendingUp,
  Cpu,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import ClickSpark from '../../../components/ui/ClickSpark';
import AnimatedContent from '../../../components/ui/AnimatedContent';
import CountUp from '../../../effects/CountUp';
import TrueFocus from '../../../effects/TrueFocus';
import { RECRUITER_URL } from '../../../config';

// ─── Recruiter Tailored FAQs ───
const RECRUITER_FAQS = [
  {
    q: 'How does AlignGrade verify candidate skills?',
    a: 'Candidates complete timed, standardized 10-question assessments drawn dynamically from our 4,770+ active question bank. Scoring is processed entirely on our backend, and candidates achieving 70% or higher earn an official verified skill badge with verifiable diagnostic topic breakdowns.'
  },
  {
    q: 'How does skill-based candidate matching work?',
    a: 'When you create a job opening, you specify the required skills and minimum proficiency percentages. AlignGrade mathematically evaluates your role requirements against candidate verified scorecards, highlighting pre-screened talent who meet your exact threshold criteria.'
  },
  {
    q: 'What types of roles can I recruit for on AlignGrade?',
    a: 'AlignGrade supports three flexible hiring formats: freelance gigs and milestone-based deliverables, stipend-guaranteed internships, and full-time or part-time engineering and domain-specific roles.'
  },
  {
    q: 'How many job postings are included in the recruiter plan?',
    a: 'The Recruiter 5-Pack provides 5 job posting credits for a one-time fee of ₹2,500. Each credit enables you to publish one active job opening with customized skill thresholds, candidate applicant tracking, and direct profile discovery.'
  },
  {
    q: 'Can I review candidate assessment results before interviewing?',
    a: 'Yes. Every recruiter account has access to candidate profiles, verified badges, comprehensive scores, and topic-specific performance indicators for the skills configured on your role before you invite them to an interview.'
  },
  {
    q: 'How do I manage applicants and recruitment rounds?',
    a: 'The Recruiter Portal includes a recruitment pipeline management workspace where you can review applicant profiles, filter by verification status, organize hiring rounds, and communicate next steps.'
  },
  {
    q: 'How does recruiter payment and credit activation work?',
    a: 'Payments are handled securely via Razorpay with backend HMAC signature validation. Upon successful payment of ₹2,500, your 5 job-posting credits are activated immediately with no recurring monthly subscription lock-ins.'
  }
];

export default function RecruiterLandingPage({ theme, toggleTheme }) {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const navigateToRecruiterAuth = (mode = 'login') => {
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (!isLocal && RECRUITER_URL) {
      window.location.href = `${RECRUITER_URL}/recruiter/${mode}`;
    } else {
      window.history.pushState({}, '', `/recruiter/${mode}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9F8F6] dark:bg-slate-950 text-on-surface font-sans antialiased overflow-x-hidden relative selection:bg-emerald-900/20 selection:text-emerald-900">
      <ClickSpark
        sparkColor={theme === 'dark' ? '#10B981' : '#003527'}
        sparkSize={10}
        sparkRadius={16}
        sparkCount={8}
        duration={400}
      >
        {/* ─── 1. RECRUITER TOP NAVIGATION BAR ─── */}
        <header className="relative z-20 flex justify-between items-center w-full px-4 sm:px-8 h-20 sticky top-0 bg-[#F9F8F6]/90 dark:bg-slate-950/90 border-b border-outline-variant/60 shadow-xs backdrop-blur-md transition-colors">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <img
                alt="AlignGrade Logo"
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-102"
                src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
              />
            </a>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-headline font-semibold bg-[#003527]/10 dark:bg-emerald-500/20 text-[#003527] dark:text-emerald-400 border border-[#003527]/20">
              Recruiter Hub
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="text-slate-600 dark:text-slate-300 hover:text-[#003527] dark:hover:text-emerald-400 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#verification"
              onClick={(e) => scrollToSection(e, 'verification')}
              className="text-slate-600 dark:text-slate-300 hover:text-[#003527] dark:hover:text-emerald-400 transition-colors"
            >
              Skill Verification
            </a>
            <a
              href="#categories"
              onClick={(e) => scrollToSection(e, 'categories')}
              className="text-slate-600 dark:text-slate-300 hover:text-[#003527] dark:hover:text-emerald-400 transition-colors"
            >
              Talent Discovery
            </a>
            <a
              href="#pricing"
              onClick={(e) => scrollToSection(e, 'pricing')}
              className="text-slate-600 dark:text-slate-300 hover:text-[#003527] dark:hover:text-emerald-400 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={(e) => scrollToSection(e, 'faq')}
              className="text-slate-600 dark:text-slate-300 hover:text-[#003527] dark:hover:text-emerald-400 transition-colors"
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

            <button
              onClick={() => navigateToRecruiterAuth('login')}
              className="px-5 py-2.5 rounded-xl bg-[#003527] hover:bg-[#002a1f] text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer group"
            >
              <span>Recruiter Login</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </header>

        {/* ─── 2. RECRUITER HERO SECTION ─── */}
        <section className="relative z-10 pt-8 sm:pt-14 pb-14 md:pb-20 px-4 sm:px-8 border-b border-outline-variant/60 overflow-hidden">
          {/* Subtle ambient lighting */}
          <div className="ambient-glow -top-32 -left-32 opacity-40"></div>
          <div
            className="ambient-glow top-1/3 -right-32 opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(0, 53, 39, 0.15) 0%, rgba(255, 255, 255, 0) 70%)' }}
          ></div>

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">

              {/* LEFT COLUMN: HERO TEXT & ACTIONS */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                <AnimatedContent distance={30} direction="vertical" duration={0.6}>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-emerald-200/80 dark:border-emerald-900/50 shadow-2xs mb-5 w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Skill-First Talent Network for Employers
                    </span>
                  </div>
                </AnimatedContent>

                <AnimatedContent distance={40} direction="vertical" duration={0.7} delay={0.1}>
                  <TrueFocus
                    manualMode={false}
                    blurAmount={1.5}
                    borderColor={['#003527', '#059669']}
                    glowColor={['rgba(0, 53, 39, 0.55)', 'rgba(16, 185, 129, 0.55)']}
                    animationDuration={0.6}
                    pauseBetweenAnimations={1.5}
                    className="mb-5"
                  >
                    <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl xl:text-[46px] font-medium tracking-tight text-heading leading-[1.15]">
                      Hire for{' '}
                      <TrueFocus.Target
                        index={0}
                        borderColor="#003527"
                        glowColor="rgba(0, 53, 39, 0.6)"
                        className="text-[#003527] dark:text-emerald-400 font-bold"
                        style={{ fontSize: 'calc(1em + 10px)' }}
                      >
                        Skills
                      </TrueFocus.Target>
                      . Build Teams with{' '}
                      <TrueFocus.Target
                        index={1}
                        borderColor="#059669"
                        glowColor="rgba(16, 185, 129, 0.6)"
                        className="text-emerald-700 dark:text-emerald-300 font-bold"
                        style={{ fontSize: 'calc(1em + 10px)' }}
                      >
                        Confidence
                      </TrueFocus.Target>
                      .
                    </h1>
                  </TrueFocus>

                  <p className="font-sans text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-7 max-w-xl">
                    Discover candidates with verified skills, assess their proficiency, and match talent to your job requirements instead of relying on resume keywords alone.
                  </p>
                </AnimatedContent>

                <AnimatedContent distance={40} direction="vertical" duration={0.7} delay={0.2}>
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-7">
                    <button
                      onClick={() => navigateToRecruiterAuth('login')}
                      className="px-6 py-3.5 rounded-xl bg-[#003527] hover:bg-[#00281e] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <Building2 className="w-4 h-4 text-emerald-300" />
                      <span>Recruiter Login</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <a
                      href="#how-it-works"
                      onClick={(e) => scrollToSection(e, 'how-it-works')}
                      className="px-6 py-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-300/80 dark:border-slate-700 font-medium text-sm text-heading hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Briefcase className="w-4 h-4 text-[#003527] dark:text-emerald-400" />
                      <span>See How It Works</span>
                    </a>
                  </div>
                </AnimatedContent>
              </div>

              {/* RIGHT COLUMN: CENTRAL HERO RECRUITER IMAGE + SATELLITE CARDS */}
              <div className="lg:col-span-6 flex items-center justify-center pt-6 lg:pt-0">
                <AnimatedContent distance={50} direction="vertical" duration={0.8} delay={0.25} className="w-full">
                  <div className="relative w-full max-w-[500px] sm:max-w-[540px] mx-auto min-h-[440px] sm:min-h-[480px] flex items-center justify-center p-4">
                    {/* Soft background ambient halo */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-300/20 via-blue-300/15 to-emerald-200/20 rounded-full blur-3xl pointer-events-none"></div>

                    {/* SATELLITE 1: TOP-LEFT (Full-Stack Engineer) */}
                    <div className="absolute top-0 sm:top-2 left-0 sm:left-2 z-20 group">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 transition-all duration-300 group-hover:scale-105">
                          <img
                            src="/hero_satellite_coder.jpg"
                            alt="Full-Stack Developer profile"
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span>React • 94%</span>
                        </div>
                      </div>
                    </div>

                    {/* SATELLITE 2: TOP-RIGHT (AI & ML Engineer) */}
                    <div className="absolute top-0 sm:top-2 right-0 sm:right-2 z-20 group">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 transition-all duration-300 group-hover:scale-105">
                          <img
                            src="/hero_satellite_intern.jpg"
                            alt="AI Systems Candidate"
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Python • 89%</span>
                        </div>
                      </div>
                    </div>

                    {/* SATELLITE 3: BOTTOM-LEFT (UI/UX Designer) */}
                    <div className="absolute bottom-2 sm:bottom-4 left-0 sm:left-2 z-20 group">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 transition-all duration-300 group-hover:scale-105">
                          <img
                            src="/hero_satellite_designer.jpg"
                            alt="UI Designer"
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>Figma • 91%</span>
                        </div>
                      </div>
                    </div>

                    {/* SATELLITE 4: BOTTOM-RIGHT (Cloud & DevOps) */}
                    <div className="absolute bottom-2 sm:bottom-4 right-0 sm:right-2 z-20 group">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 transition-all duration-300 group-hover:scale-105">
                          <img
                            src="/hero_satellite_analyst.jpg"
                            alt="Cloud Engineer"
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          <span>AWS • 87%</span>
                        </div>
                      </div>
                    </div>

                    {/* CENTRAL MAIN IMAGE: INDIAN RECRUITER & HIRING LEAD */}
                    <div className="relative z-10 w-64 sm:w-76 lg:w-80 aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-300 hover:scale-[1.02]">
                      <img
                        src="/recruiter_hero_lead.jpg"
                        alt="Indian hiring manager and tech lead reviewing candidate skill verification scorecards"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] font-medium">
                        <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Pre-Screened</span>
                        </span>
                        <span className="bg-[#003527]/90 text-emerald-200 font-bold px-2 py-0.5 rounded-full shadow-xs border border-emerald-500/30">
                          Verified Talent
                        </span>
                      </div>
                    </div>

                    {/* OVERLAPPING FLOATING RECRUITMENT PIPELINE CARD */}
                    <div className="absolute -bottom-4 sm:-bottom-3 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-xl border border-slate-200/90 dark:border-slate-700 flex items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-heading">Recruitment Pipeline</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> 48h Time-to-Shortlist
                          </span>
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Zero Keyword Spam
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </AnimatedContent>
              </div>

            </div>

            {/* ─── 3. SECTION A & B: VALUE PROPOSITION & HIRING FORMATS ─── */}
            <div id="categories" className="mt-16 sm:mt-24 space-y-8 sm:space-y-12">

              {/* ─── ROW 1: Value Prop Card (Left) + Indian Team Image (Right) ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
                <AnimatedContent distance={40} direction="vertical" duration={0.7} delay={0.15} className="w-full">
                  <div className="relative rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 dark:bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#003527]/10 dark:bg-emerald-500/20 border border-[#003527]/20 text-[#003527] dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-3.5">
                      <Sparkles className="w-3.5 h-3.5" /> Skill-First Talent Discovery
                    </div>

                    <h3 className="font-headline text-2xl sm:text-3xl font-medium text-heading mb-3.5 leading-snug">
                      Beyond Resumes. <span className="text-[#003527] dark:text-emerald-400 font-bold">Hire on Verified Ability.</span>
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                      Define the skills you need and the exact proficiency levels required. AlignGrade surfaces candidates whose assessment-backed profiles match your criteria, giving you actionable evidence before you interview.
                    </p>

                    {/* Highlight Chips */}
                    <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-5 border-t border-outline-variant/60">
                      <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container/80 border border-outline-variant text-xs font-semibold text-heading">
                        <Search className="w-4 h-4 text-[#003527] dark:text-emerald-400" /> Skill-Based Discovery
                      </span>
                      <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container/80 border border-outline-variant text-xs font-semibold text-heading">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Assessment-Backed Verification
                      </span>
                      <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container/80 border border-outline-variant text-xs font-semibold text-heading">
                        <Zap className="w-4 h-4 text-amber-600" /> Requirement-Based Matching
                      </span>
                    </div>
                  </div>
                </AnimatedContent>

                {/* CONTAINER 2: Value Prop Image (Right) */}
                <AnimatedContent distance={40} direction="vertical" duration={0.8} delay={0.2} className="w-full">
                  <div className="relative group rounded-[2.25rem] overflow-hidden border-3 sm:border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 aspect-[16/9] w-full transition-all hover:shadow-2xl">
                    <img
                      src="/recruiter_value_prop.jpg"
                      alt="Indian tech hiring leads evaluating skill proficiency matrices"
                      className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute top-3.5 right-3.5 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 bg-black/55 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-medium border border-white/20 shadow-sm">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Objective Shortlisting</span>
                      </span>
                    </div>
                  </div>
                </AnimatedContent>
              </div>

              {/* ─── ROW 2: Freelance Gig Image (Left) + Hiring Formats Card (Right) ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
                {/* CONTAINER 3: Image Only (Left) */}
                <AnimatedContent distance={40} direction="vertical" duration={0.8} delay={0.25} className="w-full order-2 lg:order-1">
                  <div className="relative group rounded-[2.25rem] overflow-hidden border-3 sm:border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 aspect-[16/9] w-full transition-all hover:shadow-2xl">
                    <img
                      src="/recruiter_gig_work.jpg"
                      alt="Indian freelance engineer delivering project milestones"
                      className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute top-3.5 right-3.5 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 bg-black/55 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-medium border border-white/20 shadow-sm">
                        <Briefcase className="w-3 h-3 text-emerald-400" />
                        <span>Flexible Hiring Formats</span>
                      </span>
                    </div>
                  </div>
                </AnimatedContent>

                {/* CONTAINER 4: Hiring Formats Card (Right) */}
                <AnimatedContent distance={40} direction="vertical" duration={0.8} delay={0.3} className="w-full order-1 lg:order-2">
                  <div className="relative rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/5 dark:bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-3.5">
                      <Layers className="w-3.5 h-3.5" /> Flexible Formats
                    </div>

                    <h3 className="font-headline text-2xl sm:text-3xl font-medium text-heading mb-3.5 leading-snug">
                      Find Talent for <span className="text-[#003527] dark:text-emerald-400 font-bold">Every Hiring Need</span>.
                    </h3>

                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                      Whether you need urgent project deliverables, high-impact interns, or long-term engineering contributors, AlignGrade covers your recruitment spectrum with pre-verified talent.
                    </p>

                    {/* 3 Categories Pills */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container/60 border border-outline-variant">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-headline font-semibold text-heading">
                            Freelance Gigs &amp; Short-Term Tasks
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            Find talent for specific deliverables, temporary projects, and defined business needs with structured milestone reviews.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container/60 border border-outline-variant">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-headline font-semibold text-heading">
                            Internships
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            Discover candidates for internship opportunities with transparent stipend benchmarks and verified foundational competencies.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container/60 border border-outline-variant">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-headline font-semibold text-heading">
                            Full-Time &amp; Part-Time Roles
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            Find candidates whose skills align with long-term and flexible job requirements across engineering and product disciplines.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => navigateToRecruiterAuth('login')}
                        className="px-5 py-2.5 rounded-xl bg-[#003527] hover:bg-[#00281e] text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm group"
                      >
                        <span>Start Discovering Talent</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </AnimatedContent>
              </div>

              {/* ─── PLATFORM KEY MILESTONES COUNTER ─── */}
              <AnimatedContent distance={30} direction="vertical" duration={0.8} delay={0.35}>
                <div className="backdrop-blur-md bg-white/90 dark:bg-slate-900/90 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 sm:mt-16">
                  <div className="text-center p-3">
                    <div className="font-headline text-2xl sm:text-3xl font-bold text-[#003527] dark:text-emerald-400">
                      <CountUp to={140} from={0} duration={2} />+
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      Verified Skill Roadmaps
                    </div>
                  </div>
                  <div className="text-center p-3">
                    <div className="font-headline text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                      <CountUp to={4770} from={0} separator="," duration={2} />+
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      Active Question Bank
                    </div>
                  </div>
                  <div className="text-center p-3">
                    <div className="font-headline text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                      <CountUp to={70} from={0} duration={2} />%+
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      Verified Benchmark Gate
                    </div>
                  </div>
                  <div className="text-center p-3">
                    <div className="font-headline text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
                      <CountUp to={48} from={0} duration={2} /> Hours
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      Avg. Shortlisting Turnaround
                    </div>
                  </div>
                </div>
              </AnimatedContent>

            </div>
          </div>
        </section>

        {/* ─── 4. SECTION C: SKILL VERIFICATION ENGINE ─── */}
        <section id="verification" className="relative z-10 py-12 sm:py-16 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

              {/* LEFT COLUMN: 3 Workflow Stages */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                <AnimatedContent distance={25} direction="vertical" duration={0.7} delay={0.15}>
                  <div>
                    {/* Eyebrow */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#003527]/10 dark:bg-emerald-500/20 border border-[#003527]/20 text-[#003527] dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-3">
                      <Sparkles className="w-3.5 h-3.5" /> OBJECTIVE EVALUATION • ZERO KEYWORD GUESSWORK
                    </div>

                    {/* Main Heading */}
                    <h2 className="text-3xl sm:text-4xl lg:text-[38px] font-headline font-medium text-heading mb-3 leading-tight">
                      Know What Candidates <span className="text-[#003527] dark:text-emerald-400 font-bold">Can Actually Do.</span>
                    </h2>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                      Resume keywords don't write production software or solve architecture bottlenecks. AlignGrade's 10-question standardized assessments evaluate practical understanding across 140+ canonical skill tracks.
                    </p>

                    {/* Three Clear Stages */}
                    <div className="space-y-3">
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant/80 shadow-xs flex items-start gap-3.5 transition-all hover:border-emerald-500/40 group">
                        <div className="w-9 h-9 rounded-xl bg-[#003527]/10 text-[#003527] dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0 font-headline font-bold text-xs border border-[#003527]/20 group-hover:bg-[#003527] group-hover:text-white transition-colors">
                          01
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-headline text-sm sm:text-base font-semibold text-heading mb-0.5">
                            Define Role Skill Requirements
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Specify your technical stack, tools, and minimum score thresholds (e.g. 70% or 80% benchmark) required for consideration.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant/80 shadow-xs flex items-start gap-3.5 transition-all hover:border-blue-500/40 group">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 font-headline font-bold text-xs border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          02
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-headline text-sm sm:text-base font-semibold text-heading mb-0.5">
                            Candidates Complete Standardized Tests
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Candidates prove their practical ability through adaptive, anti-cheat randomized assessments from our 4,770+ active question bank.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant/80 shadow-xs flex items-start gap-3.5 transition-all hover:border-emerald-500/40 group">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-headline font-bold text-xs border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          03
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-headline text-sm sm:text-base font-semibold text-heading mb-0.5">
                            Match on Verified Thresholds
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Review candidates whose verified scorecards match or exceed your benchmark, with instant score breakdowns and zero keyword guesswork.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => navigateToRecruiterAuth('login')}
                        className="px-5 py-2.5 rounded-xl bg-[#003527] hover:bg-[#00281e] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm group"
                      >
                        <span>Define Your Skill Gates</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </AnimatedContent>
              </div>

              {/* RIGHT COLUMN: Two Complementary Visual Mockups */}
              <div className="lg:col-span-6 flex flex-col gap-4 sm:gap-5 justify-center">
                {/* Visual 1: Recruiter Talent Pipeline & Matching Workflow */}
                <AnimatedContent distance={30} direction="vertical" duration={0.7} delay={0.2}>
                  <div className="relative group rounded-[2rem] sm:rounded-[2.25rem] overflow-hidden border-3 sm:border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 transition-all hover:shadow-2xl">
                    <img
                      src="/recruiter_workflow_dashboard.jpg"
                      alt="Recruiter talent pipeline and skill verification analytics dashboard"
                      className="w-full h-auto object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute top-3.5 right-3.5 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[10px] font-medium border border-white/20 shadow-sm">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Interactive Recruiter Pipeline</span>
                      </span>
                    </div>
                  </div>
                </AnimatedContent>

                {/* Visual 2: Verified Skill & Alignment Scorecard */}
                <AnimatedContent distance={30} direction="vertical" duration={0.8} delay={0.28}>
                  <div className="relative group rounded-[2rem] sm:rounded-[2.25rem] overflow-hidden border-3 sm:border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 transition-all hover:shadow-2xl">
                    <img
                      src="/candidate_skill_verification.jpg"
                      alt="Candidate Verified Skill Proficiency and Alignment Scorecard"
                      className="w-full h-auto object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute top-3.5 right-3.5 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[10px] font-medium border border-white/20 shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>70%+ Verified Score Benchmark</span>
                      </span>
                    </div>
                  </div>
                </AnimatedContent>
              </div>

            </div>
          </div>
        </section>

        {/* ─── 5. SECTION D: THE RECRUITMENT WORKFLOW (4 STEPS) ─── */}
        <section id="how-it-works" className="relative z-10 py-12 sm:py-16 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-6xl mx-auto">
            {/* Header Plate */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md text-center max-w-3xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full shadow-2xs">
                The 4-Step Recruiter Journey
              </span>
              <h2 className="text-3xl sm:text-4xl font-headline font-medium text-heading mt-3 mb-3">
                From Job Requirements to the Right Hire
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                A streamlined, evidence-backed workflow designed to eliminate resume screening fatigue and connect you with qualified candidates in 48 hours.
              </p>
            </div>

            {/* 4 Step Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[
                {
                  step: '01',
                  title: 'Create a Job',
                  desc: 'Define position title, responsibilities, compensation parameters, and workplace type (remote, hybrid, or on-site).',
                  icon: FileText
                },
                {
                  step: '02',
                  title: 'Set Skill Requirements',
                  desc: 'Benchmark mandatory technical skills and the minimum proficiency percentage needed for applicant consideration.',
                  icon: Target
                },
                {
                  step: '03',
                  title: 'Discover & Review Talent',
                  desc: 'Browse candidate profiles with transparent assessment results, verified shields, and skill gap diagnostics.',
                  icon: Search
                },
                {
                  step: '04',
                  title: 'Manage Recruitment',
                  desc: 'Review applicants, coordinate rounds, communicate with candidates, and progress to offer letters seamlessly.',
                  icon: UserCheck
                }
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md hover:shadow-xl flex flex-col justify-between relative transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-headline text-3xl font-bold text-[#003527]/30 dark:text-emerald-500/30">
                        {item.step}
                      </span>
                      <div className="w-10 h-10 rounded-2xl bg-[#003527]/10 dark:bg-emerald-500/20 text-[#003527] dark:text-emerald-400 flex items-center justify-center">
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

        {/* ─── 6. SECTION E: RECRUITER BENEFITS (6 CONCRETE CARDS) ─── */}
        <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-7xl mx-auto">
            {/* Header Plate */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md text-center max-w-3xl mx-auto mb-10 sm:mb-12">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full shadow-2xs">
                <BarChart3 className="w-3.5 h-3.5" /> Measurable Recruitment Advantages
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[38px] font-headline font-medium text-heading mt-3 mb-3 leading-tight">
                Make Better Hiring Decisions with <span className="text-[#003527] dark:text-emerald-400 font-bold">Less Guesswork.</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Every AlignGrade capability is engineered to eliminate resume keyword inflation, generic candidate filtering, and unproductive interview cycles.
              </p>
            </div>

            {/* 6 Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  title: 'More Evidence Before Shortlisting',
                  desc: 'Review candidate skill ratings and available assessment results instead of relying exclusively on resume keywords or self-reported claims.',
                  icon: ShieldCheck,
                  badge: 'Objective Data'
                },
                {
                  title: 'Requirement-Based Candidate Matching',
                  desc: 'Define what a role actually requires and identify candidates whose available skills meet your configured proficiency thresholds.',
                  icon: Target,
                  badge: 'Precision Fit'
                },
                {
                  title: 'Clearer Skill Gaps',
                  desc: 'Identify where a candidate’s available skill ratings fall short of a role’s requirements, helping recruiters make more informed hiring decisions.',
                  icon: Zap,
                  badge: 'Gap Transparency'
                },
                {
                  title: 'Multiple Hiring Formats',
                  desc: 'Use the platform to recruit for freelance gigs, short-term tasks, internships, and full-time roles supported by the existing product.',
                  icon: Layers,
                  badge: 'Gigs to Full-Time'
                },
                {
                  title: 'Structured Candidate Review',
                  desc: 'Access candidate profiles, assessment information, applications, and other available hiring details through the existing recruiter workflow.',
                  icon: UserCheck,
                  badge: 'Pipeline Control'
                },
                {
                  title: 'A More Focused Talent Search',
                  desc: 'Use AlignGrade’s existing skill-matching capabilities to prioritize relevant profiles instead of treating every candidate as an equally suitable match.',
                  icon: Search,
                  badge: 'Focused Discovery'
                }
              ].map((benefit, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-[#003527]/10 dark:bg-emerald-500/20 text-[#003527] dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <benefit.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {benefit.badge}
                      </span>
                    </div>

                    <h3 className="font-headline text-base font-semibold text-heading mb-2 group-hover:text-[#003527] dark:group-hover:text-emerald-400 transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 7. SECTION F: WHY ALIGNGRADE? (BALANCED COMPARISON) ─── */}
        <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-5xl mx-auto">
            {/* Header Plate */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md text-center max-w-3xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full shadow-2xs">
                The Skill-First Advantage
              </span>
              <h2 className="text-3xl sm:text-4xl font-headline font-medium text-heading mt-3 mb-3">
                A More Evidence-Based Way to Hire
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Define the skills you need. Evaluate the evidence available. Discover candidates who align with your requirements.
              </p>
            </div>

            {/* Comparison Cards / Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resume-First Approach Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-4">
                  Traditional Method
                </div>
                <h3 className="font-headline text-lg sm:text-xl font-semibold text-heading mb-4">
                  Resume-First Approach
                </h3>

                <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 mt-0.5 font-bold">×</span>
                    <span>Screening starts primarily with resume keywords and unverified claims.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 mt-0.5 font-bold">×</span>
                    <span>Skills may be difficult to compare consistently across diverse educational backgrounds.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 mt-0.5 font-bold">×</span>
                    <span>Candidate discovery depends heavily on broad, noisy keyword search filters.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 mt-0.5 font-bold">×</span>
                    <span>Skill gaps remain hidden until late-stage technical interviews or post-hire probation.</span>
                  </li>
                </ul>
              </div>

              {/* AlignGrade Approach Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-[#003527]/30 dark:border-emerald-500/30 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#003527]/10 dark:bg-emerald-500/20 text-[#003527] dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> AlignGrade Method
                </div>
                <h3 className="font-headline text-lg sm:text-xl font-semibold text-heading mb-4">
                  Skill-First Approach
                </h3>

                <ul className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Recruiters examine available skill ratings and objective assessment results upfront.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Required proficiency levels provide a clearer, standardized basis for candidate comparison.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Skill-matching logic helps identify candidates whose proven abilities align with role requirements.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Available skill ratings can be compared directly with the role’s required proficiency levels.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 8. SECTION G: TRUST & PLATFORM DEMONSTRATION ─── */}
        <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-6xl mx-auto">
            {/* Header Plate */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md text-center max-w-3xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full shadow-2xs">
                Platform Integrity
              </span>
              <h2 className="text-3xl sm:text-4xl font-headline font-medium text-heading mt-3 mb-3">
                Hiring Decisions Backed by Evidence
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                AlignGrade relies on verifiable assessment engineering and standardized testing rubrics rather than unverified testimonials or generic guarantees.
              </p>
            </div>

            {/* 3 Platform Mechanics Demonstrations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold mb-3">
                    Anti-Cheat Architecture
                  </div>
                  <h3 className="font-headline text-base font-semibold text-heading mb-2">
                    Anti-Cheat Assessment Rigor
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Single-use test sessions, dynamic question randomization from our 4,770+ item bank, strict countdown timers, and server-side scoring ensure every score reflects genuine candidate capability.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-bold mb-3">
                    Rigorous Benchmark
                  </div>
                  <h3 className="font-headline text-base font-semibold text-heading mb-2">
                    Standardized 70%+ Verification Gates
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    A score of 70% or higher is mandatory to earn an official verified badge. Candidates who fall short receive diagnostic feedback to improve before retaking assessments.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-4">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-bold mb-3">
                    Taxonomy Coverage
                  </div>
                  <h3 className="font-headline text-base font-semibold text-heading mb-2">
                    140+ Canonical Skill Roadmaps
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Curated technical taxonomies across Full-Stack Web, AI &amp; LLM Systems, Cloud DevOps, Mobile Engineering, Data Analytics, and Professional Soft Skills.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 9. SECTION H: PRICING (RECRUITER 5-PACK) ─── */}
        <section id="pricing" className="relative z-10 py-12 sm:py-16 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-4xl mx-auto">
            {/* Header Plate */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full shadow-2xs">
                Transparent Recruiter Pricing
              </span>
              <h2 className="text-3xl sm:text-4xl font-headline font-medium text-heading mt-3 mb-3">
                Start Hiring with AlignGrade
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Simple, credit-based pricing designed for growing teams and enterprises. No recurring subscription lock-ins.
              </p>
            </div>

            {/* Plan Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border-2 sm:border-3 border-[#003527]/30 dark:border-emerald-500/30 shadow-xl max-w-2xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-[#003527]/10 dark:bg-emerald-500/20 text-[#003527] dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Recruiter 5-Pack
                  </span>
                  <h3 className="font-headline text-2xl font-bold text-heading">
                    5 Job Posting Credits
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    One-time payment • Lifetime credit validity
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="font-headline text-4xl font-bold text-[#003527] dark:text-emerald-400">
                    ₹2,500
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">One-Time Total</div>
                </div>
              </div>

              {/* Unlocked Features List */}
              <div className="py-6 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  What's Included in Your Recruiter Pack:
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Publish up to 5 job openings using your purchased posting credits</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Define required skills and minimum proficiency levels for each role</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Discover candidates whose verified skills align with your requirements</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Review candidate profiles, skill ratings, and assessment results</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Manage applicants and track recruitment progress</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Use skill-based matching to prioritize relevant candidates</span>
                  </li>
                </ul>
              </div>

              {/* Plan Action CTA */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => navigateToRecruiterAuth('login')}
                  className="w-full py-3.5 rounded-xl bg-[#003527] hover:bg-[#00281e] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                >
                  <span>Get Recruiter Pack &amp; Start Hiring</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-[11px] text-center text-slate-500 mt-2.5">
                  Secure checkout via Razorpay • Instant credit activation
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 10. SECTION I: RECRUITER FAQS ─── */}
        <section id="faq" className="relative z-10 py-12 sm:py-16 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-4xl mx-auto">
            {/* Header Plate */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md text-center max-w-2xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full shadow-2xs">
                Clarity for Employers
              </span>
              <h2 className="text-3xl sm:text-4xl font-headline font-medium text-heading mt-3 mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Everything you need to know about candidate verification, scoring, and hiring tools on AlignGrade.
              </p>
            </div>

            {/* FAQ Accordions */}
            <div className="space-y-3">
              {RECRUITER_FAQS.map((faq, index) => {
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
                          isOpen ? 'rotate-180 text-[#003527] dark:text-emerald-400' : ''
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

        {/* ─── 11. SECTION J: FINAL HIGH-CONVERSION CTA BANNER ─── */}
        <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 lg:p-10 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">

                {/* Left Column: Recruiter Value Proposition */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-5 text-left">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#003527]/10 dark:bg-emerald-500/20 text-[#003527] dark:text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Find the Right Talent</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-medium text-heading leading-[1.2] tracking-tight">
                      Find the Right Talent. <span className="text-[#003527] dark:text-emerald-400 font-bold">Hire with Confidence.</span>
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                      Discover candidates whose available skills align with your requirements and make more informed hiring decisions through skill-based recruitment.
                    </p>

                    {/* 3 Core Value Pillars */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-headline font-semibold text-heading">
                            Objective Proficiency Scorecards
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            Evaluate proven candidate scores across 140+ technical disciplines before scheduling interviews.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-headline font-semibold text-heading">
                            Requirement-Gated Shortlisting
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            Set minimum score thresholds to filter candidates automatically, cutting screening time from weeks to 48 hours.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-xl bg-[#003527]/10 text-[#003527] dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-headline font-semibold text-heading">
                            Comprehensive Hiring Formats
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            Recruit for freelance gigs, stipend internships, and full-time engineering roles in one unified platform.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Recruiter Login Card */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div className="h-full p-6 sm:p-8 rounded-3xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 text-left shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2 text-[#003527] dark:text-emerald-400">
                        <Building2 className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">EMPLOYER ACCESS</span>
                      </div>
                      <h3 className="text-lg font-headline font-semibold text-heading mb-2">
                        Ready to Build Your Team?
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        Sign in to create your company profile, publish job requirements, and review verified candidates.
                      </p>

                      <ul className="space-y-2 mb-6 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                        <li className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Publish 5 job openings with the Recruiter Pack</span>
                        </li>
                        <li className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Define mandatory skill thresholds per position</span>
                        </li>
                        <li className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Direct access to pre-screened talent</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => navigateToRecruiterAuth('login')}
                      className="w-full py-3 rounded-xl bg-[#003527] hover:bg-[#00281e] text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Recruiter Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ─── 12. RECRUITER FOOTER ─── */}
        <footer className="relative z-10 py-10 sm:py-14 px-4 sm:px-8 text-xs bg-transparent">
          <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 border-2 sm:border-3 border-white dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              {/* Column 1: Brand Info */}
              <div className="space-y-3">
                <a href="/" className="inline-block">
                  <img
                    alt="AlignGrade Logo"
                    className="h-12 w-auto object-contain"
                    src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
                  />
                </a>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
                  AlignGrade is India's premier skill verification network, connecting ambitious companies with verified talent through objective assessments.
                </p>
                <div className="pt-2 text-[11px] text-slate-500">
                  Headquarters: Bengaluru, Karnataka, India • Pan-India Placement Reach
                </div>
              </div>

              {/* Column 2: Verification Engine */}
              <div>
                <h4 className="font-bold text-heading mb-3">Verification Standards</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li className="hover:text-[#003527] dark:hover:text-emerald-400 transition-colors cursor-pointer">140+ Skill Roadmaps</li>
                  <li className="hover:text-[#003527] dark:hover:text-emerald-400 transition-colors cursor-pointer">Question Bank Integrity</li>
                  <li className="hover:text-[#003527] dark:hover:text-emerald-400 transition-colors cursor-pointer">Anti-Cheat Protocols</li>
                  <li className="hover:text-[#003527] dark:hover:text-emerald-400 transition-colors cursor-pointer">70%+ Verification Benchmark</li>
                  <li className="hover:text-[#003527] dark:hover:text-emerald-400 transition-colors cursor-pointer">Skill Proficiency Rubrics</li>
                </ul>
              </div>

              {/* Column 3: Company & Legal */}
              <div>
                <h4 className="font-bold text-heading mb-3">Company &amp; Legal</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li>
                    <a
                      href="/privacy"
                      onClick={(e) => {
                        e.preventDefault();
                        window.history.pushState({}, '', '/privacy');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="hover:text-[#003527] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms"
                      onClick={(e) => {
                        e.preventDefault();
                        window.history.pushState({}, '', '/terms');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="hover:text-[#003527] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:support@aligngrade.com"
                      className="hover:text-[#003527] dark:hover:text-emerald-400 transition-colors cursor-pointer"
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
                <span>Empowering Skill-First Hiring in India</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Systems Operational
                </span>
              </div>
            </div>
          </div>
        </footer>

      </ClickSpark>
    </div>
  );
}
