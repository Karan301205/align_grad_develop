import { useEffect, useId, useRef, useState } from 'react';

const ITEM = 'flex w-full items-center rounded-[6px] px-3 py-2 text-left text-sm text-[#334155] hover:bg-[#F8F8F6] hover:text-[#0F172A] focus:bg-[#F8F8F6] focus:text-[#0F172A] focus:outline-none';

/**
 * "⋯" menu on a job card. `items` is a list of { id, label, onSelect, danger }.
 * Arrow keys move between items; Esc, Tab or a click outside closes it.
 */
export default function JobActionsMenu({ label, items }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();
    const onDown = (event) => {
      if (!menuRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const onMenuKey = (event) => {
    const entries = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') || [])];
    const index = entries.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') entries[(index + 1) % entries.length]?.focus();
    else if (event.key === 'ArrowUp') entries[(index - 1 + entries.length) % entries.length]?.focus();
    else if (event.key === 'Home') entries[0]?.focus();
    else if (event.key === 'End') entries[entries.length - 1]?.focus();
    else if (event.key === 'Escape') {
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
      return;
    } else return;
    event.preventDefault();
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="flex size-10 items-center justify-center rounded-[8px] border border-[#D5D9E0] bg-white text-[#334155] transition-colors hover:bg-[#F8F8F6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className="absolute right-0 top-full z-30 mt-1.5 flex w-52 flex-col rounded-[8px] border border-[#E4E6EA] bg-white p-1 shadow-lg shadow-slate-300/50"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                setOpen(false);
                // Focus returns to "⋯" first, so a dialog the item opens hands focus back there.
                buttonRef.current?.focus();
                item.onSelect();
              }}
              className={`${ITEM} ${item.danger ? 'text-[#B91C1C] hover:text-[#991B1B] focus:text-[#991B1B]' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
