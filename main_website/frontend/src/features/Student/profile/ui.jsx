import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, ChevronDown, Loader2, X } from 'lucide-react';
import { LIST_LAYER, layerTarget, listHeight, placeBelow, useFollow } from './floatingList';
import { DANGER, DANGER_OUTLINE, HEADING_FONT, INK, MUTED, PRIMARY, SECONDARY, fieldClass } from './profileTheme';

export const Spinner = ({ className = 'size-4' }) => <Loader2 aria-hidden="true" className={`${className} animate-spin`} />;

/** Plain-language error box; `id` lets a form point aria-describedby at it. */
export function ErrorBanner({ message, id }) {
  if (!message) return null;
  return (
    <div id={id} role="alert" className="flex items-start gap-2.5 rounded-[12px] border border-[#F3C5C0] bg-[#FFF5F4] px-3.5 py-3 text-[14px] font-medium text-[#8C1D14]">
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/** Red star after the label of a field that must be filled in. */
export const RequiredMark = () => (
  <>
    <span aria-hidden="true" className="ml-0.5 text-[#D92D20]">
      *
    </span>
    <span className="sr-only"> (required)</span>
  </>
);

/** "* Required" legend shown once at the top of a form. */
export const RequiredNote = () => (
  <p className={`m-0 text-[13.5px] ${MUTED}`}>
    <span aria-hidden="true" className="text-[#D92D20]">
      *
    </span>{' '}
    Required
  </p>
);

/** Label (with a red star when `required`), hint, error and an optional counter around one control. */
export function Field({ id, label, required, hint, error, counter, className = '', children }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className={`text-[14px] font-semibold ${INK}`}>
          {label}
          {required && <RequiredMark />}
        </label>
      )}
      {children}
      {(hint || counter || error) && (
        <div className="flex items-start justify-between gap-3 text-[13px]">
          {error ? (
            <span id={`${id}-error`} className="font-medium text-[#B42318]">
              {error}
            </span>
          ) : (
            <span id={`${id}-hint`} className={MUTED}>
              {hint}
            </span>
          )}
          {counter && <span className={`shrink-0 tabular-nums ${counter.over ? 'font-semibold text-[#B42318]' : MUTED}`}>{counter.text}</span>}
        </div>
      )}
    </div>
  );
}

const describedBy = (id, error, hint) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

/** Text input; `clean` filters every change so invalid characters never land in state. */
export function TextInput({ id, value, onChange, clean, error, hint, className = '', ...rest }) {
  return (
    <input
      id={id}
      value={value ?? ''}
      onChange={(event) => {
        const next = clean ? clean(event.target.value) : event.target.value;
        if (next !== null && next !== undefined) onChange(next);
      }}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy(id, error, hint)}
      className={fieldClass(error, `h-11 ${className}`)}
      {...rest}
    />
  );
}

export function TextArea({ id, value, onChange, clean, error, hint, rows = 4, className = '', ...rest }) {
  return (
    <textarea
      id={id}
      rows={rows}
      value={value ?? ''}
      onChange={(event) => onChange(clean ? clean(event.target.value) : event.target.value)}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy(id, error, hint)}
      className={fieldClass(error, `resize-y py-2.5 leading-relaxed ${className}`)}
      {...rest}
    />
  );
}

/**
 * Themed drop-down (replaces the browser's native select menu). Options are
 * { value, label, short? }; `short` is what the closed button shows. Keyboard:
 * arrows, Home/End, Enter/Space, Esc, and typing a letter jumps to an option.
 * `columns` lays a long list out as a grid so every option is visible at once.
 */
export function Dropdown({ id, value, onChange, options, placeholder = 'Choose', error, hint, ariaLabel, disabled = false, size = 'md', columns = 1, className = '' }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [box, setBox] = useState(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const listId = `${id}-list`;
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];
  const wanted = listHeight(options.length, columns);
  const close = useCallback(() => setOpen(false), []);

  useFollow(open, buttonRef, wanted, setBox, close);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (!buttonRef.current?.contains(event.target) && !listRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const openList = () => {
    const placed = buttonRef.current ? placeBelow(buttonRef.current, wanted) : null;
    if (!placed) return;
    setBox(placed);
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const choose = (index) => {
    if (options[index]) onChange(options[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (event) => {
    const { key } = event;
    if (key === 'Escape' && open) {
      // Stop here so an open dialog behind the menu stays open.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openList();
      else setActive((index) => (key === 'ArrowDown' ? Math.min(options.length - 1, index + columns) : Math.max(0, index - columns)));
    } else if ((key === 'ArrowRight' || key === 'ArrowLeft') && open && columns > 1) {
      event.preventDefault();
      setActive((index) => (key === 'ArrowRight' ? Math.min(options.length - 1, index + 1) : Math.max(0, index - 1)));
    } else if ((key === 'Home' || key === 'End') && open) {
      event.preventDefault();
      setActive(key === 'Home' ? 0 : options.length - 1);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (open && active >= 0) choose(active);
      else openList();
    } else if (key === 'Tab' && open) {
      setOpen(false);
    } else if (key.length === 1 && /\S/.test(key)) {
      const index = options.findIndex((option) => String(option.label).toLowerCase().startsWith(key.toLowerCase()));
      if (index >= 0) {
        if (open) setActive(index);
        else onChange(options[index].value);
      }
    }
  };

  return (
    <div className={`relative min-w-0 ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, hint)}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={fieldClass(error, `flex cursor-pointer items-center justify-between gap-2 text-left ${size === 'sm' ? 'h-9 px-2.5! text-[14px]!' : 'h-11'} ${open ? 'border-[#0167F6]! ring-[3px] ring-[#0167F6]/15' : ''}`)}
      >
        <span className={`truncate ${selected ? 'font-medium text-[#0E1B3D]' : 'text-[#6B7591]'}`}>{selected ? selected.short || selected.label : placeholder}</span>
        <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-[#475373] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open &&
        box &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              top: box.top,
              left: Math.max(8, Math.min(box.left, window.innerWidth - (columns > 1 ? 340 : 0) - 8)),
              minWidth: box.width,
              maxWidth: `min(${columns > 1 ? 340 : 320}px, calc(100vw - 16px))`,
              maxHeight: box.maxHeight,
              ...(columns > 1 ? { display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: '2px' } : {})
            }}
            className={`${LIST_LAYER} w-max`}
          >
            {options.map((option, index) => {
              const isSelected = index === selectedIndex;
              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-[8px] py-2.5 text-[14.5px] ${columns > 1 ? 'justify-center px-2' : 'justify-between px-3'} ${index === active ? 'bg-[#EEF2FF]' : ''} ${isSelected ? (columns > 1 ? 'bg-[#0167F6]! font-semibold text-white' : 'font-semibold text-[#0B3FA8]') : 'text-[#1B2B55]'}`}
                >
                  <span>{option.label}</span>
                  {isSelected && columns === 1 && <Check aria-hidden="true" className="size-4 shrink-0 text-[#0167F6]" />}
                </li>
              );
            })}
          </ul>,
          layerTarget()
        )}
    </div>
  );
}

/**
 * Text input with a themed suggestion list (free text still allowed), used where a
 * list of common answers helps: degrees, experience domains.
 */
// `onPick`, when given, receives a suggestion the user picks (instead of onChange).
export function ComboInput({ id, value, onChange, onPick, suggestions, clean, error, hint, placeholder, maxLength }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [box, setBox] = useState(null);
  const inputRef = useRef(null);
  const listId = `${id}-list`;
  const text = String(value || '').trim().toLowerCase();
  const matches = suggestions.filter((item) => item.toLowerCase().includes(text) && item.toLowerCase() !== text).slice(0, 8);
  const showList = open && matches.length > 0 && box;
  const wanted = listHeight(Math.max(1, matches.length));
  const close = useCallback(() => setOpen(false), []);

  useFollow(open, inputRef, wanted, setBox, close);

  const show = () => {
    const placed = inputRef.current ? placeBelow(inputRef.current, listHeight(8)) : null;
    if (placed) setBox(placed);
    setOpen(true);
  };

  const pick = (item) => {
    if (onPick) onPick(item);
    else onChange(clean ? clean(item) : item);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className="relative min-w-0">
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={Boolean(showList)}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, hint)}
        value={value ?? ''}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => {
          onChange(clean ? clean(event.target.value) : event.target.value);
          if (!open) show();
          setActive(-1);
        }}
        onFocus={show}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) show();
            setActive((index) => (event.key === 'ArrowDown' ? Math.min(matches.length - 1, index + 1) : Math.max(0, index - 1)));
          } else if (event.key === 'Enter' && showList && active >= 0) {
            event.preventDefault();
            pick(matches[active]);
          } else if (event.key === 'Escape' && showList) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
        }}
        className={fieldClass(error, 'h-11')}
      />
      {showList &&
        createPortal(
          <ul id={listId} role="listbox" style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }} className={LIST_LAYER}>
            {matches.map((item, index) => (
              <li
                key={item}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(item)}
                className={`cursor-pointer rounded-[8px] px-3 py-2.5 text-[14.5px] text-[#1B2B55] ${index === active ? 'bg-[#EEF2FF]' : ''}`}
              >
                {item}
              </li>
            ))}
          </ul>,
          layerTarget()
        )}
    </div>
  );
}

export function Checkbox({ id, checked, onChange, children, disabled }) {
  return (
    <label htmlFor={id} className={`flex min-h-10 cursor-pointer items-center gap-2.5 text-[15px] ${INK} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="size-[18px] shrink-0 cursor-pointer accent-[#0167F6]" />
      {children}
    </label>
  );
}

/**
 * Pill buttons from the design (aria-pressed). `multiple` toggles values in an
 * array; otherwise one value is picked. `disabled` maps value → reason.
 */
export function PillGroup({ legend, required, hint, error, options, value, multiple = false, onChange, disabled = {}, id }) {
  const picked = (option) => (multiple ? (value || []).includes(option.value) : value === option.value);
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}>
      <legend className={`mb-2 p-0 text-[14px] font-semibold ${INK}`}>
        {legend}
        {required && <RequiredMark />}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = picked(option);
          const reason = disabled[option.value];
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              disabled={Boolean(reason)}
              title={reason || undefined}
              onClick={() => {
                if (multiple) onChange(on ? value.filter((item) => item !== option.value) : [...(value || []), option.value]);
                else onChange(option.value);
              }}
              className={`min-h-10 rounded-full border px-4 text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6] disabled:cursor-not-allowed disabled:border-dashed disabled:bg-[#F4F6FE] disabled:text-[#6B7591] ${
                on ? 'border-[#0167F6] bg-[#0167F6] text-white shadow-[0_4px_12px_-6px_rgba(1,103,246,0.8)]' : 'border-[#C9D1E3] bg-white text-[#1B2B55] hover:border-[#6378F9] hover:bg-[#F4F6FE]'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={`${id}-error`} className="m-0 mt-1.5 text-[13px] font-medium text-[#B42318]">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className={`m-0 mt-1.5 text-[13px] ${MUTED}`}>
            {hint}
          </p>
        )
      )}
    </fieldset>
  );
}

// Only the top-most open dialog reacts to Esc, so a confirm box inside a dialog
// closes without closing the dialog behind it.
const openDialogs = [];

// Page scroll is locked while any dialog is open. A shared count (not each dialog
// saving and restoring body overflow) keeps nested dialogs that close together,
// e.g. a confirm box inside the intro video dialog, from leaving the page locked.
let scrollLocks = 0;
let savedOverflow = '';
function lockScroll() {
  if (scrollLocks === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLocks += 1;
}
function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) document.body.style.overflow = savedOverflow;
}

/**
 * Modal from the designs: header with title and subtitle, scrolling body, footer.
 * Esc and the backdrop close it unless `busy`; focus moves in and back out; the
 * page behind doesn't scroll.
 */
export function Dialog({ title, subtitle, onClose, busy = false, width = 'max-w-[640px]', footer, children, badge }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const busyRef = useRef(busy);
  const closeRef = useRef(onClose);

  useEffect(() => {
    busyRef.current = busy;
    closeRef.current = onClose;
  });

  useEffect(() => {
    const token = {};
    openDialogs.push(token);
    const opener = document.activeElement;
    lockScroll();
    const panel = panelRef.current;
    const first = panel?.querySelector('[data-autofocus]');
    (first || panel)?.focus();

    const onKey = (event) => {
      if (openDialogs[openDialogs.length - 1] !== token) return;
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key === 'Tab' && panel) {
        const focusable = [...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),video[controls],[tabindex]:not([tabindex="-1"])')];
        if (focusable.length === 0) return;
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        } else if (!event.shiftKey && document.activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      openDialogs.splice(openDialogs.indexOf(token), 1);
      unlockScroll();
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    };
  }, []);

  return createPortal(
    // Below the layout toast (z-100) so save messages show above an open dialog.
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#0E1B3D]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={() => !busyRef.current && closeRef.current()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex max-h-[94vh] w-full ${width} flex-col overflow-hidden rounded-t-[18px] bg-white text-[15px] leading-[1.5] ${INK} shadow-[0_24px_60px_-20px_rgba(14,27,61,0.45)] focus:outline-none sm:max-h-[90vh] sm:rounded-[18px]`}
      >
        <div className="h-1 w-full shrink-0 bg-[linear-gradient(90deg,#0167F6_0%,#6378F9_55%,#B386F9_80%,#FA91FD_100%)]" aria-hidden="true" />
        <header className="flex items-start justify-between gap-3 border-b border-[#EEF0F6] px-5 pb-4 pt-5 sm:px-6">
          <div className="flex min-w-0 flex-col gap-1">
            {badge}
            <h2 id={titleId} className="m-0 text-[20px] leading-tight">
              <span className={`${HEADING_FONT} font-bold ${INK}`}>{title}</span>
            </h2>
            {subtitle && <p className={`m-0 text-[14.5px] ${MUTED}`}>{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={() => closeRef.current()}
            disabled={busy}
            aria-label="Close"
            className="flex size-10 shrink-0 items-center justify-center rounded-[10px] text-[#1B2B55] hover:bg-[#F4F6FE] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[#EEF0F6] bg-[#FBFCFF] px-5 py-4 sm:px-6">{footer}</footer>}
      </div>
    </div>,
    // Inside #root (its own stacking context) so the layout's toasts (z-100) stay above dialogs.
    document.getElementById('root') || document.body
  );
}

/** Yes/no question; `tone="danger"` for removals. */
export function ConfirmDialog({ title, confirmLabel, busyLabel, tone = 'primary', busy = false, onConfirm, onClose, children }) {
  return (
    <Dialog
      title={title}
      onClose={onClose}
      busy={busy}
      width="max-w-[440px]"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={`${SECONDARY} h-11 px-4`}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={`${tone === 'danger' ? DANGER : PRIMARY} h-11 px-5`}>
            {busy && <Spinner />}
            {busy ? busyLabel : confirmLabel}
          </button>
        </>
      }
    >
      <div className={`text-[15px] ${INK}`}>{children}</div>
    </Dialog>
  );
}

/** Cancel / Save footer shared by the add-and-edit dialogs, with an optional Remove on the left. */
export function DialogFooter({ busy, saveLabel = 'Save', busyLabel = 'Saving…', onCancel, onSave, onRemove, removeLabel = 'Remove', disabled = false }) {
  return (
    <>
      {onRemove && (
        <button type="button" onClick={onRemove} disabled={busy} className={`${DANGER_OUTLINE} mr-auto h-11 px-4`}>
          {removeLabel}
        </button>
      )}
      <button type="button" onClick={onCancel} disabled={busy} className={`${SECONDARY} h-11 px-4`}>
        Cancel
      </button>
      <button type="button" onClick={onSave} disabled={busy || disabled} className={`${PRIMARY} h-11 px-5`}>
        {busy && <Spinner />}
        {busy ? busyLabel : saveLabel}
      </button>
    </>
  );
}
