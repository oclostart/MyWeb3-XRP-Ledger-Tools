#!/usr/bin/env node
/**
 * Design-system enforcement.
 *
 * Rules in a markdown file drift the moment a session gets sloppy. A failing
 * check does not. These rules are what actually hold a prompt-driven UI
 * together across dozens of sessions, and what keeps features from quietly
 * growing dependencies on each other.
 */
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'

const TOKENS_FILE = 'src/styles/tokens.css'

/** Features compose from the design system and app chrome — nothing else. */
const FEATURE_IMPORTS = new Set(['ui', 'layout', 'icons', 'flags'])

/** Raw type steps. Components must use the named `type-*` roles instead. */
const TYPE_STEPS = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']

/**
 * px values allowed to be odd: hairlines, and the full-round sentinel.
 * Everything else in tokens.css must be a whole even number of pixels.
 */
const ODD_PX_ALLOWED = new Set([1, 9999])

const files = globSync('src/**/*.{ts,tsx,css}', { exclude: (p) => p.includes('node_modules') })
const violations = []

const add = (file, line, rule, detail) => violations.push({ file, line, rule, detail })

for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const lines = src.split('\n')
  const isTokens = file.replace(/\\/g, '/').endsWith(TOKENS_FILE)
  const path = file.replace(/\\/g, '/')
  const featureMatch = path.match(/^src\/features\/([^/]+)\//)
  const feature = featureMatch?.[1] ?? null
  const isGallery = file.replace(/\\/g, '/').includes('src/design-system/')
  // typography.css defines the roles, so it necessarily names the raw steps.
  const isTypeDefs = path.endsWith('src/styles/typography.css')
  // National flag colours are prescribed content, not design decisions — they
  // cannot be tokens. Generated from a vetted source; never hand-edited.
  const isFlags = path.startsWith('src/components/flags/')

  lines.forEach((raw, i) => {
    const line = raw.trim()
    const n = i + 1
    if (line.startsWith('*') || line.startsWith('//') || line.startsWith('/*')) return

    // RULE 1 — colour literals live in tokens.css and nowhere else.
    if (!isTokens && !isFlags) {
      const hex = line.match(/#[0-9a-fA-F]{3,8}\b/)
      if (hex) add(file, n, 'raw-color', `hex literal ${hex[0]} — use a semantic token`)

      const fn = line.match(/\b(?:rgba?|hsla?|oklch|oklab)\(/)
      if (fn && !line.includes('var(--')) {
        add(file, n, 'raw-color', `${fn[0]} literal — use a semantic token`)
      }
    }

    // RULE 1b — primitive ramps are tokens.css-only. A utility naming one
    // reaches past the semantic layer and will survive a restyle unchanged.
    if (!isTokens) {
      const prim = line.match(/\b(?:bg|text|border|fill|stroke|ring|from|via|to|divide|outline|shadow)-(?:ink|red|teal|lime|green|amber)-\d+\b/)
      if (prim) add(file, n, 'primitive-token', `${prim[0]} — use a semantic token, not a primitive ramp`)
    }

    // RULE 1c — type is chosen by role, not by t-shirt size. The gallery is
    // exempt: demoing the raw scale is the one place it belongs.
    if (!isTokens && !isGallery && !isTypeDefs) {
      const step = line.match(new RegExp(`(?<![-\\w])text-(${TYPE_STEPS.join('|')})\\b`))
      if (step) {
        add(file, n, 'raw-type-step', `${step[0]} — use a type-* role (see src/styles/typography.css)`)
      }
    }

    // RULE 2 — no arbitrary Tailwind values. Off-scale means off-system.
    const arb = line.match(/\b(?:bg|text|border|fill|stroke|shadow)-\[(?!var\()[^\]]+\]/)
    if (arb) add(file, n, 'arbitrary-value', `${arb[0]} — add a token instead`)

    const arbSpace = line.match(/\b(?:p|m|gap|w|h|size|top|left|right|bottom)[trblxy]?-\[(?!var\()\d+(?:px|rem)\]/)
    if (arbSpace) add(file, n, 'off-grid-spacing', `${arbSpace[0]} — snap to the 4px scale`)

    // RULE 2b — `h-[--token]` emits `height:--token`, which is invalid CSS and
    // fails silently. Tailwind v4 wants the paren form: `h-(--token)`.
    const bracketVar = line.match(/\b[a-z-]+-\[--[a-zA-Z0-9-]+\]/)
    if (bracketVar) {
      add(file, n, 'broken-var-syntax', `${bracketVar[0]} — Tailwind v4 needs the paren form, e.g. h-(--token)`)
    }

    // RULE 2c — the app is dark-only. There is no light theme to vary against.
    const darkVariant = line.match(/\bdark:[a-z[]/)
    if (darkVariant) add(file, n, 'no-dark-variant', 'dark: variant — MW3 is dark-only, style it directly')

    // RULE 3 — features compose, they do not invent.
    if (feature) {
      const imp = line.match(/^import\s+.*\bfrom\s+['"]@\/components\/([^'"]+)['"]/)
      if (imp) {
        const area = imp[1].split('/')[0]
        if (!FEATURE_IMPORTS.has(area)) {
          add(file, n, 'feature-boundary', `features may only import from ${[...FEATURE_IMPORTS].map((a) => '@/components/' + a).join(', ')} — got @/components/${imp[1]}`)
        }
      }

      // RULE 3b — one feature may not reach into another's internals. Going
      // through the barrel (`@/features/x`) is fine; anything deeper couples
      // two product areas together and makes both harder to move.
      const cross = line.match(/^import\s+.*\bfrom\s+['"]@\/features\/([^'"]+)['"]/)
      if (cross) {
        const [other, ...rest] = cross[1].split('/')
        if (other !== feature && rest.length) {
          add(file, n, 'feature-boundary', `reaches into @/features/${cross[1]} — import from '@/features/${other}' instead`)
        }
      }
    }
  })
}

// ---------------------------------------------------------------------------
// RULE 0 — every dimension in every stylesheet is a whole even number of px.
// This is the rule the whole 8pt grid rests on: a single fractional token
// (a 0.8 multiplier, say) leaks 12.8px sizes into every screen downstream.
// ---------------------------------------------------------------------------
for (const cssFile of files.filter((f) => f.endsWith('.css'))) {
  const src = readFileSync(cssFile, 'utf8')
  src.split('\n').forEach((raw, i) => {
    const line = raw.trim()
    if (line.startsWith('*') || line.startsWith('/*') || !line.includes('--')) return
    const decl = line.split('/*')[0]

    for (const m of decl.matchAll(/(-?\d*\.?\d+)rem/g)) {
      const px = parseFloat(m[1]) * 16
      if (!Number.isInteger(px) || px % 2 !== 0) {
        add(cssFile, i + 1, 'odd-token', `${m[0]} = ${px}px — must be a whole even number of pixels`)
      }
    }
    for (const m of decl.matchAll(/(-?\d*\.?\d+)px/g)) {
      const px = parseFloat(m[1])
      if (ODD_PX_ALLOWED.has(Math.abs(px))) continue
      if (!Number.isInteger(px) || px % 2 !== 0) {
        add(cssFile, i + 1, 'odd-token', `${m[0]} — must be a whole even number of pixels`)
      }
    }
  })
}

if (violations.length === 0) {
  console.log(`✓ design system clean (${files.length} files)`)
  process.exit(0)
}

console.error(`\n✗ ${violations.length} design-system violation(s):\n`)
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.rule}]  ${v.detail}`)
}
console.error('\nSee docs/design-system.md for the rules.\n')
process.exit(1)
