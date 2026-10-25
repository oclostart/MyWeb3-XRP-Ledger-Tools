import { Section } from '../Section'

/**
 * The roles are the vocabulary; the steps are the raw material. Components
 * are checked against this — `text-lg` in a component fails the build.
 */
const ROLES = [
  ['type-wordmark', '22 / 28 · 900', 'the MyWeb3.me lockup, only'],
  ['type-display', '40 / 48 · 600', 'tier numerals, hero figures'],
  ['type-title', '26 / 32 · 600', 'page titles'],
  ['type-heading', '22 / 28 · 700', 'card titles'],
  ['type-title-sm', '22 / 28 · 600', 'modal and panel titles, prices'],
  ['type-subhead', '18 / 24 · 600', 'secondary prices, tier labels'],
  ['type-label', '16 / 24 · 600', 'nav, form labels, large buttons'],
  ['type-label-md', '14 / 20 · 600', 'default buttons'],
  ['type-label-sm', '12 / 16 · 600', 'small buttons, dense controls'],
  ['type-body', '14 / 20 · 400', 'feature rows, running text'],
  ['type-caption', '12 / 16 · 400', 'billing and cancellation notes'],
  ['type-micro', '10 / 16 · 600', 'uppercase eyebrows'],
] as const

const STEPS = ['5xl', '4xl', '3xl', '2xl', 'xl', 'lg', 'base', 'sm', 'xs'] as const

export function Typography() {
  return (
    <>
      <Section
        title="Type roles"
        note="The named vocabulary. A role says what a piece of text IS, so two people reaching for “card title” land on the same size, weight and rhythm. Components must use these — a raw text-lg fails the build."
      >
        <div className="flex flex-col">
          {ROLES.map(([role, spec, usage]) => (
            <div
              key={role}
              className="grid grid-cols-1 items-baseline gap-2 border-b border-border py-5 last:border-0 sm:grid-cols-[13rem_1fr] sm:gap-6"
            >
              <div className="flex flex-col gap-1">
                <code className="text-xs text-text">{role}</code>
                <code className="text-xs text-text-subtle">{spec}</code>
                <span className="text-xs text-text-subtle">{usage}</span>
              </div>
              <span className={`${role} text-text`}>MyWeb3.me</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Raw scale"
        note="What the roles are built from. Every size is an even number of pixels and every line-height a multiple of 4, so a line of text always occupies whole grid rows. Reach for a role instead of these."
      >
        <div className="flex flex-col">
          {STEPS.map((step) => (
            <div
              key={step}
              className="grid grid-cols-1 items-baseline gap-2 border-b border-border py-4 last:border-0 sm:grid-cols-[13rem_1fr] sm:gap-6"
            >
              <code className="text-xs text-text-subtle">text-{step}</code>
              <span className={`text-${step} text-text`}>The quick brown fox</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}
