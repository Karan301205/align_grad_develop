import React from 'react';

const ACCENT_CLASSES = {
  primary: { bg: 'bg-primary-container/40', text: 'text-primary', icon: 'text-primary' },
  secondary: { bg: 'bg-secondary-container/40', text: 'text-secondary', icon: 'text-secondary' },
  tertiary: { bg: 'bg-tertiary-container/40', text: 'text-tertiary', icon: 'text-tertiary' },
  success: { bg: 'bg-success-container/40', text: 'text-success', icon: 'text-success' },
};

export default function StatCard({ icon: Icon, label, value, sublabel, accent = 'primary' }) {
  const colors = ACCENT_CLASSES[accent] || ACCENT_CLASSES.primary;
  return (
    <div className={`p-5 rounded-2xl border border-outline-variant flex flex-col justify-between h-36 ${colors.bg}`}>
      <div className="flex justify-between items-start">
        <span className={`text-xs font-mono uppercase tracking-wider ${colors.text}`}>{label}</span>
        {Icon && <Icon className={`w-5 h-5 ${colors.icon}`} />}
      </div>
      <div className="mt-auto">
        <span className="text-3xl font-extrabold text-on-surface">{value}</span>
        {sublabel && <p className="text-[11px] text-on-surface-variant mt-1">{sublabel}</p>}
      </div>
    </div>
  );
}
