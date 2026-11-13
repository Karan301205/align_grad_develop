import { useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * Horizontal bar of profile sections (About you, Intro video, Education, …).
 * On the profile it follows the scroll position (the parent passes `active`) and
 * clicking a name scrolls to that section. On narrow screens the bar scrolls
 * sideways and keeps the active name in view. `items`: { id, label, icon,
 * count?, status?: 'done' | 'todo' }.
 */
export default function SectionBar({ items, active, onSelect }) {
  const scrollerRef = useRef(null);
  const refs = useRef({});

  // Bring the active name into view inside the bar only (never scroll the page).
  useEffect(() => {
    const box = scrollerRef.current;
    const tab = refs.current[active];
    if (!box || !tab) return;
    const boxRect = box.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    if (tabRect.left < boxRect.left) box.scrollBy({ left: tabRect.left - boxRect.left - 16, behavior: 'smooth' });
    else if (tabRect.right > boxRect.right) box.scrollBy({ left: tabRect.right - boxRect.right + 16, behavior: 'smooth' });
  }, [active]);

  return (
    <nav aria-label="Profile sections" ref={scrollerRef} className="-mx-1 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="m-0 flex w-max min-w-full list-none justify-between gap-1 rounded-[14px] border border-[#E1E5F2] bg-white p-1.5 shadow-[0_8px_24px_-18px_rgba(14,27,61,0.35)]">
        {items.map((item) => {
          const on = item.id === active;
          const Icon = item.icon;
          return (
            <li key={item.id} className="shrink-0">
              <button
                ref={(node) => {
                  refs.current[item.id] = node;
                }}
                type="button"
                aria-current={on ? 'true' : undefined}
                onClick={() => onSelect(item.id)}
                className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-3 text-[14.5px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6] ${
                  on ? 'bg-[linear-gradient(135deg,#0167F6_0%,#6378F9_100%)] text-white shadow-[0_6px_14px_-8px_rgba(1,103,246,0.9)]' : 'text-[#1B2B55] hover:bg-[#F4F6FE]'
                }`}
              >
                {Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
                {item.label}
                {item.status === 'done' && <CheckCircle2 aria-label="done" className={`size-4 shrink-0 ${on ? 'text-white' : 'text-[#0F7A55]'}`} />}
                {item.status === 'todo' && (
                  <span className={`size-2 rounded-full ${on ? 'bg-white' : 'bg-[#D92D20]'}`}>
                    <span className="sr-only">(to do)</span>
                  </span>
                )}
                {item.count > 0 && <span className={`min-w-[22px] rounded-full px-1.5 py-px text-center text-[12px] font-bold ${on ? 'bg-white/25 text-white' : 'bg-[#E8EEFF] text-[#0B3FA8]'}`}>{item.count}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
