import React from 'react';

export default function Card({ hover = false, padding = 'p-6', className = '', children, ...rest }) {
  return (
    <div
      className={`bg-surface-container border border-outline-variant rounded-2xl ${padding} ${hover ? 'transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
