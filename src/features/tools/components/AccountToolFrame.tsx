import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { PageHeader, ParticlesField } from '@/components/ui'
import { PATHS } from '@/app/routes'
import { useWalletSession, type WalletSession } from '../api/wallet'
import { ToolsShell } from './ToolsShell'

/**
 * The page around an account tool: its title and line, then the tool for the
 * connected wallet. The connected account itself is in the header (C1).
 *
 * **Without a wallet the page is not there: it goes home** (client,
 * 2026-10-14, to keep the code small: "no need to have connect pages for the
 * tools"). The hub's tiles connect and then open the tool (R16), and the
 * Tools menu greys these tools out until a wallet is connected, so the only
 * ways here without one are a bookmark, a shared link or a disconnect on the
 * page — and the hub is where the next step is for each. Disconnecting here
 * went home already (C11); arriving without a wallet used to show a card
 * asking to connect.
 *
 * The tool stands at the page's spacing under the title's line, never
 * centred in the height below it: Trust Lines was, and the gap it left under
 * its line read as the page having lost its place (client, 2026-10-13).
 */
export function AccountToolFrame({
  title,
  lede,
  measure,
  children,
}: {
  title: string
  lede: ReactNode
  /** The line's measure — see `PageHeader`. */
  measure?: 'default' | 'wide'
  children: (session: WalletSession) => ReactNode
}) {
  const session = useWalletSession()
  if (!session) return <Navigate to={PATHS.home} replace />

  return (
    <ToolsShell>
      {/* The merchant tools' background (R43, client 2026-10-14): drifting
          particles that reach for the pointer and multiply on a click, fixed
          under the whole window — the header's gradient and the cards cover
          it. Faint: 30% of its own strength (40% until the client asked for
          it lighter, 2026-10-14). */}
      <ParticlesField className="fixed inset-0 -z-10 size-full opacity-30" />
      {/* 32 from the title's line to the page, as on every tools page. The
          column is the other tools pages' width, so the line under the title
          has the same 672 measure as theirs (2026-10-08) — at the 568 it had,
          "…to verify ownership." left one word on a second line and pulled
          the first one apart. The cards keep their own widths inside it. */}
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 pt-4 pb-6">
        <PageHeader title={title} lede={lede} measure={measure} />

        <div className="flex w-full flex-col items-center gap-6">{children(session)}</div>
      </section>
    </ToolsShell>
  )
}
