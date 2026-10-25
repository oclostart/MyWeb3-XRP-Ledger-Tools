import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useI18n } from '@/lib/i18n'
import { PATHS } from '@/app/routes'
import { ToolsShell } from '@/features/tools'
import { CONTACT_EMAIL, LAST_UPDATED, POLICIES, type PolicyId } from './data/policies'

const LINK = 'cursor-pointer text-accent-text transition-ui hover:text-link-hover'

/** The policies' one address, as a mail link wherever the text gives it. */
function withContact(text: string) {
  return text.split(CONTACT_EMAIL).flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <a key={i} href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
            {CONTACT_EMAIL}
          </a>,
          part,
        ],
  )
}

/**
 * The two policies, by route name. Looked up at render rather than here: the
 * route table imports this feature, so while this module loads `PATHS` is
 * still initialising, and reading it now throws.
 */
const SWITCH: ReadonlyArray<{ id: PolicyId; route: 'privacy' | 'cookies' }> = [
  { id: 'privacy', route: 'privacy' },
  { id: 'cookies', route: 'cookies' },
]

/**
 * The Privacy Policy and the Cookies Policy (C14) — one page with a menu of
 * the two, as myweb3.me has them, linked from every page's footer.
 *
 * **Laid out as myweb3.me's** (client, 2026-10-13): the menu down the left —
 * the policy shown in grey, the other in white, both at 18 in the regular
 * weight — and the policy beside it, its text set left under a centred title
 * and date (client, 2026-10-14). On a phone
 * the menu stands above the title, as theirs does. It was a pair of pill
 * links centred over a centred title. Links, not tabs, because each policy
 * has its own address someone can share. The policy itself is MyWeb3.me's
 * English (`data/policies.ts`); in another language the page says so above it.
 *
 * Read as a document, so set left at a reading measure rather than centred
 * like the tools — a centred paragraph's ragged left edge is hard to follow
 * over this much text.
 */
export function LegalScreen({ policy }: { policy: PolicyId }) {
  const { t, locale } = useI18n()
  const { intro, sections } = POLICIES[policy]
  const updated = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${LAST_UPDATED}T00:00:00Z`),
  )

  return (
    <ToolsShell>
      {/* 56 between the menu and the policy, myweb3.me's gap at 1024. */}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-4 pb-6 sm:flex-row sm:gap-14">
        <nav aria-label={t('legal.policies')} className="shrink-0">
          <ul className="flex flex-col gap-3">
            {SWITCH.map(({ id, route }) => (
              <li key={id}>
                <Link
                  to={PATHS[route]}
                  aria-current={id === policy ? 'page' : undefined}
                  className={cn(
                    'cursor-pointer whitespace-nowrap type-menu transition-ui',
                    id === policy ? 'text-text-muted' : 'text-text hover:text-link-hover',
                  )}
                >
                  {t(`legal.${id}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className="flex w-full max-w-3xl min-w-0 flex-col gap-8">
          {/* Centred over the policy, as every page heads itself (client,
              2026-10-14) — set left beside the menu for a day. The column is
              the policy's own 768, so the title centres on the text under it;
              the text stays left, for reading. */}
          <PageHeader title={t(`legal.${policy}`)} lede={t('legal.lastUpdated', { date: updated })} />

          <article lang="en" className="flex w-full flex-col gap-6 text-left">
            {!locale.startsWith('en') && (
              <p lang={locale} className="type-caption text-text-subtle">
                {t('legal.english')}
              </p>
            )}
            <p className="type-body text-text">{intro}</p>
            {sections.map((section) => (
              <section key={section.heading} className="flex flex-col gap-2">
                <h2 className="type-heading text-text">{section.heading}</h2>
                {section.body?.map((paragraph) => (
                  <p key={paragraph} className="type-body text-text-muted">
                    {withContact(paragraph)}
                  </p>
                ))}
                {section.items && (
                  <ul className="flex list-disc flex-col gap-2 pl-5 type-body text-text-muted marker:text-accent-text">
                    {section.items.map((item) => (
                      <li key={item.text}>
                        {item.term && <strong className="text-text">{item.term}: </strong>}
                        {item.text}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>
        </section>
      </div>
    </ToolsShell>
  )
}
