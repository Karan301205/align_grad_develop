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
        className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm cursor-pointer ${
          active && !hasSubItems
            ? 'bg-primary text-on-primary font-bold shadow-sm shadow-primary/30'
            : active && hasSubItems
            ? 'bg-primary/15 text-primary font-bold'
            : isHovered && hasSubItems
            ? 'bg-surface-container-high text-primary font-medium'
            : 'font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-high active:scale-[0.98]'
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
              <span className="text-on-surface-variant group-hover:text-primary transition-colors p-0.5">
                {showSubMenu ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Hover Submenu */}
      {showSubMenu && (
        <div className="flex flex-col mt-1 ml-4 pl-3 border-l-2 border-primary/40 space-y-0.5 py-1 animate-fade-in">
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
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-headline font-medium transition-all duration-150 text-left cursor-pointer ${
                  isSubActive
                    ? 'bg-primary text-on-primary font-bold shadow-xs shadow-primary/20 translate-x-0.5'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                {SubIcon ? (
                  <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-on-primary' : 'text-on-surface-variant'}`} />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-on-primary' : 'bg-on-surface-variant/60'}`} />
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


