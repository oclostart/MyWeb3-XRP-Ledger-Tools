import type { ReactNode } from 'react'

export function Section({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="text-xl font-semibold text-text">{title}</h2>
      {note && <p className="mt-1 max-w-2xl text-sm text-text-muted">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-2 border-b border-border py-4 last:border-0 sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-4">
      <code className="text-xs text-text-subtle">{label}</code>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}
