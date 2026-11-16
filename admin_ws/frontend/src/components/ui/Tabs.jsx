import { cx } from '../../utils/cx.js';

/** tabs: [{ key, label, count? }]. Arrow keys move between tabs. `dense` tightens the spacing for narrow containers such as a drawer. */
export default function Tabs({ tabs, value, onChange, label, className, dense = false }) {
  const move = (event, index) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length];
    onChange(next.key);
    document.getElementById(`tab-${label}-${next.key}`)?.focus();
  };

  // With nothing selected (e.g. a custom mix of filters) the first tab stays reachable by keyboard.
  const tabbable = tabs.some((tab) => tab.key === value) ? value : tabs[0]?.key;

  return (
    <div role="tablist" aria-label={label} className={cx('flex overflow-x-auto border-b border-line', dense ? 'gap-0 px-2' : 'gap-1 px-3', className)}>
      {tabs.map((tab, index) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            id={`tab-${label}-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={tab.key === tabbable ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => move(event, index)}
            className={cx(
              '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors',
              dense ? 'px-2.5' : 'px-3',
              active ? 'border-accent text-accent-ink' : 'border-transparent text-ink-2 hover:text-ink'
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span className={cx('rounded-full px-2 text-xs', active ? 'bg-accent-soft text-accent-ink' : 'bg-subtle text-muted')}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
