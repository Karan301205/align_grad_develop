import React from 'react';

export default function Card({ hover = false, padding = 'p-6', className = '', children, ...rest }) {
  return (
    <div
      className={`glass-card rounded-2xl shadow-sm shadow-secondary/[0.03] ${padding} ${hover ? 'transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
