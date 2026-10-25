import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, CodePreview, DatePicker, Field, Modal, PageHeader, Stepper, Tooltip, TopologyField } from '@/components/ui'
import { ArrowLeftIcon } from '@/components/icons'
import { useI18n, useRichT } from '@/lib/i18n'
import { PATHS } from '@/app/routes'
import { cn } from '@/lib/cn'
import { ToolsShell } from './components/ToolsShell'
import { TomlFields } from './components/TomlFields'
import {
  EXPIRES_KEY,
  ORGANIZATION_FIELDS,
  ORG_FOCUS,
  SECTIONS,
  URL_FIELDS,
  buildToml,
  checkEntry,
  emptyEntry,
  expiresInFuture,
  initialState,
  isBlank,
  isEnabled,
  isEntryBlank,
  linksEnabled,
  loadState,
  saveState,
  toText,
  type Entry,
  type FieldError,
  type Line,
  type Role,
  type SectionId,
  type TomlState,
  type Values,
} from './data/toml'

/** The Canva's order: who the file is from, then what they run, then when it expires. */
const STEPS = ['organization', ...SECTIONS.map((s) => s.id), 'metadata', 'preview'] as const
type StepId = (typeof STEPS)[number]

/**
 * The field a step opens with the cursor in. Named here rather than read off
 * a focus event: the browser's own `autoFocus` lands before React is
 * listening, so the preview would never hear about it.
 */
const firstField = (step: number): string | null => {
  const id = STEPS[step]
  if (id === 'organization') return ORG_FOCUS + ORGANIZATION_FIELDS[0].key
  if (id === 'metadata') return EXPIRES_KEY
  return SECTIONS.find((s) => s.id === id)?.fields[0]?.key ?? null
}

/** How many entries a step has saved — none for a step that is not a list. */
const savedCount = (state: TomlState, step: number): number => {
  const id = STEPS[step]
  return SECTIONS.some((s) => s.id === id) ? state.entries[id as SectionId].length : 0
}

/** A section's first saved entry, if it has one — where Next into it opens. */
const firstEntry = (state: TomlState, step: number): number | undefined =>
  savedCount(state, step) > 0 ? 0 : undefined


const DOCS = 'https://xrpl.org/docs/references/xrp-ledger-toml'
const WELL_KNOWN = 'yourdomain.com/.well-known/xrp-ledger.toml'
const FILE = 'xrp-ledger.toml'

/**
 * The preview's colours, by what each piece is. Table headers in brand red —
 * the Canva's own colour for them — keys in blue (owner, 2026-10-08) and
 * values in green, with only the punctuation left grey.
 */
const ROLE_CLASS: Record<Role, string> = {
  table: 'text-accent-text',
  key: 'text-code-key',
  punct: 'text-text-subtle',
  string: 'text-positive',
  literal: 'text-text',
}

const renderLine = (line: Line) =>
  line.map((part, i) => (
    <span key={i} className={ROLE_CLASS[part.role]}>
      {part.text}
    </span>
  ))


/**
 * The address the file is served from, in bold — the part of the line someone
 * has to act on (owner, 2026-10-08). It may turn over after a slash, where an
 * address breaks, so the line it sits in can run its full measure instead of
 * dropping the whole address to the next line.
 */
const Path = ({ children }: { children: string }) => (
  <strong>
    {children.split('/').map((part, i, parts) => (
      <Fragment key={i}>
        {part}
        {i < parts.length - 1 && (
          <>
            /<wbr />
          </>
        )}
      </Fragment>
    ))}
  </strong>
)

/**
 * A step's head: Back at its top left, level with the title, then the title
 * centred and the step's one line beneath it. Back sat under Next until the
 * owner moved it here (2026-10-07) — the way back belongs where a step
 * starts, not in the stack of ways forward.
 *
 * **Back is the back-arrow mark** (client, 2026-10-12), brand red and blue
 * under the pointer like every link, with "Back" on hover and focus. It was a
 * button reading Back.
 *
 * Both side slots are the mark's 32 square at every width, the right one
 * empty, so the title sits on the card's centre line and the row is the same
 * height on every step. Organization has no Back, and its slot used to
 * collapse — its title stood 4 higher than every other step's, and on a phone
 * 8 lower (client, 2026-10-12). Preview has neither title nor line, so its
 * head is Back alone.
 */
function StepHeader({ title, intro, onBack }: { title?: string; intro?: string; onBack?: () => void }) {
  const { t } = useI18n()
  return (
    <div className="flex w-full flex-col items-center gap-1 text-center">
      <div className="flex w-full items-center gap-2">
        <div className="flex size-(--size-control-md) shrink-0 items-center justify-center">
          {onBack && (
            <Tooltip label={t('tools.toml.back')}>
              <Button type="button" variant="link" size="icon" onClick={onBack} aria-label={t('tools.toml.back')}>
                <ArrowLeftIcon />
              </Button>
            </Tooltip>
          )}
        </div>
        {title ? <h2 className="min-w-0 flex-1 type-title-sm text-text">{title}</h2> : <div className="flex-1" />}
        <div aria-hidden className="size-(--size-control-md) shrink-0" />
      </div>
      {intro && <p className="type-body text-text-muted">{intro}</p>}
    </div>
  )
}

/**
 * A step's way forward, and under it Reset — on every step, not only the
 * last (client, 2026-10-12). It still asks before it clears anything, and the
 * work is still kept in the browser until it does.
 */
function StepActions({ children, onReset }: { children: ReactNode; onReset?: () => void }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-2 pt-1">
      {children}
      {onReset && (
        <Button type="button" variant="link" size="sm" onClick={onReset}>
          {t('tools.toml.reset')}
        </Button>
      )}
    </div>
  )
}

/**
 * The xrp-ledger.toml builder (T4): a section per step, the file previewed
 * live underneath, and a download at the end.
 *
 * **Repeating sections follow the Canva's rule.** Next with something typed
 * adds that entry and opens a fresh one, counted on the step ("Principals
 * (2)") — and, on the step you are in, placed: "Principals 1/2"; Next on an
 * empty form moves on. A line under Next used to spell that
 * out; the owner took it away (2026-10-08).
 *
 * **Entries already added are walked, not skipped** (owner, 2026-10-08;
 * client, 2026-10-13). Next into a section that has entries opens its first
 * one, filled in and editable where it stands; Next walks on through the
 * rest, then the fresh form, then the next step. Back retraces exactly that:
 * into the previous section at its fresh, empty form, then the last entry,
 * then each one before it. An entry emptied and passed with Next is taken
 * out.
 *
 * **Any step is a press away** (client, 2026-10-13): the timeline's dots are
 * buttons, and a step opens as Next opens it — at its first saved entry, or
 * its fresh form. Like Back, it keeps what is typed and checks nothing.
 *
 * **The preview shows the field with the cursor**, even while empty — `""`
 * for text, nothing for a number — so someone can see where their typing
 * lands before they type. It follows the part being written, rather than
 * sitting at the top of the file.
 *
 * Work is kept in this browser as it goes: nine steps is long enough to lose
 * to a stray reload. It goes unsaid on the page since the owner took the line
 * out (2026-10-08). Reset is under every step's Next (client, 2026-10-12),
 * and still asks before it clears anything.
 *
 * **Organization comes first and comes once**, as the Canva draws it: one
 * `[ORGANIZATION]` table rather than a list, so Next moves on
 * to Principals instead of opening a second one.
 */
export function ToolsTomlScreen() {
  const { t, locale } = useI18n()
  const rich = useRichT()
  const [state, setState] = useState<TomlState>(loadState)
  const [focus, setFocus] = useState<string | null>(() => firstField(state.step))
  /**
   * The expiry not after the file's `modified` — the client's rule 9. No
   * field is checked for its shape (client, 2026-10-14): people publish what
   * they write.
   */
  const [expiresError, setExpiresError] = useState(false)
  /**
   * Next was pressed on an entry that does not meet its section's
   * `requires` (client, 2026-10-19). From then until the step changes the
   * errors follow the fields as they are typed, so each goes the moment it
   * is met.
   */
  const [tried, setTried] = useState(false)
  // Remounts a step's fields, which is what puts the cursor back in the first
  // one — on arrival, and after each Next that adds an entry.
  const [round, setRound] = useState(0)
  const [confirmReset, setConfirmReset] = useState(false)
  /** Download refused: the expiry is not after the moment of the download. */
  const [downloadError, setDownloadError] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => saveState(state), [state])

  const stepIndex = Math.min(Math.max(state.step, 0), STEPS.length - 1)
  const stepId: StepId = STEPS[stepIndex]
  const section = SECTIONS.find((s) => s.id === stepId)
  const saved = section ? state.entries[section.id] : []
  // The saved entry open in the form, or none for the fresh one. Read through
  // the bounds, since a reload can bring back a cursor past a list that
  // changed.
  const cursor =
    section && state.cursor !== undefined && state.cursor >= 0 && state.cursor < saved.length ? state.cursor : undefined
  const open: Entry | undefined = section ? (cursor !== undefined ? saved[cursor] : state.drafts[section.id]) : undefined
  // A token's links: open once it has its issuer and currency, and counted
  // for its requirements — the ones added and the one being typed.
  const isTokens = section?.id === 'tokens'
  const linksOn = isTokens && open ? linksEnabled(open.values) : false
  const hasLinks = isTokens && open ? open.urls.some((url) => !isBlank(url)) || !isBlank(state.urlDraft) : false
  const problems: Record<string, FieldError> =
    tried && section && open ? (checkEntry(section, open.values, hasLinks) ?? {}) : {}
  const label = (key: string) => {
    const field = section?.fields.find((f) => f.key === key)
    return field ? t(field.label) : key
  }
  const fieldErrors = Object.fromEntries(
    Object.entries(problems).map(([key, code]) => {
      if (code === 'required') return [key, t('tools.toml.errors.required', { field: label(key) })]
      const rule = section?.requires?.find((r) => 'oneOf' in r && r.oneOf[0] === key)
      const names = rule && 'oneOf' in rule ? rule.oneOf.map(label) : [label(key)]
      const list = new Intl.ListFormat(locale, { type: 'disjunction' }).format(names)
      return [key, t('tools.toml.errors.oneOf', { fields: list })]
    }),
  )
  /** Download waits for something to download: the organization, or an entry in any section. */
  const hasContent = !isBlank(state.organization) || SECTIONS.some((s) => state.entries[s.id].length > 0)

  // A long step leaves the page scrolled; the next one should open at its top.
  useEffect(() => {
    const top = topRef.current
    if (!top || top.getBoundingClientRect().top >= 0) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    top.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
  }, [stepIndex])

  const built = useMemo(() => {
    const urlDraft = section?.id === 'tokens' ? state.urlDraft : {}
    return buildToml(state, {
      now: new Date(),
      draft: section && open && cursor === undefined ? { section: section.id, entry: open, urlDraft } : undefined,
      editing: section && cursor !== undefined ? { section: section.id, index: cursor, urlDraft } : undefined,
      focus,
    })
  }, [state, section, open, cursor, focus])
  const text = toText(built.lines)
  const lines = built.lines.map(renderLine)

  /** Opens a step — at a saved entry, or at its fresh form when `entry` is absent. */
  const goTo = (step: number, entry?: number) => {
    setState((s) => ({ ...s, step, cursor: entry }))
    setExpiresError(false)
    setTried(false)
    setFocus(firstField(step))
    setRound((r) => r + 1)
  }

  /** Arriving at a step by Next opens its first saved entry, if it has any. */
  const arrive = (step: number) => goTo(step, firstEntry(state, step))

  // Back is Next in reverse, one place at a time (client, 2026-10-13, twice):
  // into the previous step at its new, empty entry — the last place Next
  // passed through — then from there to the last saved entry, from an entry
  // to the one before it, and from the first on to the step before. It used
  // to land on a step's last saved entry, passing over the empty one, and
  // before that on its first, passing over the rest.
  const back = () => {
    if (section && cursor === undefined && saved.length > 0) goTo(stepIndex, saved.length - 1)
    else if (section && cursor !== undefined && cursor > 0) goTo(stepIndex, cursor - 1)
    else goTo(stepIndex - 1)
  }

  /** Writes to the entry open in the form, saved or fresh. */
  const updateOpen = (s: TomlState, id: SectionId, change: (entry: Entry) => Entry): TomlState => {
    const at = s.cursor !== undefined && s.cursor >= 0 && s.cursor < s.entries[id].length ? s.cursor : undefined
    if (at === undefined) return { ...s, drafts: { ...s.drafts, [id]: change(s.drafts[id]) } }
    return { ...s, entries: { ...s.entries, [id]: s.entries[id].map((e, i) => (i === at ? change(e) : e)) } }
  }

  const setDraftValue = (id: SectionId, key: string, value: string) => {
    setState((s) =>
      updateOpen(s, id, (entry) => {
        const values: Values = { ...entry.values, [key]: value }
        // A field that waits on this one is cleared once it no longer applies —
        // a subclass left behind after its class changed is a wrong answer kept.
        for (const field of SECTIONS.find((x) => x.id === id)?.fields ?? []) {
          if (field.enabledWhen?.key === key && !isEnabled(field, values)) delete values[field.key]
        }
        return { ...entry, values }
      }),
    )
  }

  const setOrgValue = (key: string, value: string) => {
    setState((s) => ({ ...s, organization: { ...s.organization, [key]: value } }))
  }

  const setUrlValue = (key: string, value: string) => {
    setState((s) => ({ ...s, urlDraft: { ...s.urlDraft, [key]: value } }))
  }

  const addUrl = () => {
    setState((s) => ({ ...updateOpen(s, 'tokens', (entry) => ({ ...entry, urls: [...entry.urls, s.urlDraft] })), urlDraft: {} }))
  }

  /** A link already added, edited where it stands. */
  const setSavedUrlValue = (index: number, key: string, value: string) => {
    setState((s) =>
      updateOpen(s, 'tokens', (entry) => ({
        ...entry,
        urls: entry.urls.map((url, i) => (i === index ? { ...url, [key]: value } : url)),
      })),
    )
  }

  const removeUrl = (index: number) => {
    setState((s) => updateOpen(s, 'tokens', (entry) => ({ ...entry, urls: entry.urls.filter((_, i) => i !== index) })))
  }

  const next = (event?: FormEvent) => {
    event?.preventDefault()
    if (stepId === 'metadata' && !expiresInFuture(state.expires, new Date())) {
      setExpiresError(true)
      return
    }
    if (!section || !open) {
      arrive(stepIndex + 1)
      return
    }
    const id = section.id
    const urlDraft = id === 'tokens' ? state.urlDraft : {}

    if (isEntryBlank(open, urlDraft)) {
      if (cursor === undefined) {
        arrive(stepIndex + 1)
        return
      }
      // A saved entry emptied out is taken out; what followed it opens.
      const rest = saved.filter((_, i) => i !== cursor)
      setState((s) => ({ ...s, entries: { ...s.entries, [id]: rest } }))
      goTo(stepIndex, cursor < rest.length ? cursor : undefined)
      return
    }

    const unmet = checkEntry(section, open.values, hasLinks)
    if (unmet) {
      setTried(true)
      // Next is at the foot of a long step and the field may be at its top:
      // the cursor goes to the first one that needs something.
      const first = section.fields.find((f) => unmet[f.key])?.key
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"] :is(input, textarea, button)`)?.focus(),
      )
      return
    }
    // A link typed but not yet Added still belongs to this token; one emptied
    // out is dropped.
    const kept = open.urls.filter((url) => !isBlank(url))
    const entry: Entry = { values: open.values, urls: isBlank(urlDraft) ? kept : [...kept, urlDraft] }
    const clearUrl = id === 'tokens' ? {} : state.urlDraft

    if (cursor !== undefined) {
      // A saved entry, checked and kept; the next one opens, or the fresh form.
      setState((s) => ({
        ...s,
        entries: { ...s.entries, [id]: s.entries[id].map((e, i) => (i === cursor ? entry : e)) },
        urlDraft: clearUrl,
      }))
      goTo(stepIndex, cursor + 1 < saved.length ? cursor + 1 : undefined)
      return
    }

    setState((s) => ({
      ...s,
      entries: { ...s.entries, [id]: [...s.entries[id], entry] },
      drafts: { ...s.drafts, [id]: emptyEntry() },
      urlDraft: clearUrl,
    }))
    setExpiresError(false)
    setTried(false)
    setFocus(firstField(stepIndex))
    setRound((r) => r + 1)
  }

  const download = () => {
    const now = new Date()
    // The client's rule 9: no file whose expiry is not after its own
    // `modified`. The Expiration Date step checks it too, but a draft kept in
    // the browser can reach this step a day later.
    if (!expiresInFuture(state.expires, now)) {
      setDownloadError(true)
      return
    }
    setDownloadError(false)
    const file = toText(buildToml(state, { now }).lines)
    const url = URL.createObjectURL(new Blob([file], { type: 'application/toml' }))
    const link = document.createElement('a')
    link.href = url
    link.download = FILE
    link.click()
    // Revoked a beat later: some browsers start the download after the click returns.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const reset = () => {
    setState(initialState())
    setConfirmReset(false)
    setExpiresError(false)
    setTried(false)
    setFocus(firstField(0))
    setRound((r) => r + 1)
  }

  const askReset = () => setConfirmReset(true)

  // Where the open entry stands among the step's entries, shown on the
  // timeline as "Principals 1/2" once there is more than one (client,
  // 2026-10-12). The fresh form is always the last place — one principal
  // added reads 1/2 on that principal and 2/2 on the next — so the count
  // holds still while someone walks back and forth. Other steps keep theirs.
  const position = section
    ? { n: cursor !== undefined ? cursor + 1 : saved.length + 1, total: saved.length + 1 }
    : undefined

  const steps = STEPS.map((id, i) => {
    const label = t(`tools.toml.sections.${id}.step`)
    if (i === stepIndex && position && position.total > 1) {
      return { label: t('tools.toml.stepAt', { step: label, n: position.n, total: position.total }) }
    }
    return {
      label,
      count:
        id === 'organization' || id === 'metadata' || id === 'preview'
          ? undefined
          : state.entries[id].length || undefined,
    }
  })

  return (
    <ToolsShell>
      {/* The developer tools' background (R44, client 2026-10-14): the
          topology sphere, its centre at 92% of the window's width so close
          to half of it runs off the right edge, at 78% of its size and a
          fifth of its strength — as the hub carried it on 2026-10-13. Fixed
          under the window; the header and the panels cover it. */}
      <TopologyField anchor={{ x: 0.92, y: 0.5 }} scale={0.78} className="fixed inset-0 -z-10 size-full opacity-20" />
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 pt-4 pb-6">
        <PageHeader
          title={t('tools.toml.title')}
          lede={rich('tools.toml.lede', {
            path: <Path>{WELL_KNOWN}</Path>,
            docs: (
              <a
                href={DOCS}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer text-accent-text transition-ui hover:text-link-hover"
              >
                {t('tools.toml.docs')}
              </a>
            ),
          })}
        />

        <div ref={topRef} className="flex w-full scroll-mt-4 flex-col items-center gap-6">
          <Stepper
            steps={steps}
            current={stepIndex}
            label={t('tools.toml.stepsLabel')}
            summary={t('tools.toml.stepOf', { n: stepIndex + 1, total: STEPS.length, step: steps[stepIndex].label })}
            onSelect={arrive}
          />

          {stepId === 'organization' && (
            <Card className="w-full max-w-(--container-modal-md) p-6">
              <form noValidate onSubmit={next} className="flex flex-col gap-5">
                <StepHeader title="[ORGANIZATION]" intro={t('tools.toml.sections.organization.intro')} />
                <TomlFields
                  key={`organization-${round}`}
                  fields={ORGANIZATION_FIELDS}
                  values={state.organization}
                  onChange={setOrgValue}
                  onFocusField={setFocus}
                  focusPrefix={ORG_FOCUS}
                  autoFocus
                />
                {/* Filled once, so no line about Next opening another. */}
                <StepActions onReset={askReset}>
                  <Button type="submit">
                    {t('tools.toml.next')}
                  </Button>
                </StepActions>
              </form>
            </Card>
          )}

          {section && open && (
            <Card className="w-full max-w-(--container-modal-md) p-6">
              {/* `noValidate`: the fields' own types still pick the right
                  phone keyboard, but nothing is turned away — not even by
                  the browser's own bubbles. */}
              <form ref={formRef} noValidate onSubmit={next} className="flex flex-col gap-5">
                <StepHeader title={`[[${section.table}]]`} intro={t(section.intro)} onBack={back} />

                <TomlFields
                  key={`${section.id}-${round}`}
                  fields={section.fields}
                  values={open.values}
                  errors={fieldErrors}
                  onChange={(key, value) => setDraftValue(section.id, key, value)}
                  onFocusField={setFocus}
                  autoFocus
                />

                {section.id === 'tokens' && (
                  // A line above and below (client, 2026-10-21): the links are
                  // their own block, closed off from Next and Reset under it.
                  <div className="flex flex-col gap-4 border-y border-border py-5">
                    <h3 className="text-center type-subhead text-text">[[TOKENS.URLS]]</h3>
                    {/* Every link its own fields (client, 2026-10-19): Add
                        keeps the one just added open to edit or remove, and
                        opens another under it. All of them are off until the
                        token has its issuer and currency — a link belongs to
                        a token. */}
                    <div className="flex flex-col divide-y divide-border">
                      {open.urls.map((url, i) => (
                        <div key={`${round}-${i}`} className="flex flex-col gap-3 py-4 first:pt-0">
                          <TomlFields
                            fields={URL_FIELDS}
                            values={url}
                            disabled={!linksOn}
                            onChange={(key, value) => setSavedUrlValue(i, key, value)}
                            onFocusField={setFocus}
                            focusPrefix={`urls.${i}.`}
                          />
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => removeUrl(i)}
                            aria-label={t('tools.toml.removeUrl', { n: i + 1 })}
                            className="self-center"
                          >
                            {t('tools.toml.remove')}
                          </Button>
                        </div>
                      ))}
                      <div className={cn('flex flex-col', open.urls.length > 0 && 'pt-4')}>
                        <TomlFields
                          key={`urls-${round}-${open.urls.length}`}
                          fields={URL_FIELDS}
                          values={state.urlDraft}
                          disabled={!linksOn}
                          onChange={setUrlValue}
                          onFocusField={setFocus}
                          focusPrefix="url."
                        />
                      </div>
                    </div>
                    {/* Live once the link has its URL (client, 2026-10-19) —
                        a type or a title is not a link to add. Red, the
                        primary button (client, 2026-10-21). */}
                    <Button
                      type="button"
                      onClick={addUrl}
                      disabled={!linksOn || !state.urlDraft.url?.trim()}
                      className="self-center"
                    >
                      {t('tools.toml.add')}
                    </Button>
                  </div>
                )}

                <StepActions onReset={askReset}>
                  <Button type="submit">
                    {t('tools.toml.next')}
                  </Button>
                </StepActions>
              </form>
            </Card>
          )}

          {stepId === 'metadata' && (
            <Card className="w-full max-w-(--container-modal-md) p-6">
              <form noValidate onSubmit={next} className="flex flex-col gap-5">
                <StepHeader title="[METADATA]" intro={t('tools.toml.sections.metadata.intro')} onBack={back} />
                <div
                  className="mx-auto w-full max-w-(--container-field)"
                  onFocus={() => setFocus(EXPIRES_KEY)}
                  onBlur={() => setFocus(null)}
                >
                  {/* The system's calendar rather than the browser's (client,
                      2026-10-13), and the empty field reads in the
                      placeholder grey. Days before tomorrow are off: rule 9
                      reads a date as its first instant in UTC, so the
                      earliest that passes is tomorrow in UTC. */}
                  <Field label={t('tools.toml.fields.expires')} error={expiresError ? t('tools.toml.errors.expires') : undefined}>
                    <DatePicker
                      key={round}
                      value={state.expires}
                      min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
                      placeholder={t('tools.toml.placeholders.date')}
                      onChange={(value) => {
                        setState((s) => ({ ...s, expires: value }))
                        setExpiresError(false)
                        setDownloadError(false)
                      }}
                      autoFocus
                    />
                  </Field>
                </div>
                <StepActions onReset={askReset}>
                  <Button type="submit">
                    {t('tools.toml.next')}
                  </Button>
                </StepActions>
              </form>
            </Card>
          )}

          {stepId === 'preview' && (
            <div className="flex w-full max-w-(--container-modal-md) flex-col items-center gap-5">
              <StepHeader onBack={back} />
              <CodePreview className="w-full" title={FILE} lines={lines} text={text} tall />
              {/* Reset in the same block as Download, so it stands the 8
                  under it that it stands under every step's Next — it was
                  a sibling of the page column, 20 down (client,
                  2026-10-13). */}
              <StepActions onReset={askReset}>
                {/* Off until there is something to download: the
                    organization, or an entry in any section (client,
                    2026-10-19). */}
                <Button onClick={download} disabled={!hasContent}>
                  {t('tools.toml.download')}
                </Button>
                {downloadError && (
                  <p role="alert" className="text-center type-caption text-critical">
                    {t('tools.toml.errors.expires')}
                  </p>
                )}
              </StepActions>
              {/* The file proves nothing until the account names the domain
                  back — which is the next tool. */}
              <Link
                to={PATHS.domain}
                className="cursor-pointer type-caption text-accent-text transition-ui hover:text-link-hover"
              >
                {t('tools.toml.domainLink')}
              </Link>
            </div>
          )}

          {stepId !== 'preview' && (
            <CodePreview
              className="w-full max-w-(--container-modal-md)"
              title={FILE}
              lines={lines}
              text={text}
              activeLine={built.activeLine}
            />
          )}
        </div>
      </section>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={FILE}
        // As wide as its one question, on one line (client, 2026-10-14). At
        // 360 it turned over to two; at 568 it sat in a wide window with air
        // to spare.
        size="fit"
        footer={
          <Button variant="critical" onClick={reset}>
            {t('tools.toml.reset')}
          </Button>
        }
      >
        {/* White: the question the window asks, not a note under it (client,
            2026-10-14). From `sm`, 60 either side of it — the 24 of the
            window and 36 of its own — the air the client saw round its first
            line at 360, kept as the window widens to hold it on one. */}
        <p className="text-center type-body text-text sm:px-9">{t('tools.toml.resetBody')}</p>
      </Modal>
    </ToolsShell>
  )
}
