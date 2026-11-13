import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import AccountIcon from '../../components/AccountIcon';
import { Spinner } from '../../components/AccountControls';
import { CARD, MUTED, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../../components/accountStyles';

/**
 * Modal shell in the recruiter theme: Esc and the backdrop close it (unless `busy`),
 * focus moves into it and back to the opener, the page behind doesn't scroll.
 */
export default function Dialog({ title, subtitle, onClose, busy = false, width = 'max-w-md', footer, children }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      // An open dropdown inside the dialog handles Esc itself (and marks it handled).
      if (event.key === 'Escape' && !event.defaultPrevented && !busy) {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  return createPortal(
    // Below the layout's toast (z-100), so a failed action's message shows on top of the dialog.
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0F172A]/50 p-4" onMouseDown={() => !busy && onClose()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        className={`${CARD} flex max-h-[90vh] w-full ${width} flex-col font-(family-name:--font-headline) text-sm text-[#0F172A] shadow-xl focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EEF0F3] px-5 py-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 id={titleId} className="m-0 text-[17px] leading-snug text-[#0F172A]">
              <span className="font-semibold">{title}</span>
            </h2>
            {subtitle && <span className={`text-[13px] ${MUTED}`}>{subtitle}</span>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-[8px] p-1.5 text-[#4B5563] hover:bg-[#F8F8F6] hover:text-[#0F172A] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6]"
          >
            <AccountIcon name="close" size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-[#EEF0F3] px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

const DANGER_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#B91C1C] font-(family-name:--font-headline) text-sm font-semibold leading-none text-white transition-colors hover:bg-[#991B1B] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B91C1C]';

/** Yes/no question with a busy state; `tone="danger"` for deletes. */
export function ConfirmDialog({ title, confirmLabel, busyLabel, tone = 'primary', busy, onConfirm, onClose, children }) {
  return (
    <Dialog
      title={title}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={`${SECONDARY_BUTTON} h-10 px-4`}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={`${tone === 'danger' ? DANGER_BUTTON : PRIMARY_BUTTON} h-10 px-4`}>
            {busy && <Spinner />}
            {busy ? busyLabel : confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
