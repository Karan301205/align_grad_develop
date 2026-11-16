import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ListFilter } from 'lucide-react';
import { cx } from '../../utils/cx.js';

const WIDTH = 232;

/** Where the fixed panel goes for a button at `rect`: just below it, kept inside the window. */
const place = (rect) => ({ top: rect.bottom + 6, left: Math.max(8, Math.min(rect.left - 8, window.innerWidth - WIDTH - 8)) });

/**
 * A bold column heading with a small sort / filter button. The panel opens under the button
 * (in a portal, so a table's scroll area can't clip it) and closes on Escape or a click outside.
 * Scrolling or resizing moves it with its button (a wide table scrolls sideways when a clipped
 * button is clicked, and that must not shut the menu); it closes only if the button leaves the
 * screen. Controls inside it apply at once. `active` tints the button when this column is the
 * one being sorted or filtered.
 */
export default function ColumnMenu({ label, active, children }) {
  const panelId = useId();
  const button = useRef(null);
  const panel = useRef(null);
  const [position, setPosition] = useState(null); // null while closed
  const open = position !== null;

  const toggle = () => setPosition(open ? null : place(button.current.getBoundingClientRect()));

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setPosition(null);
    const follow = () => {
      const rect = button.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
        close();
        return;
      }
      const next = place(rect);
      setPosition((current) => (current && current.top === next.top && current.left === next.left ? current : next));
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        close();
        button.current?.focus();
      }
    };
    const onPointer = (event) => {
      if (!panel.current?.contains(event.target) && !button.current?.contains(event.target)) close();
    };
    panel.current?.querySelector('input')?.focus({ preventScroll: true });
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
    };
  }, [open]);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-bold text-ink">{label}</span>
      <button
        ref={button}
        type="button"
        onClick={toggle}
        aria-label={`Sort or filter by ${label}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={cx('grid size-6 place-items-center rounded-md transition-colors', active ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:bg-subtle hover:text-ink')}
      >
        <ListFilter className="size-3.5" aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={panelId}
            role="group"
            aria-label={`Sort and filter: ${label}`}
            style={{ position: 'fixed', top: position.top, left: position.left, width: WIDTH }}
            className="z-50 rounded-xl border border-line bg-panel p-3 text-left text-sm normal-case tracking-normal shadow-lg"
          >
            {children}
          </div>,
          document.body
        )}
    </span>
  );
}

export function MenuGroup({ title, children }) {
  return (
    <fieldset className="mb-2.5 last:mb-0">
      <legend className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">{title}</legend>
      <div>{children}</div>
    </fieldset>
  );
}

/** One choice in a menu group. Native radio buttons, so arrow keys and screen readers just work. */
export function MenuOption({ name, checked, onSelect, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-[13px] font-normal text-ink-2 hover:bg-subtle has-checked:font-semibold has-checked:text-ink">
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="size-3.5 accent-accent" />
      {children}
    </label>
  );
}
