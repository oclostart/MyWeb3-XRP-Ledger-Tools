# MW3 design system rules

Extracted from the MyWeb3.me v2.0 Figma file
(`K3Tga3MGH7NupSQppOo9Qt`, entry node `0:1`).

## 0. Dark only

There is **no light theme**. No `[data-theme]` switch, no `dark:` variant, no
`prefers-color-scheme` branch. Style elements directly with semantic tokens.

A `dark:` prefix anywhere in `src/` fails the build. It is not harmless — it
signals that whoever wrote it believed a second theme exists.

## 1. Tokens are the only source of colour, type, space, and motion

`src/styles/tokens.css` is the only file permitted to contain a colour literal.

**Two layers, and the split is load-bearing:**

| Layer | Example | Who may use it |
|---|---|---|
| Primitive | `--red-500`, `--ink-800` | tokens.css only |
| Semantic | `--color-accent`, `--color-text-muted` | components, screens |

Single-theme does not make this pointless. It is what lets a future restyle
re-point roles without touching a component. This is why `bg-red-500` is a
violation even though it would render correctly today.

Tailwind's stock palette is **deleted** (`--color-*: initial`), so `bg-red-500`
does not silently render — it produces nothing and you notice immediately.

`@theme static` is deliberate: Tailwind tree-shakes unused `@theme` vars, which
silently blanks any token referenced only dynamically (`var(--color-positive)`
inside a style prop). `static` emits them all.

**Blue has three jobs, and resting on a link is not one of them.** `--blue-500`
is behind `--color-link-hover` (a link under the pointer), `--color-code-key`
(a key in a file preview) and `--color-value` (`text-value`: a value on the
ledger or derived for it — the SourceTag's number, the current domain, the
current EmailHash; client, 2026-10-12). Text in `text-value` is never a link
and never clickable; links rest in brand red.

## 1b. Every dimension is a whole even number of pixels

4px base grid, 8px preferred. There is deliberately **no scale multiplier**.

A factor like `--ui-scale: 0.8` looks tidy in the token file and then produces
12.8px body text, 33.6px controls and 19.2px padding everywhere downstream. The
whole point of an 8pt grid is that the numbers are the numbers, so the scale is
written out explicitly instead.

To change density, edit the steps. That is more work than turning a dial, and it
is the work the grid is asking for — each new value is a decision, not a
rounding artefact.

`scripts/check-design-system.mjs` reads `tokens.css` and fails the build on any
value that is fractional or odd. `1px` hairlines and the `9999px` full-round
sentinel are the only exceptions.

## 2. No arbitrary values

`p-[13px]`, `bg-[#0af]`, `text-[15px]` are all violations. The 4px grid and the
type scale are the design. Stepping off them is a small permanent inconsistency.

## 3. CSS vars use the paren form

`h-(--size-control-lg)`, never `h-[--size-control-lg]`.

Tailwind v4 compiles the bracket form to `height:--size-control-lg` — invalid
CSS with no `var()` wrapper. It fails silently: no error, no style, no clue.
The checker rejects it.

## 4. Type steps carry their own line-height and tracking

Use `text-lg`, never a bare font-size.

Every step carries **+0.02em tracking**. That even, slightly-open letterfit is a
signature of this design, taken from the file — not an accident to normalise
away.

- **Titillium Web** carries the UI (400 / 600 / 700 / 900). `font-black` is for
  the wordmark only.
- **Open Sans** (`font-body`) is the secondary face.

## 5. One focus treatment, defined globally

`:focus-visible` is styled once in `src/styles/index.css`. Components must not
define their own focus rings — that is how focus states drift out of sync and
quietly fail accessibility.

## 6. Component anatomy

Every component in `src/components/ui/` follows the same shape. `Button.tsx` is
the reference implementation:

- **`cva` holds all styling.** Variants are data, not scattered ternaries.
- **Props extend the native element** so it stays a drop-in replacement.
- **`className` merges last** via `cn()`, so a screen can nudge layout (margin,
  width) without forking the component.
- **Semantic tokens only.**

Control heights are tokenised (`--size-control-sm/md/lg` = 34/42/52) because
those are the real heights in the file and they are **not** on the 4px grid.
Tokenising them is what keeps controls aligned across screens.

## 6a. Typography is chosen by role, not by size

`src/styles/typography.css` defines the named roles. Components use those; the
raw `text-*` steps are the raw material the roles are built from, and reaching
for one directly fails the build.

| role | size / line-height | weight | used for |
|---|---|---|---|
| `type-wordmark` | 22 / 28 | 900 | the MyWeb3.me lockup, only |
| `type-hero` | 56 / 64 | 700 | hero titles, one per page |
| `type-display` | 40 / 48 | 600 | page titles (the directory's standard, 2026-10-13), tier numerals |
| `type-title` | 26 / 32 | 600 | figures set large — the SourceTag |
| `type-heading` | 22 / 28 | 700 | card titles |
| `type-title-sm` | 22 / 28 | 600 | prices |
| `type-subhead` | 18 / 24 | 600 | secondary prices, tier labels |
| `type-menu` | 18 / 24 | 400 | a side menu's links — the policies, as myweb3.me's |
| `type-label` | 16 / 24 | 600 | nav, form labels, large buttons |
| `type-label-md` | 14 / 20 | 600 | default buttons |
| `type-label-sm` | 12 / 16 | 600 | small buttons, dense controls |
| `type-body` | 14 / 20 | 400 | feature rows, running text |
| `type-caption` | 12 / 16 | 400 | billing and cancellation notes |
| `type-micro` | 10 / 16 | 600 | uppercase eyebrows |

A role says what a piece of text **is**, so two people reaching for "card title"
land on the same size, weight and rhythm. Every line-height is a multiple of 4,
so a line of text always occupies whole grid rows.

Roles carry their own weight. If text needs a different weight it is probably a
different role — reach for one rather than bolting `font-*` on top, which also
invites a specificity fight between two utilities in the same layer.

The gallery at `#/design-system` renders every role against its spec.

## 6b. Icons

Icons are generated into `src/components/icons/generated.tsx` by
`scripts/build-icons.mjs` from the SVGs Figma exported into
`src/assets/icons/`. Path data is copied verbatim — never redraw a glyph.

That file is **rewritten in full on every run**, so anything added to it by hand
is lost the next time someone re-exports. Glyphs with no source SVG — plain
geometry like the modal's cross or the nav's burger — live in `authored.tsx`
beside it, which the generator never touches. Both come out of the same barrel,
so `@/components/icons` is the only import either way.

Two things the generator fixes, both of which bite if you hand-copy an export:

- Baked paints become `currentColor`, so icons take the token colour of their
  container.
- Figma exports the inner *group* bounding box and drops the offset that placed
  it inside the 24x24 frame. The generator restores it by shifting the viewBox
  origin. Rendered raw, the glyph fills the whole box — too large, and
  distorted wherever the group is not square.

Re-run `node scripts/build-icons.mjs` after re-exporting.

## 6c. Responsive

The Figma only draws the 1728px desktop form, so every narrow-width decision
below is ours, not the file's. Two rules:

- **The page never scrolls sideways.** Check `scrollWidth - clientWidth === 0`
  at 375, 768 and 1440 before calling a screen done.
- **Reorder with grid placement, not DOM order.** Components that place
  children explicitly (`xl:col-start-*` / `xl:row-start-*`) are free to sit in
  whatever DOM order reads best when stacked. `PlanCard` uses this: stacked it
  reads tier → plan → price → what you have → what you get → CTA, while the
  desktop grid is unchanged.

`Header` collapses below `lg` — nav labels become `sr-only` so the buttons are
icon-only, and the profile name drops below `md`. At full size the nav alone
needs 401px, which is more than a 375px viewport has.

## 6d. Favicon and app icons

**The monogram alone, edge to edge, in two colours: black on a light browser
bar, white on a dark one** (client, 2026-10-14: "remove the black circle … in
light mode the logo is black and in dark theme it can be white"). One SVG
carries both — a `prefers-color-scheme` rule inside it switches them with the
browser's theme. Before it, the same day: a black rounded square, then a black
circle, each with the white monogram.

| File | Size | What it shows | Source |
|---|---|---|---|
| `public/favicon.svg` | scalable, square | the supplied `myweb3-favicon.svg`'s monogram, geometry verbatim, across **154 of 156** units (99%) — **about 16 of a 16px tab icon** — 64% of the height, centred; black, or white in a dark theme | the monogram, the viewBox cropped square to its width |
| `public/favicon.ico` | 16, 32, 48 | the same in black — an ICO cannot switch, and black is myweb3.me's | rendered from `favicon.svg` |
| `public/apple-touch-icon.png` | 180 | the white monogram on a full black square, 80% across | `scripts/assets/app-icon.svg` |
| `public/icon-192.png`, `icon-512.png` | 192, 512 | as the Apple icon, for `site.webmanifest` | `scripts/assets/app-icon.svg` |

**Where the switch works**: Chrome, Edge and Firefox read the SVG and follow
the theme. Safari's tab may show the ICO's black, or the Apple icon, whichever
it prefers. The home-screen icons cannot be bare: a phone fills an icon's clear
parts with a colour of its own and cuts its own corners, so they keep a black
square.

Never edit the PNGs or the ICO by hand. Change the two SVGs, then run
`node scripts/build-favicons.mjs` (a Mac — it uses QuickLook and `sips`) and
commit what it writes.

## 7. Disabled is one shared state, not a dimmed variant

Every disabled control uses the same grey plate and grey label
(`surface-sunken` on `text-muted`) — taken from the inactive Save button in the
file. A disabled primary button is **not** a faded red button.

Do not reach for `disabled:opacity-*`. Opacity produces five different-looking
disabled states, one per variant, and lets brand colour leak into a state that
should read as inert everywhere.

The `disabled:` pseudo-class outranks the variant classes on specificity, so the
shared treatment wins regardless of cva ordering.

**A disabled field takes no hover** (client, 2026-10-21). `Input`, `Textarea`
and `Listbox` keep their resting stroke and plate under the pointer when off:
the red hover stroke says "you can reach this", which a disabled field cannot.

## 7b. Hover text opens above — below only when the screen has no room

**A platform rule** (owner, 2026-10-15), the directory, the console and the
tools alike: every hover text — the bubble that names an icon, a chip, a mark
— opens **above** what it names. **Only when the screen has no room above it
does it open below.** Never to the side.

- One component does it: `Tooltip`, or `TooltipBubble` inside a `group/tt`.
  There is **no `side` to choose** — the bubble measures as it opens and
  places itself. A native `title` is never used.
- It is drawn on the page itself (a portal, fixed to the screen), so no
  scrolling window, card or box that hides its overflow can cut it off: the
  screen's edge is the only edge it answers to. Do not hand a bubble a side to
  dodge a clipping box — that box no longer clips it.
- Sideways it centres on what it names and slides back inside the screen's 8
  margin when it would pass the edge, the arrow staying on the control.

## 8. Every component appears in the gallery

`npm run dev` serves the gallery: every component, every variant, every state,
side by side.

This is the working surface for design iteration — change a component, see it in
all states at once, know the whole app moved with it. **A component that is not
in the gallery does not exist**, because nobody can see it break.

## Observed design language

Reference for anything not yet tokenised:

| | |
|---|---|
| Brand | `#8C1515` — the single brand colour, used for buttons, accent text, and checks |
| Canvas | near-black with a soft radial wash off the top edge (`--gradient-canvas`) |
| Surfaces | `#0e1014` panels, `#0f0f0f` sunken, `#2a2a2a` form fields |
| Text | white → `#8e8e93` → `#707070` |
| Radii | 8 controls · 10 buttons · 16 cards · full pills/avatars/checks |
| Layout | designed at 1728 wide with a 1361 content column and 121px gutters |
| Category | plans carry an identity colour (`#158c84` Toolkit). Never use it for UI state. |

## Enforcement

`npm run build` runs `scripts/check-design-system.mjs` and fails on:

| Rule | Catches |
|---|---|
| `odd-token` | any fractional or odd pixel value in `tokens.css` |
| `raw-type-step` | `text-lg` in a component — use a `type-*` role |
| `raw-color` | hex / `rgb()` / `oklch()` outside tokens.css |
| `arbitrary-value` | `bg-[…]`, `text-[…]`, `border-[…]` |
| `off-grid-spacing` | `p-[13px]` and friends |
| `broken-var-syntax` | `h-[--token]` — silently invalid in Tailwind v4 |
| `no-dark-variant` | `dark:` anything — MW3 is dark-only |
| `primitive-token` | `text-ink-700`, `bg-red-500` — reaching past the semantic layer |
| `screen-boundary` | screens importing outside `ui` / `layout` / `icons` |

These are not style suggestions. They fail the build.
