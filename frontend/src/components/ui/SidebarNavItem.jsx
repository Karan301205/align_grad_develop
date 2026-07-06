import React from 'react';
import { Lock } from 'lucide-react';

export default function SidebarNavItem({ icon: Icon, label, active, locked, onClick }) {
  return (
    <button
      onClick={() => !locked && onClick?.()}
      disabled={locked}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all text-sm ${
        active
          ? 'bg-primary-container text-on-primary-container'
          : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
      } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </div>
      {locked && <Lock className="w-3.5 h-3.5 opacity-60" />}
    </button>
  );
}
