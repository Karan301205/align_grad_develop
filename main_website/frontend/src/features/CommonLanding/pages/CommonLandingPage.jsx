import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Zap,
  CheckCircle2,
  BookOpen,
  Target,
  Layers,
  BarChart3,
  Check,
  ChevronRight,
  Menu,
  X,
  TrendingUp
} from 'lucide-react';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import ClickSpark from '../../../components/ui/ClickSpark';
import AnimatedContent from '../../../components/ui/AnimatedContent';
import FoldText from '../../../effects/FoldText';
import {
  CANDIDATE_LANDING_PATH,
  RECRUITER_LANDING_PATH,
  CANDIDATE_URL,
  RECRUITER_URL
} from '../../../config';

export default function CommonLandingPage({ theme, toggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth route navigation to existing candidate or recruiter landing pages
  const navigateToCandidateLanding = () => {
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (!isLocal && CANDIDATE_URL) {
      window.location.href = `${CANDIDATE_URL}${CANDIDATE_LANDING_PATH}`;
    } else {
      window.history.pushState({}, '', CANDIDATE_LANDING_PATH);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const navigateToRecruiterLanding = () => {
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (!isLocal && RECRUITER_URL) {
      window.location.href = `${RECRUITER_URL}${RECRUITER_LANDING_PATH}`;
    } else {
      window.history.pushState({}, '', RECRUITER_LANDING_PATH);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const scrollToAnchor = (e, id) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const elem = document.getElementById(id);
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
        {/* ─── 1. COMPACT UNIFIED NAVIGATION BAR ─── */}
        <header className="relative z-30 flex justify-between items-center w-full px-4 sm:px-8 h-16 sticky top-0 bg-[#F9F8F6]/90 dark:bg-slate-950/90 border-b border-outline-variant/70 shadow-xs backdrop-blur-md transition-colors">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <img
                alt="AlignGrade Logo"
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-102"
                src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
              />
            </a>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium">
            <a
              href="#how-it-works"
              onClick={(e) => scrollToAnchor(e, 'how-it-works')}
              className="text-slate-600 dark:text-slate-300 hover:text-[#003527] dark:hover:text-emerald-400 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#ecosystem"
              onClick={(e) => scrollToAnchor(e, 'ecosystem')}
              className="text-slate-600 dark:text-slate-300 hover:text-[#003527] dark:hover:text-emerald-400 transition-colors"
            >
              The Ecosystem
            </a>
            <a
              href="#audience-paths"
              onClick={(e) => scrollToAnchor(e, 'audience-paths')}
              className="text-slate-600 dark:text-slate-300 hover:text-[#003527] dark:hover:text-emerald-400 transition-colors"
            >
              For Candidates
            </a>
            <a
              href="#audience-paths"
              onClick={(e) => scrollToAnchor(e, 'audience-paths')}
              className="text-slate-600 dark:text-slate-300 hover:text-[#003527] dark:hover:text-emerald-400 transition-colors"
            >
              For Recruiters
            </a>
            <a
              href="#skill-matching"
              onClick={(e) => scrollToAnchor(e, 'skill-matching')}
              className="text-slate-600 dark:text-slate-300 hover:text-[#003527] dark:hover:text-emerald-400 transition-colors"
            >
              Skill Verification
            </a>
            <a
              href="#opportunities"
              onClick={(e) => scrollToAnchor(e, 'opportunities')}
              className="text-slate-600 dark:text-slate-300 hover:text-[#003527] dark:hover:text-emerald-400 transition-colors"
            >
              Explore Tracks
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

            {/* Candidate Portal Action */}
            <button
              onClick={navigateToCandidateLanding}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Candidate Portal</span>
            </button>

            {/* Recruiter Hub Action */}
            <button
              onClick={navigateToRecruiterLanding}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#003527] hover:bg-[#00281e] text-white shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Recruiter Hub</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden sticky top-16 z-20 w-full bg-[#F9F8F6] dark:bg-slate-950 border-b border-outline-variant p-4 space-y-3 shadow-lg backdrop-blur-md">
            <div className="flex flex-col space-y-3 text-sm font-medium">
              <a
                href="#how-it-works"
                onClick={(e) => scrollToAnchor(e, 'how-it-works')}
                className="py-1 text-slate-700 dark:text-slate-300"
              >
                How It Works
              </a>
              <a
                href="#ecosystem"
                onClick={(e) => scrollToAnchor(e, 'ecosystem')}
                className="py-1 text-slate-700 dark:text-slate-300"
              >
                The Ecosystem
              </a>
              <a
                href="#audience-paths"
                onClick={(e) => scrollToAnchor(e, 'audience-paths')}
                className="py-1 text-slate-700 dark:text-slate-300"
              >
                Audience Paths
              </a>
              <a
                href="#skill-matching"
                onClick={(e) => scrollToAnchor(e, 'skill-matching')}
                className="py-1 text-slate-700 dark:text-slate-300"
              >
                Skill Verification &amp; Matching
              </a>
              <a
                href="#opportunities"
                onClick={(e) => scrollToAnchor(e, 'opportunities')}
                className="py-1 text-slate-700 dark:text-slate-300"
              >
                Explore Opportunities
              </a>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
              <button
                onClick={navigateToCandidateLanding}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-center flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Explore Candidate Portal</span>
              </button>
              <button
                onClick={navigateToRecruiterLanding}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#003527] text-white text-center flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4 text-emerald-300" />
                <span>Explore Recruiter Hub</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── 2. HERO SECTION — INTRODUCE THE COMPLETE PLATFORM ─── */}
        <section className="relative z-10 pt-6 sm:pt-9 pb-8 sm:pb-10 px-4 sm:px-8 border-b border-outline-variant/60 overflow-hidden">
          {/* Subtle warm ambient backdrop accents */}
          <div className="ambient-glow -top-32 -left-32 opacity-35"></div>
          <div
            className="ambient-glow top-1/4 -right-32 opacity-25"
            style={{
              background: 'radial-gradient(circle, rgba(0, 53, 39, 0.18) 0%, rgba(255, 255, 255, 0) 70%)'
            }}
          ></div>

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* LEFT COLUMN: HERO HEADLINE & DUAL AUDIENCE CTAs */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <AnimatedContent distance={25} direction="vertical" duration={0.6}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-emerald-200/80 dark:border-emerald-900/60 shadow-2xs mb-3.5 sm:mb-4 w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      The Skill-Based Opportunity Platform
                    </span>
                  </div>
                </AnimatedContent>

                <AnimatedContent distance={35} direction="vertical" duration={0.7} delay={0.1}>
                  {/* HERO HEADLINE WITH 1.2X HIGHLIGHTED WORDS & FOLDTEXT */}
                  <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-bold tracking-tight text-heading leading-[1.2] mb-2.5 sm:mb-3">
                    <FoldText
                      text="Prove Your Skills. Find Your Fit."
                      foldStyle="paper"
                      splitBy="char"
                      hinge="top"
                      trigger="mount"
                      foldAngle={92}
                      duration={0.65}
                      stagger={0.035}
                      staggerFrom="start"
                      ease="power3.out"
                      hoverRefold={true}
                      refoldRadius={140}
                      refoldAngle={45}
                      perspective={700}
                      creaseShading={0.55}
                      fontSize="inherit"
                      fontWeight="inherit"
                      highlightWords={{
                        'Skills.':
                          'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold',
                        'Fit.':
                          'fold-highlight text-primary dark:text-blue-400 font-extrabold'
                      }}
                    />
                  </h1>

                  <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 sm:mb-5 max-w-xl">
                    AlignGrade connects people who want to grow with organizations looking for the right talent.
                    Build your skills, demonstrate your abilities, discover relevant opportunities, and connect
                    through skill-based matching.
                  </p>
                </AnimatedContent>

                {/* DUAL AUDIENCE SELECTION BUTTONS */}
                <AnimatedContent distance={35} direction="vertical" duration={0.7} delay={0.2}>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 mb-5 sm:mb-6">
                    {/* Primary Button 1: Candidate Entry */}
                    <button
                      onClick={navigateToCandidateLanding}
                      className="px-6 py-3 rounded-xl bg-[#003527] hover:bg-[#00281e] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <User className="w-4 h-4 text-emerald-300" />
                      <span>Explore as a Candidate</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Primary Button 2: Recruiter Entry */}
                    <button
                      onClick={navigateToRecruiterLanding}
                      className="px-6 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-300/85 dark:border-slate-700 font-semibold text-xs sm:text-sm text-heading hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Building2 className="w-4 h-4 text-[#003527] dark:text-emerald-400" />
                      <span>Explore as a Recruiter</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Trust Micro-Metrics Line */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium pt-3.5 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>140+ Standardized Skill Roadmaps</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>Anti-Cheat Assessment Bank</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>Objective Threshold Matching</span>
                    </span>
                  </div>
                </AnimatedContent>
              </div>

              {/* RIGHT COLUMN: WELCOMING ASYMMETRIC PHOTOGRAPHY WITH FLOATING BADGES */}
              <div className="lg:col-span-5 flex items-center justify-center">
                <AnimatedContent distance={40} direction="vertical" duration={0.8} delay={0.25} className="w-full">
                  <div className="relative w-full max-w-[440px] sm:max-w-[460px] mx-auto">
                    {/* Stylized background card framing */}
                    <div className="relative rounded-[1.75rem] overflow-hidden border-3 sm:border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 aspect-[16/10] sm:aspect-[16/11]">
                      <img
                        src="/common_hero_collaboration.jpg"
                        alt="Indian young professionals collaborating over a laptop in a modern Bengaluru tech workspace"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none"></div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-medium">
                        <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Bridging Talent &amp; Roles</span>
                        </span>
                        <span className="bg-[#003527]/90 text-emerald-200 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                          Verified Ability
                        </span>
                      </div>
                    </div>

                    {/* Overlapping Floating Pill Card */}
                    <div className="absolute -bottom-3 -left-2 sm:-left-3 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl px-3.5 py-2 shadow-md border border-slate-200/90 dark:border-slate-700 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-heading">Skills Meet Opportunity</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Zero Resume Fluff • Direct Evidence
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedContent>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. SECTION TWO — THE ALIGNGRADE ECOSYSTEM (HORIZONTAL PROGRESSION) ─── */}
        <section
          id="ecosystem"
          className="relative z-10 py-8 sm:py-12 px-4 sm:px-8 border-b border-outline-variant/60 bg-transparent"
        >
          <div className="max-w-6xl mx-auto">
            {/* Header Plate with Controlled Font Size & 1.2x Highlight */}
            <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full shadow-2xs mb-2">
                <Layers className="w-3.5 h-3.5" /> Connected Ecosystem
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[38px] font-headline font-bold text-heading mb-2.5 leading-snug">
                <FoldText
                  text="More Than a Job Portal. A Connected Path to Opportunity."
                  foldStyle="paper"
                  splitBy="char"
                  hinge="top"
                  trigger="scroll"
                  foldAngle={90}
                  duration={0.6}
                  stagger={0.025}
                  staggerFrom="start"
                  hoverRefold={true}
                  refoldRadius={120}
                  fontSize="inherit"
                  fontWeight="inherit"
                  highlightWords={{
                    'Connected': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold',
                    'Path': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold',
                    'Opportunity.': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold'
                  }}
                />
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
                AlignGrade brings learning, skill verification, and opportunity matching together to help candidates
                showcase their abilities and help recruiters discover relevant talent.
              </p>
            </div>

            {/* 3 Connected Pillars: Horizontal Progression */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 relative">
              {/* Pillar 1: Build Skills */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200/50">
                    Step 1 • Learn
                  </span>
                  <h3 className="font-headline text-lg sm:text-xl font-bold text-heading mt-2.5 mb-1.5">Build Skills</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Explore curated learning resources and develop practical capabilities through available courses
                    across high-demand domains.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Structured Video Tracks</span>
                  <ChevronRight className="w-4 h-4 text-primary" />
                </div>
              </div>

              {/* Pillar 2: Verify Skills */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                    Step 2 • Certify
                  </span>
                  <h3 className="font-headline text-lg sm:text-xl font-bold text-heading mt-2.5 mb-1.5">Verify Skills</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Demonstrate your knowledge through anti-cheat 10-question assessments and build a profile that
                    reflects your verifiable proficiency.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>70%+ Verified Badge</span>
                  <ChevronRight className="w-4 h-4 text-emerald-600" />
                </div>
              </div>

              {/* Pillar 3: Find the Right Match */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#003527]/10 dark:bg-emerald-500/20 text-[#003527] dark:text-emerald-400 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-[#003527]/20">
                    Step 3 • Connect
                  </span>
                  <h3 className="font-headline text-lg sm:text-xl font-bold text-heading mt-2.5 mb-1.5">Find the Right Match</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Discover relevant opportunities as a candidate or identify suitable talent as a recruiter based
                    on exact skill threshold alignment.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Threshold-Gated Matching</span>
                  <ChevronRight className="w-4 h-4 text-[#003527] dark:text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. SECTION THREE — TWO PATHS, ONE PLATFORM (AUDIENCE EDITORIAL PANELS) ─── */}
        <section
          id="audience-paths"
          className="relative z-10 py-8 sm:py-12 px-4 sm:px-8 border-b border-outline-variant/60 bg-transparent"
        >
          <div className="max-w-7xl mx-auto">
            {/* Header Plate with Controlled Font Size & 1.2x Highlight */}
            <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full shadow-2xs mb-2">
                Tailored Journeys
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[38px] font-headline font-bold text-heading mb-2.5 leading-snug">
                <FoldText
                  text="Two Paths. One Unified Platform."
                  foldStyle="paper"
                  splitBy="char"
                  hinge="top"
                  trigger="scroll"
                  foldAngle={90}
                  duration={0.6}
                  stagger={0.03}
                  staggerFrom="start"
                  hoverRefold={true}
                  fontSize="inherit"
                  fontWeight="inherit"
                  highlightWords={{
                    'Unified': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold',
                    'Platform.': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold'
                  }}
                />
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
                Explore the dedicated workspace designed for your specific objectives — whether taking your career
                further or hiring for verified ability.
              </p>
            </div>

            {/* Editorial Audience Panels (Split Cards with Real Photography) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
              {/* PANEL A: FOR CANDIDATES */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-[16/9] mb-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <img
                      src="/common_candidate_growth.jpg"
                      alt="Indian young woman developer coding and reviewing architecture"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#003527] dark:text-emerald-400" />
                      <span>For Candidates &amp; Students</span>
                    </div>
                  </div>

                  <h3 className="font-headline text-lg sm:text-xl font-bold text-heading mb-1.5 leading-snug">
                    <FoldText
                      text="Your Skills Can Take You Further."
                      splitBy="word"
                      hinge="top"
                      trigger="scroll"
                      foldAngle={85}
                      duration={0.5}
                      stagger={0.04}
                      hoverRefold={true}
                      fontSize="inherit"
                      fontWeight="inherit"
                      highlightWords={{
                        'Skills': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold',
                        'Further.': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold'
                      }}
                    />
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3.5">
                    Showcase your abilities, verify your skills, and discover opportunities that align with your
                    expertise and career goals.
                  </p>

                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-5 sm:mb-6">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Explore freelance gigs and paid tasks with verified milestone escrows.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Discover internships with guaranteed stipends and job opportunities.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Complete available 10-question assessments across 140+ skill tracks.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Showcase verified badges and transparent scorecards on your public profile.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Explore learning resources and modular video courses.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Receive relevant job recommendations based on proven skill alignment.</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={navigateToCandidateLanding}
                  className="w-full py-3 rounded-xl bg-[#003527] hover:bg-[#00281e] text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
                >
                  <span>Explore Candidate Opportunities</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* PANEL B: FOR RECRUITERS */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-[16/9] mb-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <img
                      src="/common_recruiter_decision.jpg"
                      alt="Indian hiring manager and HR lead evaluating talent scorecards in conference room"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>For Recruiters &amp; Employers</span>
                    </div>
                  </div>

                  <h3 className="font-headline text-lg sm:text-xl font-bold text-heading mb-1.5 leading-snug">
                    <FoldText
                      text="Find Talent That Fits Your Requirements."
                      splitBy="word"
                      hinge="top"
                      trigger="scroll"
                      foldAngle={85}
                      duration={0.5}
                      stagger={0.04}
                      hoverRefold={true}
                      fontSize="inherit"
                      fontWeight="inherit"
                      highlightWords={{
                        'Talent': 'fold-highlight text-blue-600 dark:text-blue-400 font-extrabold',
                        'Requirements.': 'fold-highlight text-blue-600 dark:text-blue-400 font-extrabold'
                      }}
                    />
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3.5">
                    Define the skills your roles require, review available assessment evidence, and discover candidates
                    whose proficiency aligns with your hiring needs.
                  </p>

                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-5 sm:mb-6">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Define required skills and minimum proficiency levels per position.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Discover candidates based on objective skill alignment rather than keyword claims.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Review available candidate assessments, scorecards, and verification status.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Recruit for freelance gigs, internships, and supported full-time job types.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Review candidate profiles and manage applicants through available recruiter tools.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Cut screening turnaround to 48 hours with zero resume keyword guesswork.</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={navigateToRecruiterLanding}
                  className="w-full py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-heading text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
                >
                  <Building2 className="w-4 h-4 text-[#003527] dark:text-emerald-400" />
                  <span>Explore Recruiter Solutions</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 5. SECTION FOUR — HOW ALIGNGRADE CONNECTS BOTH SIDES (INTERACTIVE MATCHING FLOW) ─── */}
        <section
          id="skill-matching"
          className="relative z-10 py-8 sm:py-12 px-4 sm:px-8 border-b border-outline-variant/60 bg-transparent"
        >
          <div className="max-w-6xl mx-auto">
            {/* Header Plate with Controlled Font Size & 1.2x Highlight */}
            <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full shadow-2xs mb-2">
                <Target className="w-3.5 h-3.5" /> The Alignment Engine
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[38px] font-headline font-bold text-heading mb-2.5 leading-snug">
                <FoldText
                  text="Skills Meet Requirements. Opportunities Take Shape."
                  foldStyle="paper"
                  splitBy="char"
                  hinge="top"
                  trigger="scroll"
                  foldAngle={90}
                  duration={0.6}
                  stagger={0.025}
                  staggerFrom="start"
                  hoverRefold={true}
                  fontSize="inherit"
                  fontWeight="inherit"
                  highlightWords={{
                    'Opportunities': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold',
                    'Shape.': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold'
                  }}
                />
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
                AlignGrade bridges the gap between candidate capability and employer needs through mathematical
                threshold matching.
              </p>
            </div>

            {/* Custom Interactive Matching Flow Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 sm:gap-5 items-center">
                {/* Candidate Flow Left (4 cols) */}
                <div className="lg:col-span-4 space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#003527] dark:text-emerald-400" />
                    <span>Candidate Journey</span>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-low border border-outline-variant">
                    <div className="text-xs sm:text-sm font-bold text-heading">1. Candidate Skills</div>
                    <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Self-declared stack &amp; capabilities</div>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-low border border-outline-variant">
                    <div className="text-xs sm:text-sm font-bold text-heading">2. Standardized Assessment</div>
                    <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">10-question anti-cheat evaluation</div>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>3. Verified Status (70%+)</span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                      Earns Verified Shield &amp; Scorecard
                    </div>
                  </div>
                </div>

                {/* Center Connector: The Engine (3 cols) */}
                <div className="lg:col-span-3 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-[#003527]/5 dark:bg-emerald-500/10 border border-[#003527]/20">
                  <div className="w-11 h-11 rounded-xl bg-[#003527] text-white flex items-center justify-center mb-2.5 shadow-2xs">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                  </div>
                  <h4 className="font-headline text-sm sm:text-base font-bold text-heading">AlignGrade Engine</h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Compares candidate verified scores directly against role proficiency requirements.
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] sm:text-[11px] font-bold">
                    <span>Relevant Match</span>
                  </div>
                </div>

                {/* Recruiter Flow Right (4 cols) */}
                <div className="lg:col-span-4 space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Recruiter Journey</span>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-low border border-outline-variant">
                    <div className="text-xs sm:text-sm font-bold text-heading">1. Role Requirements</div>
                    <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Define position scope &amp; stack</div>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-low border border-outline-variant">
                    <div className="text-xs sm:text-sm font-bold text-heading">2. Required Proficiency</div>
                    <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Benchmark minimum score gates</div>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                    <div className="text-xs sm:text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      <span>3. Candidate Discovery</span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-blue-700/80 dark:text-blue-400 mt-0.5">
                      Shortlist matching talent in 48h
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. SECTION FIVE — WHY ALIGNGRADE? (CONCISE BENEFIT-LED SPLIT) ─── */}
        <section
          id="how-it-works"
          className="relative z-10 py-8 sm:py-12 px-4 sm:px-8 border-b border-outline-variant/60 bg-transparent"
        >
          <div className="max-w-6xl mx-auto">
            {/* Header Plate with Controlled Font Size & 1.2x Highlight */}
            <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full shadow-2xs mb-2">
                <BarChart3 className="w-3.5 h-3.5" /> Skill Visibility
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[38px] font-headline font-bold text-heading mb-2.5 leading-snug">
                <FoldText
                  text="Better Connections Start with Better Skill Visibility."
                  foldStyle="paper"
                  splitBy="char"
                  hinge="top"
                  trigger="scroll"
                  foldAngle={90}
                  duration={0.6}
                  stagger={0.025}
                  staggerFrom="start"
                  hoverRefold={true}
                  fontSize="inherit"
                  fontWeight="inherit"
                  highlightWords={{
                    'Better': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold',
                    'Skill': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold',
                    'Visibility.': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold'
                  }}
                />
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
                Traditional recruiting relies on keywords, unverified resumes, and endless screening loops. AlignGrade
                introduces evidence-based transparency to both sides.
              </p>
            </div>

            {/* Split Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* For Candidates */}
              <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-3">
                  For Candidates
                </div>
                <h3 className="font-headline text-lg sm:text-xl font-bold text-heading mb-3">
                  Show More Than Words on a Page
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Show more than resume keywords:</strong> Let your actual technical execution speak for
                      itself.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Demonstrate skills through assessments:</strong> Prove practical proficiency under
                      standardized test conditions.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Discover aligned opportunities:</strong> Unlock gigs, internships, and roles where your
                      abilities match requirements.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Identify learning gaps:</strong> Receive diagnostic feedback to sharpen areas needing
                      improvement.
                    </span>
                  </li>
                </ul>
              </div>

              {/* For Recruiters */}
              <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-3">
                  For Recruiters
                </div>
                <h3 className="font-headline text-lg sm:text-xl font-bold text-heading mb-3">
                  Make Evidence-Based Hiring Decisions
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Define what a role requires:</strong> Set mandatory score thresholds instead of broad
                      generic filters.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Examine available assessment evidence:</strong> Review actual scorecard data before
                      scheduling interviews.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Compare candidate capabilities objectively:</strong> Consistent evaluation rubrics
                      eliminate subjective bias.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Focus discovery on pre-screened talent:</strong> Cut time-to-shortlist to 48 hours with
                      zero keyword guesswork.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 7. SECTION SIX — EXPLORE THE OPPORTUNITIES (COMPACT STRIP) ─── */}
        <section
          id="opportunities"
          className="relative z-10 py-8 sm:py-12 px-4 sm:px-8 border-b border-outline-variant/60 bg-transparent"
        >
          <div className="max-w-6xl mx-auto">
            {/* Header Plate with Controlled Font Size & 1.2x Highlight */}
            <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full shadow-2xs mb-2">
                Multiple Formats
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[38px] font-headline font-bold text-heading mb-2.5 leading-snug">
                <FoldText
                  text="One Platform. Multiple Ways to Move Forward."
                  foldStyle="paper"
                  splitBy="char"
                  hinge="top"
                  trigger="scroll"
                  foldAngle={90}
                  duration={0.6}
                  stagger={0.025}
                  staggerFrom="start"
                  hoverRefold={true}
                  fontSize="inherit"
                  fontWeight="inherit"
                  highlightWords={{
                    'Multiple': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold',
                    'Ways': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold',
                    'Forward.': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold'
                  }}
                />
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
                AlignGrade supports diverse career milestones and recruitment needs in one unified ecosystem.
              </p>
            </div>

            {/* 4 Compact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Card 1: Gigs */}
              <div
                onClick={navigateToCandidateLanding}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h4 className="font-headline text-base sm:text-lg font-bold text-heading mb-1.5">Freelance Gigs &amp; Tasks</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Discover project-based deliverables and defined business tasks with verified milestone escrows.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <span>Explore Gigs</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Card 2: Internships */}
              <div
                onClick={navigateToCandidateLanding}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h4 className="font-headline text-base sm:text-lg font-bold text-heading mb-1.5">Internships</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Explore competitive internship opportunities with guaranteed stipends and skill verification.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-primary flex items-center gap-1">
                  <span>Explore Internships</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Card 3: Jobs */}
              <div
                onClick={navigateToCandidateLanding}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-headline text-base sm:text-lg font-bold text-heading mb-1.5">Full &amp; Part-Time Jobs</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Discover long-term engineering and domain roles matched to your verified proficiency.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-indigo-600 flex items-center gap-1">
                  <span>Explore Jobs</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Card 4: Learning */}
              <div
                onClick={navigateToCandidateLanding}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-amber-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h4 className="font-headline text-base sm:text-lg font-bold text-heading mb-1.5">Courses &amp; Learning</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Learn Full Stack, AI Agents, Data Analytics, and Professional Soft Skills with video lectures.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-amber-600 flex items-center gap-1">
                  <span>Explore Courses</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 8. FINAL SECTION — CHOOSE YOUR PATH ─── */}
        <section className="relative z-10 py-8 sm:py-12 px-4 sm:px-8 border-b border-outline-variant/60 bg-transparent">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm">
              {/* Header Plate with Controlled Font Size & 1.2x Highlight */}
              <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-7">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#003527] dark:text-emerald-400 bg-[#003527]/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full shadow-2xs mb-2">
                  Start Your Journey
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[38px] font-headline font-bold text-heading mb-2 leading-snug">
                  <FoldText
                    text="Your Next Opportunity Starts with the Right Connection."
                    foldStyle="paper"
                    splitBy="char"
                    hinge="top"
                    trigger="scroll"
                    foldAngle={90}
                    duration={0.6}
                    stagger={0.025}
                    staggerFrom="start"
                    hoverRefold={true}
                    fontSize="inherit"
                    fontWeight="inherit"
                    highlightWords={{
                      'Right': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold',
                      'Connection.': 'fold-highlight text-[#003527] dark:text-emerald-400 font-extrabold'
                    }}
                  />
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Whether you're building your career or building your team, AlignGrade helps bring skills and
                  opportunities closer together.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Candidate Action Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#003527]/10 dark:bg-emerald-500/20 text-[#003527] dark:text-emerald-400 flex items-center justify-center mb-3">
                      <User className="w-5 h-5" />
                    </div>
                    <h3 className="font-headline text-lg sm:text-xl font-bold text-heading mb-1.5">I'm a Candidate</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      Explore opportunities, demonstrate your skills, and take the next step in your career.
                    </p>
                  </div>
                  <button
                    onClick={navigateToCandidateLanding}
                    className="w-full py-3 rounded-xl bg-[#003527] hover:bg-[#00281e] text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
                  >
                    <span>Continue as Candidate</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Recruiter Action Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center mb-3">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-headline text-lg sm:text-xl font-bold text-heading mb-1.5">I'm a Recruiter</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      Define your hiring needs, discover relevant talent, and make more informed hiring decisions.
                    </p>
                  </div>
                  <button
                    onClick={navigateToRecruiterLanding}
                    className="w-full py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-heading text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
                  >
                    <Building2 className="w-4 h-4 text-[#003527] dark:text-emerald-400" />
                    <span>Continue as Recruiter</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 9. COMPACT FOOTER ─── */}
        <footer className="relative z-10 py-6 sm:py-8 px-4 sm:px-8 text-xs bg-transparent">
          <div className="max-w-6xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {/* Brand Col */}
              <div className="md:col-span-2 space-y-2.5">
                <a href="/" className="inline-block">
                  <img
                    alt="AlignGrade Logo"
                    className="h-9 w-auto object-contain"
                    src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
                  />
                </a>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm text-xs">
                  AlignGrade connects skills with opportunities across India, bringing learning, objective
                  assessments, and talent discovery together into one unified network.
                </p>
                <div className="pt-0.5 text-[11px] text-slate-500">
                  Headquarters: Bengaluru, Karnataka, India • Pan-India Placement Reach
                </div>
              </div>

              {/* Pathways Col */}
              <div>
                <h4 className="font-bold text-heading mb-2.5 text-xs sm:text-sm">Audience Portals</h4>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 text-xs">
                  <li>
                    <button
                      onClick={navigateToCandidateLanding}
                      className="hover:text-[#003527] dark:hover:text-emerald-400 transition-colors cursor-pointer text-left"
                    >
                      Candidate Landing Page
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={navigateToRecruiterLanding}
                      className="hover:text-[#003527] dark:hover:text-emerald-400 transition-colors cursor-pointer text-left"
                    >
                      Recruiter Landing Page
                    </button>
                  </li>
                  <li>
                    <a
                      href="#ecosystem"
                      onClick={(e) => scrollToAnchor(e, 'ecosystem')}
                      className="hover:text-[#003527] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      The Ecosystem
                    </a>
                  </li>
                  <li>
                    <a
                      href="#skill-matching"
                      onClick={(e) => scrollToAnchor(e, 'skill-matching')}
                      className="hover:text-[#003527] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      Skill Verification
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal Col */}
              <div>
                <h4 className="font-bold text-heading mb-2.5 text-xs sm:text-sm">Legal &amp; Support</h4>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 text-xs">
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

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-slate-500 text-[11px]">
              <p>© 2026 AlignGrade Recruitment &amp; Skill Systems. All rights reserved.</p>
              <div className="flex gap-4">
                <span>Connecting Skills with Opportunities</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> Operational
                </span>
              </div>
            </div>
          </div>
        </footer>
      </ClickSpark>
    </div>
  );
}
