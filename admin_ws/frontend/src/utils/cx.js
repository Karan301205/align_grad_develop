/** Joins class names, skipping falsy parts: cx('a', cond && 'b') → "a b". */
export const cx = (...parts) => parts.filter(Boolean).join(' ');
