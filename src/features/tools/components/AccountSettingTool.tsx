import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Button, Card, Input, Modal } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/cn'

export interface AccountSettingToolProps {
  /** What the input card is titled — a word, or the MyWeb3 Hash lockup. */
  heading: ReactNode
  /** The input's accessible name, since the heading may be a picture. */
  label: string
  placeholder: string
  /** The value as the ledger will hold it, or `null` when the input is not one. */
  normalise: (input: string) => string | null
  /**
   * Set stays off until `normalise` accepts the field (client, 2026-10-19,
   * for Domain — as SourceTag's Generate waits for a domain). Without it, Set
   * is live once there is text and a value `normalise` refuses shows `invalid`.
   */
  holdUntilValid?: boolean
  /** Shown when `normalise` says no — for a field that does not `holdUntilValid`. */
  invalid?: string
  /** The account's value now; `''` when unset, `undefined` while it loads. */
  current: string | undefined
  currentTitle: string
  notSet: string
  setLabel: string
  removeLabel: string
  /** The confirmation's title and question — "Remove Domain", "Remove myweb3.me…?" */
  removeTitle: string
  removeConfirm: string
  /** Hands the value on to be signed — the signing window takes it from there. */
  onSet: (value: string) => void
  onRemove: () => void
  /** Help above the card — where to find the value. */
  help?: ReactNode
  /** Sets the current value in monospace — a hash, where 0 and O must differ. */
  mono?: boolean
  /**
   * The cursor in the field on arrival, as the Canva asks — the page is this
   * field. Off where several sit on one page, which the gallery is: each would
   * pull the page down to itself.
   */
  autoFocus?: boolean
}

/**
 * One account field, set or removed (T5, T6): Set Domain and Set EmailHash are
 * the same errand on a different field, so they are one composite — two copies
 * would drift apart on exactly the details that matter, like what a waiting
 * signature looks like.
 *
 * Any help on where to find the value, then **one card** (client, 2026-10-14):
 * the field and Set — live once there is text, or once it is a value the
 * ledger can take (`holdUntilValid`, Domain) — and under a hairline the
 * current value, always there: the value in the ledger-value blue with
 * Remove, or Not set. It was two cards, the field's and the current value's
 * (C8, C9); merged rather than left as bare text, because the card is what
 * keeps the value and Remove on a calm surface over the page's moving
 * background and ties Remove to the value it removes. The value is never a
 * link — the client asked for the domain not to lead anywhere. Signing happens in the
 * screen's `SigningWindow` (H5), which covers the page while it runs, so two
 * transactions cannot race for one field.
 *
 * **Remove asks first** (H6): a confirmation names what goes, and only then
 * does the wallet ask for its signature.
 *
 * The card is SourceTag's Domain box (owner, 2026-10-08): the narrow panel,
 * 360, with the field filling it.
 *
 * A 32-character hash fits that field whole only untracked: the type scale's
 * +0.02em is Titillium's letterfit, and on monospace it only widens fixed
 * cells — 9px across a hash, which was 3px more than the field holds, and the
 * first character slid out of sight.
 */
export function AccountSettingTool({
  heading,
  label,
  placeholder,
  normalise,
  holdUntilValid,
  invalid,
  current,
  currentTitle,
  notSet,
  setLabel,
  removeLabel,
  removeTitle,
  removeConfirm,
  onSet,
  onRemove,
  help,
  mono,
  autoFocus = true,
}: AccountSettingToolProps) {
  const t = useT()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const errorId = useId()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = normalise(input)
    if (!value) {
      setError(invalid ?? null)
      return
    }
    onSet(value)
    setInput('')
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* 24 under it, as Trust Lines' reserve note stands 24 off the boxes
          above it — the same small grey line, the same space (client,
          2026-10-13). It had the column's 16. */}
      {help && <p className="mb-2 max-w-full text-center type-caption text-text-muted">{help}</p>}

      <Card className="w-full max-w-(--container-modal-2xs) p-6">
        <form noValidate onSubmit={submit} className="flex flex-col items-center gap-4">
          <h2 className="flex items-center gap-2 type-title-sm text-text">{heading}</h2>
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError(null)
            }}
            aria-label={label}
            aria-describedby={error ? errorId : undefined}
            invalid={Boolean(error)}
            placeholder={placeholder}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus={autoFocus}
            className={cn(mono && 'font-mono tracking-normal')}
          />
          {error && (
            <p id={errorId} className="text-center type-caption text-critical">
              {error}
            </p>
          )}
          <Button type="submit" disabled={holdUntilValid ? normalise(input) === null : !input.trim()}>
            {setLabel}
          </Button>
        </form>

        {/* The current value, under a hairline in the same card — outside the
            form, so Remove is never its submit. Always there, so the card
            does not change shape as the value arrives, is set or is removed;
            its title a step below the card's own. */}
        <section className="mt-5 flex flex-col items-center gap-1 border-t border-border pt-5 text-center">
          <h3 className="type-label text-text-muted">{currentTitle}</h3>
          {current === undefined ? (
            <p className="type-body text-text-subtle">{t('common.loading')}</p>
          ) : current ? (
            <>
              <p className={cn('max-w-full break-all type-body text-value', mono && 'font-mono tracking-normal')}>
                {current}
              </p>
              <Button variant="link" size="sm" onClick={() => setConfirming(true)}>
                {removeLabel}
              </Button>
            </>
          ) : (
            <p className="type-body text-text-muted">{notSet}</p>
          )}
        </section>
      </Card>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={removeTitle}
        size="2xs"
        footer={
          <Button
            variant="critical"
            onClick={() => {
              setConfirming(false)
              onRemove()
            }}
          >
            {removeLabel}
          </Button>
        }
      >
        <p className="text-center type-body text-text">{removeConfirm}</p>
      </Modal>
    </div>
  )
}
