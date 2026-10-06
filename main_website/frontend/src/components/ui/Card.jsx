import React from 'react';

// A "bolted module" panel: neumorphic lift (.glass-card), corner-screw
// detailing, and optional ventilation slots. Lifts further on hover.
export default function Card({
  hover = false,
  elevated = false,
  screws = true,
  vents = false,
  padding = 'p-6',
  className = '',
  children,
  ...rest
}) {
  return (
    <div
      className={`relative glass-card rounded-2xl ${screws ? 'neu-screws' : ''} ${elevated ? 'neu-floating' : ''} ${padding} ${
        hover
          ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-floating)]'
          : ''
      } ${className}`}
      {...rest}
    >
      {vents && (
        <div className="absolute top-4 right-4 flex gap-1 z-10" aria-hidden="true">
          <span className="neu-vent" />
          <span className="neu-vent" />
          <span className="neu-vent" />
        </div>
      )}
      {children}
    </div>
  );
}
