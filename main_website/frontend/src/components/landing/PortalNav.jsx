import { useState } from 'react';
import logo from '../../assets/landing/aligngrad-logo.png';
import { Icon } from './Icon';
import { WRAP, buttonClass } from './classNames';

/**
 * Sticky header for the candidate and recruiter landing pages:
 * logo + portal tag, section links, then secondary / primary auth buttons
 * that open the hero's auth card.
 *
 *  - tag: { label, className }      e.g. "Candidates" on soft blue
 *  - links: [{ label, section }]
 *  - secondary: { label }           opens Sign in
 *  - primary: { label, mobileLabel?, variant }   opens sign-up
 */
export default function PortalNav({ nav, openAuth, tag, links, secondary, primary }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const authLink = (mode, closeMenu = false) => ({
    href: '#auth',
    onClick: (event) => {
      event.preventDefault();
      if (closeMenu) setMenuOpen(false);
      openAuth(mode);
    }
  });

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
    <header className="sticky top-0 z-30 border-b border-[rgba(220,227,236,.8)] bg-[color-mix(in_srgb,var(--ag-mist)_88%,transparent)] backdrop-blur-[14px]">
      <div className={`${WRAP} flex h-[76px] items-center gap-7 max-[900px]:h-16 max-[900px]:gap-3`}>
        <a {...nav.home} aria-label="AlignGrad home" className="flex items-center gap-3">
          <img src={logo} alt="AlignGrad" className="h-[30px] w-auto" />
          <span className={`inline-flex min-h-7 items-center rounded-[8px] px-2.5 text-[12.5px] font-semibold ${tag.className}`}>{tag.label}</span>
        </a>

        <nav aria-label="Main" className="ml-auto flex gap-[26px] text-[15px] font-medium text-(--ag-mute) max-[900px]:hidden">
          {links.map((item) => (
            <a key={item.label} {...nav.section(item.section)} className="hover:text-(--ag-pine)">{item.label}</a>
          ))}
        </nav>

        <div className="flex gap-2.5 max-[900px]:hidden">
          <a {...authLink('login')} className={buttonClass('line', 'sm')}>{secondary.label}</a>
          <a {...authLink('signup')} className={buttonClass(primary.variant, 'sm')}>{primary.label}</a>
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
            {links.map((item) => (
              <a key={item.label} {...sectionLink(item.section)} className="flex min-h-12 items-center border-b border-(--ag-mist) text-[16px] font-medium">
                {item.label}
              </a>
            ))}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <a {...authLink('login', true)} className={buttonClass('line', 'sm')}>{secondary.label}</a>
              <a {...authLink('signup', true)} className={buttonClass(primary.variant, 'sm')}>{primary.mobileLabel || primary.label}</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
