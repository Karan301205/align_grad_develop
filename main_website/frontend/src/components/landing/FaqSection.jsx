import { useState } from 'react';
import { Icon } from './Icon';
import { SectionTitle } from './ui';
import { ANCHOR, SORA } from './classNames';
import { SECTION, SWAP } from './portalLayout';

/**
 * "Questions, answered." accordion used by the candidate and recruiter pages.
 * The first question starts open, as in the designs.
 *  - items: [{ q, a }]
 *  - className: section background, e.g. 'bg-white'
 */
export default function FaqSection({ items, className = '' }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className={`${SECTION} ${ANCHOR} ${className}`}>
      <div className="mx-auto w-full max-w-[920px] px-10 max-[900px]:px-5">
        <div className="mb-10 text-center">
          <SectionTitle id="faq-title" bold="Questions," light="answered." width="none" />
        </div>
        <div className="flex flex-col gap-3">
          {items.map((item, i) => {
            const isOpen = i === openIndex;
            return (
              <div key={item.q} className="rounded-[18px] bg-white shadow-[0_0_0_1px_var(--ag-line)]">
                <button
                  type="button"
                  id={`faq-q-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className={`flex min-h-[66px] w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent px-[22px] py-[18px] text-left text-[17px] font-semibold leading-[normal] tracking-[-.02em] text-(--ag-pine) max-[900px]:px-[18px] max-[900px]:py-4 max-[900px]:text-[16px] ${SORA}`}
                >
                  <span>{item.q}</span>
                  <Icon name="chevronDown" className={`size-5 transition-[rotate] duration-250 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <p id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className={`max-w-[66ch] px-[22px] pb-[22px] text-(--ag-mute) max-[900px]:px-[18px] max-[900px]:pb-[18px] ${SWAP}`}>
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
