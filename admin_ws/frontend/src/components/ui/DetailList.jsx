import { cx } from '../../utils/cx.js';

/** items: [[label, value, { wide? }]]. Empty values show an em dash. `columns={1}` stacks them (for narrow cards). */
export default function DetailList({ items, columns = 2, className }) {
  return (
    <dl className={cx('grid gap-x-6 gap-y-3.5', columns === 2 && 'sm:grid-cols-2', className)}>
      {items.map(([label, value, options]) => (
        <div key={label} className={cx('min-w-0', options?.wide && 'sm:col-span-2')}>
          <dt className="text-xs font-semibold text-muted">{label}</dt>
          <dd className="mt-0.5 break-words text-sm">{value || value === 0 ? value : '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
