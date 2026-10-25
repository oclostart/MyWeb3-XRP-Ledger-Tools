import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Sits the card one step up the elevation scale, on `surface-raised`.
   *
   * For a card inside a card. On `surface` the two grounds are the same
   * colour and only the hairline tells them apart, which reads as a drawing
   * mistake rather than as a stack.
   */
  raised?: boolean
}

/** 12px radius, filled surface, hairline border — the file's panel treatment. */
export function Card({ className, raised, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'border border-border rounded-2xl',
        raised ? 'bg-surface-raised' : 'bg-surface',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-2 p-5 pb-0', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('type-heading text-text', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('type-subhead text-accent-text', className)} {...props} />
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}
