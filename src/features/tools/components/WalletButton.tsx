import { Button, Tooltip } from '@/components/ui'
import { LogoutIcon } from '@/components/icons'
import { shortAddress } from '@/lib/address'
import { useT } from '@/lib/i18n'
import { disconnectWallet, useWalletSession, type WalletSession } from '../api/wallet'
import { openWalletPicker } from './pickerState'

/**
 * The wallet in the header (C1), as the client's Canva has it: a red pill
 * beside the language menu.
 *
 * - **Not connected** — Connect Wallet, which opens the Wallet window.
 * - **Connected** — the address cut to its first and last four characters
 *   (`rp5E…XDpe`, the client's list). Under the pointer, or with keyboard
 *   focus, it reads Disconnect with the logout mark, and pressing it
 *   disconnects. Both labels stand in the same grid cell, one of them hidden,
 *   so the pill keeps one width and nothing beside it shifts as it changes.
 *   The whole address is its native tooltip, for anyone checking which
 *   account it is.
 * - **In the phone's menu** (`inMenu`) — there is no hover on a touch screen,
 *   and a pill that disconnected on the first tap would do it unasked. So the
 *   address is shown as a line, and Disconnect as its own full-width button.
 */
export function WalletButton({
  inMenu = false,
  session: shown,
}: {
  inMenu?: boolean
  /** Holds the button in one state, for the gallery. Omitted, it follows the real wallet. */
  session?: WalletSession | null
}) {
  const t = useT()
  const live = useWalletSession()
  const session = shown === undefined ? live : shown

  if (!session) {
    return (
      <Button full={inMenu} onClick={() => openWalletPicker()}>
        {t('tools.wallet.connectWallet')}
      </Button>
    )
  }

  const short = shortAddress(session.address)

  if (inMenu) {
    return (
      <div className="flex flex-col items-stretch gap-2">
        <p className="text-center type-label-md text-text-muted">
          {short}
        </p>
        <Button full onClick={disconnectWallet} className="[&_svg]:size-4">
          {t('tools.wallet.disconnect')}
          <LogoutIcon />
        </Button>
      </div>
    )
  }

  return (
    // The whole address as hover text, in the arrowed tooltip every hover
    // text uses (client, 2026-10-13) — it was the browser's own `title`.
    // Above the pill, sliding in from the screen's right edge, as every
    // bubble does (owner, 2026-10-15) — it was set to the left by hand.
    <Tooltip label={session.address}>
      <Button
        onClick={disconnectWallet}
        // The visible address stays inside the name, so a voice user can say
        // what they see; the name says what pressing it does.
        aria-label={t('tools.wallet.disconnectAccount', { address: short })}
        className="group inline-grid place-items-center [&_svg]:size-4 [&>*]:col-start-1 [&>*]:row-start-1"
      >
        <span className="group-hover:invisible group-focus-visible:invisible">{short}</span>
        <span aria-hidden className="invisible inline-flex items-center gap-2 group-hover:visible group-focus-visible:visible">
          {t('tools.wallet.disconnect')}
          <LogoutIcon />
        </span>
      </Button>
    </Tooltip>
  )
}
