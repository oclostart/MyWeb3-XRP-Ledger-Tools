import { Navigate, type RouteObject } from 'react-router-dom'
import { Gallery } from '@/design-system/Gallery'
import {
  ToolsDomainScreen,
  ToolsEmailHashScreen,
  ToolsHomeScreen,
  ToolsSourceTagScreen,
  ToolsTomlScreen,
  ToolsTrustLinesScreen,
} from '@/features/tools'
import { LegalScreen } from '@/features/legal'

/**
 * The tools are the whole site, served at the root of myweb3.me until the
 * full MyWeb3 app takes that address — then they move to tools.myweb3.me, and
 * nothing here changes, since every path is relative to the root.
 *
 * Paths are real, not hashes. CloudFront answers every path that is not a
 * file or the API with index.html, so a deep link or a refresh reaches the app.
 */
export const PATHS = {
  home: '/',
  sourceTag: '/sourcetag',
  toml: '/xrp-ledger-toml',
  domain: '/domain',
  emailHash: '/emailhash',
  trustLines: '/trustlines',
  // myweb3.me's own addresses for them, so a link written for one works on both.
  privacy: '/privacy-policy',
  cookies: '/cookies-policy',
  designSystem: '/design-system',
} as const

export const routes: RouteObject[] = [
  { path: PATHS.home, element: <ToolsHomeScreen /> },
  { path: PATHS.sourceTag, element: <ToolsSourceTagScreen /> },
  { path: PATHS.toml, element: <ToolsTomlScreen /> },
  { path: PATHS.domain, element: <ToolsDomainScreen /> },
  { path: PATHS.emailHash, element: <ToolsEmailHashScreen /> },
  { path: PATHS.trustLines, element: <ToolsTrustLinesScreen /> },
  { path: PATHS.privacy, element: <LegalScreen policy="privacy" /> },
  { path: PATHS.cookies, element: <LegalScreen policy="cookies" /> },
  // The gallery is a working surface for whoever builds this, not a page for
  // the public: it is only routed in development.
  ...(import.meta.env.DEV ? [{ path: PATHS.designSystem, element: <Gallery /> }] : []),
  { path: '*', element: <Navigate to={PATHS.home} replace /> },
]
