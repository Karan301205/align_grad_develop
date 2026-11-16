import { toneOf } from './chartTones.js';

export function ChartLegend({ items }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-2">
      {items.map((item) => (
        <li key={item.name} className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-sm ${toneOf(item.tone).bg}`} aria-hidden="true" />
          {item.name}
        </li>
      ))}
    </ul>
  );
}

/** The hover card. `left` is the pixel position of the hovered column or point. */
export function ChartTooltip({ left, width, title, rows, total }) {
  const clamped = Math.min(Math.max(left, 84), Math.max(84, width - 84));
  return (
    <div role="presentation" style={{ left: clamped }} className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-lg border border-line bg-panel px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-bold text-ink">{title}</div>
      <ul className="space-y-0.5">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-ink-2">
              <span className={`size-2 shrink-0 rounded-sm ${toneOf(row.tone).bg}`} aria-hidden="true" />
              {row.name}
            </span>
            <span className="font-semibold text-ink">{row.value}</span>
          </li>
        ))}
      </ul>
      {total != null && (
        <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold">
          <span>Total</span>
          <span>{total}</span>
        </div>
      )}
    </div>
  );
}

/**
 * The same numbers as the chart, as a table for screen readers. The table sits inside an
 * sr-only div: a table can't shrink below its content, so an sr-only table on its own
 * would grow to its natural width and stretch the page on a phone.
 */
export function ChartTable({ caption, labelHeader, labels, series }) {
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{labelHeader}</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={`${label}-${i}`}>
              <th scope="row">{label}</th>
              {series.map((s) => (
                <td key={s.key}>{s.values[i] ?? 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartEmpty({ children }) {
  return <p className="pointer-events-none absolute inset-0 grid place-items-center pb-6 text-center text-sm text-muted">{children}</p>;
}
