# Component registry

**Check this file before creating any component.** If something close exists,
extend it with a variant rather than adding a sibling.

Status: `stable` = in the gallery and matched to the Figma file ·
`draft` = built, not yet validated against a real screen.

---

## Primitives

### `Button` — `src/components/ui/Button.tsx` · stable
The reference implementation for component anatomy.

| Prop | Values | Default |
|---|---|---|
| `variant` | `primary` `secondary` `outline` `ghost` `link` `critical` | `primary` |
| `size` | `sm` (24) `md` (32) `lg` (40) `xl` (48) `icon` (32) `icon-lg` (48) `pill` | `md` |

`icon-lg` was added 2026-10-03. `icon` at 32 is a pointer's target and not
a thumb's — under the 44px every touch guideline asks for — and it is the
same height as nothing else on a row. `icon-lg` stands as tall as an `xl`
field, so an icon set beside one reads as its pair rather than as something
dropped next to it. The homepage's "use my location" is the case that
named it.
| `shape` | `pill` `square` | `pill` |
| `full` | `true` | — |

Extends `<button>`. `primary` is brand red — the file uses it sparingly, one per
card. `critical` is for destructive actions only, never for emphasis.

`buttonVariants` is exported (2026-10-06) so a link can wear a button's
styling. Navigation stays a real `<a>` — middle-click, open in a new tab and
the browser's own link menu keep working — where a `<button>` that calls
`navigate()` would lose all three. XRPL Tools' hub tiles are the first case.

**One disabled treatment for every variant** — `track` plate (`#212121`),
`text-muted` label (`#8e8e93`), both measured off MW3's inactive Continue.
`primary` used to override this with the brand colour at 30%, on the argument
that a faded red reads as the same control not yet available where grey reads
as a different one appearing. MW3 greys it, and the shared rule already said
disabled should look the same everywhere — the variant was the one thing
breaking its own rule. Changed 2026-10-02; this is visible on every form's
Submit, not only in modals.

`link` is the text-link treatment on a button: brand red at rest, blue on hover,
no plate and no border. It exists for icon-only actions, where a plate reads as
chrome around nothing — pair it with `size="icon"` and always give it a `title`
**and** an `aria-label`, since it has no visible text to name it.

Fully rounded at every size — the pill is the button shape in this system,
matching the segmented control and the round icon chips.

`shape="square"` is the one exception, and exists for a single case: a button
sitting directly beside an input. It borrows the field's 8px radius so the pair
reads as one control instead of two unrelated ones. Reach for it only there —
a square button standing alone is off-language.

`xl` exists because 40px is under the 44px touch-target minimum. Use it for a
card's primary action or any standalone touch target.

**A labelled button is never narrower than a four-letter label** (client,
2026-10-12): `sm` 56, `md` 72, `lg` 80, `xl` 96 (`--size-button-min-*`), so
Set and OK stand as wide as Done instead of pinched to their letters. The icon
sizes are square and need no floor, and `link` keeps the width of what it says
— it has no plate for the floor to show on. Labels sit centred: measured
2026-10-12, the ink of a 14px label lands within half a pixel of the plate's
centre, so no optical nudge is needed.

**Disabled is shared across all variants**: grey plate, grey label
(`#0f0f0f` / `#8e8e93`). A disabled primary is grey, not faded red.

### `Input` — `src/components/ui/Input.tsx` · stable
`size` is `lg` (40, default), `xl` (48) or `2xl` (56 — the field in an MW3
prompt).

Filled, not outlined: a lighter plate on the dark surface with no visible border
until something is wrong.

**Hover stands down when the field is focused** (`focus-visible:border-transparent`,
and the same on `Textarea` and `FlagSelect`). This is a rule about the system,
not a detail of one control: `:focus-visible` is a **global** 2px outline held
2px off the element (`styles/index.css`), and these controls draw a 1px hover
border hugging it — in a *different* red, because the two come from different
tokens (`--color-border-focus` is `--red-400`, `--color-border-accent` is
`--red-500`). Both at once drew two concentric red lines with a dark gap
between, which reads as a chipped or doubled edge. Focus wins, being the one of
the two that carries meaning for someone who cannot use a pointer.

Any new control that takes a red hover border owes the same line. `OtpInput`
answers it the other way — `focus-visible:outline-none` plus its own
`border-border-focus` — because six adjacent boxes with offset outlines collide
with each other; that is the exception, and the global treatment is the rule.

| Prop | Values |
|---|---|
| `size` | `lg` (40, default) `xl` (48) |
| `invalid` | `boolean` — red border, sets `aria-invalid` |
| `leading` | `ReactNode` — leading affordance (the directory search glyph) |
| `trailing` | `ReactNode` — trailing affordance: a password-reveal eye, or an action belonging to the field |

Both slots size the glyph they are handed (`[&_svg]:size-(--size-icon)`), the
same way `Button` does. Icons from `@/components/icons` carry no width or
height by design, so a slot that does not size them renders them at **0x0** —
in the DOM, invisible on screen, and silent about it. That is exactly what had
happened to the directory's search icon.

Both slots are **inert by default**, so a click that lands on a decorative glyph
still focuses the field instead of hitting a dead spot. A `button` or `a` inside
a slot takes its events back — use that for an action that belongs to the field
itself, the way the directory's "use my location" sits inside the search box
rather than beside it. Pair it with `<Button variant="link" size="icon">`, which
fits the trailing padding exactly at either size.

Hover paints the brand stroke. The plate carries a transparent border at rest
so the box does not shift when it appears.

### `Field` — `src/components/ui/Field.tsx` · stable
`required` marks the label with the asterisk **and** sets `required` on the
control — the asterisk is `aria-hidden`, because a screen reader announces the
state rather than reading punctuation. `badge` is a short tag beside the label;
the application form uses it for `Public`, the one thing a merchant cannot infer
from looking, since every field looks alike but only some reach the directory.

Label + control + message. Wires `htmlFor`/`id` automatically.

| Prop | Values |
|---|---|
| `label` | `string` — required |
| `hint` | `string` |
| `error` | `string` — overrides `hint`, forces the control invalid |

Prefer `Field` over a bare `Input` on any real screen. The label association is
the whole reason it exists.

### `Textarea` — `src/components/ui/Textarea.tsx` · stable
`Input`'s plate with height. `resize-none` on purpose: every textarea here has a
character limit behind it, so the height is a design decision, and a dragged-out
box inside a modal pushes the panel past the fold. Its placeholder grey is
stated, `text-subtle`, as `Input`'s is (2026-10-08) — the default had been
drifting on the current colour.

| Prop | Values | Default |
|---|---|---|
| `rows` | `number` | `4` |
| `invalid` | `boolean` | — |

### `Card` — `src/components/ui/Card.tsx` · stable
16px radius, `#0e1014` surface, hairline border.
Compound: `Card` · `CardHeader` · `CardTitle` · `CardDescription` · `CardBody`.

Note `CardDescription` is brand red — in this design the subtitle slot carries
the plan status ("Free"), not muted prose.

`raised` (added 2026-10-02) sits the card on `surface-raised` instead of
`surface` — for a card inside a card, where the two grounds are otherwise the
same colour and only the hairline tells them apart, which reads as a drawing
mistake rather than as a stack. B1's three benefit cards are the first use.

### `Listbox` — `src/components/ui/Listbox.tsx` · stable
**The dropdown this product draws itself.** Renamed from `FlagSelect` on
2026-10-02, when its remit widened past flags — the old name would have led the
next person to build a second listbox for flag-less options, which is the
failure this registry exists to prevent.

`options: ListboxOption[]` (`value`, `label`, optional `flag`), `value`,
`onChange`, `label` (required — the trigger's text is the value, not a name),
`placeholder`, `align`, `disabled`. Disabled reads as a disabled `Input`: the field and its caret at half
strength, no hover stroke (2026-10-14).

An option whose value is `''` is the list's empty choice — listed so an answer
can be taken back (the toml builder's `-`, 2026-10-12) — and reads in the
placeholder's grey on the trigger when chosen.

`checked` and `unavailable` (added 2026-10-08) are for a list that adds and
removes rather than picking one — `CategoryPicker`'s sub-categories. `checked`
ticks several options (the trigger still shows `value`), and the list opens on
the first tick rather than at the top of an alphabetical list. `unavailable`
dims options to 30% and makes a press on one do nothing, the list staying open
— the press was not a choice.

**Two reasons it exists rather than being a `Select` variant.** A native
`<option>` can only hold text, so an SVG flag inside one is impossible. And a
native `<option>` cannot be reliably styled: `option:checked` and
`option:hover` are honoured by the CSS engine — `getComputedStyle` reports them
applied — but on macOS the open list is drawn by the operating system, which
ignores all of it. A brand-coloured highlight is simply not available through a
native control there, which is why the application form's category and
sub-category moved onto this.

Options are white with a brand-red highlight. `align="center"` centres each
row and lifts the tick out of the flow — left in it, the label centres against
the space the tick leaves rather than against the row, putting every option a
few pixels left of the trigger above it. A row carrying a flag centres the
flag-and-label group, so the label alone sits half a flag to the right; that is
correct, not a defect.

Keyboard is the whole cost of leaving the native control behind, so it is
implemented in full: Enter/Space/Arrows open, arrows move, Enter or Space
commits, Escape closes without committing, Home/End jump, and typing a letter
jumps to the next option starting with it.

### `TopologyField` — `src/components/ui/TopologyField.tsx` · stable
A slowly turning sphere of points and the lines between them — 21st.dev's
"Nexus topology field", drawn natively on one canvas (no iframe, no three.js),
with the original's numbers: 120 nodes on a Fibonacci sphere joined below 0.45
apart, a camera 650 back with a 60° view, 380 across on a desktop and 200 on a
phone, turning 0.0018 a frame about its vertical and 0.0006 about its depth,
tilted 0.2, each node pulsing on its own speed, fog between 300 and 950, a
soft glow, additive lines. The hub's background for a day (2026-10-13); back
on 2026-10-14 as **the developer tools' background** (SourceTag,
xrp-ledger.toml, R44): fixed under the window, its centre at 92% of the width
so close to half of it runs off the right edge, at 0.78 of its size and
`opacity-20`. Its colour is its text token; under reduced motion it holds
still. No pointer, hidden from assistive tech.

| Prop | Values |
|---|---|
| `anchor` | `{ x, y }` — the centre as fractions of the canvas; the middle by default, the developer tools `{ x: 0.92, y: 0.5 }` |
| `scale` | size against the original's; the developer tools `0.78` |
| `className` | placement and strength |

### `ParticlesField` — `src/components/ui/ParticlesField.tsx` · stable
Drifting points joined by lines when near, reaching for the pointer and
multiplying on a click — 21st.dev's "Particles BG" (particles.js), **the
merchant tools' background** (Trust Lines, Domain, EmailHash, R43, client
2026-10-14), mounted by `AccountToolFrame`, fixed under the window at
`opacity-30` (40 for its first hours, then lighter at the client's ask). The source fetched particles.js from a CDN at run time and
coloured it cyan; this draws the same field on one canvas with its settings:
140 points per 800 thousand square pixels, radii to 3 and strength to 70%
breathing between floors, drifting up to a pixel a frame and bouncing off the
edges, joined within 160 by a 1.2 line fading from 40%; **under the pointer,
every point within 220 reaches for it** (to 80%), and **a click adds four** at
the pointer, to 320 in all. In the brand's white (the canvas's text token)
rather than cyan. It follows the pointer over the whole window while taking
none, so clicks land on what was pressed. Under reduced motion it draws once
and answers nothing.

| Prop | Values |
|---|---|
| `className` | placement and strength — the merchant tools: `fixed inset-0 -z-10 size-full opacity-30` |

### `GatewayFlow` — `src/components/ui/GatewayFlow.tsx` · stable
Lines sweeping in from both edges of the window and meeting at one point — the
tools hub's background (R36, client 2026-10-13), meeting at the XRP Ledger
logo's centre, fixed under the whole page at `opacity-40`; the header's
gradient and the tiles' surfaces cover it. The logo stands on a soft shadow
of the page's black (`bg-canvas`, blurred) so the lines run into it rather
than across the letters. It replaced `TopologyField`, the sphere the hub
carried for a day, which was removed with it.

**Drawn here, not embedded.** The client's source was 21st.dev's "Gateway
Flow", which ran a whole demo page — a sign-in card, GSAP, Tailwind, Google
Fonts and stock photos from other hosts — in an iframe and kept only its
canvas. This is that canvas alone, with the original's numbers: 80 lines,
alternating left and right, starting spread over 1.4 of the height; each a
cubic curve with its first handle half-way to the meeting point at its own
height and its second 80% of the way at the point's height; dotted (1 on, 4
off), 1.2 wide, at 35%; a 3px square light at 70% riding each at its own
pace, the line's start shifting a few pixels each lap. **A click anywhere
sends a ring out** from the pointer — 15 a frame, fading over about a second —
pushing the lights within 120 of it outward, up to 80, before they settle back
onto their lines (left out on the first pass, put back at the client's ask the
same day). The canvas takes no pointer, so the click still lands on what was
pressed. Paced in real time.

Its colour is the canvas's own `color` (`text-text`), strength through
`globalAlpha`. Under reduced motion the lines are drawn once, the lights hold
still and a click sends nothing. No pointer, hidden from assistive tech.

| Prop | Values |
|---|---|
| `target` | a ref to the element whose centre the lines meet at, followed as it moves; the canvas's middle without one |
| `paths` | how many lines, 80 by default |
| `split` | splits the meeting point in two, this many pixels outside the target's ends: the left lines meet just before its left edge, the right just past its right, nothing behind it. The hub's is `16`, beside the XRP Ledger logo's mark and name (client, 2026-10-14, from a marked-up screenshot; the lines had been spread across the logo's width, then 1.6 of it, the two days before) |
| `className` | placement and strength — the hub: `fixed inset-0 -z-10 size-full opacity-40` |

### `DatePicker` — `src/components/ui/DatePicker.tsx` · stable
A date from a calendar in the system's own look (2026-10-13, the client:
"can the calendar look improve?"). The browser's date input opened the
operating system's picker, which no page can style, and showed its
"dd/mm/yyyy" in a value's white.

**The field is `Listbox`'s trigger** — field grey, the same stroke and brand
red under the pointer — showing the date in the reader's language ("October
25, 2026") or the placeholder in grey, with `CalendarIcon` where a dropdown has
its caret. **The calendar is its list's panel**: the month between two
chevrons, weekdays in small grey capitals, days on a 36 grid — the chosen day
on the brand plate, the field grey under the pointer, today ringed, days
before `min` shown but off. The week starts where the reader's locale starts
it. Keys: arrows a day or a week, Page Up/Down a month, Home/End the week's
ends, Enter/Space choose, Escape closes and hands focus back, **Backspace or
Delete clears the date** — on the field or in the open calendar (client,
2026-10-14). Closes on an
outside press or focus leaving, as every layer does. Dates in and out as
`YYYY-MM-DD`, with calendar arithmetic in UTC so no day slips across a time
zone.

| Prop | Values |
|---|---|
| `value` / `onChange` | `YYYY-MM-DD`, or `''` for none |
| `min` | the earliest day that can be chosen |
| `placeholder` | read in grey while empty |
| `label` | accessible name when no `Field` names it; inside a `Field`, the label does |
| `id` / `invalid` / `required` | passed in by `Field` |
| `autoFocus` | focus on arrival |

The toml builder's Expiration Date is the first: `min` is tomorrow in UTC,
since rule 9 reads a date as its first instant in UTC.

### `Stepper` — `src/components/ui/Stepper.tsx` · stable
Where someone is in a long errand. Added 2026-10-06 for the xrp-ledger.toml
builder.

| Prop | Values |
|---|---|
| `steps` | `{ label, count? }[]` — `count` makes "Principals (2)" |
| `current` | the step in progress; those before it are done |
| `label` | the track's accessible name |
| `summary` | the one line a phone gets instead of every label |
| `onSelect` | `(index) => void` — every step becomes a button that opens it; the dot takes a red ring and the label the white under the pointer (2026-10-13, the toml builder's timeline). Absent, display only |

Done in **brand red**, the track behind the current step red with it; the
current dot **white** (`surface-inverse`) and larger; the rest grey. The
owner's colours, 2026-10-07 — done was green at first, on `Check`'s "you have
this", but a green the brand does not use read as a second accent on a track
the red already leads.

**Labels alternate above and below the line**, as the Canva draws it, which
gives each one two steps' width: that is what lets eight stand at full size
across a form column without colliding. Below `md` they go `sr-only` and the
`summary` line speaks instead — a screen reader still hears every step and
which is current (`aria-current="step"`), and the summary is `aria-hidden` so
it is not heard twice.

**Display only.** Moving between steps is the form's Next and Back, so the
track never offers a jump past a step the form has not validated.

### `CodePreview` — `src/components/ui/CodePreview.tsx` · stable
A file shown as it will be written, with the copy mark. Added 2026-10-06.

**The header is the file's name, centred, with `CopyButton` at its right.
Changed 2026-10-08, the owner's ask.** It read "Preview" with the file name
muted beside it and Copy in words; `caption` went with it. The mark rides the
right edge out of the flow, so the name centres on the panel.

| Prop | Values |
|---|---|
| `title` | the file's name — `xrp-ledger.toml` |
| `lines` | one node per line, **already coloured** — the panel parses nothing |
| `text` | the same text unstyled, for Copy |
| `activeLine` | kept in view when it changes |
| `tall` | a taller body, when the file is the page's subject |

Lines scroll on both axes rather than wrap: a wrapped hash shows a line break
the file does not have. `activeLine` scrolls **the panel only** — never
`scrollIntoView`, which would also move the window and pull the form out from
under someone's cursor.

### `Popover` — `src/components/ui/Popover.tsx` · stable
A button that discloses a panel of controls beneath itself. Added 2026-10-03
for the directory header on a phone.

| Prop | Values |
|---|---|
| `label` | required — the accessible name for the trigger |
| `trigger` | what the trigger shows, usually one icon — in the language picker's own box |
| `body` | `controls` (default) — 12 of padding between controls, each in its own box: the phone header's settings; `list` — `Listbox`'s own list, 4 of padding and rows 4 apart, rising in as it opens: the tools' Tools menu (2026-10-13) |
| `align` | `start` `end` (default) — which edge the panel hangs from |

**Disclosure semantics, not menu semantics.** `aria-expanded` on a button and
ordinary content in the panel. A `menu` role promises a list of commands that
arrow keys walk, and what goes in here is a group of controls that each own
their own keyboard — claiming otherwise would have a screen reader announce a
menu and then hand over two dropdowns that do not behave like menu items.

**The panel is positioned, not portalled**, and must never be given `overflow`:
a `Listbox` inside opens its own absolutely-positioned list, which escapes this
box on its own and would otherwise be clipped by it.

Dismisses the three ways `Listbox` does — an outside press, a focus leaving,
Escape — and Escape peels one layer at a time, so a dropdown inside closes
before the panel does. That test is scoped to the **panel**, not the root: the
trigger carries `aria-expanded="true"` the whole time the panel is open, so
asking the root whether anything inside is open always answered yes and Escape
never reached the panel at all.

### `Modal` — `src/components/ui/Modal.tsx` · stable
**Restyled to the MW3 popups, 2026-10-02.** It was a brand-red title on a
panel outlined in flat brand red, taken from the earlier file where titles were
red. MW3's own popups are a centred white title on a near-black panel under a
**gradient stroke**, and the directory follows them. Measured from the
reference frames: panel `#080808` (ours `canvas`, `#08090b`), inactive button
`#212121`, its label `#8e8e93`, title 22/600 white. Every one of those values
already existed as a token; the modal was assembled from the wrong ones.

**The stroke is `--gradient-panel-stroke`, and it was solved rather than
eyeballed.** First reading called it no border at all — the edge pixels looked
like antialiasing. They are not: they are reddish where the background behind
is blue-grey, which antialiasing cannot produce. Composited against the panel
ground the edge is brand red from ~1% at the top-left to ~60% at the
bottom-right. The angle falls out of the spreads — vertical carries about 2.9x
the horizontal, so ~170deg, nearly vertical rather than the diagonal it appears
to be. The stops are uneven because the ramp accelerates: the sides' midpoint
sits below top-and-bottom's, which a linear ramp cannot do. Verified by
rasterising the same gradient at MW3's panel size and comparing all six
measured points — every one within 1 in the red channel.

A gradient border needs two backgrounds (fill clipped to the padding box,
gradient to the border box) over a transparent border; that is what the
`panel-stroke` utility is for. The fill lives in the utility rather than a
`bg-*` class, because `background` is one property and the utility would
overwrite it.

`size` is `2xs` `xs` `sm` `md` `lg`. `2xs` (360, added 2026-10-08) is one
short answer — Select Wallet. Its floor is the header: the longest Select
Wallet title, Spanish's at 232, clears the close button with 7 to spare at
360; any narrower and a centred title runs under it. **`xs` (480) and `sm`
(568) are not interchangeable**: `xs` is the merchant profile's width, and `api-contract.md`
derives the 150-character bio cap from a 480px panel, so widening it silently
invalidates that. `sm` is the MW3 prompt width, measured off the reference
frames — a 455x56 field with 56px of air each side.

`fit` (added 2026-10-14) is as wide as its content with the usual 24 of
padding, so a one-line question stays one line: never under `2xs` (the title
needs that room to clear the close button) nor past `sm`, where it turns over;
on a phone it fills the screen and wraps. The toml's Reset window is `fit`.

`closeOnOverlay` (default `true`) — `false` stops a press on the page behind
from closing the panel. For something read rather than answered: a stray click
on the grid or the map should not take a merchant's profile away mid-read.
Escape and the close control still work, so it is never a trap.

`onSubmit` makes the panel a form, wrapping the body **and** the footer so the
action button submits without being wired up — which is what makes Enter work
in a field. Give the footer button no `onClick` when this is set, or the action
fires twice.

`headerAlign` is `center` (default) or `start`. `center` centres the header on
the **panel** and floats the close button over the right edge — seating the
button as a flex sibling would steal width from one side only and leave the
title off-centre by half a button. `start` is kept for a panel whose header
carries enough that centring would fight the corners.

**The header's corners ride the title's cap line. Changed 2026-10-03.**
Floating the corners means nothing tells them where to sit, and they simply
hung from the header's top edge. MW3 does not centre them on the title either:
measured off the prompt frames — `Account Verified`, `Change Username` and
`Change Password` all agree — the panel sets its title box at y=32 and the 32px
close at y=24, so the glyph centres at 40 against a title box centred at 49, and
the title's cap top is at 41.9. The close rides the top of the lettering.

Reproduced rather than copied, because their title box is 34 where ours is 28:
they took Titillium Web's natural line box (ascent 25 + descent 9 at 22px, no
leading) and our scale sets 22/28. So the band is the title's own line-height —
`--text-2xl--line-height`, by name, so retyping the title moves the corners with
it — and `-mt-2` lifts it to the cap line. Titillium's cap top falls at 6.9 in a
28px box and 7.7 in a 32px one, so one 8px lift serves both within a pixel; a
`header` slot keeps the 32px control band it was drawn against and takes the
same lift.

Figma: `Official Links - Model`, 32 uses. **The dominant composition in this
product** — reach for it before building a full page.

| Prop | Values |
|---|---|
| `size` | `xs` (480) `sm` (568) `md` (704) `lg` (960) |
| `title` | required — centred, white, 22/600 |
| `subtitle` | muted, beneath the title |
| `controls` | extra header controls, left of the close button |
| `header` | replaces the title/subtitle block when the panel leads with content. `title` is still required and still names the dialog |
| `footer` | a single centred action |

**The panel is fixed to the viewport; only its body scrolls.** The overlay does
not scroll. The panel is capped with `max-h-full` and lays out as
header / body / footer, where only the body is `overflow-y-auto` — so the title,
the close button and the footer action stay on screen however long the content
is. The page behind is held still while a modal is open, and `overscroll-contain`
stops the wheel handing the scroll back to it at the end of the body.

`min-h-0` on the body is what makes the cap work: a flex item's default
`min-height: auto` refuses to shrink below its content, so without it the panel
grows past its own cap and the overflow moves back to the page.

Two one-pixel defects are held off deliberately, each verified to return without
its fix:

- `overflow-x-hidden` — setting only `overflow-y` makes `overflow-x` compute to
  `auto`, and the axes then reserve room for each other: the vertical bar
  narrows the box, which asks for a horizontal bar, which shortens it, which
  keeps the vertical one. A one-sentence modal got 15px of gutter on both axes
  with nothing to scroll.
- `pb-px` — text boxes land on fractional heights, and the browser rounds scroll
  height up while rounding client height down, so a 40px paragraph in a 40px box
  reports 41 and draws a bar.

`-mt-3 pt-3` **and** `-mb-3 pb-3` on the body are **bleed, not spacing**.
Overflow clips at the padding box, so anything drawn outside its own box — a
ring, a shadow, a focus outline — is cut flat against that edge. The padding
gives it 12px to draw into; the matching negative margin takes those 12px back
from the gap outside, so nothing moves and only the clip line does. Spacing
inside the body stays the panel's one `gap-5`.

**Both ends, because both ends bite.** The top cut a token mark's hover ring
into an arc. The bottom cut 3px off the focus outline of the last field in the
panel: `:focus-visible` is 2px held 2px off, so it reaches 4px past the
control, and the `pb-px` that used to sit here left it one. A ring sliced flat
along its bottom edge reads as a chipped corner, which is what it is. `pb-3`
subsumes that `pb-px` — every modal state was re-checked for the spurious
scrollbar it guarded against, and none returned.

12px rather than the 4 an outline needs, so a child can also be pulled against
the grain — `MerchantProfileModal` tightens its token row with `-my-2` — and
still have room to draw.

The general rule: **a scroll container owes bleed to whatever its edge children
draw outside themselves.** Three separate bugs here have been that same
mistake.

The corollary matters more than the fix: **a negative top margin on the body's
first child does nothing useful.** It cannot pull content up, because the
container's content box does not move — the item simply overflows and is
clipped. `MerchantProfileModal`'s cover art carried `-mt-2.5` for exactly that
reason and the gap never changed; all it did was crop 10px off every Featured
merchant's image. Close a gap by changing the gap.

Escape and backdrop click close it. The close button is a 32px circle that
takes a brand-red ring on hover and on keyboard focus — a ring rather than a
border, so nothing in the header reflows when it appears.


`subtitleTone` (2026-10-13): `muted` (default) or `default` — the subtitle in
the text white, for a line that is the instruction the window exists to give:
Sign with Xaman's "Open the Xaman app and scan this QR code."
### `Tooltip` / `TooltipBubble` — `src/components/ui/Tooltip.tsx` · stable
**A see-through black bubble (85%) with white text** (`--color-tooltip`, client
2026-10-13 and 14: "black opacity on MW3 and shown above"), edged in
`border-strong` so black reads as an object on this near-black page, 8px
corners, and **an arrow pointing at what it names**: a 12px square turned 45°
on the bubble's edge, carrying the edge on its two outer sides; the bubble
stands 12 off the control.

**Above, always, unless the screen has no room above — only then below**
(owner, 2026-10-15, for the tools and the directory alike;
`design-system.md` §7b). There is no `side`: the bubble measures as it opens,
and again on scroll and resize. It is drawn on the page in a portal, fixed to
the screen, so no window header or clipping box cuts it off; sideways it
centres on the control and slides inside the screen's 8 margin, the arrow
kept on the control — the wallet pill's address at the header's right edge,
a window's close and the file preview's Copy, all once set to the left by
hand, now open above like the rest. Shown under the pointer and on
**keyboard** focus, not on the focus a click leaves; it follows the nearest
`group/tt` and points at the element it sits in.

| Prop | Values | Default |
|---|---|---|
| `label` | the text | — |
| `wrap` | `true` — turns over at 256 and keeps line breaks | `false` |
| `quiet` | `true` holds the bubble back — the copy mark from its press until the pointer leaves | `false` |

**Every hover text is this, never a native `title`** — the token marks'
tickers too (2026-10-15). `TooltipBubble` is the bubble alone, for a control
that cannot be wrapped: put it inside the element it should point at, within
a `group/tt`.
### `TokenChip` — `src/components/ui/TokenChip.tsx` · stable
A currency a merchant accepts.

| Prop | Values | Default |
|---|---|---|
| `variant` | `solid` `outline` `mark` | `solid` |
| `accepted` | `boolean` — only meaningful for `solid` | `false` |
| `decorative` | `boolean` — `mark` only | `false` |

`solid` marks acceptance by fill, for a full list where some are not accepted —
the profile modal. `outline` is a neutral container for a list that is already
only what the merchant takes, where a highlight would say nothing — the tile's
`action` variant.

`mark` is the supplied token disc, with no ticker beneath it — at the size
these sit on a card the label doubled the height of the row to repeat what the
mark already says. The ticker survives as the accessible name and the tooltip.

`decorative` is that disc where the ticker *is* already set beside it in type —
the application form's currency switches. It drops the tooltip and the
accessible name, so the pair is announced once rather than twice, and the hover
glow with them: there the coin is not the control, and a glyph that lights
under the pointer offers a press that does nothing.

Marks live in `src/assets/tokens/` and render as **images, not glyphs**: the
coloured circle is part of the artwork, so `currentColor` has nothing to act
on. Their brand colour is content, the same exemption flags get. **XRP,
RLUSD and USDC were supplied** — the form's three — and the fixtures and the
demo pool carry only those.

A token without a mark still falls back to a lettered disc rather than to a
trademark drawn by hand — that path is for real data arriving with a token the
asset set does not cover. It is deliberately not on any screen: the lettered
"U" for USDC read as an unfinished placeholder next to two real marks, which is
why USDC came out of the fixtures. Never redraw a mark; drop the asset into
`src/assets/tokens/` and add it to `MARKS`.

### `CopyField` — `src/components/ui/CopyField.tsx` · stable
A long machine value with the copy mark beside it. The value stays selectable,
and a blocked clipboard fails quietly rather than trapping the user.

| Prop | Values | Default |
|---|---|---|
| `size` | `md` `lg` | `md` |
| `tone` | `default` `value` | `default` |

Copying goes through `CopyButton`, and so through `useClipboard` (`src/lib/`),
as `CodePreview`'s does: both need the same quiet failure when the clipboard is
blocked.

`tone="value"` (added 2026-10-12) sets the value in `text-value`, the blue of a
value on the ledger or derived for it — the SourceTag's number.

`wrap` (added 2026-10-07) breaks a long value across lines instead of cutting
it with an ellipsis — for a value someone checks before acting on it, like an
account address before signing, where the end is the part people compare.

`md` is a value carried beside other content — an address under a name — in
monospace, where telling `l` from `1` is the whole job, at running-text size
(`type-body`, up from `type-caption` on 2026-10-07, when the owner asked for the
account address to match the tool descriptions around it). `lg` (added
2026-10-06 for the SourceTag tool) is a value that *is* the content: set in
`type-title` and the brand face, with the pair centred, because at that size
the copy action belongs to the number rather than to the far edge of a row.
It was `type-display` (40) until the client asked for the SourceTag smaller
(2026-10-13); the mark stands 4 off the figure (10 to its ink), where 12 left
it reading as a separate control.

`align="center"` (added 2026-10-08) sets the value on the centre line of its
holder with the action beside it: an invisible twin of the action stands on the
other side, so a wrapped address centres under a centred title instead of
sitting 20px left of it — the tools' account card.

**The copy action is always the mark** — `CopyButton`, in a 32px square — and
never the word (client, 2026-10-12: "replace the text Copy with the Copy icon,
app wide"). The `look` prop that chose between the two went with it. The label
stays as the button's accessible name; its tooltip reads "Copy", as every copy
mark's does (2026-10-08). At `lg` the mark grows to 20 with the figure it
belongs to.

### `PageHeader` — `src/components/ui/PageHeader.tsx` · stable
A page's title and the line under it, centred. **The page-title standard is the
directory's** (client, 2026-10-13): the title in `type-display`, 40, and the
heading white — as "Accept XRP? Apply Now" — **40** to its line, the space the
directory leaves under that title (39 to the next line's box, measured), and
**36** from the line to whatever the page puts next: the page's `gap-8` (32)
plus the header's own 4 at its foot, so the letters stand 37 above the next
block as the directory's "Need to update your listing?" stands 38 above its
card (client, 2026-10-13). It was `type-title`, 26, with 16 under it (owner,
2026-10-08).

`align="start"` (2026-10-13) sets the pair at the left, for a document read
beside a side menu — the policies, as myweb3.me sets theirs. The line then
runs ragged, not justified.

**The line is white** — the page's main description, not a note on it — held
to 672, and from `sm` its lines run the full 672 with the last one centred
(`text-justify-center`, in `styles/index.css`). A centred paragraph starts its
first line wherever that line's length leaves it: the toml builder's line
dropped its long address to the second line and began 19px in from
SourceTag's. Now every page's line starts at the measure's edge. On a phone it
is plainly centred — 343 stretched straight opens gaps between words. A
one-line lede is its own last line, so it centres.

| Prop | Values |
|---|---|
| `title` | the page's name |
| `lede` | the line under it; may carry links and a bold address |
| `measure` | `default` (672) or `wide` (768) |

`measure="wide"` (added 2026-10-12) is for a line a hair past 672 that would
otherwise leave one word alone on its second line and pull the first one apart
— Trust Lines' line from the client's Canva runs to 673. Not for long ledes:
those turn over, as they should.

Every XRPL Tools page with a written title uses it; the hub's title is the XRP
Ledger logotype instead. Added 2026-10-08, when the owner found 12 under the
title too close; the tools had each written the pair out by hand, at 12, and
the account tools then sat 24 from their content where the others sat 32. Its
`tone` went the same day, when the owner made every page's line white.

Not on the Subscriptions screen, whose title and subhead are the signed-in
app's Figma pair at 8 — a different context with its own subtitle size.

### `CopyButton` — `src/components/ui/CopyButton.tsx` · stable
The copy mark as a button: `CopyIcon` in a 32 square, brand red, turning to a
green check once copied. **The two cross-fade, both ways**
(`transition-swap`: opacity, scale and turn, 360ms on the spring ease): the
mark fades and shrinks as the check grows into its spot (client, 2026-10-12),
and two seconds on the check fades back into the mark rather than cutting
(client, 2026-10-13). They share one grid cell, so nothing shifts. Under
reduced motion they simply swap. Every copy icon is this one — `CopyField`'s values, the file
preview's whole file through `CodePreview`. **Its hover text always reads
"Copy"** (owner, 2026-10-08), in the arrowed `Tooltip` (2026-10-13; it was the
native `title`), and **lets it go once pressed**, until the pointer leaves —
the check is the answer (client, 2026-10-13); a fuller name, such as "Copy
address", is the accessible name only. Added 2026-10-08, when the preview's Copy became the mark and two copies
of the button would have drifted.

| Prop | Values |
|---|---|
| `value` | what goes on the clipboard |
| `label` | the accessible name, when it says more than "Copy" |
| `size` | `md` (16 mark, default) `lg` (20, beside a figure set large) |
| `className` | placement — it lands on the tooltip's wrapper |

### `QrDisplay` — `src/components/ui/QrDisplay.tsx` · stable
QR on a light plate — codes need a quiet zone to scan, which is also the
language's content inversion. Modules use `currentColor`, so the colour stays
on a token. Back on 2026-10-12 for the signing window's Xaman request.

`logo` (2026-10-13, the client's Canva) sets an app's mark in the middle, as
Xaman's own codes carry theirs: 22% of the code, rounded, drawn over a centre
the code clears for it, with error correction at level H to make up the loss.

### Icons — `src/components/icons/` · part generated
Import from `@/components/icons`. Behind that barrel are three files, and the
split is load-bearing:

| File | Owned by |
|---|---|
| `generated.tsx` | `scripts/build-icons.mjs`, **rewritten in full on every run** |
| `authored.tsx` | hand — glyphs with no source SVG |
| `types.ts` | `IconProps`, so neither of the two above owns it |

One `<Name>Icon` per SVG in `src/assets/icons/`, inlined by the generator. Every
glyph paints with `currentColor` and carries no width or height, so one icon
serves every tone and every control height. The whole set is on the gallery's
Icons section, read off the module — a new SVG appears there the moment the
generator runs.

**Split on 2026-10-03, after finding a live trap.** `CloseIcon`, `PlusIcon`,
`MinusIcon` and `MenuIcon` were sitting in the generated file with no source SVG
behind them. The file says "do not edit by hand" and the script's own header
tells you to re-run it after re-exporting from Figma — so the next person to do
that would have deleted all four, and `CloseIcon` is on every modal. Nothing was
wrong with authoring those glyphs; they were in a file that is discarded and
rebuilt. Now they are in one that is not.

**Two come from Phosphor, not the file** (2026-10-06): `TagIcon` and `AtIcon`,
Phosphor 2.1.1 regular, MIT, from the official `@phosphor-icons/core`
package, for XRPL Tools. The file's own globe is Phosphor (`ph:globe`), so the
set's weight matches rather than a third family arriving. Their fill sits on
the path, not the root: the generator replaces the root with its own
`fill="none"`, and a root-painted SVG comes out invisible.

**Where a new glyph goes.** If Figma has it, or it is traced artwork, it is an
SVG in `src/assets/icons/` — that is still the default, and `crown.svg` is a
generic glyph that lives there because it is a traced shape. `authored.tsx` is
for plain geometry with no counterpart in the file: a cross, a plus, a minus,
three bars, two sheets (`CopyIcon`, added 2026-10-07 for the account card),
an arrow (`ArrowLeftIcon`, the toml builder's Back, 2026-10-12), a balance
scale (`ScaleIcon`, the Trust Lines tile, as the client's Canva has it,
2026-10-12), a calendar and a chevron (`CalendarIcon`, `ChevronLeftIcon`, the
date picker's, 2026-10-13), each a few stroked lines where a traced export would be a page of
coordinates. `xrp.svg` is the official XRP mark, supplied as an asset:
**never redraw a trademark** — replace the asset and re-run the generator; do not
hand-edit the path.

Adding one: drop the SVG in `src/assets/icons/`, strip any `class`/`<style>`
styling to plain `fill` attributes, then run `node scripts/build-icons.mjs`. A
non-square export needs a `FRAME_OFFSET` entry or the generator warns and the
glyph crops.

### `Flag` — `src/components/flags/index.tsx` · generated
All 265 country flags from `country-flag-icons`, inlined by
`scripts/build-flags.mjs`. Renders `null` for an unknown code so callers can
fall back — `hasFlag()` reports which exist.

Inlining is safe because none of the source SVGs use `id`, `defs`, `use` or
`image`, so several on one page cannot collide; the generator re-checks that
and throws if it ever changes. Flag colours are the one exemption to the
raw-colour rule: they are prescribed content, not design decisions.

Props are a **union, not an optional label**: either `title` (the accessible
name) or `decorative` (hidden from assistive tech). Forgetting the label does
not compile. A flag standing alone is information, and unlabelled it is
information only sighted users get; `decorative` is for one sitting beside the
same text it would announce.

## Feature composites

Assembled from primitives for one product area. These live with their feature,
not in the design system — see `docs/architecture.md`.

### `ToolTile` — `src/features/tools/components/ToolTile.tsx` · stable
One tool on the XRPL Tools hub (T1): a glyph, a name, a line on what it is for,
and the way in.

| Prop | Values |
|---|---|
| `icon` / `title` / `description` | the tool |
| `action` | "Access", or "Connect" for a tool that signs |
| `to` | where it lives; absent while it is not built |
| `soon` | read over the greyed action while `to` is absent |

The mark sits **above** the title, for the reason `MarkCards` gives; the Canva
set its glyphs under the button, where they read as an afterthought.

**The card lights; only the button is pressed.** A live tile takes the
Canva's brand stroke under the pointer, but the pointer itself changes only
over the action, and only the action is a target — the owner's call over two
passes: 2026-10-07 took the stroke away with the whole-tile target, 2026-10-08
brought the stroke back on its own. The action is a real link, so it is what a
keyboard focuses and a screen reader names — with the tool's name added in
`sr-only`, since "Access" four times over says nothing in a list of links. A
tool not built yet keeps its tile, its action greyed under "Coming soon", and
no stroke.

`onAction` (added 2026-10-07) is an action in place of a destination — the
hub's Connect, which opens the wallet picker rather than leaving the page. It
takes the same stretched target as `to`, and the same hover stroke.

Every tools button is MyWeb3's standard size — `md`, 32 tall with a 14px label,
as Subscriptions' Subscribe is. They were `lg` and read larger than the
product around them.

**Its route is read at render, never at module load.** The route table imports
the feature, so `PATHS` is still initialising while the feature's modules run;
a module-level `PATHS.toolsSourceTag` threw and blanked the page. The hub's
tool list names each route instead (`route: 'toolsSourceTag'`) and looks it up
when it renders — the same reason the directory only touches `PATHS` inside
components.

A title keeps a file name whole: any word with a dot in it is set `nowrap`, so
"xrp-ledger.toml" never turns over at its hyphen on a narrow tile — the
client's runbook asks for it on one line (2026-10-12). The line under the title
does the same since the Canva's copy put the file name in it too.

The title is an `h3`: on the hub the tiles sit under their group's heading,
Merchants or Developers & Operators (C2, 2026-10-12).

### `TomlFields` — `src/features/tools/components/TomlFields.tsx` · stable
One section of the xrp-ledger.toml builder, laid out from its spec in
`data/toml.ts`: two columns from `sm`, `wide` fields across both.

Every choice is a `Listbox` rather than a native `Select`, for the application
form's reason — macOS ignores the brand highlight on a native list — and
countries carry flags, which only `Listbox` can draw. Every list comes from the
client's options file, `src/assets/data/myweb3-options.json` (2026-10-12) —
countries through `countriesFor(locale)` in `lib`, the rest through
`data/options.ts` — and opens on that file's empty row, `-` (`UNCHOSEN`).
That row stays in every list as the value `''` (client, 2026-10-12), so an
answer can be taken back — choosing it empties the field and takes it out of
the file.

**No field is required** (client, 2026-10-12): people publish what they choose
to. **Nor is any checked for its shape** (client, 2026-10-14): an address, a
link, an email go into the file as written, and the fields carry no errors.
What a section needs once it holds anything — a validator's public key, a
token's issuer with its currency — is its `requires` (2026-10-19): checked on
Next by `checkEntry`, and passed in as `errors`, already translated, under the
field each names. `disabled` turns the whole group off — a token's links
until it has its issuer and currency. The expiry is still held to rule 9.

A field that waits on another is **shown but disabled** until it applies
(`enabledWhen`): RAID Standard until RAID is True, Asset Subclass until there
is an asset class — the client's rules 10 and 11. It dimmed until 2026-10-12,
was hidden until 2026-10-14, and is disabled again since, at the client's ask.
A lone half-width field after wide ones can be `centred` — Accounts' Network. A field with
`heading` starts a titled group across both columns: Server Specifications.

**An empty field says its own name**, as the Canva draws them: "Name",
"Description", "Server Location". A link or a handle shows its shape instead
(`FieldSpec.example`) — `https://example.com`, `wss://` for WS, `@username`; Public Key says "Key"
(`FieldSpec.placeholder`). The format examples that stood in every field —
an address, a key, `USD`, an ASN — went on 2026-10-08, and so did the lines
of help under Attestation, Server Cloud and Network ASN, at the owner's ask.

Focus is read off the group — `onFocus` and `onBlur` bubbling to one handler,
keyed by `data-field` — so a `Listbox` popup counts as its field and no control
has to forward a ref. The builder names a step's first field itself rather than
waiting for that event: the browser's `autoFocus` fires before React listens.

### `WalletPicker` — `src/features/tools/components/WalletPicker.tsx` · stable
The Wallet window (T2; titled Select Wallet until 2026-10-13): Xaman and Joey
Wallet, each as its mark above its name, on `Modal` at `2xs`. **Choosing one
turns the window into Connect with Xaman** (client, 2026-10-14), laid out by
`useWalletRequest`: the sign-in request as a code to scan, or the button on a
phone; Joey Wallet told to confirm in its app. Closing withdraws the request;
a failure offers Try again. It had connected at once under "Opening Xaman…". `onConnected`
runs once a wallet connects (defaults to `onClose`); the page's one picker,
`WalletPickerHost`, goes there to the tool a hub tile's Connect named —
`openWalletPicker(path)` — so connecting from a tile lands on its tool
(client, 2026-10-13). The header's Connect passes no path and stays put. Hover is the mark answering in `glow-accent`, the language's
answer for artwork that must not be recoloured. While a wallet opens, both
choices hold still and a line under them reads "Opening Xaman…".

**A pair, in the narrowest window. Changed 2026-10-08, the owner's ask.** At
`xs` the two split a 480 window into columns, which held the icons 159 apart —
the window was wide only to hold the gap. Each wallet now takes a set 112, the
two sit together 64 apart in the middle, and the window is 360. The "Opening…"
line moved out of the chosen wallet's label at the same time: at 112,
"Opening Joey Wallet…" turned over onto two lines.

The marks are **each wallet's own icon**, supplied by the owner on 2026-10-08
(`src/assets/wallets/`) — lettered plates until then. Both are trademarks, shown
as given and never redrawn. Joey's file padded its icon into a 512 square while
Xaman's runs full-bleed, so Joey's viewBox is cropped to its artwork and both
take one corner radius, to read as one set. It said Demo under the stand-in
until 2026-10-07, when the owner asked for the line to go; the connection is
still a stand-in until T7.

**One per page** (2026-10-12): `ToolsShell` mounts `WalletPickerHost`, and every
Connect opens it through `openWalletPicker()` (`pickerState.ts`). Connect
Wallet moved into the header, which on a phone sits in a menu that closes as
the picker takes the pointer — a picker owned by the button closed with it.

### `SigningWindow` — `src/features/tools/components/SigningWindow.tsx` · stable
One signature, request to ledger (H5), on `Modal` at `2xs` and `QrDisplay`.
Driven by `useSigning()` in `api/wallet.ts`, which every signing screen holds:
`start(session, request)`, `retry`, `close`.

**Laid out as the client's Canva "Connect with Xaman" frame** (2026-10-13):
"Sign with Xaman", the line "Open the Xaman app and scan this QR code." as the
window's subtitle in white (`subtitleTone="default"`), the code with Xaman's
mark in its middle, and Open in Xaman as a red link under it. **No loading or status lines** — Preparing,
Waiting and Opened went at the client's ask; the code's plate holds its place,
empty, until the request exists. On a phone there is no code (a phone cannot
scan its own screen): the line says to open the request here, and Open in
Xaman is the footer button. Joey Wallet is told where to look. Cancelled or
failed, with Try again. Closing it while it waits withdraws the request.
**No Signed step** (client, 2026-10-13): once the signature lands,
`useSigning` reads the account again and closes the window — the wallet shows
the transaction and the page shows the change.

### `ToolsMenu` — `src/features/tools/components/ToolsMenu.tsx` · stable
The header's Tools menu (R13, R24 — client 2026-10-13), the last of
`ToolsShell`'s settings — **the header's far right** — on every page but the
hub, which is itself the list. **The three-bar mark, made as the language menu
is**: a `Popover` whose trigger is the language picker's box holding
`MenuIcon`, and whose `list` body is the language list — the two groups as the
hub has them (`data/tools.tsx`, which the hub reads too) under their names in
`type-micro` capitals, each tool by its tile's name with its glyph, rows on the
brand plate under the pointer, and the page you are on ticked in red as the
chosen language is, and `aria-current`. **Without a wallet, the tools that
sign are greyed out and not links** (client, 2026-10-14), as the language list
greys an option it cannot take — their pages no longer ask to connect. It was a "Tools" word before the
language menu for a day. In the phone's menu (`inMenu`) the list stands open
under Disconnect — a dropdown inside the burger's panel is one layer too
many.

### `useWalletRequest` — `src/features/tools/components/WalletRequest.tsx` · stable
A request waiting in a wallet, as a window shows it — the one layout for
signing in (the Wallet window's Connect with Xaman) and for signing (the
signing window), as the client's Canva draws them (2026-10-13 and 14). Returns
the window's subtitle, body and footer for the caller's `Modal`: for Xaman from
`sm`, "Open the Xaman app and scan this QR code." and the request as a code
with Xaman's mark, Open in Xaman as a red link under it (the plate empty while
the request is made); on a phone, a line to open the request here and Open in
Xaman as the footer button; for Joey Wallet, the caller's `confirm` line.

### `WalletButton` — `src/features/tools/components/WalletButton.tsx` · stable
The wallet in the header (C1, client 2026-10-12), passed to `SiteShell` as a
setting by `ToolsShell`. A primary pill:

- **Not connected** — Connect Wallet, opening the Wallet window.
- **Connected** — the address's first and last four characters (`shortAddress`
  in `lib`). Under the pointer or keyboard focus it reads Disconnect with
  `LogoutIcon`; both labels share one grid cell, one hidden, so the pill keeps
  its width as it changes. The whole address is its hover text, in the arrowed
  `Tooltip` on the left (2026-10-13; it was the native `title`).
- **In the phone's menu** (`inMenu`) — no hover on touch, and a pill that
  disconnected on the first tap would do it unasked: the address as a line,
  and Disconnect as its own full-width button.

`session` holds it in one state for the gallery. Replaced `AccountCard`, which
showed the account on the hub and above the account tools until the header
took it over.

### `AccountSettingTool` — `src/features/tools/components/AccountSettingTool.tsx` · stable
One account field, set or removed — Set Domain and Set EmailHash are this with
different words, so a waiting signature looks the same in both.

Any help on finding the value first — above the card, as the client's Canva
has it (2026-10-12) — then **one card** (client, 2026-10-14): the field and Set
(live once there is text; the value normalised before it is sent, with a
message when it cannot be), and under a hairline the current value, **always
there**: its title a step below the card's, the value in `text-value` with
Remove, or Not set. It was two cards; merged rather than left as bare text, so
the value and Remove keep a calm surface over the page's moving background. The value is never a link. Set and Remove hand on to the screen's
`SigningWindow`, which covers the page while it runs. **Remove asks first**
(2026-10-12): `removeTitle` and `removeConfirm` name what goes, with Remove in
the critical red. `autoFocus` puts
the cursor in the field, as the Canva asks; the gallery turns it off, since
three on one page would each pull the page to themselves.

**Both cards are SourceTag's Domain box: 360, the field filling it** (owner,
2026-10-08). With `mono` the field is untracked, so a whole 32-character hash
fits it: the scale's +0.02em is Titillium's letterfit, and on monospace it
only widened the cells — 3px past the field, hiding the first character.

`AccountToolFrame` is the page around it: the title and line, then the tool —
or, with no wallet, a way to connect, because an address can be bookmarked,
shared or reloaded. **Disconnecting on the page goes to the hub** (C11,
2026-10-12). `grow` centres the tool in the height between the title and the
footer (Trust Lines); `measure` is passed to `PageHeader`.

## App chrome — `src/components/layout/`

### `SiteShell` — stable
The frame of a public product site: the lockup and the settings, then the page,
then the credit line. `DirectoryShell` and the tools' `ToolsShell` are each
this plus a lockup; the directory adds its currency and rate through
`settings`.

| Prop | Values |
|---|---|
| `lockup` | the product's lockup, drawn as a picture only |
| `brand` | its accessible name — a logo is not translated, so the name travels separately |
| `home` | where the lockup leads |
| `rights` | the footer's ownership line, already translated |
| `links` | `{ to, label }[]` — the product's own pages linked from the footer, already translated: the tools' Privacy and Cookies policies (2026-10-12) |
| `settings` | `(stacked) => ReactNode` — controls after the language picker; `stacked` when they sit in the phone's menu |
| `fill` / `wide` / `bare` | as the directory had them: one viewport tall, the nav's measure, no chrome at all |
| `grow` | the content becomes a column filling the height between header and footer, so a page can place parts of itself in it — the tools hub keeps its title on top and centres its tools below. Added 2026-10-07 as `center`, which carried the title down with the tools; reworked 2026-10-08 |

Added 2026-10-06 by lifting the directory's chrome out of `DirectoryShell`,
when XRPL Tools needed the same frame under a different lockup. The header had
been measured against myweb3.me's nav once already; a second copy would have
had to be measured again, and would then have drifted. Verified as a pure
move — the directory's header and footer markup hashed identical before and
after on home, apply and search at 375 and 1440, with the phone's Settings
menu open as well as shut, and the map still renders bare at both widths.

Its positions, measured against myweb3.me's at four widths, are in
`docs/header-positions.md` — the scrollbar's room is kept and the bar is thin,
as theirs, so the logo lands on theirs.

Not `Header`, which is the signed-in MyWeb3 app's bar with nav and a profile
chip. Like `Header` it is not in the gallery: chrome needs a whole page to mean
anything, and every screen that uses it is already a page.

