import { useRef, useState } from 'react';
import { Icon } from '../../../components/landing/Icon';
import { CheckList } from '../../../components/landing/ui';
import { SORA, GEIST, HEADING, BOLD, SWAP, ACCENT_TEXT } from '../../../components/landing/classNames';

const TAB_BASE =
  'relative grid w-full min-h-[104px] cursor-pointer leading-[normal] grid-cols-[52px_minmax(0,1fr)_22px] items-center gap-3.5 border-0 py-4 pl-[9%] pr-[13%] text-left ' +
  '[clip-path:polygon(0_0,91%_0,100%_100%,9%_100%)] [transition:translate_.35s_cubic-bezier(.2,.7,.2,1),background-color_.25s_ease,color_.25s_ease] ' +
  'focus-visible:outline-none motion-reduce:transition-none ' +
  'max-[900px]:min-h-[84px] max-[900px]:grid-cols-[36px_minmax(0,1fr)_18px] max-[900px]:gap-2.5 max-[900px]:py-3.5 max-[900px]:pl-[8%] max-[900px]:pr-[12%]';

const TAB_STYLES = {
  light: {
    off: { tab: 'bg-white text-(--ag-pine) hover:translate-x-1.5 focus-visible:bg-(--ag-soft)', number: 'text-(--ag-blue)', sub: 'text-(--ag-mute)' },
    on: {
      tab: 'bg-[linear-gradient(120deg,#0167F6_0%,#6378F9_70%,#B386F9_100%)] text-white translate-x-3.5 max-[900px]:translate-x-2 focus-visible:bg-[linear-gradient(120deg,#0052C8,#6378F9)]',
      number: 'text-white/86',
      sub: 'text-white/86'
    }
  },
  dark: {
    off: { tab: 'bg-(--ag-pine-m) text-white hover:translate-x-1.5 focus-visible:bg-[#05514C]', number: 'text-(--ag-mint)', sub: 'text-white/65' },
    on: { tab: 'bg-(--ag-mint) text-(--ag-pine) translate-x-3.5 max-[900px]:translate-x-2', number: 'text-[rgba(2,56,54,.75)]', sub: 'text-[rgba(2,56,54,.75)]' }
  }
};

const PANEL_STYLES = {
  light: { panel: 'bg-white shadow-[0_0_0_1px_var(--ag-line),0_30px_60px_-40px_rgba(2,56,54,.4)]', body: 'text-(--ag-mute)' },
  dark: { panel: 'bg-(--ag-pine-m) text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.09)]', body: 'text-white/76' }
};

/** Coloured illustration area on the left of a panel (design `.uv`). */
export function VisualBox({ className = '', children }) {
  return (
    <div className={`relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[20px] p-7 max-[900px]:min-h-0 max-[900px]:px-4 max-[900px]:py-[22px] ${className}`}>
      {children}
    </div>
  );
}

const CARD_GAPS = { 2: 'gap-2', 2.5: 'gap-2.5', 3.5: 'gap-3.5' };

/** White mock UI card inside a VisualBox (design `.uc`). */
export function MiniCard({ gap = 2.5, children }) {
  return (
    <div className={`relative flex w-full max-w-[340px] flex-col rounded-[14px] bg-white p-3.5 text-(--ag-pine) shadow-[0_26px_44px_-24px_rgba(2,56,54,.55)] ${CARD_GAPS[gap]}`}>
      {children}
    </div>
  );
}

/**
 * Vertical tabs with a feature panel.
 *  - features: [{ key, title, subtitle, body, points, accent, link? }]
 *  - renderVisual(feature): the VisualBox for the active feature
 *  - linkProps(to): href/onClick for a feature's `link.to`
 */
export default function SkillTabs({ idPrefix, label, features, tone = 'light', renderVisual, linkProps }) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef([]);
  const feature = features[active];
  const panelStyle = PANEL_STYLES[tone];

  const select = (index) => {
    const next = (index + features.length) % features.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); select(active + 1); }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); select(active - 1); }
  };

  return (
    <div className="grid grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] items-stretch gap-7 max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:gap-4">
      <div role="tablist" aria-label={label} aria-orientation="vertical" onKeyDown={onKeyDown} className="flex flex-col gap-3">
        {features.map((item, index) => {
          const isOn = index === active;
          const style = TAB_STYLES[tone][isOn ? 'on' : 'off'];
          return (
            <button
              key={item.key}
              ref={(el) => { tabRefs.current[index] = el; }}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${index}`}
              aria-selected={isOn}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={isOn ? 0 : -1}
              onClick={() => setActive(index)}
              className={`${TAB_BASE} ${style.tab}`}
            >
              <span className={`${SORA} text-[15px] font-semibold ${style.number}`}>{String(index + 1).padStart(2, '0')}</span>
              <span className={`${SORA} text-[clamp(17px,1.6vw,21px)] font-semibold leading-[1.15] tracking-[-.03em]`}>
                {item.title}
                <span className={`${GEIST} mt-1 block text-[13.5px] font-normal tracking-normal max-[900px]:hidden ${style.sub}`}>{item.subtitle}</span>
              </span>
              <Icon name="arrowRight" className={`size-5 transition-[translate] duration-300 ${isOn ? 'translate-x-1' : ''}`} />
            </button>
          );
        })}
      </div>

      <div
        key={feature.key}
        role="tabpanel"
        id={`${idPrefix}-panel`}
        aria-labelledby={`${idPrefix}-tab-${active}`}
        className={`group/panel grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-7 rounded-[28px] py-5 pl-5 pr-7 max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:gap-5 max-[900px]:pb-6 max-[900px]:pl-3.5 max-[900px]:pr-3.5 max-[900px]:pt-3.5 ${panelStyle.panel} ${SWAP}`}
      >
        {renderVisual(feature)}
        <div className="flex flex-col gap-3.5 max-[900px]:px-1.5">
          <h3 className={`${HEADING} text-[clamp(24px,2.2vw,30px)] leading-[1.08] tracking-[-.035em]`}>
            <span className={BOLD}>{feature.title}</span>
          </h3>
          <p className={`max-w-[46ch] text-[16px] ${panelStyle.body}`}>{feature.body}</p>
          <CheckList items={feature.points} accentClass={ACCENT_TEXT[feature.accent]} />
          {feature.link && (
            <a
              {...linkProps(feature.link.to)}
              className={`mt-1 inline-flex min-h-10 items-center gap-1.5 text-[14.5px] font-semibold ${ACCENT_TEXT[feature.accent]}`}
            >
              {feature.link.label}
              <Icon name="arrowRight" className="size-4 transition-[translate] duration-200 group-hover/panel:translate-x-[3px]" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
