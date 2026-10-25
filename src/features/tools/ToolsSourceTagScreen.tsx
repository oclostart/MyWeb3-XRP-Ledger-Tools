import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button, Card, CopyField, Input, PageHeader, TopologyField } from '@/components/ui'
import { useRichT, useT } from '@/lib/i18n'
import { ToolsShell } from './components/ToolsShell'
import { SOURCE_TAG_PROPOSAL, deriveSourceTag, type SourceTagResult } from './data/sourceTag'
import { normaliseDomainInput } from './data/accountSet'

/** Leaves the site, so its own tab — the same treatment as "Powered by Lost Art". */
function ProposalLink({ children }: { children: string }) {
  return (
    <a
      href={SOURCE_TAG_PROPOSAL}
      target="_blank"
      rel="noreferrer"
      className="cursor-pointer text-accent-text transition-ui hover:text-link-hover"
    >
      {children}
    </a>
  )
}

/**
 * The SourceTag generator (T3): a domain in, the number its proposal derives
 * out. Nothing leaves the browser — the hash is `crypto.subtle`'s.
 *
 * One panel with two states, as the Canva draws it: the field, then the answer
 * in the field's place. The answer is titled SourceTag, as the field's panel
 * is titled Domain (C6), and names what was hashed under the title —
 * `myweb3.me` for `https://MyWeb3.me` — because that is the proof of the
 * number, and the only way someone can see that `example.com/` and
 * `example.com` are different inputs, which the proposal leaves them. The
 * number itself is in the ledger-value blue, with the copy mark.
 */
export function ToolsSourceTagScreen() {
  const t = useT()
  const rich = useRichT()
  const [input, setInput] = useState('')
  const [result, setResult] = useState<SourceTagResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const domainId = useId()

  // The form that had focus is gone once the answer replaces it, which would
  // drop a keyboard user at the top of the page. Focus follows the answer.
  useEffect(() => {
    if (result) resultRef.current?.focus()
  }, [result])

  const generate = async (event: FormEvent) => {
    event.preventDefault()
    setResult(await deriveSourceTag(input))
  }

  const reset = () => {
    setInput('')
    setResult(null)
  }

  return (
    <ToolsShell>
      {/* The developer tools' background (R44, client 2026-10-14): the
          topology sphere, its centre at 92% of the window's width so close
          to half of it runs off the right edge, at 78% of its size and a
          fifth of its strength — as the hub carried it on 2026-10-13. Fixed
          under the window; the header and the panels cover it. */}
      <TopologyField anchor={{ x: 0.92, y: 0.5 }} scale={0.78} className="fixed inset-0 -z-10 size-full opacity-20" />
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 pt-4 pb-6">
        {/* The proposal is named once, at the foot, where it asks for
            support. */}
        {/* Once there is a SourceTag, the line says what to do with it;
            Reset brings back the line on how it is made (client,
            2026-10-19). */}
        <PageHeader title={t('tools.sourceTag.title')} lede={result ? t('tools.sourceTag.ledeDone') : t('tools.sourceTag.how')} />

        {/* The panel and the support line as one block, 24 apart — as Trust
            Lines' reserve note stands 24 off the boxes above it (client,
            2026-10-13). The page's own 32 had stood between them. */}
        <div className="flex w-full flex-col items-center gap-6">
          {/* The narrow panel: one field and one action. It was the MW3
              prompt's 568, which left the 320 field 100 of empty card a side;
              the owner asked for it smaller (2026-10-08), and at 360 the field
              fills it. */}
          <Card className="w-full max-w-(--container-modal-2xs) p-6">
            {result ? (
              <div
                ref={resultRef}
                tabIndex={-1}
                // Announced as it appears, for anyone not looking at the panel.
                role="status"
                className="flex flex-col items-center gap-4 text-center outline-none"
              >
                <div className="flex max-w-full flex-col items-center gap-2">
                  <h2 className="type-title-sm text-text">{t('tools.sourceTag.title')}</h2>
                  <p className="max-w-full break-all type-body text-text-muted">{result.domain}</p>
                  <CopyField
                    size="lg"
                    tone="value"
                    align="center"
                    value={String(result.tag)}
                    label={t('tools.sourceTag.copy')}
                  />
                </div>
                <Button onClick={reset}>{t('tools.sourceTag.reset')}</Button>
              </div>
            ) : (
              <form onSubmit={generate} className="flex flex-col items-center gap-4">
                {/* The window's title, centred at a window title's size, and the
                    field's name — the input is labelled by it rather than by a
                    second, smaller "Domain" above it. */}
                <h2 id={domainId} className="type-title-sm text-text">
                  {t('tools.sourceTag.domain')}
                </h2>
                {/* Focused on arrival — the page is this one field, and the
                    Canva asks for the cursor in it. Remounted by Reset, so the
                    cursor comes back for the next domain as well. A domain's
                    width, which is the panel's: 310 holds a long one, and a
                    field twice that asked for something longer than a name. */}
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  aria-labelledby={domainId}
                  placeholder="example.com"
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="url"
                />
                {/* Live once the field holds something shaped like a domain — a
                    name, a dot and an ending (C6) — by the same test Set Domain
                    uses. A shape, not a list, and checked here in the browser,
                    so a domain registered today passes as well as any other.
                    What is hashed is still the input as the proposal reads it. */}
                <Button type="submit" disabled={normaliseDomainInput(input) === null}>
                  {t('tools.sourceTag.generate')}
                </Button>
              </form>
            )}
          </Card>

          <p className="text-center type-body text-text-muted">
            {rich('tools.sourceTag.support', {
              discussion: <ProposalLink>{t('tools.sourceTag.discussion')}</ProposalLink>,
            })}
          </p>
        </div>
      </section>
    </ToolsShell>
  )
}
