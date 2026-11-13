import logo from '../../../../assets/landing/aligngrad-logo.png';
import { WRAP } from '../../../../components/landing/classNames';
import { SUPPORT_EMAIL } from '../content';

const LINK = 'hover:text-(--ag-blue)';

function FooterColumn({ title, children }) {
  return (
    <div className="flex flex-col gap-2.5 text-[14px]">
      <strong className="font-semibold text-(--ag-pine)">{title}</strong>
      {children}
    </div>
  );
}

export default function CandidateFooter({ nav }) {
  return (
    <footer className="border-t border-(--ag-line) bg-white pb-10 text-(--ag-mute)">
      <div className={WRAP}>
        <div className="grid grid-cols-[2fr_repeat(3,minmax(0,1fr))] gap-8 py-12 max-[900px]:grid-cols-2">
          <div className="flex flex-col gap-3.5">
            <a {...nav.home} aria-label="AlignGrad home" className="inline-flex">
              <img src={logo} alt="AlignGrad" className="h-[30px] w-auto" />
            </a>
            <p className="max-w-[34ch] text-[14px]">Skill verification and opportunities for students and early-career talent across India.</p>
          </div>
          <FooterColumn title="Candidates">
            <a {...nav.section('jobs')} className={LINK}>Matching jobs</a>
            <a {...nav.section('courses')} className={LINK}>Courses</a>
            <a {...nav.section('gigs')} className={LINK}>Gigs</a>
          </FooterColumn>
          <FooterColumn title="AlignGrad">
            <a {...nav.home} className={LINK}>Home</a>
            <a {...nav.recruiter} className={LINK}>For recruiters</a>
          </FooterColumn>
          <FooterColumn title="Legal">
            <a {...nav.page('/terms')} className={LINK}>Terms of service</a>
            <a {...nav.page('/privacy')} className={LINK}>Privacy policy</a>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK}>Contact support</a>
          </FooterColumn>
        </div>
        <div className="border-t border-(--ag-line) pt-5 text-[13px]">© {new Date().getFullYear()} AlignGrad Recruitment &amp; Skill Systems</div>
      </div>
    </footer>
  );
}
