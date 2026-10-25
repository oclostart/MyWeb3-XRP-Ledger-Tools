import { useCallback, useSyncExternalStore } from 'react'

/**
 * Tailwind's breakpoints, by name, so a component that has to branch in
 * JavaScript branches at the same width its classes do.
 *
 * The two go out of step the moment someone writes `(max-width: 639px)` by
 * hand next to an `sm:` class, and that drift is invisible until a phone sits
 * in the gap.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

/**
 * Whether the viewport is at least this wide.
 *
 * **CSS first.** Layout belongs in classes — `sm:grid-cols-2` survives a
 * resize with no JavaScript and no re-render, and cannot disagree with itself
 * between the server's first paint and the client's. Reach for this only where
 * a value rather than a style has to change: the *text* of a placeholder, say,
 * which no class can reach.
 *
 * Subscribed through `useSyncExternalStore`, so it re-renders on rotation and
 * on a window drag rather than reading the width once and going stale. The
 * server snapshot is `false` — the narrow layout — because a phone that
 * briefly sees the wide one is the worse of the two wrong first frames.
 */
export function useMinWidth(breakpoint: Breakpoint) {
  const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`

  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
