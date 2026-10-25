import { useId, useRef } from 'react'
import { GatewayFlow } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { PATHS } from '@/app/routes'
import xrpLedgerLogo from '@/assets/img/xrp-ledger-logo.svg'
import { ToolsShell } from './components/ToolsShell'
import { ToolTile } from './components/ToolTile'
import { openWalletPicker } from './components/pickerState'
import { useWalletSession } from './api/wallet'
import { TOOL_GROUPS } from './data/tools'

/**
 * The tools hub (T1, C2). The tools that sign say Connect until a wallet is
 * connected, and Connect opens the picker here rather than leaving — then, as
 * the Canva has it, they say Access. The connected account is in the header.
 */
export function ToolsHomeScreen() {
  const t = useT()
  const session = useWalletSession()
  const id = useId()
  const logo = useRef<HTMLImageElement>(null)

  return (
    // The title where every page's title is; the tools centred in the height
    // below it (the owner's ask, 2026-10-08) — centring the whole block had
    // carried the title down the page with them.
    <ToolsShell grow>
      {/* The gateway flow (R36, client 2026-10-13, in place of R35's
          sphere): lines from both edges of the window, a square of light
          riding each. The left ones meet 16 before the XRP Ledger logo's
          left edge and the right ones 16 past its right — beside the mark
          and the name, nothing converging behind them (client, 2026-10-14,
          from a marked-up screenshot).
          Fixed under the whole window — the header's gradient and the tiles'
          surfaces cover it — and followed as the logo moves. */}
      <GatewayFlow target={logo} split={16} className="fixed inset-0 -z-10 size-full opacity-40" />
      <section className="flex flex-1 flex-col gap-8 pt-4 pb-6">
        {/* The XRP Ledger's own logotype in place of a written title, as the
            owner asked (2026-10-07) — reversed out of the dark page and
            centred as a standalone device, both of which its brand kit
            allows. The title stays as the heading a screen reader announces. */}
        <h1 className="relative flex justify-center">
          {/* A soft shadow of the page's own black behind the logo, so the
              lines meeting there run into it rather than across the
              letters (client, 2026-10-13). Under the page's content, as the
              lines are — at the field's own depth and after it, so above
              them; positioned without it, its blur dimmed the heading under
              the logo and the header above. */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-24 w-96 max-w-full -translate-1/2 rounded-full bg-canvas blur-2xl"
          />
          <img ref={logo} src={xrpLedgerLogo} alt="" aria-hidden className="relative h-10 w-auto sm:h-12" />
          <span className="sr-only">{t('tools.title')}</span>
        </h1>

        <div className="flex flex-1 flex-col justify-center gap-10">
          {TOOL_GROUPS.map((group) => (
            <section
              key={group.key}
              aria-labelledby={`${id}-${group.key}`}
              className="flex flex-col items-center gap-6"
            >
              <h2 id={`${id}-${group.key}`} className="text-center type-title-sm text-text">
                {t(`tools.groups.${group.key}`)}
              </h2>
              {/* Three across from `lg`, two from `sm`, one on a phone, in one
                  column for both groups — so a tile is the same width in
                  both, and the two-tile row centres under the three. 1024
                  wide, so "Set Stablecoin Trust Lines" stands on one line as
                  the Canva sets it. Wrapped rather than a grid so a short row
                  centres instead of hanging at the left. A list, because it
                  is one. */}
              <ul className="flex w-full max-w-5xl flex-wrap justify-center gap-4">
                {group.tools.map((tool) => {
                  const waiting = tool.signs && !session
                  const route = tool.route
                  return (
                    <li
                      key={tool.key}
                      className="w-full sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
                    >
                      <ToolTile
                        icon={tool.icon}
                        title={t(`tools.${tool.key}.tile`)}
                        description={t(`tools.${tool.key}.tileBody`)}
                        action={t(waiting ? 'tools.connect' : 'tools.access')}
                        to={!waiting && tool.route ? PATHS[tool.route] : undefined}
                        // Connected from a tile, the person lands on that tool.
                        onAction={waiting && route ? () => openWalletPicker(PATHS[route]) : undefined}
                        soon={t('tools.comingSoon')}
                      />
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </ToolsShell>
  )
}
