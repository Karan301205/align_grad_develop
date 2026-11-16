import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A panel that slides in from the right over a dimmed page. The header holds the title and a close
 * button, the body scrolls, and `footer` stays at the bottom (e.g. Previous / Next).
 *
 * Esc, the ✕ button and a click on the dimmed page close it. Focus moves into the panel, Tab stays
 * inside it, and focus goes back to what opened it on close. `scrollKey` scrolls the body back to the
 * top whenever it changes (e.g. when the drawer switches to another record). `closeOnBackdrop={false}`
 * makes a click on the dimmed page do nothing, so a stray click can't throw away a half-filled form
 * (Esc and ✕ still close it). The course forms and the rejection form use this.
 */
export default function Drawer({ title, subtitle, onClose, footer, scrollKey, closeOnBackdrop = true, children }) {
  const titleId = useId();
  const panel = useRef(null);
  const body = useRef(null);
  const closeRef = useRef(onClose);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => setShown(true));
    panel.current?.focus();

    const onKey = (event) => {
      if (event.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (body.current) body.current.scrollTop = 0;
  }, [scrollKey]);

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        aria-hidden="true"
        onMouseDown={() => closeOnBackdrop && closeRef.current()}
        className={`absolute inset-0 bg-ink/45 transition-opacity duration-200 motion-reduce:transition-none ${shown ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-full flex-col bg-panel shadow-2xl transition-transform duration-200 focus:outline-none motion-reduce:transition-none sm:w-[min(760px,92vw)] ${shown ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-lg font-bold leading-tight">
              {title}
            </h2>
            {subtitle && <div className="mt-1 text-[13px] text-muted">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-subtle hover:text-ink">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div ref={body} className="min-h-0 flex-1 overflow-y-auto bg-canvas p-5">
          {children}
        </div>
        {footer && <div className="border-t border-line bg-panel px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
