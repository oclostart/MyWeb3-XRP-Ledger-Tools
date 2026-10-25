import { Button, Modal } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { walletName, walletShortName, type Signing } from '../api/wallet'
import { useWalletRequest } from './WalletRequest'

/**
 * The signing window (H5): "Sign with Xaman", then the request as
 * `useWalletRequest` lays it out — the line in white, the code with Xaman's
 * mark, Open in Xaman as a red link; on a phone, the button. The same layout
 * as the Wallet window's Connect with Xaman, from the one place (2026-10-14).
 * **Cancelled** or **failed** close the request and offer Try again.
 *
 * Once the signature lands the window simply closes (R5): the wallet shows
 * the transaction and the page shows the change, so there is no Signed step —
 * `useSigning` closes it.
 *
 * Closing it while it waits withdraws the request — the window is the
 * request, so there is nothing left waiting behind it. A feature composite on
 * `Modal`.
 */
export function SigningWindow({ signing }: { signing: Signing }) {
  const t = useT()
  const { run } = signing
  const walletId = run?.session.wallet ?? 'xaman'
  const wallet = walletName(walletId)
  const step = run?.step
  const link = step && (step.step === 'waiting' || step.step === 'opened') ? step.link : undefined
  const request = useWalletRequest(walletId, link, t('tools.sign.confirmHere', { wallet }))
  if (!run || !step) return null

  const ended = step.step === 'cancelled' || step.step === 'failed'
  const title =
    step.step === 'cancelled'
      ? t('tools.sign.cancelledTitle')
      : step.step === 'failed'
        ? t('tools.sign.failedTitle')
        : t('tools.sign.title', { wallet: walletShortName(walletId) })

  return (
    <Modal
      open
      onClose={signing.close}
      title={title}
      subtitle={ended ? undefined : request.line}
      subtitleTone="default"
      size="2xs"
      footer={ended ? <Button onClick={signing.retry}>{t('tools.sign.tryAgain')}</Button> : request.footer}
    >
      {ended ? (
        <p role="alert" className="text-center type-body text-text-muted">
          {step.step === 'cancelled' ? t('tools.sign.cancelled') : t('tools.sign.failed')}
        </p>
      ) : (
        request.body
      )}
    </Modal>
  )
}
