import React from 'react';
import { Lock } from 'lucide-react';

export default function SidebarNavItem({ icon: Icon, label, active, locked, onClick }) {
  return (
    <button
      onClick={() => !locked && onClick?.()}
      disabled={locked}
      className={`group relative w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${
        active
          ? 'bg-primary-container text-on-primary-container font-semibold'
          : 'font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
      } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" aria-hidden="true" />
      )}
      <div className="flex items-center gap-3">
        <Icon className={`w-[18px] h-[18px] transition-transform duration-200 ${active ? '' : 'group-hover:scale-110'}`} />
        <span>{label}</span>
      </div>
      {locked && <Lock className="w-3.5 h-3.5 opacity-60" />}
    </button>
  );
}
