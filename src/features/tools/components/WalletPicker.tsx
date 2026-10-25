import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Modal } from '@/components/ui'
import { useT } from '@/lib/i18n'
import xamanMark from '@/assets/wallets/xaman.svg'
import joeyMark from '@/assets/wallets/joey.svg'
import { WALLETS, connectWallet, walletName, walletShortName, type ConnectStep, type WalletId } from '../api/wallet'
import { closeWalletPicker, takeDestination, useWalletPickerOpen } from './pickerState'
import { useWalletRequest } from './WalletRequest'

/** Each wallet's own icon, supplied by the owner (2026-10-08), as given. */
const MARKS: Record<WalletId, string> = {
  xaman: xamanMark,
  joey: joeyMark,
}

export interface WalletPickerProps {
  open: boolean
  onClose: () => void
  /** Once a wallet connects. Defaults to `onClose`. */
  onConnected?: () => void
}

/** A sign-in under way: the wallet chosen and how far it has got, or that it failed. */
type Run = { wallet: WalletId; step: ConnectStep | { step: 'failed' } }

/**
 * The Wallet window (T2; titled Select Wallet until R1, 2026-10-13): the
 * wallets the tools can sign with, as the Canva draws them — the app's mark
 * above its name.
 *
 * **Choosing one turns the window into Connect with Xaman** (client,
 * 2026-10-14: "the Connect with Xaman is missing"), as the Canva's frame of
 * that name draws it: "Connect with Xaman", "Open the Xaman app and scan this
 * QR code." in white, the sign-in request as a code with Xaman's mark in its
 * middle and Open in Xaman as a red link — on a phone, no code and Open in
 * Xaman as the button. The layout is `useWalletRequest`'s, the signing
 * window's own. Joey Wallet is told to confirm in its app. It used to connect
 * at once under "Opening Xaman…". Closing the window withdraws the request; a
 * failure offers Try again.
 *
 * The marks are each wallet's own icon, supplied as artwork in its own
 * colours (2026-10-08). Both are trademarks, so they are shown exactly as
 * given and never redrawn. Hover is the mark answering, in the glow the rest
 * of the language uses for a mark. Narrow, and the two side by side as a pair
 * (owner, 2026-10-08), 64 between the icons.
 */
export function WalletPicker({ open, onClose, onConnected }: WalletPickerProps) {
  const t = useT()
  const [run, setRun] = useState<Run | null>(null)
  const request = useRef<AbortController | null>(null)
  const done = onConnected ?? onClose

  const withdraw = () => {
    request.current?.abort()
    request.current = null
  }

  // A window closed from outside — a page left mid-request — withdraws it too.
  useEffect(() => {
    if (open) return
    withdraw()
    setRun(null)
  }, [open])

  const close = () => {
    withdraw()
    setRun(null)
    onClose()
  }

  const choose = (wallet: WalletId) => {
    withdraw()
    const controller = new AbortController()
    request.current = controller
    setRun({ wallet, step: { step: 'preparing' } })
    connectWallet(wallet, (step) => !controller.signal.aborted && setRun({ wallet, step }), controller.signal)
      .then(() => {
        if (controller.signal.aborted) return
        request.current = null
        setRun(null)
        done()
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setRun({ wallet, step: { step: 'failed' } })
      })
  }

  const step = run?.step
  const link = step && (step.step === 'waiting' || step.step === 'opened') ? step.link : undefined
  const wallet = walletName(run?.wallet ?? 'xaman')
  const sign = useWalletRequest(run?.wallet ?? 'xaman', link, t('tools.wallet.confirmIn', { wallet }))

  if (run && step?.step === 'failed') {
    return (
      <Modal
        open={open}
        onClose={close}
        title={t('tools.wallet.connectTitle', { wallet: walletShortName(run.wallet) })}
        size="2xs"
        footer={<Button onClick={() => choose(run.wallet)}>{t('tools.sign.tryAgain')}</Button>}
      >
        <p role="alert" className="text-center type-body text-text-muted">
          {t('common.error')}
        </p>
      </Modal>
    )
  }

  if (run) {
    return (
      <Modal
        open={open}
        onClose={close}
        title={t('tools.wallet.connectTitle', { wallet: walletShortName(run.wallet) })}
        subtitle={sign.line}
        subtitleTone="default"
        size="2xs"
        footer={sign.footer}
      >
        {sign.body}
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={close} title={t('tools.wallet.selectTitle')} size="2xs">
      <ul className="flex justify-center gap-4">
        {WALLETS.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => choose(option.id)}
              className="group flex w-28 cursor-pointer flex-col items-center gap-3 rounded-2xl py-4"
            >
              <img
                src={MARKS[option.id]}
                alt=""
                aria-hidden
                // One corner for both: Xaman's file is a full-bleed square,
                // Joey's a rounded one, and side by side they should read
                // as one set of app icons.
                className="size-16 rounded-2xl transition-ui group-hover:glow-accent"
              />
              <span className="type-label text-text">{option.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

/**
 * The page’s one Wallet window, opened by `openWalletPicker` (see
 * `pickerState.ts`). Once a wallet connects it goes where the Connect asked —
 * a hub tile's tool — or stays where it is.
 */
export function WalletPickerHost() {
  const open = useWalletPickerOpen()
  const navigate = useNavigate()
  const connected = () => {
    const to = takeDestination()
    closeWalletPicker()
    if (to) navigate(to)
  }
  return <WalletPicker open={open} onClose={closeWalletPicker} onConnected={connected} />
}
