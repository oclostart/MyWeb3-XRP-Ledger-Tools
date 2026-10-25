import { QRCodeSVG } from 'qrcode.react'
import { cn } from '@/lib/cn'

/** A transparent pixel: what the code clears its centre for, under the logo. */
const CLEAR = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

export interface QrDisplayProps {
  value: string
  /** Accessible description of what the code encodes. */
  label: string
  size?: number
  /**
   * An app's mark in the middle of the code — the wallet the code is for, as
   * Xaman's own codes carry theirs (client's Canva, 2026-10-13). The code
   * clears its centre for it and corrects for the loss at level H.
   */
  logo?: string
  className?: string
}

/**
 * A QR code on a light plate. Codes need a light quiet zone to scan reliably,
 * which is also why the plate inverts — the same inversion the language uses
 * for content.
 *
 * With `logo`, the mark sits at 22% of the code, rounded, on the plate's own
 * colour — the modules under it are cleared rather than covered, so the edge
 * around the mark is clean. Drawn over the code rather than inside it: the
 * code's own image is square, and the mark is an app icon with rounded
 * corners.
 */
export function QrDisplay({ value, label, size = 160, logo, className }: QrDisplayProps) {
  const mark = Math.round(size * 0.22)
  return (
    <div
      role="img"
      aria-label={label}
      className={cn('relative inline-flex rounded-xl bg-surface-inverse p-3 text-canvas', className)}
    >
      {/* currentColor keeps the modules on a token rather than a literal, and
          the wrapper supplies the near-black the light plate needs. */}
      <QRCodeSVG
        value={value}
        size={size}
        level={logo ? 'H' : 'M'}
        bgColor="transparent"
        fgColor="currentColor"
        imageSettings={logo ? { src: CLEAR, width: mark, height: mark, excavate: true } : undefined}
      />
      {logo && (
        <img
          src={logo}
          alt=""
          aria-hidden
          width={mark}
          height={mark}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md"
        />
      )}
    </div>
  )
}
