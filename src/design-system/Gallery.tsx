import { Foundations } from './sections/Foundations'
import { Typography } from './sections/Typography'
import { Icons } from './sections/Icons'
import { Components } from './sections/Components'
import { Tools } from './sections/Tools'

/**
 * The kitchen sink — every token and every component variant on one page.
 *
 * This is the working surface for design iteration. Change a component here,
 * see it in every state at once, and know the whole app moved with it.
 * A component that is not represented on this page does not exist.
 */
export function Gallery() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <header className="pb-10">
          <p className="type-micro uppercase text-accent-text">MyWeb3.me</p>
          <h1 className="mt-2 type-title text-text">Design System</h1>
          <p className="mt-3 max-w-xl type-body text-text-muted">
            The single source of truth for the visual language. Screens compose
            from these components — they never invent their own.
          </p>
        </header>

        <div className="flex flex-col gap-12">
          <Foundations />
          <Typography />
          <Icons />
          <Components />
          <Tools />
        </div>
      </div>
    </div>
  )
}
