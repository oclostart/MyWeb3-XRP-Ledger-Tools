import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Tooltip, buttonVariants } from '@/components/ui'
import { cn } from '@/lib/cn'

export interface ToolTileProps {
  /** The tool's glyph, set above its title. */
  icon: ReactNode
  title: string
  description: string
  /** The action's label — "Access", or "Connect" for a tool that signs. */
  action: string
  /** Where the tool lives. Absent while it is not built yet. */
  to?: string
  /**
   * An action in place of a destination — Connect, which opens the wallet
   * picker on the hub rather than leaving it.
   */
  onAction?: () => void
  /** Read over the disabled action while `to` is absent — "Coming soon". */
  soon?: string
}

/**
 * One tool on the XRPL Tools hub (T1): a glyph, a name, one line on what it is
 * for, and the way in.
 *
 * The mark sits **above** the title for the reason `MarkCards` gives — above
 * the text, the card is the unit; beside it, the card is a boxed list row. The
 * Canva set its glyphs under the button, where they read as an afterthought to
 * an action already taken.
 *
 * **The card lights; only the button is pressed.** A live tile takes the
 * Canva's brand stroke when the pointer is over it, but the pointer itself
 * changes only over the action, and only the action is a target — the owner's
 * call, settled over two passes (2026-10-07 took the stroke away with the
 * whole-tile target; 2026-10-08 brought the stroke back, alone). The tile used
 * to stretch its link across the card, and a hand over a description that
 * was not itself a link promised a press that landed somewhere unasked.
 *
 * A tool not built yet keeps its tile, with the action greyed under "Coming
 * soon" — the design language's treatment for it.
 */
/**
 * A file name never breaks across lines: "xrp-ledger.toml" turned over at its
 * hyphen on a narrow tile, as "xrp-" and "ledger.toml" — the client's runbook
 * asks for it on one line. Any word with a dot in it is a file name here, in
 * the title and in the line under it alike.
 */
function keepFileNames(title: string) {
  return title.split(/(\S+\.\S+)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

export function ToolTile({ icon, title, description, action, to, onAction, soon }: ToolTileProps) {
  const target = cn(buttonVariants(), 'mt-2')
  // "Access" four times over says nothing in a list of links; the tool's
  // name makes each one say where it goes.
  const name = <span className="sr-only"> {title}</span>

  return (
    <Card
      className={cn(
        'flex h-full flex-col items-center gap-3 p-6 text-center transition-ui',
        (to || onAction) && 'hover:border-border-accent',
      )}
    >
      <span aria-hidden className="text-accent-text [&_svg]:size-8">
        {icon}
      </span>
      {/* Under its group's heading on the hub (C2), so a step below it. */}
      <h3 className="type-heading text-text">{keepFileNames(title)}</h3>
      {/* `flex-1` pushes the action to the foot, so the buttons line up
          across a row whatever each description's length. */}
      <p className="flex-1 type-body text-text-muted">{keepFileNames(description)}</p>

      {to ? (
        <Link to={to} className={target}>
          {action}
          {name}
        </Link>
      ) : onAction ? (
        <button type="button" onClick={onAction} className={target}>
          {action}
          {name}
        </button>
      ) : (
        <Tooltip label={soon ?? ''} className="mt-2">
          <Button disabled>
            {action}
          </Button>
        </Tooltip>
      )}
    </Card>
  )
}
