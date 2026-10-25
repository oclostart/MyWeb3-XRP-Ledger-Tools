import { useEffect } from 'react'
import { BrowserRouter, HashRouter, useLocation, useRoutes } from 'react-router-dom'
import { routes } from './routes'

/**
 * Real paths when served, hash routing when opened straight off disk.
 *
 * A deployed build gets clean URLs like `/directory/search`, which is what a
 * shared link should look like. The offline single-file preview has no server
 * to rewrite those, so it falls back to hashes rather than 404ing.
 */
const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter

function Routes() {
  return useRoutes(routes)
}

/**
 * Start a new page at the top of it.
 *
 * The browser restores scroll on a real page load; a client-side route change
 * is not one, so React Router leaves the window exactly where it was. Going
 * from halfway down a result set to the homepage landed halfway down the
 * homepage — past the hero, into the middle of the Featured grid — which
 * reads as the link having done nothing at all. The brand lockup took most of
 * the blame for it, being the link people press to get home.
 *
 * Keyed on `pathname` alone: the search page writes its filters into the query
 * string on every keystroke, and scrolling to the top of the results each time
 * someone typed a letter would be its own bug.
 */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Block body, not a concise one. `() => window.scrollTo(…)` *returns* the
    // call's value, and React reads an effect's return as its cleanup — it
    // then tried to call it on the next route change and threw, taking the
    // whole page down with it.
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

export function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes />
    </Router>
  )
}
