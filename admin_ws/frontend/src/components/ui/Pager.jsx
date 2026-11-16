import { pageWindow } from '../../utils/collections.js';
import { cx } from '../../utils/cx.js';
import Button from './Button.jsx';

/** `info` is the object returned by paginate(). */
export default function Pager({ info, onPage }) {
  if (info.total === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-muted">
      <span>
        Showing {info.from}–{info.to} of {info.total}
      </span>
      <nav aria-label="Pagination" className="flex items-center gap-1.5">
        <Button size="sm" disabled={info.page <= 1} onClick={() => onPage(info.page - 1)}>
          ← Previous
        </Button>
        {pageWindow(info.page, info.pages).map((n, index) =>
          n === '…' ? (
            <span key={`gap-${index}`} aria-hidden="true" className="px-1">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              aria-label={`Page ${n}`}
              aria-current={n === info.page ? 'page' : undefined}
              onClick={() => onPage(n)}
              className={cx(
                'h-8 min-w-8 rounded-lg px-2 text-[13px] font-semibold transition-colors',
                n === info.page ? 'bg-accent text-white' : 'bg-subtle text-ink-2 hover:bg-line'
              )}
            >
              {n}
            </button>
          )
        )}
        <Button size="sm" disabled={info.page >= info.pages} onClick={() => onPage(info.page + 1)}>
          Next →
        </Button>
      </nav>
    </div>
  );
}
