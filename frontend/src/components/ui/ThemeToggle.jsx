import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, toggleTheme, className = '' }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex items-center w-12 h-7 rounded-full transition-colors bg-surface-container-low neu-recessed ${className}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-background neu-raised flex items-center justify-center transition-transform duration-200 ${isDark ? 'translate-x-5' : 'translate-x-0'}`}
      >
        {isDark ? <Moon className="w-3 h-3 text-secondary" /> : <Sun className="w-3 h-3 text-tertiary" />}
      </span>
    </button>
  );
}
