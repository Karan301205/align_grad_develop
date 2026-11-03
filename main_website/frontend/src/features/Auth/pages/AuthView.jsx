import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Mail,
  User,
  UserPlus,
  LogIn,
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
  Video,
  MessagesSquare,
  UserCheck
} from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import ClickSpark from '../../../components/ui/ClickSpark';
import AnimatedContent from '../../../components/ui/AnimatedContent';
import GoogleAuthButton from '../../../components/ui/GoogleAuthButton';
import CountUp from '../../../effects/CountUp';
import TrueFocus from '../../../effects/TrueFocus';
import { motion, AnimatePresence } from 'motion/react';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import VerificationPinModal from '../components/VerificationPinModal';
import { formatErrorMessage } from '../../../utils/errorFormatter';
import { CANDIDATE_URL } from '../../../config';

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
    id: 'communication-soft-skills',
    title: 'Communication & Soft Skills',
    level: 'Comprehensive',
    modules: '6 Modules • 36 Lessons',
    description: 'Master professional workplace communication, executive storytelling, active listening, business writing, and cross-functional team collaboration.',
    skills: ['Active Listening', 'Public Speaking', 'Executive Presence', 'Business Writing', 'Team Collaboration'],
    icon: MessagesSquare,
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
    id: 'interview-readiness',
    title: 'Interview Readiness',
    level: 'All Levels',
    modules: '5 Modules • 30 Lessons',
    description: 'Gain interview confidence with sessions on resume building, communication skills, mock interviews, and behavioral preparation.',
    skills: ['Communication', 'Resume Building', 'Interview Preparation', 'Soft Skills', 'Behavioral Skills'],
    icon: UserCheck,
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

export default function AuthView({
  setToken,
  setUser,
  theme,
  toggleTheme,
  initialAuthMode = 'signup'
}) {
  // Navigation & Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(initialAuthMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');

  useEffect(() => {
    setIsLogin(initialAuthMode === 'login');
  }, [initialAuthMode]);

  // FAQ Tab & Accordion State
  const [faqTab, setFaqTab] = useState('candidates');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Auth Handling
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (/\s/.test(password)) {
      setError('Password cannot contain spaces.');
      return;
    }

    setError('');
    setLoading(true);

    const path = isLogin ? '/auth/login' : '/auth/signup';
    const cleanEmail = email.toLowerCase().trim();
    const payload = isLogin
      ? { email: cleanEmail, password, role: 'STUDENT' }
      : { email: cleanEmail, password, role: 'STUDENT', name: name.trim() };

    try {
      const res = await apiFetch(path, {
        method: 'POST',
        json: payload
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsVerification) {
          setPendingVerificationEmail(cleanEmail);
          setIsVerificationOpen(true);
          return;
        }
        // Auto-switch to Sign In if account already exists on Sign Up attempt
        if (!isLogin && res.status === 409) {
          setIsLogin(true);
          setError('An account with this email already exists. Switched to Sign In — please enter your password.');
          return;
        }
        throw new Error(data.error || 'Authentication failed');
      }

      if (!isLogin && data.needsVerification) {
        setPendingVerificationEmail(cleanEmail);
        setIsVerificationOpen(true);
        return;
      }

      if (data.user && data.user.role !== 'STUDENT') {
        throw new Error('Access denied. This account is registered as a recruiter. Please sign in through the Recruiter portal.');
      }
      if (setToken) setToken(data.token);
      if (setUser) setUser(data.user);
      window.history.pushState({}, '', '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = (data) => {
    setIsVerificationOpen(false);
    if (data.user && data.user.role !== 'STUDENT') {
      setError('Access denied. This account is registered as a recruiter.');
      return;
    }
    if (setToken) setToken(data.token);
    if (setUser) setUser(data.user);
    window.history.pushState({}, '', '/');
  };

  const handleSubmit = handleAuthSubmit;

  const triggerAuthFlow = (mode = 'login', defaultRole = 'STUDENT') => {
    setIsLogin(mode === 'login');
    setRole(defaultRole);
    setError('');
    const formElem = document.getElementById('candidate-auth-card');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const targetInput = formElem.querySelector('input');
      if (targetInput) setTimeout(() => targetInput.focus(), 300);
    }
  };

  const navigateToCandidate = (mode = 'signup') => {
    setIsLogin(mode === 'login');
    setError('');
    const formElem = document.getElementById('candidate-auth-card');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const targetInput = formElem.querySelector('input');
      if (targetInput) setTimeout(() => targetInput.focus(), 300);
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
            <a href="#how-it-works" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">How It Works</a>
            <a href="#verification" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Skill Engine</a>
            <a href="#faq" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">FAQ</a>
          </nav>

          
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
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Unlock Side Hustles &amp; Gigs</span>
                  </div>
                </AnimatedContent>

                <AnimatedContent distance={40} direction="vertical" duration={0.7} delay={0.1}>
                  <TrueFocus
                    manualMode={false}
                    blurAmount={1.5}
                    borderColor={['#059669', '#2563eb']}
                    glowColor={['rgba(16, 185, 129, 0.55)', 'rgba(37, 99, 235, 0.55)']}
                    animationDuration={0.6}
                    pauseBetweenAnimations={1.5}
                    className="mb-5"
                  >
                    <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl xl:text-[45px] font-medium tracking-tight text-heading leading-[1.14]">
                      Turn Your Skills Into{' '}
                      <TrueFocus.Target
                        index={0}
                        borderColor="#059669"
                        glowColor="rgba(16, 185, 129, 0.6)"
                        className="text-emerald-600 dark:text-emerald-400 font-bold"
                        style={{ fontSize: 'calc(1em + 25px)' }}
                      >
                        Money
                      </TrueFocus.Target>{' '}
                      And Your Hustle Into a{' '}
                      <TrueFocus.Target
                        index={1}
                        borderColor="#2563eb"
                        glowColor="rgba(37, 99, 235, 0.6)"
                        className="text-primary font-bold"
                        style={{ fontSize: 'calc(1em + 25px)' }}
                      >
                        Career !!
                      </TrueFocus.Target>
                      .
                    </h1>
                  </TrueFocus>
                  <p className="font-sans text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-7 max-w-xl">
                    Turn your skills into income with paid gigs, stipend internships, and verified job opportunities through 10-question skill assessments.
                  </p>
                </AnimatedContent>

                <AnimatedContent distance={40} direction="vertical" duration={0.7} delay={0.2}>
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-7">
                    <button
                      onClick={() => navigateToCandidate('signup')}
                      className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Candidate Sign Up</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => navigateToCandidate('login')}
                      className="px-6 py-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-300/80 dark:border-slate-700 font-medium text-sm text-heading hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <LogIn className="w-4 h-4 text-primary" />
                      <span>Candidate Login</span>
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

              {/* RIGHT COLUMN: INTEGRATED CANDIDATE SIGN UP & LOGIN CARD */}
              <div className="lg:col-span-6 flex items-center justify-center pt-4 lg:pt-0">
                <AnimatedContent distance={40} direction="vertical" duration={0.8} delay={0.25} className="w-full">
                  <div
                    id="candidate-auth-card"
                    className="w-full max-w-[460px] mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative transition-all duration-300"
                  >
                    {/* Mode Switcher Tabs - Candidate Sign Up is default with smooth indicator */}
                    <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-5 border border-slate-200/60 dark:border-slate-700/60 relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(false);
                          setError('');
                        }}
                        className={`relative flex-1 py-2 text-xs font-headline font-bold rounded-lg transition-colors cursor-pointer z-10 ${
                          !isLogin
                            ? 'text-primary dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {!isLogin && (
                          <motion.div
                            layoutId="candidateAuthTabIndicator"
                            className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-xs"
                            transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                          />
                        )}
                        <span className="relative z-10">Candidate Sign Up</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(true);
                          setError('');
                        }}
                        className={`relative flex-1 py-2 text-xs font-headline font-bold rounded-lg transition-colors cursor-pointer z-10 ${
                          isLogin
                            ? 'text-primary dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {isLogin && (
                          <motion.div
                            layoutId="candidateAuthTabIndicator"
                            className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-xs"
                            transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                          />
                        )}
                        <span className="relative z-10">Sign In</span>
                      </button>
                    </div>

                    {/* Smooth Transitioning Header */}
                    <div className="mb-5 min-h-[52px]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={isLogin ? 'header-candidate-login' : 'header-candidate-signup'}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {isLogin ? 'Candidate Access' : 'Create Free Account'}
                            </span>
                          </div>
                          <h2 className="font-headline text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {isLogin ? 'Candidate Sign In' : 'Create Candidate Account'}
                          </h2>
                          
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Error Banner */}
                    {error && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span className="flex-1 font-medium">{error}</span>
                        <button
                          type="button"
                          onClick={() => setError('')}
                          className="text-rose-400 hover:text-rose-600 cursor-pointer text-xs ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Form Fields */}
                    <form onSubmit={handleAuthSubmit}>
                      {/* Full Name (Sign Up only) */}
                      <AnimatePresence initial={false}>
                        {!isLogin && (
                          <motion.div
                            key="name-field"
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                              Your Full Name
                            </label>
                            <div className="relative">
                              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              <input
                                type="text"
                                required={!isLogin}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Leo Carter"
                                className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-blue-500 focus:outline-none transition-colors"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Email Address */}
                      <div className="mb-4">
                        <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@domain.com"
                            className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-blue-500 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="mb-4">
                        <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-xl pl-10 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-blue-500 focus:outline-none transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Remember Me / Forgot Password (Sign In mode) */}
                      <AnimatePresence initial={false}>
                        {isLogin && (
                          <motion.div
                            key="remember-forgot-row"
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="flex justify-between items-center text-xs">
                              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  className="rounded border-slate-300 dark:border-slate-700 text-primary accent-primary w-3.5 h-3.5 cursor-pointer"
                                  checked={rememberMe}
                                  onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="text-slate-600 dark:text-slate-400 font-sans">Remember me</span>
                              </label>
                              <button
                                type="button"
                                className="text-primary hover:underline cursor-pointer font-headline font-bold bg-transparent border-none p-0 text-xs"
                                onClick={() => setIsForgotPasswordOpen(true)}
                              >
                                Forgot password?
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 sm:py-3.5 rounded-xl bg-primary hover:bg-primary/95 disabled:opacity-60 text-white font-headline font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={isLogin ? 'submit-signin' : 'submit-signup'}
                              initial={{ opacity: 0, y: 3 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -3 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-2"
                            >
                              <span>{isLogin ? 'Sign In to Workspace' : 'Claim Verified Score & Start Earning'}</span>
                              <ArrowRight className="w-4 h-4" />
                            </motion.span>
                          </AnimatePresence>
                        )}
                      </button>
                    </form>

                    {/* OR Divider */}
                    <div className="relative my-4 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                      </div>
                      <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] font-headline font-bold uppercase tracking-wider text-slate-400">
                        OR
                      </span>
                    </div>

                    {/* Google Auth Button */}
                    <GoogleAuthButton
                      role="STUDENT"
                      onSuccess={(data) => {
                        if (setToken) setToken(data.token);
                        if (setUser) setUser(data.user);
                        window.history.pushState({}, '', '/');
                      }}
                      onError={(msg) => setError(msg)}
                    />

                    {/* Bottom Links with Smooth Cross-Fade */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 text-center text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(!isLogin);
                          setError('');
                        }}
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                      >
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={isLogin ? 'link-login' : 'link-signup'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            {isLogin ? (
                              <span>
                                New candidate? <strong className="text-primary underline font-bold">Register your account</strong>
                              </span>
                            ) : (
                              <span>
                                Already registered? <strong className="text-primary underline font-bold">Sign In</strong>
                              </span>
                            )}
                          </motion.span>
                        </AnimatePresence>
                      </button>
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
                      AlignGrade connects talent with paid gigs, internships, and career opportunities to showcase skills, verify expertise, and grow professionally.
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
                      src="/non-tech.jpg"
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
                      Discover paid daily tasks, freelance gigs, internships, and full-time jobs that match your skills, strengths, and career goals.
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
                    <div className="font-headline text-2xl sm:text-3xl font-bold text-emerald-600">
                      ₹<CountUp to={14.2} from={0} duration={2} /> Cr+
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">Total Income Earned</div>
                  </div>
                  <div className="text-center p-3">
                    <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
                      <CountUp to={5000} from={0} separator="," duration={2} />+
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">Active Opportunities &amp; Gigs</div>
                  </div>
                  <div className="text-center p-3">
                    <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
                      <CountUp to={140} from={0} duration={2} />+
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">Verified Skill Roadmaps</div>
                  </div>
                  <div className="text-center p-3">
                    <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
                      <CountUp to={94.2} from={0} duration={2} />%
                    </div>
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
        <section id="how-it-works" className="relative z-10 py-5 sm:py-7 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

              {/* LEFT COLUMN: Explanatory Content & 3 Clear Stages */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                <AnimatedContent distance={25} direction="vertical" duration={0.7} delay={0.15}>
                  <div>
                    {/* Eyebrow */}
                    <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-primary text-[11px] font-bold uppercase tracking-wider mb-3">
                      <Sparkles className="w-3.5 h-3.5" /> SKILLS VERIFIED. JOBS MATCHED.
                    </div>

                    {/* Main Heading */}
                    <h2 className="text-3xl sm:text-4xl lg:text-[38px] font-headline font-medium text-heading mb-3 leading-tight">
                      Verify Your Skills. <span className="text-primary font-bold">Unlock Relevant Jobs.</span>
                    </h2>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5 sm:mb-6">
                      Prove your expertise through 10-question skill assessments. Get verified on AlignGrade and receive job recommendations that match your skills and proficiency levels.
                    </p>

                    {/* Three Clear Stages */}
                    <div className="space-y-3">
                      {/* 01 — Verify Your Skills */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-container-lowest/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant/80 shadow-xs flex items-start gap-3.5 transition-all hover:border-blue-500/40 group">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0 font-headline font-bold text-xs border border-blue-500/20 group-hover:bg-primary group-hover:text-white transition-colors">
                          01
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-headline text-sm sm:text-base font-semibold text-heading mb-0.5">
                            Verify Your Skills
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Complete 10-question assessments to demonstrate your knowledge and earn verified skill recognition.
                          </p>
                        </div>
                      </div>

                      {/* 02 — Unlock Relevant Opportunities */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-container-lowest/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant/80 shadow-xs flex items-start gap-3.5 transition-all hover:border-emerald-500/40 group">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 font-headline font-bold text-xs border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          02
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-headline text-sm sm:text-base font-semibold text-heading mb-0.5">
                            Unlock Relevant Opportunities
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Verified skills help you discover job opportunities aligned with your expertise and proficiency.
                          </p>
                        </div>
                      </div>

                      {/* 03 — Get Matched with Recruiters */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-container-lowest/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant/80 shadow-xs flex items-start gap-3.5 transition-all hover:border-primary/40 group">
                        <div className="w-9 h-9 rounded-xl bg-primary-container text-primary flex items-center justify-center shrink-0 font-headline font-bold text-xs border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors">
                          03
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-headline text-sm sm:text-base font-semibold text-heading mb-0.5">
                            Get Matched with Recruiters
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Showcase your verified abilities and connect with recruiters looking for candidates with your skills.
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
                        <span>Verify Your Skills</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <button
                        onClick={() => navigateToCandidate('signup')}
                        className="px-5 py-2.5 rounded-xl bg-surface-container-high border border-outline text-heading text-xs sm:text-sm font-semibold hover:bg-surface-container-highest transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <span>Explore Matched Jobs</span>
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
                      src="/candidate_skill_verification.jpg"
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
              <div className="bg-white dark:bg-slate-900 text-3xl rounded-3xl p-5 backdrop-blur-md bg-surface-container-lowest/80 dark:bg-surface-container-lowest/80 rounded-3xl p-6 sm:p-8 border border-outline-variant/50 shadow-xs text-center max-w-3xl mx-auto mb-10 sm:mb-12">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/90 px-3 py-1 rounded-full shadow-2xs">
                  <BookOpen className="w-3.5 h-3.5" /> Multi-Domain Academy &amp; Roadmaps
                </span>
                <h2 className="sm:text-4xl lg:text-[38px] font-headline font-medium text-heading mt-3 mb-3 leading-tight">
                  Master In-Demand Skills. <span className="text-primary font-bold">Learn Across Core Domains.</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  Build in-demand skills with AlignGrade’s video courses in Full Stack Development, Data Analytics, AI Agents, and Digital Marketing. Strengthen your expertise, verify your skills, and unlock career opportunities.
                </p>
              </div>
            </AnimatedContent>

            {/* 4 Core Domain Curriculum Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-12 sm:mb-16">
              {COURSE_DOMAINS.map((domain, idx) => (
                <AnimatedContent key={domain.id} distance={30} direction="vertical" duration={0.7} delay={0.15 + idx * 0.08}>
                  <div className="bg-white dark:bg-slate-900 h-full p-5 rounded-3xl bg-surface-container-lowest/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between group">
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
            {/* <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center"> */}
            {/* Visual 1: Course Learning Image (Cohort & Hands-On Engineering) */}
            {/* <div className="lg:col-span-6 flex flex-col gap-4"> */}
            {/* <AnimatedContent distance={35} direction="vertical" duration={0.8} delay={0.2}>
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
                </AnimatedContent> */}

            {/* <AnimatedContent distance={20} direction="vertical" duration={0.7} delay={0.25}>
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <h4 className="font-headline text-sm sm:text-base font-semibold text-heading mb-1.5 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <span>Curriculum Across 4 Strategic Domains</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Build full-stack software, automate intelligence with autonomous AI agents, extract insights with data analytics, and drive growth with digital marketing.
                    </p>
                  </div>
                </AnimatedContent> */}
            {/* </div> */}

            {/* Visual 2: Course Platform Experience (Video Lectures & Progress Tracking) */}
            {/* <div className="lg:col-span-6 flex flex-col gap-4">
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
              </div> */}
            {/* </div> */}

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
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${faqTab === t.id
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
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''
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
        <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-8 border-b border-outline-variant bg-transparent">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 lg:p-10 border-2 sm:border-3 border-white dark:border-slate-800 shadow-md">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">

                {/* ─── LEFT COLUMN: Headline & Rich Value Proposition ─── */}
                <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between space-y-5 text-left">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Unlock Your Earning Potential</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-medium text-heading leading-[1.2] tracking-tight">
                      Step Into the Era of Skill Monetization &amp; Rightful Hiring
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                      Whether you want to earn extra side hustle money from freelance contracts, build recurring monthly stipend income, or hire top pre-screened engineers without resume screening headaches — AlignGrade is your home.
                    </p>

                    {/* 3 Core Value Pillars */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-headline font-semibold text-heading">
                            Anti-Cheat Skill Verification
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            10-question adaptive assessments validate genuine proficiency, rendering resume inflation and pedigree bias obsolete.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Coins className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-headline font-semibold text-heading">
                            Escrow-Protected Monetization
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            Every freelance milestone and paid student stipend is funded upfront into escrow for guaranteed, on-time payouts.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-headline font-semibold text-heading">
                            Threshold-Gated Rightful Hiring
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            Recruiters set minimum score bars. Only candidates who prove requisite knowledge apply, slashing time-to-hire to 48 hours.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Proof Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-base sm:text-lg font-bold font-headline text-emerald-600">
                        ₹<CountUp to={4.8} from={0} duration={2} /> Cr+
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">Escrow Paid Out</div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-bold font-headline text-heading">
                        <CountUp to={12400} from={0} separator="," duration={2} />+
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">Verified Gigs Done</div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-bold font-headline text-primary">
                        <CountUp to={800} from={0} duration={2} />+
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">Colleges &amp; Employers</div>
                    </div>
                  </div>
                </div>

                {/* ─── RIGHT COLUMN: Candidate & Recruiter Cards ─── */}
                <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-4 justify-between">
                  {/* Card 1: Candidates & Students */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 text-left shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2 text-emerald-600">
                        <Wallet className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">CANDIDATES &amp; STUDENTS</span>
                      </div>
                      <h3 className="text-base font-headline font-semibold text-heading mb-1.5 group-hover:text-emerald-600 transition-colors">
                        Prove Skills &amp; Start Earning
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                        100% Free forever. Take 10-question tests, earn verified shields, and unlock 5,000+ gigs, side hustles, and jobs.
                      </p>

                      <ul className="space-y-1.5 mb-4 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        <li className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>70%+ score unlocks direct interview access</span>
                        </li>
                        <li className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Escrow-backed milestone payouts</span>
                        </li>
                        <li className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Verified work experience on public profile</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => navigateToCandidate('signup')}
                      className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group-hover:shadow-md"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Candidate Sign Up</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card 2: Returning Candidates */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 text-left shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2 text-primary">
                        <LogIn className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">RETURNING CANDIDATES</span>
                      </div>
                      <h3 className="text-base font-headline font-semibold text-heading mb-1.5 group-hover:text-primary transition-colors">
                        Access Your Candidate Portal
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                        Sign in to track verified test scorecards, manage active interview invitations, and explore high-payout opportunities.
                      </p>

                      <ul className="space-y-1.5 mb-4 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        <li className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>View verified assessment scores and badges</span>
                        </li>
                        <li className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Review job invites and track application status</span>
                        </li>
                        <li className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Direct access to wallet and milestone escrow earnings</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => navigateToCandidate('login')}
                      className="w-full py-2.5 rounded-xl bg-surface-container-high border border-outline text-heading text-xs font-semibold hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group-hover:shadow-md"
                    >
                      <LogIn className="w-3.5 h-3.5 text-primary" />
                      <span>Candidate Login</span>
                      <ArrowRight className="w-3.5 h-3.5 text-primary" />
                    </button>
                  </div>
                </div>

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

        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          initialEmail={email}
          role="STUDENT"
          theme={theme}
        />

        <VerificationPinModal
          isOpen={isVerificationOpen}
          onClose={() => setIsVerificationOpen(false)}
          email={pendingVerificationEmail || email}
          role="STUDENT"
          onSuccess={handleVerificationSuccess}
        />
      </ClickSpark>
    </div>
  );
}
