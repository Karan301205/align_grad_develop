import React, { useState } from 'react';
import { Lock, ChevronDown, ChevronUp } from 'lucide-react';

export default function SidebarNavItem({
  icon: Icon,
  label,
  active,
  locked,
  onClick,
  collapsed,
  subItems,
  activeSubId,
  onSubItemClick
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const hasSubItems = Array.isArray(subItems) && subItems.length > 0;

  // Submenu opens when hovered over this item, or when toggled on mobile
  const showSubMenu = hasSubItems && !collapsed && (isHovered || isMobileOpen);

  const handleParentClick = (e) => {
    if (locked) return;
    if (hasSubItems && !collapsed) {
      setIsMobileOpen(prev => !prev);
      onClick?.();
    } else {
      onClick?.();
    }
  };

  return (
    <div
      className="w-full flex flex-col relative"
      onMouseEnter={() => !locked && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={handleParentClick}
        disabled={locked}
        title={collapsed ? label : undefined}
        className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-none transition-all duration-150 text-xs sm:text-sm font-headline cursor-pointer ${
          active && !hasSubItems
            ? 'bg-blue-700 text-white font-bold shadow-xs'
            : active && hasSubItems
            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-bold border-l-2 border-blue-700'
            : isHovered && hasSubItems
            ? 'bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold'
            : 'font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
        } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`w-[18px] h-[18px] transition-transform duration-200 shrink-0 ${active ? '' : 'group-hover:scale-110'}`} />
          {!collapsed && <span className="animate-fade-in text-left truncate">{label}</span>}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {locked && <Lock className="w-3.5 h-3.5 opacity-60 animate-fade-in" />}
            {hasSubItems && (
              <span className="text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors p-0.5">
                {showSubMenu ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Hover Submenu */}
      {showSubMenu && (
        <div className="flex flex-col mt-1 ml-3.5 pl-2.5 border-l-2 border-blue-700 dark:border-blue-500 space-y-1 py-1 animate-fade-in">
          {subItems.map((sub) => {
            const SubIcon = sub.icon;
            const isSubActive = active && activeSubId === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSubItemClick?.(sub.id);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-none text-xs font-headline transition-all duration-150 text-left cursor-pointer ${
                  isSubActive
                    ? 'bg-blue-700 text-white font-bold shadow-xs translate-x-0.5'
                    : 'font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                {SubIcon ? (
                  <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${isSubActive ? 'bg-white' : 'bg-slate-400 dark:bg-slate-500'}`} />
                )}
                <span className="truncate">{sub.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


