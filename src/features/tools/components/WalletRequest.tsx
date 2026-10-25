import type { ReactNode } from 'react'
import { Button, QrDisplay, buttonVariants } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { useMinWidth } from '@/lib/useMediaQuery'
import xamanMark from '@/assets/wallets/xaman.svg'
import { walletName, type WalletId } from '../api/wallet'

/** The code's width — its plate, at 200, holds the 2xs window's middle. */
const QR = 176

/**
 * A request waiting in a wallet, as a window shows it — the one layout for
 * signing in (the Wallet window's Connect with Xaman) and for signing (the
 * signing window), as the client's Canva draws it (2026-10-13 and 14): a line
 * on what to do, in white, then the request as a code with Xaman's mark in its
 * middle and Open in Xaman as a red link under it. No loading or status lines;
 * the code's plate holds its place, empty, while the request is made.
 *
 * - **Xaman, from `sm`**: the code to scan, and the link for anyone who would
 *   rather open it on a desktop's Xaman.
 * - **Xaman on a phone**: a phone cannot scan its own screen, so no code — the
 *   line says to open the request here, and Open in Xaman is the window's
 *   button.
 * - **Joey Wallet** asks in its own app: `confirm` is the line saying so.
 *
 * Returns the window's subtitle, body and footer, for the caller's `Modal`.
 */
export function useWalletRequest(
  walletId: WalletId,
  link: string | undefined,
  confirm: string,
): { line: string; body: ReactNode; footer: ReactNode } {
  const t = useT()
  const desktop = useMinWidth('sm')
  const wallet = walletName(walletId)

  if (walletId !== 'xaman') return { line: confirm, body: null, footer: undefined }

  if (!desktop) {
    return {
      line: t('tools.sign.openHere', { wallet }),
      body: null,
      // A real link, so the phone hands it to the wallet app. Held off, not
      // hidden, until the request exists, so the window keeps its shape.
      footer: link ? (
        <a href={link} target="_blank" rel="noreferrer" className={buttonVariants()}>
          {t('tools.sign.open', { wallet })}
        </a>
      ) : (
        <Button disabled>{t('tools.sign.open', { wallet })}</Button>
      ),
    }
  }

  return {
    line: t('tools.sign.scan', { wallet }),
    footer: undefined,
    body: (
      <div className="flex flex-col items-center gap-4">
        {link ? (
          <QrDisplay value={link} label={t('tools.sign.qr', { wallet })} size={QR} logo={xamanMark} />
        ) : (
          // The plate, empty, while the request is made.
          <div aria-hidden className="rounded-xl bg-surface-inverse p-3">
            <div className="size-44" />
          </div>
        )}
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer type-label-md text-accent-text transition-ui hover:text-link-hover"
          >
            {t('tools.sign.open', { wallet })}
          </a>
        ) : (
          // Its room kept, so nothing moves when the request arrives.
          <span aria-hidden className="invisible type-label-md">
            {t('tools.sign.open', { wallet })}
          </span>
        )}
      </div>
    ),
  }
}
