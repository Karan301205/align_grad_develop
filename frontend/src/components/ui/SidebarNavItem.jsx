import React from 'react';
import { Lock } from 'lucide-react';

export default function SidebarNavItem({ icon: Icon, label, active, locked, onClick, collapsed }) {
  return (
    <button
      onClick={() => !locked && onClick?.()}
      disabled={locked}
      title={collapsed ? label : undefined}
      className={`group relative w-full flex items-center px-3.5 py-2.5 rounded-lg transition-all duration-200 text-sm ${
        active
          ? 'bg-surface-container-low neu-recessed text-primary font-bold'
          : 'font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container hover:shadow-[var(--shadow-card)] active:translate-y-px'
      } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {active && (
        <span className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-primary shadow-[0_0_8px_1px_var(--c-primary)]" aria-hidden="true" />
      )}
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-[18px] h-[18px] transition-transform duration-200 shrink-0 ${active ? '' : 'group-hover:scale-110'}`} />
        {!collapsed && <span className="animate-fade-in text-left truncate">{label}</span>}
      </div>
      {!collapsed && locked && <Lock className="w-3.5 h-3.5 opacity-60 animate-fade-in shrink-0 ml-auto" />}
    </button>
  );
}
