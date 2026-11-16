import { LogOut } from 'lucide-react';
import { cx } from '../utils/cx.js';
import { NAV_GROUPS } from './navigation.js';
import { useAdminData } from './AdminDataContext.jsx';

// On phones the sidebar is a drawer and always shows its labels. `collapsed` only applies
// from the md breakpoint up, where it becomes a narrow icon rail.
function SystemStatus({ collapsed }) {
  const { stats } = useAdminData();
  const reachable = Boolean(stats.data);
  const checking = stats.loading && !stats.data;
  const dot = checking ? 'bg-faint' : reachable ? 'bg-ok' : 'bg-bad';
  const summary = checking ? 'Checking the system…' : reachable ? 'System healthy: PostgreSQL connected' : 'System problem: PostgreSQL unavailable';
  return (
    <>
      <div className={cx('mx-1 rounded-xl border border-line bg-canvas p-3 text-[12.5px]', collapsed && 'md:hidden')}>
        <div className="flex items-center justify-between font-semibold text-muted">
          <span>System status</span>
          <span className="flex items-center gap-1.5 text-ink-2">
            <span className={cx('size-2 rounded-full', dot)} aria-hidden="true" />
            {checking ? 'Checking…' : reachable ? 'Healthy' : 'Problem'}
          </span>
        </div>
        <dl className="mt-2 space-y-1">
          <div className="flex justify-between">
            <dt className="text-muted">PostgreSQL</dt>
            <dd className={cx('font-semibold', reachable ? 'text-ok' : 'text-muted')}>{checking ? '…' : reachable ? 'Connected' : 'Unavailable'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">AWS S3</dt>
            <dd className={cx('font-semibold', stats.data?.storageSize ? 'text-ok' : 'text-muted')}>{checking ? '…' : stats.data?.storageSize ?? 'Unavailable'}</dd>
          </div>
        </dl>
      </div>
      <div className={cx('hidden justify-center py-2', collapsed && 'md:flex')} title={summary} role="img" aria-label={summary}>
        <span className={cx('size-2.5 rounded-full', dot)} />
      </div>
    </>
  );
}

export default function Sidebar({ section, onSelect, onLogout, open, onClose, badges, collapsed }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/40 md:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        id="admin-sidebar"
        aria-label="Admin navigation"
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col gap-1 overflow-y-auto overflow-x-hidden border-r border-line bg-panel px-3 py-4 transition-[transform,width] duration-200 md:translate-x-0',
          collapsed ? 'md:w-[72px] md:px-2' : 'md:w-60',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className={cx('flex flex-col gap-1 px-2 pb-3', collapsed && 'md:items-center md:px-0')}>
          <img src="/aligngrad-logo.png" alt="AlignGrad" width="131" height="28" className={cx('h-7 w-auto self-start', collapsed && 'md:hidden')} />
          <img src="/aligngrad-mark.png" alt="AlignGrad" width="36" height="36" className={cx('hidden size-9', collapsed && 'md:block')} />
          <div className={cx('text-xs font-medium text-muted', collapsed && 'md:hidden')}>Admin Workspace</div>
        </div>

        <nav className="flex-1">
          {NAV_GROUPS.map((group, groupIndex) => (
            <div key={group.label} className={cx(collapsed && groupIndex > 0 && 'md:mt-2 md:border-t md:border-line md:pt-1')}>
              <div className={cx('px-2.5 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted', collapsed && 'md:hidden')}>{group.label}</div>
              <ul className="space-y-px">
                {group.items.map((item) => {
                  const active = item.id === section;
                  const badge = badges[item.id];
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(item.id)}
                        aria-current={active ? 'page' : undefined}
                        aria-label={collapsed ? item.label : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cx(
                          'relative flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] font-medium transition-colors',
                          collapsed && 'md:justify-center md:px-0',
                          active ? 'bg-accent-soft font-semibold text-accent-ink' : 'text-ink-2 hover:bg-subtle hover:text-ink'
                        )}
                      >
                        <item.icon className="size-[18px] shrink-0" aria-hidden="true" />
                        <span className={cx('flex-1', collapsed && 'md:hidden')}>{item.label}</span>
                        {badge > 0 && (
                          <span
                            className={cx('rounded-full bg-bad-soft px-2 text-xs font-bold text-bad', collapsed && 'md:absolute md:right-1 md:top-0 md:px-1.5 md:text-[10px]')}
                            aria-label={`${badge} waiting`}
                          >
                            {badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <SystemStatus collapsed={collapsed} />
        <button
          type="button"
          onClick={onLogout}
          aria-label={collapsed ? 'Log out' : undefined}
          title={collapsed ? 'Log out' : undefined}
          className={cx(
            'mx-1 mt-2 flex items-center gap-2.5 rounded-lg border border-line-strong px-3 py-2 text-[13.5px] font-semibold text-bad transition-colors hover:bg-bad-soft',
            collapsed && 'md:justify-center md:px-0'
          )}
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          <span className={cx(collapsed && 'md:hidden')}>Log out</span>
        </button>
      </aside>
    </>
  );
}
