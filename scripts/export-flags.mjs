#!/usr/bin/env node
/**
 * Every flag in the client's options file, saved as an image file (C13,
 * 2026-10-12) — the client asked for the flag images behind the JSON's flag
 * emoji, to store on their side.
 *
 * For each `country` row and each `language` row of
 * `src/assets/data/myweb3-options.json` it takes the flag emoji, reads it as
 * the two-letter code it spells (the same reading as `flagCode` in
 * `src/lib/i18n`), and copies that code's flag from `country-flag-icons` (3:2,
 * MIT — the set `src/components/flags` is built from) to
 * `public/flags/{CODE}.svg`. Served by the site at `/flags/{CODE}.svg`.
 *
 * `public/flags/manifest.json` lists what was written, from the JSON's own
 * rows: each country's code, name, calling code and file, and each
 * language's value, name, flag code and file. A row whose flag has no file
 * fails the run, so a gap is found here rather than as a broken image later.
 *
 * Re-run after the options file changes:  node scripts/export-flags.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OPTIONS = 'src/assets/data/myweb3-options.json'
const SRC = 'node_modules/country-flag-icons/3x2'
const OUT = 'public/flags'

/** 🇺🇸 → `US`: each regional indicator symbol is a letter, offset from 🇦. */
const flagCode = (emoji) =>
  String.fromCharCode(...[...emoji].map((char) => char.codePointAt(0) - 0x1f1e6 + 65))

const options = JSON.parse(readFileSync(OPTIONS, 'utf8'))
mkdirSync(OUT, { recursive: true })

const written = new Set()
const missing = []

const save = (code) => {
  const from = join(SRC, `${code}.svg`)
  if (!existsSync(from)) {
    missing.push(code)
    return null
  }
  if (!written.has(code)) copyFileSync(from, join(OUT, `${code}.svg`))
  written.add(code)
  return `/flags/${code}.svg`
}

const countries = options.country
  .filter((row) => row.flag)
  .map((row) => {
    const code = flagCode(row.flag)
    return { code, name: row.label, dial_code: row.dial_code, file: save(code) }
  })

const languages = options.language
  .filter((row) => row.flag)
  .map((row) => {
    const code = flagCode(row.flag)
    return { value: row.value, label: row.label, code, file: save(code) }
  })

if (missing.length) {
  console.error(`✗ no flag for: ${[...new Set(missing)].join(', ')}`)
  process.exit(1)
}

writeFileSync(join(OUT, 'manifest.json'), `${JSON.stringify({ countries, languages }, null, 2)}\n`)
console.log(`✓ ${written.size} flags in ${OUT} — ${countries.length} countries, ${languages.length} languages`)
