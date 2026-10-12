import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Database, UserCheck, AlertCircle } from 'lucide-react';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import DotGrid from '../../../components/ui/DotGrid';
import ClickSpark from '../../../components/ui/ClickSpark';

export default function PrivacyPolicyPage({ theme, toggleTheme }) {
  const navigateToHome = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="theme-jobsplanet min-h-screen w-full bg-background text-on-surface font-sans antialiased overflow-x-hidden relative selection:bg-primary/20 selection:text-primary">
      <ClickSpark
        sparkColor={theme === 'dark' ? '#3B82F6' : '#2563EB'}
        sparkSize={10}
        sparkRadius={16}
        sparkCount={8}
        duration={400}
      >
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
        <header className="relative z-20 flex justify-between items-center w-full px-4 sm:px-8 h-20 sticky top-0 bg-surface-container-lowest/90 border-b border-outline-variant shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-4">
            <a href="/" onClick={navigateToHome} className="flex items-center gap-2 group">
              <img
                alt="AlignGrad Logo"
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-102"
                src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
              />
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={navigateToHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-surface-container/90 border border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span>Back to Home</span>
            </button>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12">
          {/* Header Card with Frosted Backdrop */}
          <div className="backdrop-blur-md bg-surface-container-lowest/85 border border-outline-variant/60 rounded-3xl p-6 sm:p-10 shadow-sm mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold mb-4">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Legal Documentation</span>
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl font-medium text-heading mb-3">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Effective Date: October 8, 2026 • Last Reviewed: October 2026
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              AlignGrade Recruitment Systems ("AlignGrade", "we", "us", or "our") is committed to protecting your privacy and ensuring transparency in how your personal and skill assessment data is processed.
            </p>
          </div>

          {/* Policy Sections */}
          <div className="backdrop-blur-md bg-surface-container-lowest/85 border border-outline-variant/60 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>1. Information We Collect</span>
              </h2>
              <p>
                When you interact with AlignGrade as a Candidate, Recruiter, or Visitor, we collect the following categories of information:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                <li><strong>Account Information:</strong> Full name, verified email address, encrypted credentials, telephone number, and profile image.</li>
                <li><strong>Candidate Profile Data:</strong> Higher education records, degrees, projects, self-declared skills, work experience, certifications, and portfolio links.</li>
                <li><strong>Skill Assessment &amp; Proctoring Telemetry:</strong> Standardized test responses, session answer timestamps, test score outcomes, focus state shifts, and verified rating badges.</li>
                <li><strong>Recruiter &amp; Company Verification:</strong> Company registration certificates, GST/CIN documents, official business domain emails, and recruiter designation.</li>
                <li><strong>Technical &amp; Log Data:</strong> IP addresses, browser fingerprint, session cookies, and interaction timestamps.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-3 pt-6 border-t border-outline-variant/60">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>2. How We Use Your Information</span>
              </h2>
              <p>We process your data strictly for legitimate operational purposes, including:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>Computing automated skill coverage algorithms to align candidates with recruiter job specifications.</li>
                <li>Generating immutable verified rating badges (70%+ score threshold) stored on candidate profiles.</li>
                <li>Delivering personalized candidate recommendations to verified recruiters via Top Talents discovery.</li>
                <li>Preventing assessment fraud, question leaks, automated bot attempts, and account impersonation.</li>
                <li>Processing secure payment transactions and generating official tax receipts for recruiters.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3 pt-6 border-t border-outline-variant/60">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>3. Assessment Privacy &amp; Question Bank Integrity</span>
              </h2>
              <p>
                To maintain the high validity of our 4,770+ assessment bank, questions and answer keys are scored server-side. Candidates receive overall percentage outcomes and verified skill badges. We do not sell test answer logs or candidate behavioral recordings to third-party ad networks.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3 pt-6 border-t border-outline-variant/60">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>4. Information Sharing &amp; Disclosure</span>
              </h2>
              <p>We do not sell personal data. We disclose your information only under the following conditions:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                <li><strong>To Recruiters:</strong> When you submit an application or opt-in to our public talent showcase, authorized recruiters can inspect your verified skill score, profile resume, and video pitch.</li>
                <li><strong>Service Providers:</strong> Cloud infrastructure (AWS S3), authentication partners (Google OAuth), and transactional email providers who adhere to strict data processing agreements.</li>
                <li><strong>Legal Compliance:</strong> If required by Indian law, regulatory authority, or court summons.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3 pt-6 border-t border-outline-variant/60">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>5. Data Security &amp; Retention</span>
              </h2>
              <p>
                All data in transit is encrypted using modern TLS (Transport Layer Security). Uploaded files and verified documents reside in secure AWS S3 buckets with presigned time-limited access tokens. Passwords are hash-encrypted using bcryptjs with salted rounds. We retain candidate records for as long as your account remains active or as required by statutory regulations.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3 pt-6 border-t border-outline-variant/60">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>6. Your Rights &amp; Choices</span>
              </h2>
              <p>As an AlignGrade user, you retain full rights to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>Access and export your profile, verified badges, and assessment history as a standardized PDF.</li>
                <li>Update or rectify inaccurate educational, personal, or employment details at any time.</li>
                <li>Request account deactivation or permanent deletion of uploaded resumes and videos.</li>
                <li>Revoke recruiter profile visibility from public discovery.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="space-y-3 pt-6 border-t border-outline-variant/60">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>7. Contact &amp; Grievance Officer</span>
              </h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy, you may contact our Grievance Redressal Team:
              </p>
              <div className="p-4 rounded-xl bg-surface-container border border-outline-variant text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div><strong>AlignGrade Recruitment Systems Pvt. Ltd.</strong></div>
                <div>Grievance Officer: Legal &amp; Compliance Department</div>
                <div>Email: privacy@aligngrade.com • support@aligngrade.com</div>
                <div>Location: Bengaluru, Karnataka, 560001, India</div>
              </div>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant py-8 px-4 text-center text-xs text-slate-500">
          <p>© 2026 AlignGrade Recruitment Systems. All rights reserved.</p>
        </footer>
      </ClickSpark>
    </div>
  );
}
