import type { ReactElement } from 'react'
import * as icons from '@/components/icons'
import { Section, Row } from '../Section'

/**
 * The whole icon set, at the one size the app uses it.
 *
 * Read off the barrel rather than listed by hand — a new SVG in
 * `src/assets/icons/` shows up here the moment `build-icons.mjs` runs, and a
 * glyph added to `authored.tsx` shows up immediately, so the gallery cannot
 * drift out of date with either half.
 */
const ENTRIES = Object.entries(icons)
  .filter(([name]) => name.endsWith('Icon'))
  .sort(([a], [b]) => a.localeCompare(b)) as [string, (p: icons.IconProps) => ReactElement][]

export function Icons() {
  return (
    <Section
      title="Icons"
      note="Most are generated from src/assets/icons/*.svg by scripts/build-icons.mjs; a few with no source in the Figma file — the cross, plus, minus, burger and copy — are hand-authored in components/icons/authored.tsx, which the generator never touches. Every glyph paints with currentColor and is sized by CSS, so one icon serves every tone and every control height."
    >
      <Row label="24px · text">
        {ENTRIES.map(([name, Icon]) => (
          <span key={name} title={name} className="flex w-16 flex-col items-center gap-1">
            <Icon className="size-6 text-text" />
            <code className="type-micro text-text-subtle">{name.replace('Icon', '')}</code>
          </span>
        ))}
      </Row>
      <Row label="tones">
        <icons.XrpIcon className="size-6 text-text" />
        <icons.XrpIcon className="size-6 text-text-muted" />
        <icons.XrpIcon className="size-6 text-accent-text" />
        <icons.CrownIcon className="size-6 text-featured" />
      </Row>
      <Row label="sizes">
        <icons.XrpIcon className="size-4 text-text" />
        <icons.XrpIcon className="size-5 text-text" />
        <icons.XrpIcon className="size-6 text-text" />
        <icons.XrpIcon className="size-8 text-text" />
      </Row>
    </Section>
  )
}
