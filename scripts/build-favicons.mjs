#!/usr/bin/env node
/**
 * The favicon's other sizes (C12, 2026-10-12; R25, 2026-10-13; R47,
 * 2026-10-14). `public/favicon.svg` is the browser's mark — the bare monogram,
 * black on a light bar and white on a dark one by a media query inside it;
 * browsers that take an SVG icon use it as it is. These are for everything
 * else — the client asked for the favicon to show everywhere:
 *   - `favicon.ico`          16, 32 and 48, from `public/favicon.svg` in the
 *                            light theme's black (an ICO cannot switch)
 *   - `apple-touch-icon.png` 180, for an iPhone's home screen, and
 *   - `icon-192.png`, `icon-512.png`, for `site.webmanifest` (Android), from
 *     `scripts/assets/app-icon.svg` — the white monogram on a black square,
 *     since a home screen fills an icon's clear parts with a colour of its own
 *
 * The mark is never redrawn: QuickLook renders the SVG once at 1024 and `sips`
 * scales that down, so every size is the supplied geometry. Both are macOS's
 * own tools, which is why this runs on a Mac and the output is committed —
 * Vercel's build never needs it.
 *
 * The ICO holds the PNGs as they are, which every current browser reads: a
 * 6-byte header, a 16-byte entry per image, then the images.
 *
 * Re-run after the SVG changes:  node scripts/build-favicons.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const FAVICON = 'public/favicon.svg'
const APP_ICON = 'scripts/assets/app-icon.svg'
const OUT = 'public'
const PNGS = { 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 }
const ICO_SIZES = [16, 32, 48]

const tmp = mkdtempSync(join(tmpdir(), 'favicons-'))

/** QuickLook's 1024 render of an SVG — every size is scaled from it. */
function master(svg, name) {
  const file = join(tmp, name)
  writeFileSync(file, svg)
  execFileSync('qlmanage', ['-t', '-s', '1024', '-o', tmp, file], { stdio: 'ignore' })
  return `${file}.png`
}

try {
  // The dark theme's white is a media query QuickLook might honour on a Mac
  // in dark mode; the ICO is the light theme's black, so it goes.
  const favicon = master(readFileSync(FAVICON, 'utf8').replace(/@media[^{]*\{[^}]*\}\s*\}/, ''), 'favicon.svg')
  const appIcon = master(readFileSync(APP_ICON, 'utf8'), 'app-icon.svg')

  const render = (from, size, file) => {
    execFileSync('sips', ['-z', String(size), String(size), from, '--out', file], { stdio: 'ignore' })
    return readFileSync(file)
  }

  for (const [name, size] of Object.entries(PNGS)) render(appIcon, size, join(OUT, name))

  const images = ICO_SIZES.map((size) => render(favicon, size, join(tmp, `${size}.png`)))
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // 1 = icon
  header.writeUInt16LE(images.length, 4)

  let offset = header.length + 16 * images.length
  const entries = images.map((image, i) => {
    const size = ICO_SIZES[i]
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size, 0) // width
    entry.writeUInt8(size, 1) // height
    entry.writeUInt8(0, 2) // no palette
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // colour planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(image.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += image.length
    return entry
  })

  writeFileSync(join(OUT, 'favicon.ico'), Buffer.concat([header, ...entries, ...images]))
  console.log(`✓ favicon.ico (${ICO_SIZES.join(', ')}), ${Object.keys(PNGS).join(', ')}`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
