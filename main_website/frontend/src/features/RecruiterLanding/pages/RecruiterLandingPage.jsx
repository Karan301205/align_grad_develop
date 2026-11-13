import useLandingNavigation from '../../../components/landing/useLandingNavigation';
import PortalNav from '../../../components/landing/PortalNav';
import FaqSection from '../../../components/landing/FaqSection';
import ForgotPasswordModal from '../../Auth/components/ForgotPasswordModal';
import VerificationPinModal from '../../Auth/components/VerificationPinModal';
import LandingAuthCard from '../../Auth/components/LandingAuthCard';
import useLandingAuth from '../../Auth/hooks/useLandingAuth';
import { THEME_VARS, NAV, NAV_LINKS, AUTH_CONFIG, FAQS } from '../content';
import RecruiterHero from '../components/RecruiterHero';
import MatchSection from '../components/MatchSection';
import DemoSection from '../components/DemoSection';
import JobPostSection from '../components/JobPostSection';
import GigsSection from '../components/GigsSection';
import RecruiterCta from '../components/RecruiterCta';
import RecruiterFooter from '../components/RecruiterFooter';

const FOCUS_RING =
  '[&_:focus-visible]:outline-3 [&_:focus-visible]:outline-solid [&_:focus-visible]:outline-(--ag-peri) [&_:focus-visible]:outline-offset-3';

/**
 * Recruiter landing page with embedded company registration / sign-in
 * (/for-recruiters, /recruiter/signup, /recruiter/login).
 * Design: design/Recruiter landing, desktop-html. Light-only; App.jsx keeps the site light.
 */
export default function RecruiterLandingPage({ setToken, setUser, theme, initialAuthMode = 'signup' }) {
  const nav = useLandingNavigation();
  const auth = useLandingAuth({ role: 'RECRUITER', setToken, setUser, initialAuthMode });

  return (
    <div
      id="top"
      style={THEME_VARS}
      className={`min-h-screen overflow-x-clip bg-(--ag-mist) text-[16px] leading-[1.55] text-(--ag-pine) antialiased [font-family:var(--ag-geist)] ${FOCUS_RING}`}
    >
      <PortalNav nav={nav} openAuth={auth.openAuth} links={NAV_LINKS} {...NAV} />
      <main>
        <RecruiterHero authCard={<LandingAuthCard auth={auth} config={AUTH_CONFIG} />} />
        <MatchSection />
        <DemoSection />
        <JobPostSection openAuth={auth.openAuth} />
        <GigsSection openAuth={auth.openAuth} />
        <FaqSection items={FAQS} className="bg-white" />
        <RecruiterCta openAuth={auth.openAuth} />
      </main>
      <RecruiterFooter nav={nav} />

      <ForgotPasswordModal
        isOpen={auth.forgotPassword.isOpen}
        onClose={auth.forgotPassword.close}
        initialEmail={auth.fields.email}
        role="RECRUITER"
        theme={theme}
      />
      <VerificationPinModal
        isOpen={auth.verification.isOpen}
        onClose={auth.verification.close}
        email={auth.verification.email}
        role="RECRUITER"
        onSuccess={auth.verification.onVerified}
      />
    </div>
  );
}
