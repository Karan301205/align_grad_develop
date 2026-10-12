import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  User, 
  Lock, 
  Mail, 
  ArrowLeft, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Wallet,
  TrendingUp,
  CheckCircle2,
  Coins,
  ArrowRight
} from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import AnimatedContent from '../../../components/ui/AnimatedContent';
import ClickSpark from '../../../components/ui/ClickSpark';
import DotGrid from '../../../components/ui/DotGrid';
import GoogleAuthButton from '../../../components/ui/GoogleAuthButton';
import { formatErrorMessage } from '../../../utils/errorFormatter';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { LANDING_URL, RECRUITER_URL } from '../../../config';

export default function CandidateAuth({ setToken, setUser, theme, toggleTheme, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (/\s/.test(password)) {
      setError('Password cannot contain spaces.');
      return;
    }

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
        throw new Error(data.error || 'Authentication failed');
      }
      if (data.user && data.user.role !== 'STUDENT') {
        throw new Error('Access denied. This account is registered as a recruiter. Please sign in through the Recruiter portal.');
      }
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeToggle = (loginMode) => {
    setIsLogin(loginMode);
    setError('');
    const newPath = loginMode ? '/candidate/login' : '/candidate/signup';
    window.history.pushState({}, '', newPath);
  };

  const navigateToLanding = (e) => {
    e.preventDefault();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal && LANDING_URL) {
      window.location.href = `${LANDING_URL}/`;
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const navigateToRecruiter = (e) => {
    e.preventDefault();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal && RECRUITER_URL) {
      window.location.href = `${RECRUITER_URL}/recruiter/login`;
    } else {
      window.history.pushState({}, '', '/recruiter/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-on-surface font-sans antialiased overflow-x-hidden relative selection:bg-primary/20 selection:text-primary flex flex-col justify-between">
      <ClickSpark
        sparkColor={theme === 'dark' ? '#3B82F6' : '#2563EB'}
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        {error && formatErrorMessage(error, () => setError(''))}

        {/* Dynamic Background DotGrid */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.25]" style={{ minHeight: '100vh' }}>
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

        {/* Top Header */}
        <header className="relative z-10 w-full bg-surface-container-lowest/85 backdrop-blur-md border-b border-outline-variant">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" onClick={navigateToLanding} className="flex items-center gap-2.5">
                <img 
                  src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'} 
                  alt="AlignGrad Logo" 
                  className="h-9 w-auto object-contain"
                />
              </a>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={navigateToRecruiter}
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors font-headline"
              >
                Recruiter Portal
              </button>
              <div className="h-4 w-[1px] bg-outline-variant"></div>
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>
          </div>
        </header>

        {/* Main Split-Screen Container */}
        <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-5xl">
            <AnimatedContent distance={40} direction="vertical" delay={0.1}>
              <div className="rounded-3xl border border-outline-variant/80 bg-surface-container-lowest/90 backdrop-blur-md shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                
                {/* Left Side: Complete Candidate Login Showcase Image */}
                <div className="lg:col-span-5 relative min-h-[380px] sm:min-h-[460px] lg:min-h-full border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800 overflow-hidden group bg-surface-container">
                  <img
                    src="/candidate_login_showcase.jpg"
                    alt="AlignGrade Candidate Portal & Skill Assessment Hub"
                    className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-5 left-5 right-5 text-white pointer-events-none">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-emerald-700 dark:text-emerald-400 text-xs font-bold shadow-md backdrop-blur-md mb-2">
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Candidate Portal</span>
                    </div>
                    <p className="text-xs font-medium text-white/95 drop-shadow-sm leading-relaxed">
                      Prove your skills with 10-question benchmarks and unlock verified opportunities.
                    </p>
                  </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between relative">
                  {/* Return button */}
                  <div className="flex justify-between items-center mb-6">
                    <button
                      type="button"
                      onClick={navigateToLanding}
                      className="p-2 text-slate-500 hover:text-heading hover:bg-surface-container rounded-full transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Home</span>
                    </button>
                    <span className="text-xs font-semibold text-primary px-3 py-1 rounded-full bg-primary-container">
                      Candidate Access
                    </span>
                  </div>

                  <div>
                    <div className="mb-6">
                      <h1 className="font-headline text-2xl sm:text-3xl font-medium tracking-tight text-heading">
                        {isLogin ? 'Sign in to Your Account' : 'Create Free Candidate Account'}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {isLogin 
                          ? 'Access your verified skill scores, track gig milestones, and accept interview invites.' 
                          : 'Build your profile, prove your skills in minutes, and start earning side hustle income.'}
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {!isLogin && (
                        <Input
                          label="Your Full Name"
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. Leo Carter"
                          containerClassName="animate-fade-in"
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
                        <label className="block text-[11px] font-headline font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            className="w-full bg-surface-container border border-outline-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl pl-4 pr-11 py-2.5 text-sm text-heading placeholder-slate-400 transition-all"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
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

                      {isLogin && (
                        <div className="flex justify-between items-center py-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="rounded border-outline-variant text-primary bg-surface-container focus:ring-0 w-3.5 h-3.5"
                              checked={rememberMe}
                              onChange={e => setRememberMe(e.target.checked)}
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-400 hover:text-heading transition-colors">Remember me</span>
                          </label>
                          <button 
                            type="button" 
                            className="text-xs text-primary hover:underline cursor-pointer bg-transparent border-none p-0 font-medium" 
                            onClick={() => setIsForgotPasswordOpen(true)}
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      <Button type="submit" loading={loading} fullWidth className="mt-4 shadow-sm shadow-primary/20">
                        {isLogin ? 'Sign In to Candidate Dashboard' : 'Claim Verified Score & Start Earning'}
                      </Button>
                    </form>

                    <div className="relative my-4 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-outline-variant/60"></div>
                      </div>
                      <span className="relative bg-surface-container-lowest px-3 text-[10px] font-headline font-medium text-slate-500 uppercase tracking-wider">
                        OR CONTINUE WITH
                      </span>
                    </div>

                    <GoogleAuthButton
                      role="STUDENT"
                      onSuccess={(data) => {
                        setToken(data.token);
                        setUser(data.user);
                      }}
                      onError={(msg) => setError(msg)}
                    />
                  </div>

                  {/* Mode Toggle Footer */}
                  <div className="border-t border-outline-variant pt-4 mt-6 text-center">
                    <button
                      type="button"
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-heading transition-colors cursor-pointer"
                      onClick={() => handleModeToggle(!isLogin)}
                    >
                      {isLogin ? (
                        <span>Don't have an account? <strong className="text-primary hover:underline font-bold">Sign up (Free forever)</strong></span>
                      ) : (
                        <span>Already registered? <strong className="text-primary hover:underline font-bold">Sign in</strong></span>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </AnimatedContent>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-6 text-center text-[11px] text-slate-500 border-t border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 AlignGrade Candidate &amp; Side Hustle Network</span>
            <div className="flex gap-4">
              <a href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="/terms-and-conditions" className="hover:text-primary transition-colors">Terms of Service</a>
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
      </ClickSpark>
    </div>
  );
}
