/**
 * Stroke icons from the landing design (24×24, 1.8 stroke).
 * Paths are copied from the design export so the shapes match exactly.
 */
const STROKE_ICONS = {
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  external: <path d="M7 17L17 7M9 7h8v8" />,
  building: <path d="M4 21V5l8-3v19M12 9h8v12M7.5 8h1M7.5 12h1M7.5 16h1M15.5 13h1M15.5 17h1M2 21h20" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  usersCheck: <path d="M9 12a4 4 0 100-8 4 4 0 000 8zM2 21c1.2-3.6 3.8-5.5 7-5.5 1.8 0 3.3.6 4.5 1.6M15 15l2 2 4-4" />,
  clock: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  quiz: <path d="M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9" />,
  briefcase: <path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />,
  graduation: <path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5" />,
  book: <path d="M2 5h7a3 3 0 013 3v12a2 2 0 00-2-2H2zM22 5h-7a3 3 0 00-3 3v12a2 2 0 012-2h8z" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  shieldCheck: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M8.5 12l2.5 2.5 4.5-5" />,
  code: <path d="M8 6l-6 6 6 6M16 6l6 6-6 6" />,
  image: <path d="M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  sparkle: <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8z" />,
  screen: <path d="M3 5h18v14H3zM3 9h18M7 13h5" />,
  sheet: <path d="M4 4h16v16H4zM4 10h16M10 4v16" />,
  pen: <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  briefcaseRect: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  )
};

const FILLED_ICONS = {
  dot: <circle cx="12" cy="12" r="10" />,
  play: <path d="M8 5v14l11-7z" />,
  pause: <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
};

/** Stroke icon. Pass a size class (defaults to 20px) plus any colour/position classes. */
export function Icon({ name, className = 'size-5', strokeWidth = 1.8, style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-none ${className}`}
      style={style}
    >
      {STROKE_ICONS[name]}
    </svg>
  );
}

/** Solid icon (play / pause). */
export function FilledIcon({ name, className = 'size-5' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={`flex-none ${className}`}>
      {FILLED_ICONS[name]}
    </svg>
  );
}
