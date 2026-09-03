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
  ChevronRight
} from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import ClickSpark from '../../../components/ui/ClickSpark';
import AnimatedContent from '../../../components/ui/AnimatedContent';
import GoogleAuthButton from '../../../components/ui/GoogleAuthButton';
import { formatErrorMessage } from '../../../utils/errorFormatter';

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

  const triggerAuthFlow = (mode = 'login') => {
    setIsLogin(mode === 'login');
    setIsDrawerOpen(true);
    setError('');
  };

  const navigateToCandidate = (mode = 'login') => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      window.history.pushState({}, '', `/candidate/${mode}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      window.location.href = `https://career.aligngrad.com/candidate/${mode}`;
    }
  };

  const navigateToRecruiter = (mode = 'login') => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      window.history.pushState({}, '', `/recruiter/${mode}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      window.location.href = `https://hire.aligngrad.com/recruiter/${mode}`;
    }
  };

  return (
    <div className="theme-jobsplanet min-h-screen w-full bg-background text-on-surface font-sans antialiased overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <ClickSpark
        sparkColor={theme === 'dark' ? '#ffffff' : '#000000'}
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        {error && formatErrorMessage(error, () => setError(''))}

        {/* TopNavBar Navigation Shell */}
        <nav className="flex justify-between items-center w-full px-4 sm:px-8 h-16 sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <img
              alt="AlignGrad Logo"
              className="h-10 w-auto object-contain"
              src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
            />
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#solutions" className="text-primary font-bold border-b-2 border-primary pb-0.5">Solutions</a>
            <a href="#assessments" className="text-on-surface-variant hover:text-primary transition-colors">Assessments</a>
            <a href="#enterprise" className="text-on-surface-variant hover:text-primary transition-colors">Enterprise</a>
            <a href="#pricing" className="text-on-surface-variant hover:text-primary transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

            {/* <button
              onClick={() => triggerAuthFlow('login')}
              className="hidden sm:inline-flex text-xs font-semibold px-3 py-2 text-on-surface hover:text-primary transition-colors"
            >
              Sign In
            </button> */}

            <button
              onClick={() => navigateToCandidate('login')}
              className="btn-secondary px-3.5 py-2 rounded-lg font-label-md text-xs cursor-pointer"
            >
              Candidate Portal
            </button>

            <button
              onClick={() => navigateToRecruiter('login')}
              className="btn-primary px-4 py-2 rounded-lg font-label-md text-xs cursor-pointer shadow-md"
            >
              Recruiter Hub
            </button>
          </div>
        </nav>

        {/* Main Content Canvas */}
        <main className="relative overflow-hidden">
          {/* Hero Section */}
          <section className="hero-gradient pt-12 md:pt-16 pb-6 md:pb-8 px-4 sm:px-8 relative">
            <div className="ambient-glow -top-48 -left-48"></div>
            <div
              className="ambient-glow top-0 right-0"
              style={{ background: 'radial-gradient(circle, rgba(148, 163, 184, 0.05) 0%, rgba(255, 255, 255, 0) 70%)' }}
            ></div>

            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left mb-12">
                <div className="col-span-12 lg:col-span-7">
                  <AnimatedContent distance={80} direction="vertical" duration={0.8} ease="power3.out" delay={0.1}>
                    <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary mb-6 leading-tight tracking-tight">
                      Hire on merit, <br className="hidden md:block" />
                      <span className="text-on-primary-container">not just resumes</span>
                    </h1>

                    <p className="font-body text-base sm:text-lg text-secondary max-w-xl mb-8 leading-relaxed">
                      The institutional-grade skill verification platform for technical and professional roles. Reduce time-to-hire by 60% with data-driven meritocracy.
                    </p>

                    <div className="flex flex-col sm:flex-row items-start justify-start gap-4">
                      <button
                        onClick={() => triggerAuthFlow('register')}
                        className="btn-primary px-8 py-3.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg hover:brightness-110 cursor-pointer"
                      >
                        <span>Start Verifying Now</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                      <button
                        onClick={() => navigateToCandidate('signup')}
                        className="btn-secondary px-8 py-3.5 rounded-lg font-semibold text-sm cursor-pointer"
                      >
                        View Sample Reports
                      </button>
                    </div>
                  </AnimatedContent>
                </div>

                <div className="col-span-12 lg:col-span-5 flex justify-center lg:justify-end">
                  <AnimatedContent distance={80} direction="horizontal" duration={0.8} ease="power3.out" delay={0.2}>
                    <div className="relative rounded-2xl overflow-hidden">
                      <img 
                        src="/handshake.webp" 
                        alt="Handshake Meritocracy Verification" 
                        className="w-full max-w-md lg:max-w-full h-auto object-contain transition-transform duration-500" 
                      />
                    </div>
                  </AnimatedContent>
                </div>
              </div>

              {/* Hero Visual - Bento Grid Style */}
              <div className="grid grid-cols-12 gap-4 mt-12 items-stretch relative">
                {/* Left Column: Image + Rapid Verification */}
                <div className="col-span-12 lg:col-span-4 flex flex-col justify-end text-left relative z-10">
                  <AnimatedContent distance={60} direction="horizontal" reverse={true} duration={0.8} delay={0.3} className="h-full flex flex-col justify-end">
                    <div className="-mt-16 -mb-8 lg:-mt-14 relative z-10 flex justify-center">
                      <img 
                        src="/laptop_guy_hd.png" 
                        alt="Developer working on Laptop" 
                        className="w-full max-w-sm sm:max-w-md lg:max-w-full h-70 sm:h-82 lg:h-82 object-contain -scale-x-100 transition-transform duration-500 drop-shadow-md" 
                      />
                    </div>
                    <div className="flex-1 glass-card rounded-xl p-3 border-outline-variant flex flex-col justify-center">
                      <span className="material-symbols-outlined text-primary mb-3 text-3xl">speed</span>
                      <h3 className="text-lg font-headline font-bold text-primary mb-1">Rapid Verification</h3>
                      <p className="text-xs text-secondary leading-relaxed">Assessments deliver results in real-time with comprehensive audit logs.</p>
                    </div>
                  </AnimatedContent>
                </div>

                {/* Right Column: Verified Skill Dashboard */}
                <div className="col-span-12 lg:col-span-8">
                  <AnimatedContent distance={60} direction="horizontal" duration={0.8} delay={0.3} className="glass-card rounded-xl overflow-hidden shadow-lg border-outline-variant text-left flex flex-col h-full">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-container-low border-b border-outline-variant">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-error/20 border border-error/40"></div>
                        <div className="w-3 h-3 rounded-full bg-secondary-container border border-on-secondary-container/20"></div>
                        <div className="w-3 h-3 rounded-full bg-tertiary-fixed-dim border border-on-tertiary-fixed-variant/20"></div>
                      </div>
                      <div className="flex-grow text-center text-xs font-mono text-on-surface-variant font-medium">
                        Verified Skill Dashboard - Lead Software Engineer Role
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-center">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-surface-container border border-outline-variant">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1">CANDIDATE SCORE</div>
                            <div className="text-3xl font-headline font-bold text-primary">94.8<span className="text-sm font-normal text-secondary">/100</span></div>
                          </div>
                          <div className="p-4 rounded-lg bg-surface-container border border-outline-variant">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1">PERCENTILE</div>
                            <div className="text-3xl font-headline font-bold text-primary">Top 2%</div>
                          </div>
                        </div>

                        <div className="md:col-span-2 p-4 rounded-lg bg-surface-container-lowest border border-outline-variant relative flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-xs font-bold text-primary uppercase font-mono">Skill Distribution</span>
                              <span className="material-symbols-outlined text-secondary text-sm">analytics</span>
                            </div>

                            <div className="space-y-3">
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                  <span>System Architecture</span>
                                  <span className="font-bold text-primary">98%</span>
                                </div>
                                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                                  <div className="h-full bg-primary w-[98%]"></div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                  <span>Concurrency Patterns</span>
                                  <span className="font-bold text-primary">91%</span>
                                </div>
                                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                                  <div className="h-full bg-primary w-[91%]"></div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                  <span>Cloud Infrastructure</span>
                                  <span className="font-bold text-primary">87%</span>
                                </div>
                                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                                  <div className="h-full bg-primary w-[87%]"></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end">
                            <div className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-mono font-bold">
                              VERIFIED ON-CHAIN
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AnimatedContent>
                </div>
              </div>
            </div>
          </section>

          {/* Verified Skills Section */}
          <section id="solutions" className="py-6 md:py-8 px-4 sm:px-8 bg-surface-container-lowest border-t border-outline-variant">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-12 gap-6 items-center">
                <div className="col-span-12 lg:col-span-5">
                  <AnimatedContent distance={60} direction="horizontal" reverse={true} duration={0.8}>
                    <div className="glass-card rounded-2xl p-6 border border-outline-variant shadow-sm space-y-4">
                      <h2 className="text-2xl font-headline font-bold text-primary">Verified Skills</h2>
                      <p className="text-xs text-secondary leading-relaxed">
                        Our proprietary verification engine goes beyond simple tests. We analyze real-world task performance to build a high-fidelity skill profile for every candidate.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex gap-2.5 items-start">
                          <div className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-on-secondary-container text-[11px] font-bold">check</span>
                          </div>
                          <span className="text-xs text-on-surface font-medium">Algorithmic difficulty mapping for fair comparisons.</span>
                        </li>
                        <li className="flex gap-2.5 items-start">
                          <div className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-on-secondary-container text-[11px] font-bold">check</span>
                          </div>
                          <span className="text-xs text-on-surface font-medium">Anti-cheat behavioral analysis and session integrity monitoring.</span>
                        </li>
                        <li className="flex gap-2.5 items-start">
                          <div className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-on-secondary-container text-[11px] font-bold">check</span>
                          </div>
                          <span className="text-xs text-on-surface font-medium">Integrated IDE and sandbox environments.</span>
                        </li>
                      </ul>
                    </div>
                  </AnimatedContent>
                </div>

                <div className="col-span-12 lg:col-span-7 flex justify-center items-center">
                  <AnimatedContent distance={60} direction="horizontal" duration={0.8}>
                    <img 
                      src="/women_studying.webp" 
                      alt="Women Studying" 
                      className="w-full max-w-xs sm:max-w-sm h-auto object-contain -scale-x-100 transition-transform duration-500" 
                    />
                  </AnimatedContent>
                </div>
              </div>
            </div>
          </section>

          {/* Premium Assessments Section */}
          <section id="assessments" className="py-20 px-4 sm:px-8 border-t border-outline-variant">
            <div className="max-w-6xl mx-auto">
              <AnimatedContent distance={40} direction="vertical" duration={0.6}>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-headline font-bold text-primary mb-3">Premium Assessments</h2>
                  <p className="text-sm text-secondary max-w-xl mx-auto">Crafted by industry experts and PhDs to ensure maximum predictive validity for on-the-job success.</p>
                </div>
              </AnimatedContent>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tech Card */}
                <AnimatedContent distance={60} direction="vertical" delay={0.1} duration={0.8}>
                  <div className="p-6 bg-white border border-outline-variant rounded-xl hover:shadow-lg transition-all group h-full flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-container transition-colors">
                        <span className="material-symbols-outlined text-primary group-hover:text-white">code</span>
                      </div>
                      <h3 className="text-lg font-headline font-bold text-primary mb-2">Software Engineering</h3>
                      <p className="text-xs text-secondary leading-relaxed mb-6">Systems design, data structures, and production-level debugging scenarios.</p>
                    </div>
                    <button onClick={() => navigateToCandidate('login')} className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                      Explore Track <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </AnimatedContent>

                {/* Data Card */}
                <AnimatedContent distance={60} direction="vertical" delay={0.25} duration={0.8}>
                  <div className="p-6 bg-white border border-outline-variant rounded-xl hover:shadow-lg transition-all group h-full flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-container transition-colors">
                        <span className="material-symbols-outlined text-primary group-hover:text-white">monitoring</span>
                      </div>
                      <h3 className="text-lg font-headline font-bold text-primary mb-2">Data &amp; Analytics</h3>
                      <p className="text-xs text-secondary leading-relaxed mb-6">Statistical modeling, SQL optimization, and visual insight communication.</p>
                    </div>
                    <button onClick={() => navigateToCandidate('login')} className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                      Explore Track <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </AnimatedContent>

                {/* Leadership Card */}
                <AnimatedContent distance={60} direction="vertical" delay={0.4} duration={0.8}>
                  <div className="p-6 bg-white border border-outline-variant rounded-xl hover:shadow-lg transition-all group h-full flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-container transition-colors">
                        <span className="material-symbols-outlined text-primary group-hover:text-white">psychology</span>
                      </div>
                      <h3 className="text-lg font-headline font-bold text-primary mb-2">Leadership &amp; Strategy</h3>
                      <p className="text-xs text-secondary leading-relaxed mb-6">Conflict resolution, architectural roadmapping, and team scaling dynamics.</p>
                    </div>
                    <button onClick={() => navigateToCandidate('login')} className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                      Explore Track <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </AnimatedContent>
              </div>
            </div>
          </section>

          {/* Enterprise-Grade Matching */}
          <section id="enterprise" className="py-20 px-4 sm:px-8 bg-primary-container text-white overflow-hidden relative">
            <div className="max-w-6xl mx-auto relative z-10">
              <div className="grid grid-cols-12 gap-8 items-center">
                <div className="col-span-12 lg:col-span-6 space-y-6">
                  <AnimatedContent distance={60} direction="horizontal" reverse={true} duration={0.8}>
                    <div className="inline-block px-3 py-1 bg-white/10 rounded-full border border-white/20 mb-4">
                      <span className="font-mono text-[10px] uppercase text-primary-fixed font-bold tracking-wider">SCALABLE INFRASTRUCTURE</span>
                    </div>
                    <h2 className="text-3xl font-headline font-bold mb-3">Enterprise-Grade Matching</h2>
                    <p className="text-sm text-on-primary-container leading-relaxed mb-6">
                      Our AI-driven matching engine uses verified skill data to rank candidates against your specific headcount requirements, ensuring cultural and technical alignment at scale.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-2xl font-bold mb-1">99.9%</div>
                        <div className="text-[10px] font-mono text-on-primary-container uppercase">Platform Uptime</div>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-2xl font-bold mb-1">SSO</div>
                        <div className="text-[10px] font-mono text-on-primary-container uppercase">SAML Integrated</div>
                      </div>
                    </div>
                  </AnimatedContent>
                </div>

                <div className="col-span-12 lg:col-span-6">
                  <AnimatedContent distance={60} direction="horizontal" duration={0.8}>
                    <div className="p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl space-y-6">
                      <div className="space-y-4">
                        <p className="text-sm italic leading-relaxed text-slate-200">
                          "AlignGrad has fundamentally changed how we view talent. We no longer rely on pedigree; we rely on proof."
                        </p>
                        <p className="text-xs font-bold text-white">— Sarah Chen, VP of Talent at GlobalTech</p>
                      </div>
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between opacity-70 text-xs font-mono font-bold tracking-wider">
                        <span>MICROSOFT</span>
                        <span>AIRBNB</span>
                        <span>STRIPE</span>
                        <span>ADOBE</span>
                      </div>
                    </div>
                  </AnimatedContent>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section id="pricing" className="py-20 px-4 sm:px-8 bg-surface-container-low text-center border-t border-outline-variant">
            <AnimatedContent distance={60} direction="vertical" duration={0.8}>
              <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-3xl font-headline font-bold text-primary">Ready to build a high-performance team?</h2>
                <p className="text-sm text-secondary">Join the elite organizations using AlignGrad to verify skills and hire with absolute confidence.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => triggerAuthFlow('register')}
                    className="btn-primary px-8 py-3.5 rounded-lg font-bold text-sm w-full sm:w-auto cursor-pointer"
                  >
                    Get Started for Free
                  </button>
                  <button
                    onClick={() => navigateToRecruiter('login')}
                    className="btn-secondary px-8 py-3.5 rounded-lg font-bold text-sm w-full sm:w-auto cursor-pointer"
                  >
                    Contact Sales
                  </button>
                </div>
                <p className="text-[11px] font-mono text-outline">No credit card required for 14-day trial.</p>
              </div>
            </AnimatedContent>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-surface-container-lowest border-t border-outline-variant py-12 px-4 sm:px-8 text-xs">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-8">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <img
                  alt="AlignGrad Logo"
                  className="h-14 w-auto object-contain"
                  src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
                />
                
              </div>
              <p className="text-secondary leading-relaxed max-w-xs">
                The institutional-grade platform for global recruitment and skill verification.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-primary mb-3">Product</h4>
              <ul className="space-y-2 text-secondary">
                <li className="hover:text-primary cursor-pointer">Assessments</li>
                <li className="hover:text-primary cursor-pointer">Verification</li>
                <li className="hover:text-primary cursor-pointer">Pricing</li>
                <li className="hover:text-primary cursor-pointer">Security</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-primary mb-3">Company</h4>
              <ul className="space-y-2 text-secondary">
                <li className="hover:text-primary cursor-pointer">About Us</li>
                <li className="hover:text-primary cursor-pointer">Customers</li>
                <li className="hover:text-primary cursor-pointer">Careers</li>
                <li className="hover:text-primary cursor-pointer">Blog</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-primary mb-3">Support</h4>
              <ul className="space-y-2 text-secondary">
                <li className="hover:text-primary cursor-pointer">Help Center</li>
                <li className="hover:text-primary cursor-pointer">API Docs</li>
                <li className="hover:text-primary cursor-pointer">Status</li>
                <li className="hover:text-primary cursor-pointer">Contact</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-primary mb-3">Legal</h4>
              <ul className="space-y-2 text-secondary">
                <li className="hover:text-primary cursor-pointer">Privacy</li>
                <li className="hover:text-primary cursor-pointer">Terms</li>
                <li className="hover:text-primary cursor-pointer">Compliance</li>
              </ul>
            </div>
          </div>

          <div className="max-w-6xl mx-auto pt-6 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4 text-outline font-mono text-[11px]">
            <p>© 2026 AlignGrad Recruitment Systems. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="hover:text-primary cursor-pointer">English (US)</span>
              <span className="hover:text-primary cursor-pointer">System Status: Operational</span>
            </div>
          </div>
        </footer>

        {/* Auth Drawer / Modal Overlay */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-surface-container border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-outline-variant pb-4">
                <div>
                  <h3 className="text-xl font-headline font-bold text-on-surface">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {isLogin ? 'Sign in to access your portal' : 'Join AlignGrad to verify your skills'}
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

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

                {isLogin && (
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
                  </div>
                )}

                <Button type="submit" loading={loading} fullWidth className="mt-4">
                  {isLogin ? 'Sign In to Dashboard' : 'Create Account'}
                </Button>
              </form>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/60"></div>
                </div>
                <span className="relative bg-surface-container px-3 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
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
        )}
      </ClickSpark>
    </div>
  );
}
