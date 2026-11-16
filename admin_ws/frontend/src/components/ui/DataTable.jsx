import { cx } from '../../utils/cx.js';
import { EmptyState } from './States.jsx';

/**
 * columns: [{ header, render(row), key?, headerNode?, headerClassName?, wrapHeader?, align?: 'right', className?, hideHeader? }]
 * (`header` is the text and the default key; `headerNode` replaces it visually, e.g. a column menu; `headerClassName`
 * replaces the default semibold style; `wrapHeader` lets a long heading break onto two lines so the column can be narrower;
 * `hideHeader` keeps the name for screen readers only)
 * `compact` tightens the cell padding for tables with many columns.
 * The wrapper is `relative` so the screen-reader-only header (absolutely positioned) can't stretch the page.
 * Clicking a row calls onRowClick (a mouse shortcut; every row also has its own button
 * for keyboard users). Clicks on buttons and links inside a row don't trigger it.
 */
export default function DataTable({ columns, rows, rowKey, onRowClick, empty, caption, compact = false }) {
  const pad = compact ? 'px-3' : 'px-4';
  const handleRowClick = (event, row) => {
    if (!onRowClick || event.target.closest('button, a, input, select, textarea')) return;
    onRowClick(row);
  };

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left text-[13.5px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line bg-subtle/60 text-xs uppercase tracking-wide text-muted">
            {columns.map((column) => (
              <th key={column.key || column.header} scope="col" className={cx(column.wrapHeader ? 'whitespace-normal' : 'whitespace-nowrap', pad, 'py-2.5', column.headerClassName || 'font-semibold', column.align === 'right' && 'text-right')}>
                {column.hideHeader ? <span className="sr-only">{column.header}</span> : column.headerNode || column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState>{empty}</EmptyState>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={(event) => handleRowClick(event, row)}
                className={cx('transition-colors hover:bg-subtle/60', onRowClick && 'cursor-pointer')}
              >
                {columns.map((column) => (
                  <td key={column.key || column.header} className={cx(pad, 'py-3 align-middle', column.align === 'right' && 'text-right', column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
