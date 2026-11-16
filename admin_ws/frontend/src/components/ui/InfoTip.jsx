import { useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';

const TIP_WIDTH = 256; // matches w-64
const EDGE_GAP = 12;

/**
 * An (i) button that explains a section. The text shows on hover and on keyboard focus,
 * stays open while the pointer is over it, and Escape closes it. It is `display: none`
 * while closed (so it can never stretch the page) and slides left if it would run off
 * the right edge of the screen.
 */
export default function InfoTip({ label, children }) {
  const id = useId();
  const button = useRef(null);
  const [shift, setShift] = useState(0);

  const place = () => {
    const { left } = button.current.getBoundingClientRect();
    const overflow = left + TIP_WIDTH - (window.innerWidth - EDGE_GAP);
    setShift(overflow > 0 ? -overflow : 0);
  };

  return (
    <span className="group relative inline-flex" onMouseEnter={place}>
      <button
        ref={button}
        type="button"
        aria-label={`About: ${label}`}
        aria-describedby={id}
        onFocus={place}
        onKeyDown={(event) => event.key === 'Escape' && event.currentTarget.blur()}
        className="grid size-5 place-items-center rounded-full text-muted transition-colors hover:text-accent-ink focus-visible:text-accent-ink"
      >
        <Info className="size-4" aria-hidden="true" />
      </button>
      {/* The padding (not a margin) keeps the pointer over the tooltip while moving from the icon to it. */}
      <span
        role="tooltip"
        id={id}
        style={{ transform: `translateX(${shift}px)` }}
        className="absolute left-0 top-full z-30 hidden w-64 max-w-[calc(100vw-1.5rem)] pt-2 group-focus-within:block group-hover:block"
      >
        <span className="block rounded-lg bg-ink px-3 py-2 text-left text-xs font-normal leading-relaxed text-white shadow-lg">{children}</span>
      </span>
    </span>
  );
}
