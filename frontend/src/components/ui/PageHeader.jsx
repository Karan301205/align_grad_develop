import React from 'react';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-headline font-medium tracking-tight text-on-surface">{title}</h2>
        {subtitle && <p className="text-on-surface-variant text-sm mt-1.5 font-sans font-normal">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
