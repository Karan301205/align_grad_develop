import { useEffect } from 'react';

// Option lists of Dropdown and ComboInput open in a layer above everything (so a
// dialog's scroll area can't cut them off), always below their field. When there
// isn't room below, the field is scrolled up first.
export const LIST_LAYER = 'fixed z-[95] m-0 list-none overflow-y-auto rounded-[12px] border border-[#E1E5F2] bg-white p-1 shadow-[0_18px_40px_-18px_rgba(14,27,61,0.45)]';
export const listHeight = (count, columns = 1) => Math.min(400, Math.ceil(count / columns) * 42 + 10);

function measureBelow(anchor, wanted) {
  const rect = anchor.getBoundingClientRect();
  const room = window.innerHeight - rect.bottom - 16;
  if (rect.bottom < 0 || rect.top > window.innerHeight) return null;
  return { top: rect.bottom + 6, left: rect.left, width: rect.width, maxHeight: Math.max(96, Math.min(wanted, room)) };
}

export function placeBelow(anchor, wanted) {
  if (window.innerHeight - anchor.getBoundingClientRect().bottom - 16 < wanted) anchor.scrollIntoView({ block: 'center' });
  return measureBelow(anchor, wanted);
}

/** Keeps an open list attached to its field while the page or a dialog scrolls; closes it if the field leaves the screen. */
export function useFollow(open, anchorRef, wanted, setBox, close) {
  useEffect(() => {
    if (!open) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = anchorRef.current ? measureBelow(anchorRef.current, wanted) : null;
      if (box) setBox(box);
      else close();
    };
    const onMove = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, anchorRef, wanted, setBox, close]);
}

export const layerTarget = () => document.getElementById('root') || document.body;
