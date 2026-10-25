# MW3 design language

How to design a screen that belongs in this product, including screens the
Figma file has never seen.

`design-system.md` holds the rules the build enforces. This holds the
*judgement* — the patterns behind the file, so a new flow lands in the same
world. Read both before designing a screen.

Source: the MyWeb3.me v2.0 Figma file, surveyed across 24 sections.

---

## What the product is

A Web3 profile builder. Two contexts, and they look different on purpose:

| | |
|---|---|
| **App chrome** | Where the owner configures things. Near-black, centred, quiet. |
| **Public profile** | What a visitor sees. Banner image, avatar, sections of content tiles. Brighter, denser, more expressive. |

A screen belongs to one of these. Decide which before laying anything out.

---

## The seven habits of this design

### 1. Work happens in a centred panel, not on a page

This is the strongest pattern in the file. My Account, Payment Methods, Change
Password, Change Email, Delete Account — all of them are a **panel floating
over a blurred, dimmed page**. Full-page forms essentially do not exist here.

Reach for `Modal` first. Ask what forces a new full page before building one.

### 2. Titles are red

Panel titles, section titles and modal titles are **brand red**, not white, with
a muted grey subtitle directly beneath. This is the single most identifiable
habit in the product — get it wrong and a screen stops looking like MW3.

```
My Account            ← #8C1515, 22/600
Account Details & Preferences   ← muted, 14/400
```

### 3. Brand red is used generously, not sparingly

Most systems ration their accent. This one does not: red carries titles,
primary buttons, active segments, included-feature checks, the whole editor
rail, and every inline edit affordance. Red *is* the interface.

What red does **not** do: body text, borders on ordinary surfaces, or large
fills. It marks things, it does not upholster them.

### 4. Content plates invert

The canvas is near-black, and the things a visitor came to see — platform
tiles, category chips, tooltips — sit on **white plates with dark content**.
That inversion is what makes content read as content rather than chrome.

Chrome is dark on dark. Content is dark on light. `Tile`, `TabCell` (solid) and
`Tooltip` all follow this.

### 5. Everything is round

Pills for buttons and chips. `rounded-lg` for fields and selects. `rounded-2xl`
for panels and cards. Full circles for avatars, checks and rail actions. There
are no square corners in this product — a hard 90° corner will look foreign.

### 6. Composition is centred

Panel titles sit left, but **actions centre**: the Save button, the "View All"
link, the section titles on the public profile. A footer action that is
left-aligned or right-aligned will read as the wrong product.

### 7. State is colour-coded, consistently

| Meaning | Treatment |
|---|---|
| Included / active / on | brand red fill |
| Inherited / available but not yours | grey fill, and the block dimmed to 80% |
| Time-sensitive notice | lime `--color-notice` (expiry dates) |
| Disabled | grey plate, grey label — never a faded version of the live style |
| Coming soon | disabled plate plus a light `Tooltip` |

---

## Layout

- Designed at **1728** wide with a **1361** content column. Ours is
  `--container-content`, scaled.
- The canvas is never flat black: every screen carries a soft radial wash off
  the top edge (`--gradient-canvas`). It is already on `body`; do not re-add it.
- The **side rail** (`SideRail` + `SideOption`) is pinned right and persists
  across the app. Screens do not own it.
- The **header** is on every screen. Screens supply only the content column —
  use `PageShell`.
- Below `xl`, stack. The file has no narrow-width design, so those decisions
  are ours: keep the reading order sensible and never let the page scroll
  sideways.

## Typography in practice

- **Titillium Web** carries everything. Open Sans is the secondary body face.
- The file also contains Wix Madefor Display and Montserrat. Those are drift
  from borrowed components — **do not use them**.
- Every step carries +0.02em tracking. It is a signature, not an accident.
- Pick a `type-*` role, never a raw size. See `design-system.md` §6a.

## Density

Tight. 20px panel padding, 8px between a title and its list, 4px between rows
in a list. When unsure, go one step tighter than feels right — the file
consistently does.

The exception is a page's title. It stands **16** above the line under it and
the pair **32** above the page — at 12 the owner read the line as crowding the
title (2026-10-08). The line is white, the page's main description, and its
lines start at the same place on every page. `PageHeader` draws it; do not
write the pair out by hand.

An empty field says its own name — "Name", "Description" — as the Canva and
the directory's form both do. A field with a shape someone could get wrong
shows the shape: a link `https://example.com`, a handle `@username`.

## Writing

- Labels are plain and short: "Add to cart:", "Billed Annually", "Cancel
  Anytime", "Change Username".
- Sentence case for descriptions, Title Case for buttons and labels.
- Feature rows are single-line. Check the width budget in `plans.ts` before
  adding one — the column is ~45 characters.

---

## Designing something new

1. **Which context** — app chrome or public profile?
2. **Panel or page?** Panel, unless something forces otherwise.
3. **Red title + muted subtitle.** Always.
4. **Compose from the registry.** If a piece is missing, build it into
   `components/ui/`, register it, gallery it — then use it.
5. **Centre the primary action.**
6. **Check it at 375, 768 and 1440**, and that `npm run build` passes.
