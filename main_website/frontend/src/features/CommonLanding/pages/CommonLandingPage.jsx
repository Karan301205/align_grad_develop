import { THEME_VARS, STUDENT_TESTIMONIALS, RECRUITER_TESTIMONIALS } from '../content';
import useLandingNavigation from '../../../components/landing/useLandingNavigation';
import LandingNav from '../components/LandingNav';
import HeroSection from '../components/HeroSection';
import PartnerLogos from '../components/PartnerLogos';
import StudentUspSection from '../components/StudentUspSection';
import TestimonialsSection from '../components/TestimonialsSection';
import RecruiterUspSection from '../components/RecruiterUspSection';
import ProductTourSection from '../components/ProductTourSection';
import LearnSection from '../components/LearnSection';
import PartnerSection from '../components/PartnerSection';
import LandingFooter from '../components/LandingFooter';

/* The reference design shows these reviews selected. */
const INITIAL_STUDENT_REVIEW = 1; // Sana Qureshi
const INITIAL_RECRUITER_REVIEW = 4; // Neha Kulkarni

const FOCUS_RING =
  '[&_:focus-visible]:outline-3 [&_:focus-visible]:outline-solid [&_:focus-visible]:outline-(--ag-peri) [&_:focus-visible]:outline-offset-3';

/**
 * Public common landing page at `/` (design: design/Common landing, desktop-html).
 * Light-only by design; App.jsx keeps the site in light mode.
 */
export default function CommonLandingPage() {
  const nav = useLandingNavigation();

  return (
    <div
      id="top"
      style={THEME_VARS}
      className={`min-h-screen overflow-x-clip bg-(--ag-mist) text-[16px] leading-[1.55] text-(--ag-pine) antialiased [font-family:var(--ag-geist)] ${FOCUS_RING}`}
    >
      <LandingNav nav={nav} />
      <main>
        <HeroSection nav={nav} />
        <PartnerLogos nav={nav} />
        <StudentUspSection nav={nav} />
        <TestimonialsSection
          id="student-reviews"
          kicker="What students say"
          bold="Loved by"
          light="students."
          lede="Stories from students and campuses who turned verified skills into real offers."
          items={STUDENT_TESTIMONIALS}
          initialIndex={INITIAL_STUDENT_REVIEW}
          className="pt-0 max-[900px]:pt-0"
        />
        <RecruiterUspSection nav={nav} />
        <TestimonialsSection
          id="recruiter-reviews"
          kicker="What recruiters say"
          kickerTone="pine"
          bold="Trusted by"
          light="hiring teams."
          lede="How teams use match scores, skill ratings and gigs to hire with confidence."
          items={RECRUITER_TESTIMONIALS}
          initialIndex={INITIAL_RECRUITER_REVIEW}
          activeRing="pine"
        />
        <ProductTourSection nav={nav} />
        <LearnSection nav={nav} />
        <PartnerSection />
      </main>
      <LandingFooter nav={nav} />
    </div>
  );
}
