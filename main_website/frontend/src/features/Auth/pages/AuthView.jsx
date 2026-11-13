import useLandingNavigation from '../../../components/landing/useLandingNavigation';
import PortalNav from '../../../components/landing/PortalNav';
import FaqSection from '../../../components/landing/FaqSection';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import VerificationPinModal from '../components/VerificationPinModal';
import LandingAuthCard from '../components/LandingAuthCard';
import useLandingAuth from '../hooks/useLandingAuth';
import { THEME_VARS, NAV, NAV_LINKS, AUTH_CONFIG, FAQS } from '../candidateLanding/content';
import CandidateHero from '../candidateLanding/components/CandidateHero';
import JobsSection from '../candidateLanding/components/JobsSection';
import GigsSection from '../candidateLanding/components/GigsSection';
import CoursesSection from '../candidateLanding/components/CoursesSection';
import JourneySection from '../candidateLanding/components/JourneySection';
import CtaBand from '../candidateLanding/components/CtaBand';
import CandidateFooter from '../candidateLanding/components/CandidateFooter';

const FOCUS_RING =
  '[&_:focus-visible]:outline-3 [&_:focus-visible]:outline-solid [&_:focus-visible]:outline-(--ag-peri) [&_:focus-visible]:outline-offset-3';

/**
 * Candidate landing page with embedded sign-up / sign-in
 * (/for-candidates, /candidate/signup, /candidate/login).
 * Design: design/Candidate landing, desktop-html. Light-only; App.jsx keeps the site light.
 */
export default function AuthView({ setToken, setUser, theme, initialAuthMode = 'signup' }) {
  const nav = useLandingNavigation();
  const auth = useLandingAuth({ role: 'STUDENT', setToken, setUser, initialAuthMode });

  return (
    <div
      id="top"
      style={THEME_VARS}
      className={`min-h-screen overflow-x-clip bg-(--ag-mist) text-[16px] leading-[1.55] text-(--ag-pine) antialiased [font-family:var(--ag-geist)] ${FOCUS_RING}`}
    >
      <PortalNav nav={nav} openAuth={auth.openAuth} links={NAV_LINKS} {...NAV} />
      <main>
        <CandidateHero authCard={<LandingAuthCard auth={auth} config={AUTH_CONFIG} />} />
        <JobsSection openAuth={auth.openAuth} />
        <GigsSection openAuth={auth.openAuth} />
        <CoursesSection />
        <JourneySection />
        <FaqSection items={FAQS} />
        <CtaBand openAuth={auth.openAuth} />
      </main>
      <CandidateFooter nav={nav} />

      <ForgotPasswordModal
        isOpen={auth.forgotPassword.isOpen}
        onClose={auth.forgotPassword.close}
        initialEmail={auth.fields.email}
        role="STUDENT"
        theme={theme}
      />
      <VerificationPinModal
        isOpen={auth.verification.isOpen}
        onClose={auth.verification.close}
        email={auth.verification.email}
        role="STUDENT"
        onSuccess={auth.verification.onVerified}
      />
    </div>
  );
}
