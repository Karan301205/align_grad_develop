import { useState } from 'react';
import logo from '../../../assets/landing/aligngrad-logo.png';
import { NAV_LINKS } from '../content';
import { Icon } from '../../../components/landing/Icon';
import { WRAP, buttonClass } from '../../../components/landing/classNames';

export default function LandingNav({ nav }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const sectionLink = (id) => {
    const link = nav.section(id);
    return {
      href: link.href,
      onClick: (event) => {
        setMenuOpen(false);
        link.onClick(event);
      }
    };
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(220,227,236,.8)] bg-[rgba(244,246,254,.88)] backdrop-blur-[14px]">
      <div className={`${WRAP} flex h-[76px] items-center gap-[30px] max-[900px]:h-16 max-[900px]:gap-3`}>
        <a {...nav.section('top')} aria-label="AlignGrad home">
          <img src={logo} alt="AlignGrad" className="h-[30px] w-auto" />
        </a>

        <nav aria-label="Main" className="flex gap-6 text-[15px] font-medium text-(--ag-mute) max-[1100px]:hidden">
          {NAV_LINKS.map((item) => (
            <a key={item.section} {...nav.section(item.section)} className="hover:text-(--ag-pine)">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex gap-2.5 max-[900px]:hidden">
          <a {...nav.candidate} className={buttonClass('line', 'sm')}>Candidate portal</a>
          <a {...nav.recruiter} className={buttonClass('pine', 'sm')}>Recruiter hub</a>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="ml-auto hidden size-11 cursor-pointer items-center justify-center rounded-[12px] border-0 bg-white text-(--ag-pine) shadow-[inset_0_0_0_1.5px_var(--ag-line)] max-[900px]:inline-flex"
        >
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
      </div>

      {menuOpen && (
        <div className="hidden max-[900px]:block">
          <div className="flex flex-col gap-1 border-t border-(--ag-line) bg-white px-5 pb-5 pt-3">
            {NAV_LINKS.map((item) => (
              <a
                key={item.section}
                {...sectionLink(item.section)}
                className="flex min-h-12 items-center border-b border-(--ag-mist) text-[16px] font-medium"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <a {...nav.candidate} className={buttonClass('line', 'sm')}>Candidate portal</a>
              <a {...nav.recruiter} className={buttonClass('pine', 'sm')}>Recruiter hub</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
