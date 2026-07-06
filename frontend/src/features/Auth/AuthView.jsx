import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';
import { API_BASE } from '../../constants';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ThemeToggle from '../../components/ui/ThemeToggle';
import AnimatedContent from '../../components/ui/AnimatedContent';

export default function AuthView({ setToken, setUser, theme, toggleTheme }) {
  // Authentication & Form States
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

  // Interactive Match Simulator State
  const [simulatedReactRating, setSimulatedReactRating] = useState(3);
  const [isSimulatingTest, setIsSimulatingTest] = useState(false);
  const [simQuestionsPassed, setSimQuestionsPassed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/signup`;
    const payload = isLogin ? { email, password } : { email, password, role, name };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
              onClick={() => triggerAuthFlow('login')}
              className="text-xs font-semibold px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => triggerAuthFlow('register')}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/95 transition-all shadow-sm shadow-primary/20"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section — asymmetric, product-first */}
      <section id="demo" className="relative pt-16 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Off-center soft accent, drifts on scroll instead of a tiled dot-grid */}
        <AnimatedContent
          parallax
          parallaxStrength={90}
          distance={0}
          animateOpacity={false}
          className="pointer-events-none absolute -top-32 -right-40 -z-10 h-[28rem] w-[28rem] rounded-full opacity-[0.14] blur-3xl brand-gradient"
        >
          <div className="h-full w-full" />
        </AnimatedContent>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left: copy, left-aligned, not centered */}
          <div className="lg:col-span-5">
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
                  onClick={() => triggerAuthFlow('register')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold text-sm hover:opacity-90 transition-all shadow-md"
                >
                  Join as a Candidate
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => triggerAuthFlow('register')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-high transition-all"
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
                <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-4 mb-5">
                      <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-on-surface-variant">
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
                        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden relative">
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
                        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden relative">
                          <div className="h-full bg-on-surface-variant/40 rounded-full w-[80%]" />
                        </div>
                      </div>
                    </div>

                    {!simQuestionsPassed && (
                      <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          Leo's React rating is <strong>3/5</strong>. The role on the right needs <strong>4/5</strong> — locked. Try the test.
                        </p>
                        <button
                          onClick={runVerificationSimulation}
                          disabled={isSimulatingTest}
                          className="mt-3 w-full py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-on-primary font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2"
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
                    <span className={simQuestionsPassed ? "text-success font-bold" : "text-amber-500 font-bold"}>
                      {simQuestionsPassed ? "VERIFIED L5" : "SELF-RATED"}
                    </span>
                  </div>
                </div>

                {/* Job card */}
                <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-sm sm:mt-8">
                  <div>
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4 mb-5">
                      <h4 className="text-sm font-bold text-on-surface">Frontend Engineer</h4>
                      <span className="text-[10px] font-mono text-zinc-500">$8k/mo</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center bg-surface-container-high rounded-xl p-3 border border-outline-variant/60 text-xs">
                        <span className="font-medium">React</span>
                        <span className="font-mono px-2 py-0.5 rounded font-bold">Min 4/5</span>
                      </div>
                      <div className="flex justify-between items-center bg-surface-container-high rounded-xl p-3 border border-outline-variant/60 text-xs">
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
                        className="w-full py-3 bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md animate-fade-in"
                      >
                        <span>Submit Application</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 bg-surface-container-high border border-outline-variant text-on-surface-variant/50 rounded-xl font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* 4. Two portals, deliberately asymmetric — not mirrored cards */}
      <section id="features" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-outline-variant">
        <AnimatedContent distance={30} direction="vertical" threshold={0.2}>
          <div className="max-w-xl mb-14">
            <h2 className="font-headline text-3xl font-bold text-on-surface">
              One dataset, two very different logins.
            </h2>
            <p className="text-sm text-on-surface-variant mt-2">
              Candidates and recruiters look at the same skill records from opposite ends.
            </p>
          </div>
        </AnimatedContent>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* Student Panel — wider, primary */}
          <AnimatedContent distance={40} direction="vertical" threshold={0.15} delay={0.1} stagger={0.1} className="lg:col-span-7 flex flex-col bg-surface-container border border-outline-variant rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-8">
              <User className="w-4 h-4 text-primary" />
              <h3 className="font-headline text-lg font-bold text-on-surface">For Students & Candidates</h3>
            </div>

            <div className="divide-y divide-outline-variant/60 flex-1">
              <div className="py-4 first:pt-0">
                <p className="text-sm font-bold text-on-surface">Locked application, unlocked in minutes</p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Fall short of a job's threshold and you get a code test, not a silent rejection. Pass it to raise the rating that matters.</p>
              </div>
              <div className="py-4">
                <p className="text-sm font-bold text-on-surface">A resume that reads your verified data</p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Generated straight from your rated and verified skills — no manual formatting.</p>
              </div>
              <div className="py-4 last:pb-0">
                <p className="text-sm font-bold text-on-surface">60-second video, sent with every application</p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Say the things a rating can't. Recruiters watch before they screen.</p>
              </div>
            </div>

            <button
              onClick={() => triggerAuthFlow('register')}
              className="mt-8 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors self-start"
            >
              Create Candidate Profile <ChevronRight className="w-4 h-4" />
            </button>
          </AnimatedContent>

          {/* Recruiter Panel — narrower, inverted for contrast */}
          <AnimatedContent distance={40} direction="vertical" threshold={0.15} delay={0.2} stagger={0.1} className="lg:col-span-5 flex flex-col bg-zinc-950 dark:bg-zinc-900 border border-zinc-900 dark:border-outline-variant rounded-2xl p-8 text-white">
            <div className="flex items-center gap-2 mb-8">
              <Briefcase className="w-4 h-4 text-zinc-400" />
              <h3 className="font-headline text-lg font-bold">For Recruiter Talent Teams</h3>
            </div>

            <div className="divide-y divide-white/10 flex-1">
              <div className="py-4 first:pt-0">
                <p className="text-sm font-bold">Set the bar per skill, per role</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Minimum ratings on React, SQL, whatever the job needs — enforced automatically.</p>
              </div>
              <div className="py-4">
                <p className="text-sm font-bold">Only see candidates who cleared the bar</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Self-rated and verified scores sit side by side, so inflation is visible.</p>
              </div>
              <div className="py-4 last:pb-0">
                <p className="text-sm font-bold">Video before the first call</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Skim a minute of footage instead of scheduling a screen.</p>
              </div>
            </div>

            <button
              onClick={() => triggerAuthFlow('register')}
              className="mt-8 inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-zinc-300 transition-colors self-start"
            >
              Register Recruiter Hub <ChevronRight className="w-4 h-4" />
            </button>
          </AnimatedContent>

        </div>
      </section>

      {/* 5. Trust Workflow & Timeline (Linear styled) */}
      <section id="process" className="py-16 md:py-24 border-t border-outline-variant bg-surface-container-low/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <AnimatedContent distance={30} direction="vertical" threshold={0.2}>
            <div className="max-w-xl mb-14">
              <h2 className="font-headline text-3xl font-bold text-on-surface">
                From self-rating to interview, four steps.
              </h2>
              <p className="text-sm text-on-surface-variant mt-2">
                Nothing here is a black box — every rating change traces back to a step below.
              </p>
            </div>
          </AnimatedContent>

          <AnimatedContent distance={30} direction="vertical" threshold={0.15} stagger={0.15}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">

              <div className="relative border-t-2 border-primary pt-5">
                <span className="block font-mono text-4xl font-bold text-outline-variant leading-none mb-3">01</span>
                <h4 className="text-sm font-bold text-on-surface">Register & self-rate</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  Students rate themselves on core stacks. Recruiters submit company details for verification.
                </p>
              </div>

              <div className="relative border-t-2 border-outline-variant pt-5">
                <span className="block font-mono text-4xl font-bold text-outline-variant leading-none mb-3">02</span>
                <h4 className="text-sm font-bold text-on-surface">Thresholds run automatically</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  Every application is checked against a job's minimum ratings the moment it's opened.
                </p>
              </div>

              <div className="relative border-t-2 border-outline-variant pt-5">
                <span className="block font-mono text-4xl font-bold text-outline-variant leading-none mb-3">03</span>
                <h4 className="text-sm font-bold text-on-surface">Locked? Take the test</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  A short MCQ test on the exact skill in question. Pass it and the rating updates immediately.
                </p>
              </div>

              <div className="relative border-t-2 border-outline-variant pt-5">
                <span className="block font-mono text-4xl font-bold text-on-surface leading-none mb-3">04</span>
                <h4 className="text-sm font-bold text-on-surface">Recruiter reviews, verified</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  Resume, verified scores and a video pitch land together — no unscreened calls needed.
                </p>
              </div>

            </div>
          </AnimatedContent>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-surface-container-low border-t border-outline-variant py-12 text-center text-xs text-on-surface-variant font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-on-surface">AlignGrad</span>
            <span className="text-[10px] font-mono text-zinc-500">© 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-on-surface transition-colors" onClick={e => e.preventDefault()}>Privacy Policy</a>
            <a href="#" className="hover:text-on-surface transition-colors" onClick={e => e.preventDefault()}>Terms of Service</a>
            <a href="#" className="hover:text-on-surface transition-colors" onClick={e => e.preventDefault()}>Recruitment Standards</a>
          </div>
        </div>
      </footer>


      {/* 7. Slide-over Auth Drawer (Linear-style panel) */}
      <div 
        className={`fixed inset-0 z-50 transition-opacity duration-300 ease-out bg-zinc-950/40 backdrop-blur-sm ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
      >
        <div 
          className={`absolute top-0 right-0 h-full w-full max-w-md bg-surface-container border-l border-outline-variant shadow-2xl p-8 flex flex-col justify-between transition-transform duration-300 ease-out transform ${
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
                <span className="font-headline text-sm font-bold text-on-surface text-zinc-900 dark:text-zinc-100">
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

    </div>
  );
}

