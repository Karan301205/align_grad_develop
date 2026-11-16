import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button.jsx';

/**
 * The footer of a drawer that browses a list: Previous, "3 of 24" and Next. `noun` completes the button
 * names ("Previous candidate") and `label` names the record on screen for the screen-reader announcement
 * that is made each time it changes. Previous is disabled on the first record and Next on the last.
 */
export default function DrawerNav({ noun, label, position, total, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p role="status" className="sr-only">
        {noun.charAt(0).toUpperCase() + noun.slice(1)} {position} of {total}: {label}
      </p>
      <Button icon={ChevronLeft} aria-label={`Previous ${noun}`} onClick={onPrev} disabled={position <= 1}>
        Previous
      </Button>
      <span className="text-[13px] font-semibold text-muted">
        {position} of {total}
      </span>
      <Button aria-label={`Next ${noun}`} onClick={onNext} disabled={position >= total}>
        Next
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
