import { Section, Row } from '../Section'

const COLOR_GROUPS: { title: string; tokens: string[] }[] = [
  {
    title: 'Surfaces',
    tokens: ['canvas', 'surface', 'surface-raised', 'surface-sunken', 'surface-active', 'field'],
  },
  {
    title: 'Text',
    tokens: ['text', 'text-muted', 'text-subtle', 'text-disabled', 'accent-text', 'value'],
  },
  {
    title: 'Border',
    tokens: ['border', 'border-strong', 'border-accent', 'border-focus'],
  },
  {
    title: 'Accent',
    tokens: ['accent', 'accent-hover', 'accent-active', 'accent-subtle'],
  },
  {
    title: 'Status & category',
    tokens: ['positive', 'caution', 'notice', 'critical', 'category-teal'],
  },
]

const RADII = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'] as const
const SHADOWS = ['xs', 'sm', 'md', 'lg', 'accent'] as const
const SPACING = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16] as const
const CONTROLS = [
  ['control-sm', '24px'],
  ['control-md', '32px'],
  ['control-lg', '40px'],
  ['pill', '32px'],
  ['icon', '20px'],
] as const

export function Foundations() {
  return (
    <>
      <Section
        title="Color"
        note="Semantic tokens only. Components never reference the primitive ramps behind these — that indirection is what lets the whole app be restyled by editing one file. Dark is the only theme; there is nothing to vary against."
      >
        <div className="flex flex-col gap-8">
          {COLOR_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="mb-3 text-sm font-semibold uppercase text-text-subtle">
                {group.title}
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {group.tokens.map((name) => (
                  <div key={name} className="flex flex-col gap-2">
                    <div
                      className="h-14 w-full rounded-lg border border-border"
                      style={{ background: `var(--color-${name})` }}
                    />
                    <code className="text-xs text-text-muted">{name}</code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Spacing"
        note="4px base, 8px preferred. Every value is even — the checker fails the build on a fractional or odd token."
      >
        <div className="flex flex-wrap items-end gap-4">
          {SPACING.map((n) => (
            <div key={n} className="flex flex-col items-center gap-2">
              <div
                className="bg-accent rounded-sm"
                style={{ width: `${n * 4}px`, height: `${n * 4}px` }}
              />
              <code className="text-xs text-text-subtle">{n}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Control sizes"
        note="Real heights from the file, tokenised so controls line up across screens."
      >
        {CONTROLS.map(([name, px]) => (
          <Row key={name} label={`--size-${name}`}>
            <div
              className="rounded-lg bg-surface-active"
              style={{ height: `var(--size-${name})`, width: `var(--size-${name})` }}
            />
            <span className="text-sm text-text-subtle">{px}</span>
          </Row>
        ))}
      </Section>

      <Section title="Radius">
        <div className="flex flex-wrap gap-4">
          {RADII.map((r) => (
            <div key={r} className="flex flex-col items-center gap-2">
              <div
                className="size-16 border border-border-strong bg-surface-raised"
                style={{ borderRadius: `var(--radius-${r})` }}
              />
              <code className="text-xs text-text-subtle">{r}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Elevation"
        note="On near-black, depth reads through contrast far more than shadow. These stay deliberately restrained."
      >
        <div className="flex flex-wrap gap-6">
          {SHADOWS.map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div
                className="size-20 rounded-2xl bg-surface border border-border"
                style={{ boxShadow: `var(--shadow-${s})` }}
              />
              <code className="text-xs text-text-subtle">{s}</code>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}
