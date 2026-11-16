import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AccountIcon from './AccountIcon';
import { MUTED } from './accountStyles';

// Form controls shared by the recruiter pages (account pages, post a job, jobs,
// applications). Colours follow the 2026-11 recruiter designs.

export function FieldError({ id, children }) {
  return (
    <p id={id} role="alert" className="m-0 flex items-center gap-1.5 text-[13px] font-medium text-[#B91C1C]">
      <AccountIcon name="alert" size={14} />
      {children}
    </p>
  );
}

const MENU_MAX_HEIGHT = 264;
const SIZES = {
  md: 'h-11 pl-3 pr-2.5 text-sm',
  sm: 'h-9 pl-2.5 pr-2 text-[13px]'
};

/**
 * Dropdown in the recruiter theme (replaces native <select>, whose open list the
 * browser draws in its own style). `options` is a list of [value, label].
 *
 * Select-only combobox: focus stays on the button; ↑/↓, Home/End, Enter/Space,
 * Esc and type-ahead work as in a native select. The list is portalled to <body>
 * with fixed positioning so modals and scrolling panels can't clip it, opens
 * upward when there's no room below, and follows the button while the page scrolls.
 */
export function SelectControl({ id, value, onChange, options, placeholder, disabled, error, size = 'md', bare = false, className = '', menuMinWidth = 180, ...aria }) {
  const autoId = useId();
  const buttonId = id || `select-${autoId}`;
  const listId = `${buttonId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const typed = useRef({ text: '', at: 0 });

  const selectedIndex = options.findIndex(([optionValue]) => String(optionValue) === String(value));
  const selected = options[selectedIndex];

  const measure = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom;
    const up = below < 200 && rect.top > below;
    setPosition({
      left: Math.min(rect.left, window.innerWidth - Math.max(rect.width, menuMinWidth) - 8),
      width: Math.max(rect.width, menuMinWidth),
      top: up ? undefined : rect.bottom + 4,
      bottom: up ? window.innerHeight - rect.top + 4 : undefined,
      maxHeight: Math.max(120, Math.min(MENU_MAX_HEIGHT, (up ? rect.top : below) - 12))
    });
  };

  const openMenu = (index = selectedIndex) => {
    if (disabled || options.length === 0) return;
    measure();
    setActive(index >= 0 ? index : 0);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const choose = (index) => {
    const option = options[index];
    if (option) onChange(option[0]);
    close();
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!buttonRef.current?.contains(event.target) && !listRef.current?.contains(event.target)) close();
    };
    const onMove = (event) => {
      if (listRef.current?.contains(event.target)) return; // scrolling inside the list
      measure();
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  });

  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const typeAhead = (key) => {
    const now = Date.now();
    typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + key.toLowerCase(), at: now };
    const start = open ? active : selectedIndex;
    const order = options.map((_, i) => (start + 1 + i) % options.length);
    const match = order.find((i) => String(options[i][1]).toLowerCase().startsWith(typed.current.text));
    return match === undefined ? -1 : match;
  };

  const onKeyDown = (event) => {
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openMenu();
      } else if (event.key.length === 1 && /\S/.test(event.key)) {
        const match = typeAhead(event.key);
        if (match >= 0) onChange(options[match][0]);
      }
      return;
    }
    if (event.key === 'ArrowDown') setActive((i) => Math.min(last, i + 1));
    else if (event.key === 'ArrowUp') setActive((i) => Math.max(0, i - 1));
    else if (event.key === 'Home') setActive(0);
    else if (event.key === 'End') setActive(last);
    else if (event.key === 'Enter' || event.key === ' ') choose(active);
    else if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault();
      close();
      return;
    } else if (event.key.length === 1 && /\S/.test(event.key)) {
      const match = typeAhead(event.key);
      if (match >= 0) setActive(match);
      return;
    } else return;
    event.preventDefault();
  };

  return (
    <div className={`relative min-w-0 ${className}`}>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${buttonId}-error` : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
        {...aria}
        className={
          bare // inside a styled wrapper (e.g. "Compare with job"): no box of its own
            ? `flex h-full w-full items-center justify-between gap-2 rounded-[6px] bg-transparent text-left font-(family-name:--font-headline) text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F7A55]/30`
            : `flex w-full items-center justify-between gap-2 rounded-[8px] border bg-white text-left font-(family-name:--font-headline) font-normal transition-colors focus:outline-none focus-visible:border-[#0F7A55] focus-visible:ring-2 focus-visible:ring-[#0F7A55]/20 disabled:cursor-not-allowed disabled:bg-[#F4F8F6] ${SIZES[size]} ${
                error ? 'border-[#DC2626]' : open ? 'border-[#0F7A55] ring-2 ring-[#0F7A55]/20' : 'border-[#D5D9E0] hover:border-[#9CA3AF]'
              }`
        }
      >
        <span className={`min-w-0 truncate ${selected ? 'text-[#023836]' : 'text-[#6B7280]'}`}>{selected ? selected[1] : placeholder || 'Select'}</span>
        <AccountIcon name="chevron-down" size={16} strokeWidth={2} className={`${MUTED} transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && position &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={buttonId}
            style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom, width: position.width, maxHeight: position.maxHeight }}
            className="z-[1000] m-0 list-none overflow-y-auto rounded-[8px] border border-[#E4E6EA] bg-white p-1 font-(family-name:--font-headline) shadow-lg shadow-slate-300/50"
          >
            {options.map(([optionValue, label], index) => {
              const isSelected = index === selectedIndex;
              return (
                <li
                  key={String(optionValue)}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-[6px] px-3 py-2 ${size === 'sm' ? 'text-[13px]' : 'text-sm'} ${
                    isSelected ? 'bg-[#E3F1EE] font-semibold text-[#0F7A55]' : index === active ? 'bg-[#F4F8F6] text-[#023836]' : 'text-[#334155]'
                  } ${isSelected && index === active ? 'ring-1 ring-inset ring-[#0F7A55]/30' : ''}`}
                >
                  <span className="min-w-0 break-words">{label}</span>
                  {isSelected && <AccountIcon name="check" size={14} strokeWidth={2.5} />}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}

/** Small spinner for buttons and tiles. */
export function Spinner({ className = 'border-current' }) {
  return <span aria-hidden="true" className={`inline-block size-4 animate-spin rounded-full border-2 border-t-transparent ${className}`} />;
}
