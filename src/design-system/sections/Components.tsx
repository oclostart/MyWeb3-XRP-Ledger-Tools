import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Section, Row } from '../Section'
import { SettingsIcon, LocationIcon, MenuIcon, SearchIcon } from '@/components/icons'
import {
  Button,
  buttonVariants,
  Input,
  Field,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  Modal,
  Tooltip,
  Listbox,
  Popover,
  Stepper,
  DatePicker,
  GatewayFlow,
  TopologyField,
  ParticlesField,
  CodePreview,
  PageHeader,
  TokenChip,
  CopyField,
  CopyButton,
  type ListboxOption,
} from '@/components/ui'

const VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'link', 'critical'] as const
const SIZES = ['sm', 'md', 'lg'] as const

const EyeOff = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" />
    <path d="M6.5 6.6C4.6 7.9 3.917 9.5 2.5 12c1.5 3 5 6 9.5 6 1.7 0 3.2-.4 4.5-1.1M17.9 15c1.4-1 2.4-2 3.1-3-1.5-3-5-6-9.5-6-.6 0-1.2.05-1.7.15" strokeLinecap="round" />
  </svg>
)

const FLAG_OPTIONS: ReadonlyArray<ListboxOption<'US' | 'CN' | 'JP' | 'ES'>> = [
  { value: 'US', label: 'English', flag: 'US' },
  { value: 'CN', label: '简体中文', flag: 'CN' },
  { value: 'JP', label: '日本語', flag: 'JP' },
  { value: 'ES', label: 'Español', flag: 'ES' },
]

export function Components() {
  const [flagValue, setFlagValue] = useState<(typeof FLAG_OPTIONS)[number]['value']>('US')
  const [modal, setModal] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [fit, setFit] = useState(false)
  const [step, setStep] = useState(1)
  const [date, setDate] = useState('')
  const flowTarget = useRef<HTMLSpanElement>(null)
  return (
    <>
      <Section
        title="Button"
        note="Every variant crossed with every size and state. If a state is missing here, it is untested — that is the point of the grid."
      >
        {VARIANTS.map((variant) => (
          <Row key={variant} label={variant}>
            {SIZES.map((size) => (
              <Button key={size} variant={variant} size={size}>
                Subscribe
              </Button>
            ))}
            <Button variant={variant} disabled>
              Disabled
            </Button>
          </Row>
        ))}
        <Row label="full">
          <Button full>Full width</Button>
        </Row>
        {/* The floor: a short label stands as wide as a four-letter one, so
            Set and OK do not look pinched beside Done. */}
        <Row label="min width (4 letters)">
          {SIZES.map((size) => (
            <Button key={size} size={size}>
              OK
            </Button>
          ))}
          <Button>Set</Button>
          <Button>Done</Button>
        </Row>
        {/* `link` exists for icon-only actions, which is where a plate would
            read as chrome around nothing. The label moves to `title` and
            `aria-label` — an icon with neither is a button nobody can name. */}
        <Row label="link, icon-only">
          <Button
            variant="link"
            size="icon"
            title="Use my location"
            aria-label="Use my location"
          >
            <LocationIcon />
          </Button>
          <Button variant="link" size="icon" title="Settings" aria-label="Settings">
            <SettingsIcon />
          </Button>
          <Button variant="link" size="icon" disabled title="Working" aria-label="Working">
            <LocationIcon />
          </Button>
        </Row>
        {/* `buttonVariants` on a link: navigation stays a real `<a>`, so
            middle-click and open-in-new-tab still work. The XRPL Tools hub
            tiles are where it is used. */}
        <Row label="buttonVariants on a link">
          <Link to="/" className={buttonVariants({ size: 'lg' })}>
            Access
          </Link>
          <Link to="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Outline link
          </Link>
        </Row>
        {/* Shown against a real field, because that is the only reason the
            square shape exists — matching the radius of the thing beside it. */}
        <Row label="shape=square">
          <span className="flex items-center gap-3">
            <span className="w-40">
              <Input size="xl" placeholder="Search" />
            </span>
            <Button variant="outline" size="xl" shape="square">
              Use my location
            </Button>
          </span>
          <Button shape="square">Primary</Button>
        </Row>
      </Section>

      <Section title="Input & Field">
        <Row label="default">
          <Input placeholder="Current Password" className="max-w-xs" />
        </Row>
        <Row label="trailing">
          <Input placeholder="New Password" type="password" trailing={<EyeOff />} className="max-w-xs" />
        </Row>
        {/* The slots are inert so a click near a glyph still focuses the
            field — but a button inside takes its events back. This is the row
            that proves it: the pin is clickable, the eye above is not. */}
        <Row label="trailing action">
          <Input
            size="xl"
            placeholder="Merchant, State, City, Zip Code, or Address"
            leading={<SearchIcon />}
            trailing={
              <Button
                variant="link"
                size="icon"
                title="Use my location"
                aria-label="Use my location"
              >
                <LocationIcon />
              </Button>
            }
          />
        </Row>
        <Row label="invalid">
          <Input defaultValue="Bad value" invalid className="max-w-xs" />
        </Row>
        <Row label="disabled">
          <Input placeholder="Disabled" disabled className="max-w-xs" />
        </Row>
        <Row label="field">
          <Field label="Confirm New Password" hint="Minimum 12 characters." className="max-w-xs">
            <Input placeholder="Confirm Password" trailing={<EyeOff />} />
          </Field>
        </Row>
        <Row label="field error">
          <Field label="Current Password" error="That password is incorrect." className="max-w-xs">
            <Input defaultValue="hunter2" />
          </Field>
        </Row>
      </Section>

      <Section
        title="Listbox"
        note="A listbox, not a styled <select> — a native <option> holds text only, so a flag inside one is impossible. Reach for Select unless the options genuinely need a mark. Full keyboard: arrows, Home/End, type-ahead, Escape. `checked` ticks several options for a list that adds and removes, and `unavailable` dims ones that cannot be picked yet — CategoryPicker's sub-categories, below, at three picks."
      >
        <Row label="closed">
          <Listbox
            label="Language"
            options={FLAG_OPTIONS}
            value={flagValue}
            onChange={setFlagValue}
          />
          <span className="type-caption text-text-subtle">selected: {flagValue}</span>
        </Row>
        <Row label="disabled">
          {/* Shown, at half strength, until it applies — the toml's RAID
              Standard until RAID is True. As a disabled Input. */}
          <Listbox label="RAID Standard" options={[{ value: '', label: '-' }]} value="" onChange={() => {}} disabled className="w-60" />
        </Row>
      </Section>

      <Section
        title="Stepper"
        note="Where someone is in a long errand. Done in brand red, current in white, the rest grey; labels alternate above and below so eight fit a form column. Below md the labels give way to one summary line — narrow the window to see it."
      >
        <Row label="first step">
          <Stepper
            label="Steps"
            current={0}
            summary="Step 1 of 5 · Contacts"
            steps={[{ label: 'Contacts' }, { label: 'Accounts' }, { label: 'Servers' }, { label: 'Expiry' }, { label: 'Preview' }]}
          />
        </Row>
        <Row label="midway, counts">
          <Stepper
            label="Steps"
            current={2}
            summary="Step 3 of 5 · Servers"
            steps={[{ label: 'Contacts', count: 2 }, { label: 'Accounts', count: 1 }, { label: 'Servers' }, { label: 'Expiry' }, { label: 'Preview' }]}
          />
        </Row>
        <Row label="last step">
          <Stepper
            label="Steps"
            current={4}
            summary="Step 5 of 5 · Preview"
            steps={[{ label: 'Contacts', count: 2 }, { label: 'Accounts', count: 1 }, { label: 'Servers' }, { label: 'Expiry' }, { label: 'Preview' }]}
          />
        </Row>
        <Row label="onSelect — press a step">
          <Stepper
            label="Steps"
            current={step}
            summary={`Step ${step + 1} of 5`}
            steps={[{ label: 'Contacts' }, { label: 'Accounts' }, { label: 'Servers' }, { label: 'Expiry' }, { label: 'Preview' }]}
            onSelect={setStep}
          />
        </Row>
      </Section>

      <Section
        title="GatewayFlow"
        note="Lines sweeping in from both edges and meeting at one point — the tools hub's background, meeting behind the XRP Ledger logo, which stands on a soft shadow of the page's black. target is the element to meet at, followed as it moves. Click anywhere: a ring spreads from the pointer and pushes the lights aside. Under reduced motion the lines are drawn once and the lights hold still."
      >
        <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-border">
          <GatewayFlow target={flowTarget} split={16} className="absolute inset-0 size-full opacity-40" />
          <span ref={flowTarget} className="relative type-label text-text">target</span>
        </div>
      </Section>

      <Section
        title="TopologyField"
        note="A slowly turning sphere of points and the lines between them — the developer tools' background (SourceTag, xrp-ledger.toml), fixed under the page on the right at a fifth of its strength. Shown at full strength and as those pages set it."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative h-80 overflow-hidden rounded-2xl border border-border">
            <TopologyField className="absolute inset-0 size-full" />
          </div>
          <div className="relative h-80 overflow-hidden rounded-2xl border border-border">
            <TopologyField anchor={{ x: 0.92, y: 0.5 }} scale={0.78} className="absolute inset-0 size-full opacity-20" />
          </div>
        </div>
      </Section>

      <Section
        title="ParticlesField"
        note="Drifting points joined by lines when near, reaching for the pointer and multiplying on a click — the merchant tools' background (Trust Lines, Domain, EmailHash), fixed under the page at 30%. Move and click anywhere."
      >
        <div className="relative h-80 overflow-hidden rounded-2xl border border-border">
          <ParticlesField className="absolute inset-0 size-full opacity-30" />
        </div>
      </Section>

      <Section
        title="DatePicker"
        note="A date from a calendar in the system's look, not the browser's: the language menu's field with a calendar mark, and its list's panel holding the month — the chosen day on the brand plate, today ringed, days before min shown but off. Arrows, Page Up/Down, Home/End, Enter, Escape."
      >
        <div className="max-w-(--container-field)">
          <Field label="Expiration Date">
            <DatePicker value={date} onChange={setDate} min="2026-10-14" placeholder="Select a date" />
          </Field>
        </div>
      </Section>

      <Section
        title="CodePreview"
        note="A file as it will be written: its name centred, the copy mark at the right. The panel draws code; colouring is the caller's, by what each piece is — the builder's keys are blue. Long lines scroll rather than wrap — a wrap would show a line break the file does not have."
      >
        <CodePreview
          title="example.toml"
          text={'[METADATA]\nmodified = 2027-01-15T00:00:00.000Z\n\n[[ACCOUNTS]]\naddress = "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"\n'}
          lines={[
            <span key="t" className="text-accent-text">[METADATA]</span>,
            <span key="m"><span className="text-code-key">modified</span><span className="text-text-subtle"> = </span><span className="text-text">2027-01-15T00:00:00.000Z</span></span>,
            '',
            <span key="a" className="text-accent-text">[[ACCOUNTS]]</span>,
            <span key="d"><span className="text-code-key">address</span><span className="text-text-subtle"> = </span><span className="text-positive">"rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"</span></span>,
          ]}
        />
      </Section>

      <Section
        title="Popover"
        note="A button that discloses a panel of controls beneath itself — disclosure semantics, not a menu, because what goes inside owns its own keyboard. The directory's header folds its language, currency and rate into one below sm. Dismisses on an outside press, on focus leaving, and on Escape — and Escape peels one layer at a time, so a dropdown inside closes before the panel does."
      >
        <Row label="align end">
          <Popover label="Settings" trigger={<MenuIcon />}>
            <Listbox
              label="Language"
              options={FLAG_OPTIONS}
              value={flagValue}
              onChange={setFlagValue}
              className="w-full"
            />
            <p className="text-center type-label text-text">XRP = $5.89</p>
          </Popover>
        </Row>
        <Row label="align start">
          <Popover label="Settings" trigger={<MenuIcon />} align="start">
            <p className="type-body text-text">Hangs from the left edge instead.</p>
          </Popover>
        </Row>
        <Row label="body list">
          <Popover label="Tools" trigger={<MenuIcon />} body="list" align="start">
            <p className="rounded-md py-2 pr-2 pl-3 type-body text-text">The language menu's own list — the tools' Tools menu.</p>
          </Popover>
        </Row>
      </Section>

      <Section
        title="Modal"
        note="The dominant composition in this product — almost nothing happens on a full page. Red title, muted subtitle, centred footer action, blurred backdrop."
      >
        <Row label="open">
          <Button onClick={() => setModal(true)}>Open modal</Button>
          <Modal
            open={modal}
            onClose={() => setModal(false)}
            title="My Account"
            subtitle="Account Details & Preferences"
            footer={<Button variant="secondary">Save</Button>}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Username">
                <Input defaultValue="@oclostart" />
              </Field>
              <Field label="Name">
                <Input placeholder="Name" />
              </Field>
            </div>
          </Modal>
        </Row>
        <Row label='size="2xs"'>
          {/* The narrowest window: one short answer. Select Wallet is this
              size; its longest title, Spanish's, sets the floor. */}
          <Button variant="secondary" onClick={() => setNarrow(true)}>Open 2xs</Button>
          <Modal open={narrow} onClose={() => setNarrow(false)} title="Selecciona una billetera" size="2xs">
            <p className="text-center type-body text-text-muted">360 wide. The title clears the close button with 7 to spare.</p>
          </Modal>
        </Row>
        <Row label='size="fit"'>
          {/* As wide as its content: a one-line question stays one line, from
              2xs to sm. The toml's Reset window is this size. */}
          <Button variant="secondary" onClick={() => setFit(true)}>Open fit</Button>
          <Modal
            open={fit}
            onClose={() => setFit(false)}
            title="xrp-ledger.toml"
            size="fit"
            footer={<Button variant="critical" onClick={() => setFit(false)}>Reset</Button>}
          >
            <p className="text-center type-body text-text">Are you sure you want to clear the xrp-ledger.toml?</p>
          </Modal>
        </Row>
      </Section>

      <Section
        title="PageHeader"
        note="The page-title standard, the directory's: the title at type-display (40), 40 to its line, then 36 from the line to the page. The line is white — the page's main description — and from sm its lines run the full measure with the last centred, so every page's line starts in the same place. align=start sets the pair left, for a document beside a side menu."
      >
        <div className="flex flex-col gap-10">
          <div className="flex flex-col items-center gap-8 rounded-2xl border border-border p-6">
            <PageHeader
              title="Domain"
              lede="Link your XRPL account to your website. Pair it with an xrp-ledger.toml to verify ownership."
            />
            <div className="h-16 w-full max-w-(--container-modal-2xs) rounded-xl border border-dashed border-border-strong" />
          </div>
          <PageHeader
            title="SourceTag"
            lede="Derive a consistent SourceTag from your domain. Your domain is normalized and hashed with SHA-256, then the first 4 bytes are converted to your SourceTag."
          />
          {/* `measure="wide"`: a line a hair past 672 stays on one line rather
              than leaving its last word alone on a second. */}
          <PageHeader
            title="Trust Lines · measure=wide"
            measure="wide"
            lede="Want to send and receive stablecoins backed 1:1 by the US dollar? Add these trust lines to your XRP Ledger account."
          />
          <PageHeader title="Privacy Policy" lede="Last Updated: October 25, 2026" align="start" />
        </div>
      </Section>

      <Section
        title="Tooltip"
        note="Every hover text: a see-through black bubble (85%) with white text and an arrow, as MyWeb3's. The platform's rule: above what it names, always, unless the screen has no room above — only then below; never to the side. It measures as it opens — scroll a button to the top of the window to see it turn over — and slides in from the screen's sides with the arrow kept on the control. Drawn on the page itself, so no clipping box cuts it off. Shown on hover and keyboard focus, never left behind by a click. Never the browser's own title."
      >
        <Row label="hover each">
          <Tooltip label="Coming Soon!">
            <Button variant="secondary" disabled>Coming soon</Button>
          </Tooltip>
          <Tooltip label="rasda7ad71d1877827d171jv3kj2jkkvj1z">
            <Button variant="secondary">Long label</Button>
          </Tooltip>
        </Row>
        <Row label="at an edge">
          {/* Against the row's right end: centred over it, the bubble would
              pass the screen's edge, so it slides in and the arrow stays. */}
          <span className="flex w-full justify-end">
            <Tooltip label="Slides in from the screen's edge">
              <Button variant="secondary">Edge</Button>
            </Tooltip>
          </span>
        </Row>
      </Section>

      <Section title="Card">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Generate SourceTag</CardTitle>
            <CardDescription>Derive a consistent SourceTag from your domain.</CardDescription>
          </CardHeader>
          <CardBody>
            <Button>Access</Button>
          </CardBody>
        </Card>

        {/* `raised` against a `surface` ground, which is the only place the
            variant means anything — on `canvas` the two are near enough that
            the hairline does all the work either way. */}
        <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border-strong bg-surface p-6">
          <p className="type-label text-text">Card · raised, inside a card</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {['RLUSD', 'USDC'].map((label) => (
              <li key={label} className="flex">
                <Card raised className="flex flex-1 flex-col items-center gap-3 p-5 text-center">
                  <span className="type-label text-text">{label}</span>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section
        title="TokenChip"
        note="Two readings of the same thing. Solid marks acceptance by fill, for a full list where some are not accepted. Outline is a neutral container, for a list that is already only what the merchant takes — where a highlight would say nothing. Mark is the supplied coin disc; decorative is that disc with its name already set beside it."
      >
        <Row label="solid">
          <TokenChip token="XRP" accepted />
          <TokenChip token="RLUSD" />
          <TokenChip token="USDC" />
        </Row>
        <Row label="outline">
          {['XRP', 'RLUSD', 'USDC'].map((tk) => (
            <TokenChip key={tk} token={tk} variant="outline" />
          ))}
        </Row>
        <Row label="mark">
          {['XRP', 'RLUSD', 'USDC'].map((tk) => (
            <TokenChip key={tk} token={tk} variant="mark" />
          ))}
          {/* The lettered fallback, for a ticker with no supplied mark. The
              form's three all have one, so no listing shows this; it is for
              whatever the API sends that the form never offered, which lands
              here rather than being redrawn by hand. */}
          <TokenChip token="AAA" variant="mark" />
        </Row>
        {/* No tooltip, no accessible name, and no hover glow — the ticker is
            set right beside the coin, and on the application form the coin is
            not the control. Hover both rows to see the difference. */}
        <Row label="mark, decorative">
          {['XRP', 'RLUSD', 'USDC', 'AAA'].map((tk) => (
            <span key={tk} className="flex flex-col items-center gap-2">
              <TokenChip token={tk} variant="mark" decorative />
              <span className="type-label-sm text-text">{tk}</span>
            </span>
          ))}
        </Row>
      </Section>

      <Section title="CopyField" note="The value stays selectable — the copy mark is a shortcut, not the only route. `lg` is for a value that is the answer itself, set at title size with the mark close by. `tone=value` sets it in the ledger-value blue. The word Copy is gone app-wide: the mark is the one copy affordance.">
        <Row label="wallet address">
          <CopyField value="r3CrhDk9y9HR5uBkogRHu8hS1B4Q7dv3q8" label="Copy address" className="max-w-sm" />
        </Row>
        <Row label="size=lg">
          <CopyField size="lg" value="2357011303" label="Copy SourceTag" />
        </Row>
        <Row label="size=lg tone=value">
          <CopyField size="lg" tone="value" value="3970545284" label="Copy SourceTag" />
        </Row>
        <Row label="wrap, narrow, centred">
          <CopyField wrap align="center" value="rasda7ad71d1877827d171jv3kj2jkkvj1z" className="max-w-48" />
        </Row>
      </Section>

      <Section title="CopyButton" note="The one copy mark, on its own: brand red, cross-fading into a green check once copied and fading back two seconds on, and the tooltip Copy wherever it stands. CopyField and CodePreview's header both draw it.">
        <Row label="default (press it)">
          <CopyButton value="r3CrhDk9y9HR5uBkogRHu8hS1B4Q7dv3q8" label="Copy address" />
        </Row>
      </Section>
    </>
  )
}
