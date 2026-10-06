import React from 'react';

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="p-12 text-center bg-surface-container-low neu-recessed rounded-2xl flex flex-col items-center gap-3">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-background neu-raised flex items-center justify-center">
          <Icon className="w-6 h-6 text-on-surface-variant" strokeWidth={1.5} />
        </div>
      )}
      {title && <p className="text-sm font-bold text-on-surface">{title}</p>}
      {description && <p className="text-xs text-on-surface-variant max-w-sm">{description}</p>}
    </div>
  );
}
