import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Right-hand drawer for the recruiter pages (candidate profile, job details), the same pattern as the
 * admin portal's drawers: it slides in over a dimmed page; Esc, the ✕ button and a click on the dimmed
 * area close it. Focus moves into the panel and goes back to what opened it on close.
 *  - header / actions: left side of the top bar, and buttons next to the ✕
 *  - children: the scrolling body; footer: pinned bar at the bottom
 *  - outside: extra layers that must not sit inside the sliding panel (their `fixed` positioning
 *    would then be relative to it), e.g. a video overlay
 *  - widthClass: the panel width, as a full Tailwind class
 */
export default function SideDrawer({ label, onClose, header, actions, footer, outside, widthClass = 'sm:w-[min(896px,92vw)]', children }) {
  const panel = useRef(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();

    const onKey = (event) => {
      if (event.key === 'Escape') closeRef.current?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-black/45 animate-backdrop-in" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden border-l border-[#E4E6EA] bg-white text-left shadow-2xl animate-drawer-in focus:outline-none ${widthClass}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E4E6EA] bg-white px-5 py-4">
          <div className="min-w-0 flex-1">{header}</div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer rounded-[8px] p-1.5 text-[#4B5563] transition-colors hover:bg-[#F4F8F6] hover:text-[#023836]">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F4F8F6] p-5 text-[#023836] custom-scrollbar sm:p-6">{children}</div>
        {footer && <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-t border-[#E4E6EA] bg-white px-5 py-3">{footer}</div>}
      </div>
      {outside}
    </div>,
    document.body
  );
}
