/**
 * Looping motion via the Web Animations API (marquee scroll, floating photos).
 * Tailwind has no custom keyframes without a stylesheet, so loops live here.
 *
 * loopAnimation() returns a React 19 callback ref: create it once at module
 * level and pass it as `ref`. It starts the loop when the element mounts and
 * cancels it on unmount. Skipped when the visitor prefers reduced motion.
 */
export function loopAnimation(keyframes, options) {
  return (element) => {
    if (!element || typeof element.animate !== 'function') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const animation = element.animate(keyframes, { iterations: Infinity, ...options });
    return () => animation.cancel();
  };
}

/** Pause / resume every animation running on an element (e.g. on hover). */
export function pauseAnimations(element) {
  element?.getAnimations?.().forEach((animation) => animation.pause());
}

export function resumeAnimations(element) {
  element?.getAnimations?.().forEach((animation) => animation.play());
}
