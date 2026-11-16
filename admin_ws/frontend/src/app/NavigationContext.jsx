import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const NavigationContext = createContext(null);

/**
 * Which screen is showing. `open` pushes a screen on top of the current one; `back` pops
 * it. `switchTo` is the sidebar: it starts a fresh stack. Each entry has a unique `key`.
 * The shell keeps every page in the stack mounted (only the top one is visible), so Back
 * restores exactly what you left: e.g. job → applicant → back to the same job and tab.
 */
export function NavigationProvider({ children }) {
  const counter = useRef(0);
  const entry = (section, params = null) => ({ section, params, key: `${section}-${counter.current++}` });
  const [stack, setStack] = useState(() => [entry('dashboard')]);

  const open = useCallback((section, params) => setStack((s) => [...s, entry(section, params)]), []);
  const switchTo = useCallback((section) => setStack([entry(section)]), []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  const value = useMemo(
    () => ({ stack, current: stack[stack.length - 1], canGoBack: stack.length > 1, open, switchTo, back }),
    [stack, open, switchTo, back]
  );
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const value = useContext(NavigationContext);
  if (!value) throw new Error('useNavigation must be used inside <NavigationProvider>');
  return value;
}
