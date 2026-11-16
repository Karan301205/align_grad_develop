import RecruiterIcon from './RecruiterIcon';
import AccountIcon from './AccountIcon';
import alignGradLogo from '../../../assets/landing/aligngrad-logo.png';
import { BRAND_GRADIENT, BRAND_GRADIENT_X, BRAND_GRADIENT_Y } from './accountStyles';

// Landing-page greens: the logo's wordmark teal for active text, green for icons,
// and a light pine tint behind the active item. The marker bar keeps the logo mark's gradient.
const PINE = 'text-[#003833]';
const ACTIVE_ROW = 'border border-[#7FD8C4]/60 bg-[#E3F1EE]';

// Below md the sidebar is a slide-in drawer and always shows labels; `collapsed`
// only changes the desktop rail (256px ↔ 80px), so these classes are md: only.
const whenCollapsed = (collapsed, classes) => (collapsed ? classes : '');

function NavButton({ item, active, collapsed, onClick }) {
  const lockedHint = `${item.label} unlocks after your company is approved`;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={item.locked ? `${item.label} (locked)` : item.label}
      title={item.locked ? lockedHint : collapsed ? item.label : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left text-base leading-6 transition-colors ${whenCollapsed(collapsed, 'md:justify-center md:px-0')} ${
        active ? `${ACTIVE_ROW} ${PINE}` : 'border border-transparent text-slate-500 hover:bg-[#F1F7F5] hover:text-[#023836]'
      }`}
    >
      {/* Active marker: a thin bar in the logo gradient. */}
      {active && <span aria-hidden="true" className={`absolute inset-y-2 left-0 w-[3px] rounded-full ${BRAND_GRADIENT_Y}`} />}
      {/* 24px line box around the 16px glyph gives the design's 40px rows */}
      <span className="w-5 shrink-0 text-center leading-6">
        <RecruiterIcon name={item.icon} className={active ? 'text-[#0F7A55]' : 'group-hover:text-[#0F7A55]'} />
      </span>
      <span className={`min-w-0 flex-1 truncate text-sm leading-5 ${active ? 'font-bold' : 'font-medium'} ${whenCollapsed(collapsed, 'md:hidden')}`}>{item.label}</span>
      {item.locked && <RecruiterIcon name="lock" className={`text-[10px] text-slate-300 ${whenCollapsed(collapsed, 'md:absolute md:right-2 md:top-1.5 md:text-[8px]')}`} />}
      {item.dot && (
        <span
          role="img"
          aria-label={item.dot}
          title={item.dot}
          className={`size-2 shrink-0 rounded-full bg-[#D97706] ${whenCollapsed(collapsed, 'md:absolute md:right-2.5 md:top-2')}`}
        />
      )}
      {!item.locked && item.subItems && (
        <RecruiterIcon name={active ? 'chevron-up' : 'chevron-down'} className={`text-[10px] text-slate-400 ${whenCollapsed(collapsed, 'md:hidden')}`} />
      )}
    </button>
  );
}

function GroupLabel({ collapsed, className = '', children }) {
  return (
    <>
      <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 ${className} ${whenCollapsed(collapsed, 'md:hidden')}`}>{children}</div>
      {collapsed && <div aria-hidden="true" className={`mx-3 hidden border-t border-slate-100 md:block ${className ? 'my-2' : 'mb-2'}`} />}
    </>
  );
}

/**
 * Recruiter portal sidebar (design: design/AlignGrad - CompanyProfile.html; "Account"
 * group from design/Company profile & verification-html).
 * Desktop: fixed rail, 256px open (default) or 80px icons-only after the arrow is
 * clicked; the layout moves <main> with it so nothing is covered. Mobile: drawer.
 */
export default function RecruiterSidebar({ navItems, activeItemId, onNavigate, company, user, onLogout, open, onOpen, onClose, collapsed, onToggleCollapsed }) {
  const displayName = company?.name || user?.name || user?.email || 'Recruiter';

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-white px-4 md:hidden">
        <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-[2px] ${BRAND_GRADIENT_X}`} />
        <img src={alignGradLogo} alt="AlignGrad" className="h-8 w-auto" />
        <button type="button" onClick={onOpen} aria-label="Open menu" className="rounded-[8px] p-2 text-lg text-slate-500 hover:bg-slate-50 hover:text-[#023836]">
          <RecruiterIcon name="bars" />
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        aria-label="Sidebar"
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-[transform,width] duration-300 ease-out md:translate-x-0 ${
          collapsed ? 'md:w-20' : 'md:w-64'
        } ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex items-center justify-between gap-2 border-b border-slate-100 p-6 ${whenCollapsed(collapsed, 'md:flex-col md:px-3 md:py-5')}`}>
          {/* Collapsed: only the mark at the left of the logo shows. */}
          <img src={alignGradLogo} alt="AlignGrad" className={`h-8 w-auto ${whenCollapsed(collapsed, 'md:w-[30px] md:object-cover md:object-left')}`} />
          <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-[8px] p-1.5 text-base text-slate-400 hover:bg-slate-50 hover:text-[#023836] md:hidden">
            <RecruiterIcon name="xmark" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden size-8 shrink-0 items-center justify-center rounded-[8px] border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#023836] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7A55] md:flex"
          >
            <AccountIcon name={collapsed ? 'chevron-right' : 'chevron-left'} size={16} strokeWidth={2} />
          </button>
        </div>

        <nav aria-label="Recruiter hub" className={`flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-4 ${whenCollapsed(collapsed, 'md:px-3')}`}>
          <GroupLabel collapsed={collapsed}>Recruiter hub</GroupLabel>
          {navItems.map((item, index) => {
            const active = activeItemId === item.id;
            // Items with a `group` (e.g. "Account") get a section label above the first of them.
            const startsGroup = item.group && item.group !== navItems[index - 1]?.group;
            return (
              <div key={item.id} className="flex flex-col gap-1">
                {startsGroup && (
                  <GroupLabel collapsed={collapsed} className="mt-4">
                    {item.group}
                  </GroupLabel>
                )}
                <NavButton item={item} active={active} collapsed={collapsed} onClick={() => onNavigate(item.id)} />
                {active && item.subItems && !item.locked && (
                  <div className={`ml-[22px] flex flex-col gap-0.5 border-l border-slate-200 pl-3 ${whenCollapsed(collapsed, 'md:hidden')}`}>
                    {item.subItems.map((sub) => {
                      const subActive = item.activeSubId === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => item.onSubItemClick(sub.id)}
                          aria-current={subActive ? 'page' : undefined}
                          className={`rounded-[8px] px-3 py-1.5 text-left text-[13px] leading-5 transition-colors ${
                            subActive ? `bg-[#E3F1EE] font-bold ${PINE}` : 'font-medium text-slate-500 hover:bg-[#F1F7F5] hover:text-[#023836]'
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={`border-t border-slate-100 p-4 ${whenCollapsed(collapsed, 'md:px-3')}`}>
          <div
            title={collapsed ? displayName : undefined}
            className={`flex items-center gap-3 rounded-[12px] border border-slate-100 bg-slate-50 p-3 ${whenCollapsed(collapsed, 'md:justify-center md:border-0 md:bg-transparent md:p-0')}`}
          >
            <div className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[8px] font-bold text-white ${BRAND_GRADIENT}`}>
              {company?.logoUrl ? <img src={company.logoUrl} alt="" className="size-full object-cover" /> : displayName.charAt(0).toUpperCase()}
            </div>
            <div className={`min-w-0 flex-1 ${whenCollapsed(collapsed, 'md:hidden')}`}>
              <p className="truncate text-sm font-bold text-[#023836]">{displayName}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recruiter</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            title={collapsed ? 'Log out' : undefined}
            className={`mt-4 flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 ${whenCollapsed(collapsed, 'md:justify-center md:px-0')}`}
          >
            <RecruiterIcon name="right-from-bracket" />
            <span className={whenCollapsed(collapsed, 'md:hidden')}>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
