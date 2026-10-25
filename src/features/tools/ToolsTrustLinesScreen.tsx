import { Button, Card } from '@/components/ui'
import { CheckIcon } from '@/components/icons'
import { useRichT, useT } from '@/lib/i18n'
import rlusdMark from '@/assets/tokens/rlusd.svg'
import usdcMark from '@/assets/tokens/usdc.svg'
import { AccountToolFrame } from './components/AccountToolFrame'
import { SigningWindow } from './components/SigningWindow'
import { useAccount, useSigning, useWalletSession } from './api/wallet'
import { useTrustLineReserve } from './api/ledger'
import { STABLECOINS, STABLECOIN_IDS, type Stablecoin } from './data/trustLines'

/** Each coin's own mark, supplied as artwork and shown as given. */
const MARKS: Record<Stablecoin, string> = { RLUSD: rlusdMark, USDC: usdcMark }

/**
 * Set Stablecoin Trust Lines (H4, C7): one box per stablecoin — RLUSD from
 * Ripple, USDC from Circle — as the client's Canva lays it out: the coin's
 * mark, its name, who issues it, then "Trust Line" over Set, or over a green
 * check once the account has the line (client, 2026-10-13: just "Trust
 * Line" — "Add Trust Line" for a day). Set signs a `TrustSet` in the signing
 * window.
 *
 * The boxes are the hub's tiles in all but their action (R4, client
 * 2026-10-13): the mark at the tiles' 32, the brand stroke under the pointer,
 * 16 apart. 288 wide — 360 read as too big beside the hub's 314 — so "Issued
 * by Circle, based in the USA." still holds one line. They sit side by side
 * from `sm`, at the page's spacing under the line — no longer centred in the
 * height below it, which left a gap there the directory's pages do not have
 * (client, 2026-10-13). The reserve goes under them, once: it is the one cost
 * of the tool, and it applies to either alike. Its figure is the ledger's
 * own, read from a public node (client, 2026-10-19), in the ledger-value blue.
 *
 * With both lines set, the line under the title says the account is ready
 * (R3) — the page has nothing left to ask.
 */
export function ToolsTrustLinesScreen() {
  const t = useT()
  const rich = useRichT()
  const reserve = useTrustLineReserve()
  const session = useWalletSession()
  const account = useAccount(session?.address)
  const signing = useSigning()

  const lines = account.data?.trustLines
  const ready = lines !== undefined && STABLECOIN_IDS.every((id) => lines[id])

  return (
    <AccountToolFrame
      title={t('tools.trustLines.title')}
      lede={ready ? t('tools.trustLines.ledeDone') : t('tools.trustLines.lede')}
      measure="wide"
    >
      {(connected) => (
        <>
          <ul className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-stretch sm:justify-center">
            {STABLECOIN_IDS.map((id) => {
              const isSet = lines?.[id]
              return (
                <li key={id} className="w-full max-w-72">
                  <Card className="flex h-full flex-col items-center gap-3 p-6 text-center transition-ui hover:border-border-accent">
                    <img src={MARKS[id]} alt="" aria-hidden className="size-8" />
                    <h2 className="type-title-sm text-text">{id}</h2>
                    <p className="type-body text-text-muted">
                      {t('tools.trustLines.issuedBy', { issuer: STABLECOINS[id].issuerName })}
                    </p>
                    {/* The label and its answer as one block at the foot, so
                        Set and the check stand level across the two boxes. */}
                    <div className="mt-auto flex flex-col items-center gap-2 pt-2">
                      <p className="type-label-md text-text">
                        {t('tools.trustLines.label')}
                      </p>
                      {account.isPending ? (
                        <p className="flex h-(--size-control-md) items-center type-caption text-text-subtle">
                          {t('common.loading')}
                        </p>
                      ) : isSet ? (
                        // The Canva's check in a ring, in the positive green —
                        // drawn heavier at the client's ask (R4): a 2px ring,
                        // and the mark's own outline stroked 1 over its fill,
                        // which takes its arms from 1px to 2.
                        <p className="flex h-(--size-control-md) items-center">
                          <span className="flex size-6 items-center justify-center rounded-full border-2 border-positive text-positive [&_svg]:size-4">
                            <CheckIcon stroke="currentColor" strokeWidth={1} strokeLinejoin="round" />
                          </span>
                          <span className="sr-only">{t('tools.trustLines.isSet')}</span>
                        </p>
                      ) : (
                        <Button onClick={() => signing.start(connected, { action: 'set_trustline', value: id })}>
                          {t('tools.trustLines.set')}
                          <span className="sr-only"> {id}</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
          <p className="text-center type-caption text-text-muted">
            {rich('tools.trustLines.reserve', { amount: <span className="text-value">{reserve} XRP</span> })}
          </p>
          <SigningWindow signing={signing} />
        </>
      )}
    </AccountToolFrame>
  )
}
