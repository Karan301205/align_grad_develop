import React from 'react';

const ACCENT_CLASSES = {
  primary: { text: 'text-primary', icon: 'text-primary', led: 'led' },
  secondary: { text: 'text-on-surface-variant', icon: 'text-on-surface-variant', led: 'led-success' },
  tertiary: { text: 'text-tertiary', icon: 'text-tertiary', led: 'led-tertiary' },
  success: { text: 'text-success', icon: 'text-success', led: 'led-success' },
};

// A gauge module bolted to the chassis: raised panel, LED status light,
// and a monospace numeric readout (like a physical instrument display).
export default function StatCard({ icon: Icon, label, value, sublabel, accent = 'primary' }) {
  const colors = ACCENT_CLASSES[accent] || ACCENT_CLASSES.primary;
  return (
    <div className="relative glass-card neu-screws rounded-2xl p-5 flex flex-col justify-between h-36 transition-all duration-300 hover:-translate-y-1 hover:neu-floating">
      <div className="flex justify-between items-start">
        <span className={`flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.08em] ${colors.text}`}>
          <span className={`${colors.led} animate-pulse`} />
          {label}
        </span>
        {Icon && <Icon className={`w-5 h-5 ${colors.icon}`} strokeWidth={1.5} />}
      </div>
      <div className="mt-auto">
        <span className="text-3xl font-mono font-extrabold tracking-tight text-on-surface tabular-nums">{value}</span>
        {sublabel && <p className="text-[11px] font-mono text-on-surface-variant mt-1">{sublabel}</p>}
      </div>
    </div>
  );
}
