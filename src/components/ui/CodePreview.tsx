import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { CopyButton } from './CopyButton'

export interface CodePreviewProps {
  /** The file's name — the header's title, centred. */
  title: string
  /**
   * One node per line, already coloured by whoever knows the language. The
   * panel draws code; it does not parse any.
   */
  lines: ReadonlyArray<ReactNode>
  /** The same text unstyled — what Copy puts on the clipboard. */
  text: string
  /**
   * A line to keep in view. When it changes and is scrolled out of sight, the
   * panel brings it back — the part someone is typing into, not the top of a
   * file they finished hours ago.
   */
  activeLine?: number
  /** A taller body, for a panel that is the page's subject rather than a companion. */
  tall?: boolean
  className?: string
}

/**
 * A file shown as it will be written, with a copy shortcut: a sunken plate, a
 * header naming the file, and a monospace body that scrolls on both axes
 * rather than wrapping — wrapping a long key or hash would show a line break
 * the file does not have.
 *
 * The header is the file's name, centred, and the copy mark at its right
 * (owner, 2026-10-08). It read "Preview", the file name beside it in grey,
 * and Copy in words; the name is what the panel is, and the mark is the one
 * every copy action wears.
 */
export function CodePreview({ title, lines, text, activeLine, tall, className }: CodePreviewProps) {
  const bodyRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const body = bodyRef.current
    if (!body || activeLine === undefined) return
    const line = body.querySelector<HTMLElement>(`[data-line="${activeLine}"]`)
    if (!line) return
    // Scroll the panel only, never the page: `scrollIntoView` would also move
    // the window, pulling the form out from under someone's cursor.
    const top = line.offsetTop
    const bottom = top + line.offsetHeight
    if (top >= body.scrollTop && bottom <= body.scrollTop + body.clientHeight) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    body.scrollTo({ top: Math.max(0, top - body.clientHeight / 3), behavior: reduce ? 'auto' : 'smooth' })
  }, [activeLine, lines.length])

  return (
    <section
      aria-label={title}
      className={cn('overflow-hidden rounded-2xl border border-border bg-surface-sunken', className)}
    >
      {/* The mark rides the right edge out of the flow, so the name centres on
          the panel rather than on what the mark leaves; the padding keeps a
          long name clear of it. */}
      <header className="relative flex items-center justify-center border-b border-border px-12 py-2">
        <h2 className="truncate type-label text-text">{title}</h2>
        <CopyButton value={text} className="absolute top-1/2 right-2 -translate-y-1/2" />
      </header>
      {/* `relative`, so each line's `offsetTop` is measured from here. */}
      <pre
        ref={bodyRef}
        className={cn(
          'relative overflow-auto px-5 py-4 font-mono type-caption',
          tall ? 'max-h-120' : 'max-h-72',
        )}
      >
        <code>
          {lines.map((line, i) => (
            <span key={i} data-line={i} className="block min-h-4 whitespace-pre">
              {line}
            </span>
          ))}
        </code>
      </pre>
    </section>
  )
}
