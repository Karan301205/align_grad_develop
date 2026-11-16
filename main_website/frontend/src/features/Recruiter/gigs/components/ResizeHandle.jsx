import { useRef } from 'react';

const KEY_STEP = 16; // px per arrow-key press

/**
 * Drag bar between two panels. `orientation="vertical"` is an upright bar you drag sideways (changes a
 * width); `"horizontal"` is a flat bar you drag up or down (changes a height). Arrow keys nudge it and a
 * double-click resets it. `getStart` returns the current size in px, `onChange` receives the new one
 * (clamp it there), and `invert` flips the direction for panels that grow when the bar moves the other way.
 */
export default function ResizeHandle({ orientation, label, getStart, value, onChange, onReset, invert = false, className = '' }) {
  const drag = useRef(null);
  const vertical = orientation === 'vertical';
  const sign = invert ? -1 : 1;

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault(); // no text selection while dragging
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { from: vertical ? event.clientX : event.clientY, start: getStart() };
  };

  const onPointerMove = (event) => {
    if (!drag.current) return;
    const at = vertical ? event.clientX : event.clientY;
    onChange(drag.current.start + sign * (at - drag.current.from));
  };

  const onKeyDown = (event) => {
    const step = (vertical ? { ArrowLeft: -1, ArrowRight: 1 } : { ArrowUp: -1, ArrowDown: 1 })[event.key];
    if (!step) return;
    event.preventDefault();
    onChange(getStart() + sign * step * KEY_STEP);
  };

  return (
    <div
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label={label}
      aria-valuenow={value ?? undefined}
      tabIndex={0}
      title="Drag to resize, double-click to reset"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
      className={`group relative touch-none select-none outline-none ${vertical ? 'cursor-col-resize' : 'cursor-row-resize'} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute rounded-full bg-transparent transition-colors group-hover:bg-[#BFE0D8] group-focus-visible:bg-[#0F7A55] group-active:bg-[#0F7A55] ${
          vertical ? 'inset-y-0 left-1/2 w-1 -translate-x-1/2' : 'inset-x-0 top-1/2 h-1 -translate-y-1/2'
        }`}
      />
    </div>
  );
}
