import React from 'react';
import { ArrowLeft, Scale, ShieldAlert, CheckCircle, FileText, AlertTriangle } from 'lucide-react';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import DotGrid from '../../../components/ui/DotGrid';
import ClickSpark from '../../../components/ui/ClickSpark';

export default function TermsAndConditionsPage({ theme, toggleTheme }) {
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
              <Scale className="w-4 h-4 text-primary" />
              <span>Terms of Service</span>
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl font-medium text-heading mb-3">
              Terms &amp; Conditions
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Effective Date: October 8, 2026 • Governing Law: Laws of India
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Please read these terms carefully before accessing or using the AlignGrade platform, skill assessment system, or freelance gigs marketplace.
            </p>
          </div>

          {/* Terms Content */}
          <div className="backdrop-blur-md bg-surface-container-lowest/85 border border-outline-variant/60 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>1. Acceptance &amp; Eligibility</span>
              </h2>
              <p>
                By creating an account, browsing job listings, posting employment opportunities, or attempting an AlignGrade skill assessment, you agree to be bound by these Terms and Conditions. You must be at least 18 years of age or possess legal guardian consent to register.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3 pt-6 border-t border-outline-variant/60">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>2. Account Classifications &amp; Responsibilities</span>
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                <li><strong>Candidate Accounts:</strong> Dedicated to individual learners, students, and professionals. Candidates warrant that all profile details (academics, experience, portfolio code) reflect true factual achievements.</li>
                <li><strong>Recruiter Accounts:</strong> Reserved for legitimate organizations and employers. Recruiters must verify company authenticity with valid legal documentation (e.g. GST/CIN registration) to publish jobs and contact candidates.</li>
                <li><strong>Credential Confidentiality:</strong> Users are solely responsible for maintaining the confidentiality of their login credentials.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3 pt-6 border-t border-outline-variant/60">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>3. Skill Assessment &amp; Anti-Cheating Integrity Policy</span>
              </h2>
              <p>
                The core premise of AlignGrade is objective, uncompromised meritocracy. Users agree to the following strict examination rules:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>Assessments must be completed independently without third-party proxy assistance or automated AI solvers.</li>
                <li>Extracting, recording, reverse engineering, or publicly leaking questions from our 4,770+ item bank is strictly forbidden.</li>
                <li>A score of 70% or greater grants an immutable Verified Badge for that skill track. Candidates who do not meet 70% are granted remedial retake privileges after a learning interval.</li>
                <li>Violations of assessment integrity will result in immediate disqualification, badge revocation, and permanent account suspension.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3 pt-6 border-t border-outline-variant/60">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>4. Recruiter Conduct &amp; Fair Hiring Obligations</span>
              </h2>
              <p>Employers utilizing AlignGrade agree to uphold non-discriminatory hiring principles:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>All posted job listings and internships must offer transparent, legitimate compensation and truthful job responsibilities. Unpaid internships masquerading as full-time employment are prohibited.</li>
                <li>Recruiters shall not harass, exploit, or misappropriate candidate work trials or project submissions.</li>
                <li>Candidate contact data obtained via AlignGrade may only be utilized for lawful recruitment purposes.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3 pt-6 border-t border-outline-variant/60">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>5. Freelance Gigs Marketplace &amp; Escrow</span>
              </h2>
              <p>
                For freelance projects and contract gigs contracted through AlignGrade, client payments are held in secure escrow upon milestone definition and released upon verified deliverable acceptance. AlignGrade provides arbitration assistance in the event of work quality disputes.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3 pt-6 border-t border-outline-variant/60">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>6. Intellectual Property</span>
              </h2>
              <p>
                All trademarks, logos, assessment algorithms, software code, roadmaps, and question repositories are the exclusive intellectual property of AlignGrade Recruitment Systems Pvt. Ltd. Candidates retain copyright over original project portfolio code linked on their profiles.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-3 pt-6 border-t border-outline-variant/60">
              <h2 className="text-xl font-headline font-medium text-heading flex items-center gap-2 text-primary">
                <span>7. Limitation of Liability &amp; Dispute Resolution</span>
              </h2>
              <p>
                AlignGrade provides match recommendations based on verified assessment metrics but does not guarantee employment offers or candidate performance. In no event shall AlignGrade be liable for indirect, punitive, or consequential damages.
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                These terms are governed by the laws of India. Any disputes arising out of these terms shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.
              </p>
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
