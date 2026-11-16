import { useEffect, useRef, useState } from 'react';

/**
 * The width of an element in pixels, kept up to date, so a chart can be drawn at its real
 * size (text stays 11px instead of shrinking with the page). Never below `min`: a page
 * that is hidden reports 0, and the chart must not draw with negative sizes.
 */
export default function useWidth(min = 240) {
  const ref = useRef(null);
  const [width, setWidth] = useState(min);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    setWidth(Math.max(min, element.clientWidth));
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(min, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, [min]);

  return [ref, width];
}
