import React from 'react';
import { Lock } from 'lucide-react';

export default function SidebarNavItem({ icon: Icon, label, active, locked, onClick, collapsed }) {
  return (
    <button
      onClick={() => !locked && onClick?.()}
      disabled={locked}
      title={collapsed ? label : undefined}
      className={`group relative w-full flex items-center px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm cursor-pointer ${
        active
          ? 'bg-primary text-on-primary font-bold shadow-sm shadow-primary/30'
          : 'font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-high active:scale-[0.98]'
      } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-[18px] h-[18px] transition-transform duration-200 shrink-0 ${active ? '' : 'group-hover:scale-110'}`} />
        {!collapsed && <span className="animate-fade-in text-left truncate">{label}</span>}
      </div>
      {!collapsed && locked && <Lock className="w-3.5 h-3.5 opacity-60 animate-fade-in shrink-0 ml-auto" />}
    </button>
  );
}
