import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ChevronRight, 
  Lock, 
  Unlock, 
  CheckCircle2,
  User,
  Briefcase,
  ArrowRight,
  X,
  Activity,
  Sliders,
  Target,
  Award,
  Sparkles,
  FileText,
  Video,
  Play,
  TrendingUp,
  Search,
  CheckCircle,
  HelpCircle,
  FileCheck,
  Zap,
  Building2,
  UploadCloud,
  Loader2,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ThemeToggle from '../../components/ui/ThemeToggle';
import AnimatedContent from '../../components/ui/AnimatedContent';
import ClickSpark from '../../components/ui/ClickSpark';
import DotGrid from '../../components/ui/DotGrid';

export default function AuthView({ setToken, setUser, theme, toggleTheme }) {
  // Authentication & Form States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [authPopupMode, setAuthPopupMode] = useState(null); // 'login' | 'register' | null
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Interactive Match Simulator State
  const [simulatedReactRating, setSimulatedReactRating] = useState(3);
  const [isSimulatingTest, setIsSimulatingTest] = useState(false);
  const [simQuestionsPassed, setSimQuestionsPassed] = useState(false);

  // Interactive Features Showcase States
  const [featuresTab, setFeaturesTab] = useState('students');
  const [activeRoadmapStep, setActiveRoadmapStep] = useState(0);

  // Student Profiler Widget
  const [demoSelfRating, setDemoSelfRating] = useState(3);

  // Student MCQ Widget
  const [demoSelectedAnswer, setDemoSelectedAnswer] = useState(null);
  const [demoAnswerSubmitted, setDemoAnswerSubmitted] = useState(false);
  const [demoAnswerResult, setDemoAnswerResult] = useState(null); // 'correct' or 'incorrect'

  // Student PDF Resume Widget
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  // Student Video Pitch Widget
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const [videoRecorded, setVideoRecorded] = useState(false);

  // Recruiter Job Threshold Widget
  const [demoMinReact, setDemoMinReact] = useState(4);
  const [demoMinNode, setDemoMinNode] = useState(3);

  // Recruiter Company Verify Widget
  const [companyDocName, setCompanyDocName] = useState('');
  const [companyVerificationTier, setCompanyVerificationTier] = useState('Unverified');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Video recording timer effect
  useEffect(() => {
    let interval;
    if (isRecordingVideo) {
      interval = setInterval(() => {
        setVideoSeconds(prev => {
          if (prev >= 60) {
            setIsRecordingVideo(false);
            setVideoRecorded(true);
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setVideoSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVideo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const path = isLogin ? '/auth/login' : '/auth/signup';
    const payload = isLogin ? { email, password } : { email, password, role, name };

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

  const triggerAuthFlow = (mode) => {
    setIsLogin(mode === 'login');
    setIsDrawerOpen(true);
    setError('');
  };

  // Run a quick mock verification simulation in the browser
  const runVerificationSimulation = () => {
    setIsSimulatingTest(true);
    setTimeout(() => {
      setSimulatedReactRating(5);
      setSimQuestionsPassed(true);
      setIsSimulatingTest(false);
    }, 1500);
  };

  const resetSimulation = () => {
    setSimulatedReactRating(3);
    setSimQuestionsPassed(false);
  };

  return (
    <div className="min-h-screen w-full bg-background text-on-surface font-sans antialiased overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <ClickSpark
        sparkColor={theme === 'dark' ? '#ffffff' : '#000000'}
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        {/* Dynamic Background DotGrid */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.25]" style={{ minHeight: '100vh' }}>
          <DotGrid
            dotSize={5}
            gap={25}
            baseColor={theme === 'dark' ? '#0f2530ff' : '#3e6379ff'}
            activeColor={theme === 'dark' ? '#9bd6f2' : '#0181a0ff'}
            proximity={130}
            shockRadius={150}
            shockStrength={3}
            returnDuration={1.2}
          />
        </div>
      {/* 1. Header/Navbar */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'} 
              alt="AlignGrad Logo" 
              className="h-10 w-auto object-contain"
            />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-on-surface-variant">
            <a href="#demo" className="hover:text-on-surface transition-colors">Skill Matcher</a>
            <a href="#features" className="hover:text-on-surface transition-colors">Features</a>
            <a href="#process" className="hover:text-on-surface transition-colors">Verification Loop</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <button
              onClick={() => setAuthPopupMode('login')}
              className="text-xs font-semibold px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthPopupMode('register')}
              className="text-xs font-semibold px-4 py-2 rounded-lg glass-button-primary text-on-primary hover:brightness-110 transition-all shadow-sm shadow-primary/20"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section — asymmetric, product-first */}
      <section id="demo" className="relative z-10 pt-16 pb-20 md:pt-20 md:pb-28 overflow-hidden">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left: copy, left-aligned, not centered */}
          <div className="lg:col-span-5 glass-card rounded-3xl p-8 md:p-10 shadow-lg shadow-secondary/[0.02]">
            <AnimatedContent distance={30} direction="vertical" delay={0.1}>
              <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight text-on-surface leading-[1.08] mb-5">
                Resumes lie.<br />
                Rating <span className="text-primary">4/5 in React</span> shouldn't.
              </h1>
            </AnimatedContent>

            <AnimatedContent distance={25} direction="vertical" delay={0.25}>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed mb-8 max-w-md">
                Candidates self-rate their skills. Recruiters set the bar. When a rating doesn't hold up, AlignGrad hands the candidate a short verification test instead of a rejection — pass it, and the door opens.
              </p>
            </AnimatedContent>

            <AnimatedContent distance={20} direction="vertical" delay={0.4}>
              <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
                <button
                  onClick={() => { window.location.href = 'https://career.aligngrad.com'; }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl glass-button-secondary text-on-secondary font-semibold text-sm hover:brightness-110 hover:shadow-lg hover:shadow-secondary/20 transition-all shadow-md shadow-secondary/15"
                >
                  Join as a Candidate
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { window.location.href = 'https://hire.aligngrad.com'; }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl glass-button text-on-surface font-semibold text-sm hover:bg-surface-container-high/70 transition-all"
                >
                  Hire Verified Students
                </button>
              </div>
            </AnimatedContent>

            {/* Inline stat strip — no boxes, no grid */}
            <AnimatedContent distance={15} direction="vertical" delay={0.55} stagger={0.12}>
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-xs text-on-surface-variant border-t border-outline-variant pt-5">
                <span><strong className="font-mono text-on-surface text-sm">5,400+</strong> students verified</span>
                <span><strong className="font-mono text-on-surface text-sm">150+</strong> partner companies</span>
                <span><strong className="font-mono text-on-surface text-sm">&lt;3 days</strong> avg. interview loop</span>
              </div>
            </AnimatedContent>
          </div>

          {/* Right: the actual product, standing in for a hero screenshot */}
          <div className="lg:col-span-7">
            <AnimatedContent distance={50} direction="horizontal" reverse threshold={0.1} delay={0.3}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Candidate card */}
                <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-4 mb-5">
                      <div className="h-9 w-9 rounded-full bg-primary-container flex items-center justify-center text-sm font-bold text-on-primary-container">
                        LC
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">Leo Carter</h4>
                        <span className="text-[10px] font-mono text-on-surface-variant uppercase">Pre-Final Year, B.Tech CSE</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                          <span>React & Next.js</span>
                          <span className="font-mono text-primary font-bold">{simulatedReactRating}/5</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-high/40 rounded-full overflow-hidden relative">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(simulatedReactRating / 5) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                          <span>Node.js / Databases</span>
                          <span className="font-mono text-on-surface-variant">4/5</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-high/40 rounded-full overflow-hidden relative">
                          <div className="h-full bg-on-surface-variant/40 rounded-full w-[80%]" />
                        </div>
                      </div>
                    </div>

                    {!simQuestionsPassed && (
                      <div className="mt-6 p-4 glass-card rounded-xl border border-primary/10">
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          Leo's React rating is <strong>3/5</strong>. The role on the right needs <strong>4/5</strong> — locked. Try the test.
                        </p>
                        <button
                          onClick={runVerificationSimulation}
                          disabled={isSimulatingTest}
                          className="mt-3 w-full py-2 glass-button-primary hover:brightness-110 disabled:opacity-50 text-on-primary font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          {isSimulatingTest ? (
                            <>
                              <Activity className="w-3.5 h-3.5 animate-spin" />
                              <span>Running 12 React MCQs...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Run Skill Verification Test</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {simQuestionsPassed && (
                      <div className="mt-6 p-4 bg-success-container/30 rounded-xl border border-success-container text-success font-medium text-xs flex flex-col items-center text-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <span>Passed with 92%. React verified at 5/5.</span>
                        <button
                          onClick={resetSimulation}
                          className="mt-1 text-[10px] uppercase font-mono tracking-wider text-on-surface-variant hover:text-on-surface underline"
                        >
                          Reset Demo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-outline-variant/60 pt-4 mt-5 flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                    <span>STATUS:</span>
                    <span className={simQuestionsPassed ? "text-success font-bold" : "text-tertiary font-bold"}>
                      {simQuestionsPassed ? "VERIFIED L5" : "SELF-RATED"}
                    </span>
                  </div>
                </div>

                {/* Job card */}
                <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-sm sm:mt-8">
                  <div>
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4 mb-5">
                      <h4 className="text-sm font-bold text-on-surface">Frontend Engineer</h4>
                      <span className="text-[10px] font-mono text-on-surface-variant">$8k/mo</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center bg-surface-container-high/40 rounded-xl p-3 border border-outline-variant/60 text-xs">
                        <span className="font-medium">React</span>
                        <span className="font-mono px-2 py-0.5 rounded font-bold">Min 4/5</span>
                      </div>
                      <div className="flex justify-between items-center bg-surface-container-high/40 rounded-xl p-3 border border-outline-variant/60 text-xs">
                        <span className="font-medium">Node.js</span>
                        <span className="font-mono px-2 py-0.5 rounded font-bold">Min 3/5</span>
                      </div>
                    </div>

                    {simulatedReactRating >= 4 ? (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-success-container/20 border border-success-container/30 text-success text-xs">
                        <Unlock className="w-4 h-4" />
                        <span>Thresholds met. Unlocked.</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-error-container/20 border border-error-container/30 text-error text-xs">
                        <Lock className="w-4 h-4" />
                        <span>React rating below requirement.</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    {simulatedReactRating >= 4 ? (
                      <button
                        onClick={() => alert("Mock application submitted successfully!")}
                        className="w-full py-3 glass-button-secondary text-on-secondary rounded-xl font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md shadow-secondary/15 animate-fade-in"
                      >
                        <span>Submit Application</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 glass-button text-on-surface-variant/50 rounded-xl font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2 opacity-60"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Application Locked</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </AnimatedContent>
          </div>
        </div>
      </section>

      {/* 4. Tabbed Feature Showcase Section */}
      <section id="features" className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-outline-variant">
        <AnimatedContent distance={30} direction="vertical" threshold={0.2}>
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="font-headline text-3xl font-bold text-on-surface">
              A Platform Engineered for Two Audiences
            </h2>
            <p className="text-sm text-on-surface-variant mt-2 max-w-lg mx-auto">
              Connecting self-driven students and data-focused recruiter teams with transparent skill metrics.
            </p>

            {/* Premium Tab Selector */}
            <div className="inline-flex p-1.5 bg-surface-container-low border border-outline-variant rounded-xl mt-8">
              <button
                onClick={() => setFeaturesTab('students')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                  featuresTab === 'students'
                    ? 'glass-button-primary text-on-primary shadow-sm shadow-primary/15'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                For Students & Candidates
              </button>
              <button
                onClick={() => setFeaturesTab('recruiters')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                  featuresTab === 'recruiters'
                    ? 'glass-button-secondary text-on-secondary shadow-sm shadow-secondary/15'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                For Recruiter Talent Teams
              </button>
            </div>
          </div>
        </AnimatedContent>

        {/* Feature Cards Grid */}
        <AnimatedContent distance={40} direction="vertical" threshold={0.15} delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {featuresTab === 'students' ? (
              <>
                {/* Student Feature 1 */}
                <div className="flex flex-col glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <h3 className="font-headline text-base font-bold text-on-surface">Dynamic Skills Profiler</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed flex-1">
                    Declare and customize your expertise levels across different stacks. AlignGrad maps these self-ratings to provide immediate feedback on job eligibility.
                  </p>
                  
                  {/* Slider Simulator Widget */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mt-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-mono font-bold text-on-surface">React & Frontend</span>
                      <span className="text-[11px] font-mono font-bold text-primary bg-primary-container px-2 py-0.5 rounded">
                        {demoSelfRating}/5 Stars
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      value={demoSelfRating} 
                      onChange={(e) => setDemoSelfRating(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer mb-2"
                    />
                    <p className="text-[10px] text-on-surface-variant font-mono leading-relaxed">
                      {demoSelfRating < 4 
                        ? "⚠️ Rating L3: Some senior frontend openings will be locked." 
                        : "✨ Rating L4+: Ready for verification tests to unlock senior roles."}
                    </p>
                  </div>
                </div>

                {/* Student Feature 2 */}
                <div className="flex flex-col glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <Award className="w-5 h-5" />
                    </div>
                    <h3 className="font-headline text-base font-bold text-on-surface">Lockout Remedial Exams</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed flex-1">
                    Fall below a job's requirement threshold? AlignGrad generates a personalized MCQ test. Complete it to verify your capability and instantly submit your application.
                  </p>
                  
                  {/* MCQ Simulator Widget */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mt-5 text-left">
                    <p className="text-xs font-bold text-on-surface mb-2.5">Q: What hook handles side effects in React?</p>
                    <div className="space-y-1.5 mb-3">
                      {[
                        { id: 'A', text: 'useState' },
                        { id: 'B', text: 'useEffect' },
                        { id: 'C', text: 'useContext' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (!demoAnswerSubmitted) {
                              setDemoSelectedAnswer(opt.id);
                            }
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs transition-all border ${
                            demoSelectedAnswer === opt.id 
                              ? 'bg-primary-container border-primary text-on-primary-container font-semibold' 
                              : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high'
                          }`}
                          disabled={demoAnswerSubmitted}
                        >
                          {opt.id}) {opt.text}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => {
                          if (demoSelectedAnswer) {
                            setDemoAnswerSubmitted(true);
                            setDemoAnswerResult(demoSelectedAnswer === 'B' ? 'correct' : 'incorrect');
                          }
                        }}
                        disabled={!demoSelectedAnswer || demoAnswerSubmitted}
                        className="px-3 py-1.5 bg-secondary text-on-secondary hover:brightness-110 disabled:bg-surface-container-highest disabled:text-on-surface-variant/40 rounded-lg text-[10px] font-bold transition-all"
                      >
                        Submit Answer
                      </button>
                      {demoAnswerSubmitted && (
                        <span className={`text-[10px] font-mono font-bold ${demoAnswerResult === 'correct' ? 'text-success' : 'text-error'}`}>
                          {demoAnswerResult === 'correct' ? '✓ Passed! Verified L4+' : '✗ Failed. Try again!'}
                        </span>
                      )}
                      {demoAnswerSubmitted && (
                        <button
                          onClick={() => {
                            setDemoSelectedAnswer(null);
                            setDemoAnswerSubmitted(false);
                            setDemoAnswerResult(null);
                          }}
                          className="text-[9px] underline font-mono text-on-surface-variant ml-auto hover:text-on-surface"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Student Feature 3 */}
                <div className="flex flex-col glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-headline text-base font-bold text-on-surface">Verified PDF Resume Engine</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed flex-1">
                    Compile a professional, standardized resume instantly. AlignGrad embeds verified status badges next to your passing skill sets so recruiters know your ratings are real.
                  </p>
                  
                  {/* PDF Generator Simulator */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mt-5 flex flex-col justify-between">
                    <div className="border border-dashed border-outline-variant p-2.5 rounded-lg bg-surface-container mb-3 text-[10px] font-mono">
                      <div className="font-bold border-b border-outline-variant/60 pb-1 mb-1.5">LEO CARTER • RESUME</div>
                      <div className="flex justify-between mb-1">
                        <span>React.js</span>
                        <span className="text-success font-bold">L5 [VERIFIED] ⭐</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Node.js</span>
                        <span className="text-on-surface-variant font-bold">L4 [SELF-RATED]</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsDownloadingPdf(true);
                        setPdfDownloaded(false);
                        setTimeout(() => {
                          setIsDownloadingPdf(false);
                          setPdfDownloaded(true);
                        }, 1000);
                      }}
                      disabled={isDownloadingPdf}
                      className="w-full py-2 bg-primary text-on-primary hover:brightness-110 disabled:bg-primary-container disabled:text-on-primary-container rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      {isDownloadingPdf ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating PDF...</span>
                        </>
                      ) : pdfDownloaded ? (
                        <span>✓ Verified PDF Generated!</span>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          <span>Download Verified PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Student Feature 4 */}
                <div className="flex flex-col glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <Video className="w-5 h-5" />
                    </div>
                    <h3 className="font-headline text-base font-bold text-on-surface">60-Second Video Pitch</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed flex-1">
                    Tell your story beyond plain sheets. Record a 60-second video elevator pitch inside the browser to showcase your communication skills alongside your verified code scores.
                  </p>
                  
                  {/* Video Recorder Simulator */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mt-5 text-center">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center mb-2.5">
                      {isRecordingVideo ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-error/15">
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
                            <span>REC 00:{videoSeconds.toString().padStart(2, '0')}</span>
                          </div>
                          <Activity className="w-6 h-6 text-white animate-pulse" />
                        </div>
                      ) : videoRecorded ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-success/20">
                          <Play className="w-8 h-8 text-success hover:scale-110 transition-transform cursor-pointer" onClick={() => alert("Simulating playback of your video introduction.")} />
                          <span className="text-[9px] font-mono mt-1.5 bg-black/50 px-2 py-0.5 rounded">01:00 Pitch Ready</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-mono">Camera Feed Idle</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (isRecordingVideo) {
                            setIsRecordingVideo(false);
                            setVideoRecorded(true);
                          } else {
                            setVideoRecorded(false);
                            setIsRecordingVideo(true);
                          }
                        }}
                        className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          isRecordingVideo 
                            ? 'bg-error text-on-error hover:brightness-110' 
                            : 'bg-primary text-on-primary hover:brightness-110'
                        }`}
                      >
                        {isRecordingVideo ? 'Stop Recording' : 'Simulate Pitch Record'}
                      </button>
                      {videoRecorded && (
                        <button
                          onClick={() => {
                            setVideoRecorded(false);
                            setVideoSeconds(0);
                          }}
                          className="px-2.5 py-1.5 glass-card hover:bg-surface-container-high rounded-lg text-[10px] font-bold"
                        >
                          Retake
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Recruiter Feature 1 */}
                <div className="flex flex-col glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-secondary/15 rounded-xl text-secondary dark:text-primary">
                      <Target className="w-5 h-5" />
                    </div>
                    <h3 className="font-headline text-base font-bold text-on-surface">Skill-Gated Job Postings</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed flex-1">
                    Set precise minimum requirements for specific tech stacks. Candidates below these ratings cannot apply, dramatically reducing volume and keeping candidates qualified.
                  </p>
                  
                  {/* Gate Constructor Simulator */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mt-5">
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/60 text-xs">
                        <span className="font-semibold text-on-surface">Min React Rating</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setDemoMinReact(Math.max(1, demoMinReact - 1))} className="px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] font-bold">-</button>
                          <span className="font-mono font-bold text-primary">{demoMinReact}/5</span>
                          <button onClick={() => setDemoMinReact(Math.min(5, demoMinReact + 1))} className="px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] font-bold">+</button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/60 text-xs">
                        <span className="font-semibold text-on-surface">Min Node.js Rating</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setDemoMinNode(Math.max(1, demoMinNode - 1))} className="px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] font-bold">-</button>
                          <span className="font-mono font-bold text-primary">{demoMinNode}/5</span>
                          <button onClick={() => setDemoMinNode(Math.min(5, demoMinNode + 1))} className="px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] font-bold">+</button>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 bg-primary/5 rounded-lg text-[9px] font-mono text-on-surface-variant flex items-center gap-1.5 border border-primary/10">
                      <Lock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>Skill threshold enforce: Auto-lock unqualified applications.</span>
                    </div>
                  </div>
                </div>

                {/* Recruiter Feature 2 */}
                <div className="flex flex-col glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-secondary/15 rounded-xl text-secondary dark:text-primary">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="font-headline text-base font-bold text-on-surface">Verified Applicant Pipeline</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed flex-1">
                    Bypass unverified claims. Access a pipeline clean of credential inflation, showing candidates who validated their scores through tests.
                  </p>
                  
                  {/* Verified Pipeline Simulator */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mt-5">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between p-2 bg-surface-container rounded-lg border border-outline-variant/60 text-[10px] font-mono">
                        <div className="font-bold">Leo Carter</div>
                        <div className="flex gap-2">
                          <span className="text-success font-semibold">React L5 Verified</span>
                          <span className="text-success font-bold px-1 rounded bg-success/10 text-[8px]">PASS</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-surface-container rounded-lg border border-outline-variant/60 text-[10px] font-mono">
                        <div className="font-bold">Sarah Connor</div>
                        <div className="flex gap-2">
                          <span className="text-success font-semibold">React L4 Verified</span>
                          <span className="text-success font-bold px-1 rounded bg-success/10 text-[8px]">PASS</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] text-on-surface-variant font-mono mt-2 text-right">✓ 100% applicants cleared skill gates</p>
                  </div>
                </div>

                {/* Recruiter Feature 3 */}
                <div className="flex flex-col glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-secondary/15 rounded-xl text-secondary dark:text-primary">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-headline text-base font-bold text-on-surface">Verification Audit Vault</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed flex-1">
                    Upload official corporate documentation to verify your recruiting profile. Verified companies get a trust checkmark and unlock candidate explore features.
                  </p>
                  
                  {/* Document Audit Simulator */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mt-5 flex flex-col justify-between">
                    {companyVerificationTier === 'Unverified' ? (
                      <div className="flex flex-col items-center justify-center border border-dashed border-outline-variant bg-surface-container rounded-lg p-3 text-center mb-3">
                        <UploadCloud className="w-5 h-5 text-on-surface-variant mb-1" />
                        <span className="text-[10px] font-bold text-on-surface">Click to upload audit file</span>
                        <span className="text-[8px] text-on-surface-variant/70">PDF, PNG up to 10MB</span>
                        <button
                          onClick={() => {
                            setIsUploadingDoc(true);
                            setTimeout(() => {
                              setIsUploadingDoc(false);
                              setCompanyDocName('inc_certificate.pdf');
                              setCompanyVerificationTier('Tier 1 Verified');
                            }, 1200);
                          }}
                          disabled={isUploadingDoc}
                          className="mt-2 px-2.5 py-1 bg-primary text-on-primary rounded text-[9px] font-bold"
                        >
                          {isUploadingDoc ? 'Uploading...' : 'Simulate Audit Upload'}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-success-container/30 border border-success-container text-success p-3 rounded-lg flex flex-col items-center justify-center text-center mb-3">
                        <ShieldCheck className="w-5 h-5 text-success mb-1" />
                        <span className="text-[10px] font-bold">Verified: {companyDocName}</span>
                        <span className="text-[8px] font-mono">Status: PLATINUM PARTNER</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setCompanyDocName('');
                        setCompanyVerificationTier('Unverified');
                      }}
                      disabled={companyVerificationTier === 'Unverified'}
                      className="text-[9px] font-mono text-on-surface-variant underline hover:text-on-surface text-center"
                    >
                      Reset Verification Status
                    </button>
                  </div>
                </div>

                {/* Recruiter Feature 4 */}
                <div className="flex flex-col glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-secondary/15 rounded-xl text-secondary dark:text-primary">
                      <Search className="w-5 h-5" />
                    </div>
                    <h3 className="font-headline text-base font-bold text-on-surface">Verified Talent Explorer</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed flex-1">
                    Search the candidate directory directly by verified skill sets. Find talent who have already cleared verified benchmarks and review resume profiles in bulk.
                  </p>
                  
                  {/* Explorer Search Simulator */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mt-5">
                    <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1.5 rounded-lg border border-outline-variant/60 mb-2">
                      <Search className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span className="text-[9px] font-mono text-on-surface-variant">Query: React L4+ AND SQL L3+</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['React L5', 'SQL L4', 'NextJS L4', 'Vite'].map((tag, idx) => (
                        <span key={idx} className="text-[8px] font-mono bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </AnimatedContent>
      </section>

      {/* 5. Curved/Interactive Process Roadmap */}
      <section id="process" className="relative z-10 py-16 md:py-24 border-t border-outline-variant bg-surface-container-low/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContent distance={30} direction="vertical" threshold={0.2}>
            <div className="max-w-2xl mx-auto text-center mb-14">
              <h2 className="font-headline text-3xl font-bold text-on-surface">
                AlignGrade Skill Match Roadmap
              </h2>
              <p className="text-sm text-on-surface-variant mt-2 max-w-lg mx-auto">
                Follow our 4-step process from self-declared rating to verified placement. Hover over steps below to visualize the mechanics.
              </p>
            </div>
          </AnimatedContent>

          {/* Process Timeline Steps */}
          <AnimatedContent distance={20} direction="vertical" threshold={0.15}>
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 mb-12">
              {/* Desktop Connecting Line */}
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-outline-variant/60 -translate-y-1/2 hidden md:block z-0" />
              
              {[
                { num: '01', title: 'Register & Self-Rate', desc: 'Create profile & set baseline ratings.' },
                { num: '02', title: 'Match Checks', desc: 'Auto-auditing requirements on click.' },
                { num: '03', title: 'Skill test remedial', desc: 'Pass MCQ quiz to unlock gates.' },
                { num: '04', title: 'Verified Placement', desc: 'Direct review by partner recruiters.' }
              ].map((step, idx) => {
                const isActive = activeRoadmapStep === idx;
                return (
                  <button
                    key={idx}
                    onMouseEnter={() => setActiveRoadmapStep(idx)}
                    onClick={() => setActiveRoadmapStep(idx)}
                    className="relative flex flex-col items-center text-center z-10 group w-full md:w-1/4 focus:outline-none"
                  >
                    {/* Circle Node */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary text-on-primary ring-4 ring-primary-container scale-110 shadow-lg shadow-primary/25 font-semibold' 
                        : 'bg-surface-container border-2 border-outline-variant text-on-surface-variant group-hover:border-primary group-hover:text-primary group-hover:scale-105'
                    }`}>
                      {step.num}
                    </div>
                    {/* Titles */}
                    <h4 className={`text-xs font-bold mt-3 transition-colors ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                      {step.title}
                    </h4>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 max-w-[150px] hidden md:block">
                      {step.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </AnimatedContent>

          {/* Interactive Step Details Panel */}
          <AnimatedContent distance={30} direction="vertical" threshold={0.1} delay={0.05}>
            <div className="glass-card rounded-2xl p-6 md:p-8 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[300px]">
              
              {/* Details text (Left 7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-center text-left">
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold mb-1">
                  Phase {activeRoadmapStep + 1} System Flow
                </span>
                <h3 className="font-headline text-xl md:text-2xl font-bold text-on-surface mb-3">
                  {activeRoadmapStep === 0 && "01. Candidate Profiling & Skill Declaration"}
                  {activeRoadmapStep === 1 && "02. Skill Matching & Gate Enforcement"}
                  {activeRoadmapStep === 2 && "03. MCQ Verification & Certification"}
                  {activeRoadmapStep === 3 && "04. Verified Placement & Direct Hiring"}
                </h3>
                
                <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed mb-6">
                  {activeRoadmapStep === 0 && "Every student begins by creating a profile detailing their education, experience, and projects, coupled with a self-declared rating from 1 to 5 stars for core technical skills."}
                  {activeRoadmapStep === 1 && "When a student submits an application, AlignGrade automatically audits their ratings. Underqualified ratings trigger a dynamic lock status, blocking the direct submission of the resume."}
                  {activeRoadmapStep === 2 && "Locked applications offer an escape hatch: a quick, 10-question MCQ test. Clear this test to instantly raise your rating, update your profile, and submit your application."}
                  {activeRoadmapStep === 3 && "Recruiters explore candidate lists showing side-by-side self-rated vs. verified ratings. They can watch 1-minute intro pitches and download verified PDF portfolios."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeRoadmapStep === 0 && (
                    <>
                      <div className="flex items-start gap-2 text-left">
                        <Sliders className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-on-surface">Dynamic Skills Profiler</h5>
                          <p className="text-[11px] text-on-surface-variant leading-normal">Specify ratings for React, Node, database, and system architectures.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-left">
                        <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-on-surface">AWS S3 Storage Upload</h5>
                          <p className="text-[11px] text-on-surface-variant leading-normal">Safely upload and store pdf resumes and project details.</p>
                        </div>
                      </div>
                    </>
                  )}
                  {activeRoadmapStep === 1 && (
                    <>
                      <div className="flex items-start gap-2 text-left">
                        <Lock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-on-surface">Automatic Skill-Gate</h5>
                          <p className="text-[11px] text-on-surface-variant leading-normal">Compares candidate skills against job thresholds instantly on click.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-left">
                        <Activity className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-on-surface">Immediate Lockout Status</h5>
                          <p className="text-[11px] text-on-surface-variant leading-normal">Alerts underqualified students and provides the test unlock portal link.</p>
                        </div>
                      </div>
                    </>
                  )}
                  {activeRoadmapStep === 2 && (
                    <>
                      <div className="flex items-start gap-2 text-left">
                        <Award className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-on-surface">Dynamic MCQ Assessment</h5>
                          <p className="text-[11px] text-on-surface-variant leading-normal">AI generation from Claude Bedrock/Groq for 10 skill-specific questions.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-left">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-on-surface">Verified Rating Elevation</h5>
                          <p className="text-[11px] text-on-surface-variant leading-normal">Sets verified rating in backend, upgrading the candidate's trust status.</p>
                        </div>
                      </div>
                    </>
                  )}
                  {activeRoadmapStep === 3 && (
                    <>
                      <div className="flex items-start gap-2 text-left">
                        <Video className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-on-surface">Embedded Video Pitch</h5>
                          <p className="text-[11px] text-on-surface-variant leading-normal">Watch candidate pitches inside the dashboard to skip preliminary screenings.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-left">
                        <Building2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-on-surface">Verified Recruiter Access</h5>
                          <p className="text-[11px] text-on-surface-variant leading-normal">Explore candidate databases using robust verified skill filters.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Graphic/Interactive Box (Right 5 cols) */}
              <div className="lg:col-span-5 bg-surface-container-high border border-outline-variant/60 rounded-xl p-5 flex flex-col justify-center items-center text-center min-h-[225px] w-full">
                {activeRoadmapStep === 0 && (
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                      <span className="text-xs font-bold text-on-surface">Interactive Preview</span>
                      <span className="text-[9px] font-mono uppercase bg-primary-container text-on-primary-container px-2 py-0.5 rounded">Setup Profile</span>
                    </div>
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between items-center text-xs">
                        <span>Database Rating</span>
                        <span className="font-mono text-primary font-bold">React: 3/5 Stars</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>PDF Resume Status</span>
                        <span className="text-success font-bold font-mono">Linked</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>Showcase Video Status</span>
                        <span className="text-success font-bold font-mono">Recorded (60s)</span>
                      </div>
                    </div>
                  </div>
                )}
                {activeRoadmapStep === 1 && (
                  <div className="w-full space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                      <span className="text-xs font-bold text-on-surface">Skill Match Simulator</span>
                      <span className="text-[9px] font-mono uppercase bg-error-container text-on-error-container px-2 py-0.5 rounded">Block Check</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 bg-surface-container rounded-lg border border-outline-variant/60">
                        <span>Job Need: Min React L4</span>
                        <span className="text-error font-bold font-mono">L4 Required</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-surface-container rounded-lg border border-outline-variant/60">
                        <span>Candidate Rating: React L3</span>
                        <span className="text-error font-bold font-mono">L3 Rating</span>
                      </div>
                    </div>
                    <div className="p-2 bg-error-container/20 border border-error-container/30 text-error rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Application Gated & Locked</span>
                    </div>
                  </div>
                )}
                {activeRoadmapStep === 2 && (
                  <div className="w-full space-y-3 text-left">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                      <span className="text-xs font-bold text-on-surface">Test Verification Loop</span>
                      <span className="text-[9px] font-mono uppercase bg-success-container text-on-success-container px-2 py-0.5 rounded">Exam Portal</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 bg-surface-container rounded-lg border border-outline-variant/60">
                        <span>Questions Passed</span>
                        <span className="text-success font-bold font-mono">8 / 10 MCQ</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-surface-container rounded-lg border border-outline-variant/60">
                        <span>Score Percentage</span>
                        <span className="text-success font-bold font-mono">80% Pass</span>
                      </div>
                    </div>
                    <div className="p-2 bg-success-container/20 border border-success-container/30 text-success rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Verified React Rating Raised to L5!</span>
                    </div>
                  </div>
                )}
                {activeRoadmapStep === 3 && (
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                      <span className="text-xs font-bold text-on-surface">Recruiter Interview Board</span>
                      <span className="text-[9px] font-mono uppercase bg-primary-container text-on-primary-container px-2 py-0.5 rounded">Placement</span>
                    </div>
                    <div className="flex flex-col items-center py-1">
                      <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center font-bold text-on-primary-container mb-1 text-xs">
                        LC
                      </div>
                      <h4 className="text-xs font-bold text-on-surface">Leo Carter</h4>
                      <p className="text-[9px] text-on-surface-variant font-mono">React Verified: L5 • Pitch Video Linked</p>
                      <button className="mt-2.5 px-3 py-1.5 bg-secondary text-on-secondary rounded-lg text-[10px] font-bold hover:brightness-110 flex items-center gap-1">
                        <span>Unlock Candidate Interview</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </AnimatedContent>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="relative z-10 bg-surface-container-low border-t border-outline-variant py-12 text-center text-xs text-on-surface-variant font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-on-surface">AlignGrad</span>
            <span className="text-[10px] font-mono text-on-surface-variant">© 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-on-surface transition-colors" onClick={e => e.preventDefault()}>Privacy Policy</a>
            <a href="#" className="hover:text-on-surface transition-colors" onClick={e => e.preventDefault()}>Terms of Service</a>
            <a href="#" className="hover:text-on-surface transition-colors" onClick={e => e.preventDefault()}>Recruitment Standards</a>
          </div>
        </div>
      </footer>


      {/* Navbar auth portal picker */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ease-out bg-[#023047]/50 backdrop-blur-sm ${
          authPopupMode ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setAuthPopupMode(null)}
      >
        <div
          className={`absolute top-1/2 left-1/2 w-full max-w-sm glass-card shadow-2xl p-8 rounded-2xl transition-all duration-300 ease-out transform ${
            authPopupMode ? 'opacity-100 -translate-x-1/2 -translate-y-1/2 scale-100' : 'opacity-0 -translate-x-1/2 -translate-y-1/2 scale-95 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-6">
            <span className="font-headline text-sm font-bold text-on-surface">
              {authPopupMode === 'login' ? 'Sign in to AlignGrad' : 'Create your AlignGrad account'}
            </span>
            <button
              type="button"
              onClick={() => setAuthPopupMode(null)}
              className="h-8 w-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => { window.location.href = 'https://career.aligngrad.com'; }}
              className="py-3 rounded-xl border text-sm font-bold transition-all bg-primary-container border-primary text-on-primary-container hover:brightness-110 flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              {authPopupMode === 'login' ? 'Candidate Login' : 'Candidate Signup'}
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = 'https://hire.aligngrad.com'; }}
              className="py-3 rounded-xl border text-sm font-bold transition-all bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container-high flex items-center justify-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              {authPopupMode === 'login' ? 'Recruiter Login' : 'Recruiter Signup'}
            </button>
          </div>
        </div>
      </div>


      {/* 7. Slide-over Auth Drawer (Linear-style panel) */}
      <div 
        className={`fixed inset-0 z-50 transition-opacity duration-300 ease-out bg-[#023047]/50 backdrop-blur-sm ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
      >
        <div 
          className={`absolute top-0 right-0 h-full w-full max-w-md glass-card shadow-2xl p-8 flex flex-col justify-between transition-transform duration-300 ease-out transform ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div>
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <img 
                  src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'} 
                  alt="AlignGrad Logo" 
                  className="h-7 w-auto object-contain"
                />
                <span className="font-headline text-sm font-bold text-on-surface">
                  {isLogin ? 'Sign in to AlignGrad' : 'Create Student / Recruiter Account'}
                </span>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-5 p-4 bg-error-container border border-error/20 rounded-xl flex items-start gap-3 text-on-error-container text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <Input
                  label="Name / Organization Name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Leo Carter / Aether Corp"
                />
              )}

              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@domain.com"
              />

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-xl pl-4 pr-11 py-3 text-sm text-on-surface placeholder-on-surface-variant/50 transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isLogin ? (
                <div className="flex justify-between items-center py-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant text-primary bg-surface-container-low focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    <span className="text-[11px] text-on-surface-variant hover:text-on-surface transition-colors">Remember me</span>
                  </label>
                  <a 
                    href="#" 
                    className="text-[11px] text-primary hover:underline" 
                    onClick={(e) => { e.preventDefault(); alert("Password recovery is simulated in this build."); }}
                  >
                    Forgot password?
                  </a>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Account Classification
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setRole('STUDENT')}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${role === 'STUDENT'
                        ? 'bg-primary-container border-primary text-on-primary-container'
                        : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                      Candidate / Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('RECRUITER')}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${role === 'RECRUITER'
                        ? 'bg-primary-container border-primary text-on-primary-container'
                        : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                      Recruiter / Employer
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" loading={loading} fullWidth className="mt-4">
                {isLogin ? 'Sign In to Dashboard' : 'Create Account'}
              </Button>
            </form>

            {/* Social Logins */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-[1px] bg-outline-variant"></div>
                <span className="text-[10px] font-mono text-on-surface-variant/60">OR CONTINUE WITH</span>
                <div className="flex-1 h-[1px] bg-outline-variant"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => alert('Social authentication is mocked for development.')}
                  className="py-2.5 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant rounded-xl text-[11px] font-medium text-on-surface transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.44-2.885-6.44-6.44s2.885-6.44 6.44-6.44c1.633 0 3.129.61 4.274 1.621l3.031-3.031C19.015 2.185 15.82 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.895 0 10.865-4.224 10.865-11.24 0-.768-.068-1.5-.205-2.185H12.24z" />
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert('Social authentication is mocked for development.')}
                  className="py-2.5 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant rounded-xl text-[11px] font-medium text-on-surface transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  <span>Github</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant pt-5 text-center">
            <button
              type="button"
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
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

    </ClickSpark>
  </div>
);
}
