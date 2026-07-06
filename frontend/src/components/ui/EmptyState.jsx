import React from 'react';

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="p-12 text-center bg-surface-container-low/60 rounded-2xl border border-dashed border-outline-variant flex flex-col items-center gap-3">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
          <Icon className="w-6 h-6 text-on-surface-variant" />
        </div>
      )}
      {title && <p className="text-sm font-bold text-on-surface">{title}</p>}
      {description && <p className="text-xs text-on-surface-variant max-w-sm">{description}</p>}
    </div>
  );
}
