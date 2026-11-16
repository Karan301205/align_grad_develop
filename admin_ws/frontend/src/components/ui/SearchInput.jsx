import { Search } from 'lucide-react';
import { cx } from '../../utils/cx.js';

export default function SearchInput({ value, onChange, placeholder, label, className }) {
  return (
    <label className={cx('relative block', className)}>
      <span className="sr-only">{label || placeholder}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-line-strong bg-panel pl-9 pr-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
