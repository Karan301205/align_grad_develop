import { WRAP } from '../../../components/landing/classNames';
import { BrandLockup } from '../../../components/landing/ui';
import { SUPPORT_EMAIL } from '../content';

const LINK = 'hover:text-white';

function FooterColumn({ title, children }) {
  return (
    <div className="flex flex-col gap-2.5 text-[14px]">
      <strong className="font-semibold text-white">{title}</strong>
      {children}
    </div>
  );
}

export default function RecruiterFooter({ nav }) {
  return (
    <footer className="bg-(--ag-pine-d) pb-10 text-white/70">
      <div className={WRAP}>
        <div className="grid grid-cols-[2fr_repeat(3,minmax(0,1fr))] gap-8 border-t border-white/10 py-12 max-[900px]:grid-cols-2">
          <div className="flex flex-col gap-3.5">
            <a {...nav.home} aria-label="AlignGrad home" className="inline-flex items-center gap-2.5 text-white">
              <BrandLockup />
            </a>
            <p className="max-w-[34ch] text-[14px]">Skill-first hiring for teams across India. Headquartered in Bengaluru.</p>
          </div>
          <FooterColumn title="Recruiters">
            <a {...nav.section('match')} className={LINK}>Matched candidates</a>
            <a {...nav.section('post')} className={LINK}>Job posts</a>
            <a {...nav.section('gigs')} className={LINK}>Gigs</a>
          </FooterColumn>
          <FooterColumn title="AlignGrad">
            <a {...nav.home} className={LINK}>Home</a>
            <a {...nav.candidate} className={LINK}>For candidates</a>
          </FooterColumn>
          <FooterColumn title="Legal">
            <a {...nav.page('/terms')} className={LINK}>Terms of service</a>
            <a {...nav.page('/privacy')} className={LINK}>Privacy policy</a>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK}>Contact support</a>
          </FooterColumn>
        </div>
        <div className="text-[13px] text-white/60">© {new Date().getFullYear()} AlignGrad Recruitment &amp; Skill Systems</div>
      </div>
    </footer>
  );
}
