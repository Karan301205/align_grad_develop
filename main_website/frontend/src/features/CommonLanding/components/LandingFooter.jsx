import { LEARN_HOST, LEARN_URL, SUPPORT_EMAIL } from '../content';
import { WRAP } from '../../../components/landing/classNames';
import { BrandLockup } from '../../../components/landing/ui';

const LINK = 'hover:text-white';

function FooterColumn({ title, children }) {
  return (
    <div className="flex flex-col gap-2.5 text-[14px]">
      <strong className="font-semibold text-white">{title}</strong>
      {children}
    </div>
  );
}

export default function LandingFooter({ nav }) {
  return (
    <footer className="bg-(--ag-pine-d) pb-10 text-white/70">
      <div className={WRAP}>
        <div className="grid grid-cols-[2fr_repeat(3,minmax(0,1fr))] gap-8 pb-12 pt-14 max-[900px]:grid-cols-2">
          <div className="flex flex-col gap-3.5">
            <a {...nav.section('top')} className="inline-flex items-center gap-2.5 text-white">
              <BrandLockup />
            </a>
            <p className="max-w-[36ch] text-[14px]">
              Connecting skills with opportunities across India, bringing learning, objective assessments and talent discovery together.
            </p>
            <p className="text-[13px] text-white/55">Headquarters: Bengaluru, Karnataka</p>
          </div>

          <FooterColumn title="Platform">
            <a {...nav.section('student-usp')} className={LINK}>For candidates</a>
            <a {...nav.section('recruiters')} className={LINK}>For recruiters</a>
            <a {...nav.section('tour')} className={LINK}>Product tour</a>
            <a href={LEARN_URL} target="_blank" rel="noopener noreferrer" className={LINK}>{LEARN_HOST}</a>
          </FooterColumn>

          <FooterColumn title="Portals">
            <a {...nav.candidate} className={LINK}>Candidate portal</a>
            <a {...nav.recruiter} className={LINK}>Recruiter hub</a>
            <a {...nav.section('partner')} className={LINK}>Partner with us</a>
          </FooterColumn>

          <FooterColumn title="Legal & support">
            <a {...nav.page('/privacy')} className={LINK}>Privacy policy</a>
            <a {...nav.page('/terms')} className={LINK}>Terms of service</a>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK}>Contact support</a>
          </FooterColumn>
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-white/10 pt-[22px] text-[13px] text-white/60">
          <span>© {new Date().getFullYear()} AlignGrad Recruitment &amp; Skill Systems</span>
          <span>Connecting skills with opportunities</span>
        </div>
      </div>
    </footer>
  );
}
