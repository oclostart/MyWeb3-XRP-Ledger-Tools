import { useEffect, useRef, type RefObject } from 'react'
import { cn } from '@/lib/cn'

export interface GatewayFlowProps {
  /**
   * The element whose centre the lines meet at — the tools hub's XRP Ledger
   * logo. Followed as it moves, so the lines stay on it while the page
   * scrolls. Without one they meet at the canvas's middle.
   */
  target?: RefObject<HTMLElement | null>
  /** How many lines; half come in from the left edge, half from the right. */
  paths?: number
  /**
   * Splits the meeting point in two, one beside each end of the target, this
   * many pixels outside it: the left lines meet just before its left edge,
   * the right lines just past its right edge, and nothing meets behind it.
   * The hub's is `16`, either side of the XRP Ledger logo's mark and name
   * (client, 2026-10-14, from a marked-up screenshot). Absent, or without a
   * target, the lines meet at its centre.
   */
  split?: number
  /** Placement and strength — the hub sets it fixed under the page. */
  className?: string
}

type Path = { left: boolean; start: number; t: number; speed: number }
/** A click's ring, spreading from where it landed and fading as it goes. */
type Burst = { x: number; y: number; radius: number; life: number }

/** A point on a cubic Bézier at `t`. */
function bezier(t: number, a: number, b: number, c: number, d: number) {
  const u = 1 - t
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d
}

/**
 * Lines that sweep in from both edges of the window and meet — the "Gateway
 * Flow" the client chose for the tools hub (2026-10-13). On the hub the
 * meeting point is split in two, one just outside each end of the XRP Ledger
 * logo, so the lines meet the logo's ends and nothing converges behind it
 * (`split`, 2026-10-14).
 *
 * **Drawn here, not embedded.** The supplied component ran the effect's whole
 * demo page — a sign-in card, GSAP, Tailwind, Google Fonts and stock photos
 * from other hosts — in an iframe, and kept only its canvas. This is that
 * canvas on its own, with the original's numbers: 80 lines, alternating left
 * and right, starting spread over 1.4 of the window's height; each a cubic
 * curve whose first handle stands half-way to the meeting point at its own
 * height and whose second stands 80% of the way at the point's height, so the
 * lines run level from the edge and turn in late; drawn dotted (1 on, 4 off),
 * 1.2 wide, at 35%. One square light, 3 across at 70%, rides each line at its
 * own pace and, arriving, starts again — the line's start shifting a few
 * pixels each time, so the field never quite repeats. (The hub carried the
 * XRP symbol in place of the squares for a day; the client went back to the
 * squares, 2026-10-14.)
 *
 * **A click sends a ring out** (client, 2026-10-13: "the interaction should
 * also be there"): from wherever the pointer lands, anywhere on the page, a
 * ring spreads 15 a frame and fades over about a second, and the lights within
 * 120 of it are pushed outward — up to 80, most at the ring itself — then
 * fall back onto their lines. The lines hold still; only the lights move, as
 * in the original. The canvas still takes no pointer: the click goes on to
 * whatever was pressed.
 *
 * Its colour is the canvas's own `color`, a text token, with strength through
 * `globalAlpha`; under reduced motion the lines are drawn once, the lights
 * hold still and a click sends nothing. No pointer, hidden from assistive
 * tech.
 */
export function GatewayFlow({ target, paths: count = 80, split, className }: GatewayFlowProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const ink = getComputedStyle(canvas).color
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    resize()

    const paths: Path[] = Array.from({ length: count }, (_, i) => ({
      left: i % 2 === 0,
      start: (i / count) * 1.4 - 0.2, // as a fraction of the height
      t: Math.random(),
      speed: 0.0015 + Math.random() * 0.002,
    }))

    let bursts: Burst[] = []
    const onClick = (e: MouseEvent) => {
      const frame = canvas.getBoundingClientRect()
      bursts.push({ x: e.clientX - frame.left, y: e.clientY - frame.top, radius: 0, life: 1 })
    }

    /**
     * Where each side's lines meet, in the canvas's own coordinates: one point
     * for both — the target's centre — or, split, one beside each of its ends.
     */
    const meeting = () => {
      const el = target?.current
      if (!el) return { left: width / 2, right: width / 2, y: height / 2 }
      const box = el.getBoundingClientRect()
      const frame = canvas.getBoundingClientRect()
      const centre = box.left + box.width / 2 - frame.left
      return {
        left: split === undefined ? centre : box.left - frame.left - split,
        right: split === undefined ? centre : box.right - frame.left + split,
        y: box.top + box.height / 2 - frame.top,
      }
    }

    const draw = (step: number) => {
      ctx.clearRect(0, 0, width, height)
      for (const burst of bursts) {
        burst.radius += 15 * step
        burst.life -= 0.015 * step
      }
      bursts = bursts.filter((burst) => burst.life > 0)
      const meet = meeting()
      const cy = meet.y
      ctx.strokeStyle = ink
      ctx.fillStyle = ink
      ctx.lineWidth = 1.2
      ctx.setLineDash([1, 4])

      for (const path of paths) {
        const edge = path.left ? 0 : width
        const y0 = path.start * height
        // Its own side's meeting point.
        const cx = path.left ? meet.left : meet.right
        // The handles stand half-way and 80% of the way in from the line's
        // own edge toward the meeting point, as the original's do.
        const x1 = edge + (cx - edge) * 0.5
        const x2 = edge + (cx - edge) * 0.8

        ctx.globalAlpha = 0.35
        ctx.beginPath()
        ctx.moveTo(edge, y0)
        ctx.bezierCurveTo(x1, y0, x2, cy, cx, cy)
        ctx.stroke()

        if (step > 0) {
          path.t += path.speed * step
          if (path.t > 1) {
            path.t = 0
            path.start += ((Math.random() - 0.5) * 10) / height
          }
        }
        let x = bezier(path.t, edge, x1, x2, cx)
        let y = bezier(path.t, y0, y0, cy, cy)
        // Pushed out by any ring passing: hardest at the ring, nothing 120
        // either side of it, weaker as the ring fades.
        let pushX = 0
        let pushY = 0
        for (const burst of bursts) {
          const dx = x - burst.x
          const dy = y - burst.y
          const distance = Math.hypot(dx, dy)
          if (distance > 0 && Math.abs(distance - burst.radius) < 120) {
            const force = (1 - Math.abs(distance - burst.radius) / 120) * burst.life
            pushX += (dx / distance) * force * 80
            pushY += (dy / distance) * force * 80
          }
        }
        x += pushX
        y += pushY
        ctx.globalAlpha = 0.7
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
      }
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    const observer = new ResizeObserver(() => {
      resize()
      if (still) draw(0)
    })
    observer.observe(canvas)

    if (still) {
      draw(0)
      const redraw = () => draw(0)
      window.addEventListener('scroll', redraw, { passive: true })
      return () => {
        observer.disconnect()
        window.removeEventListener('scroll', redraw)
      }
    }

    window.addEventListener('click', onClick)

    // Paced in the original's frames — it moved its lights once a frame at
    // 60 a second — so a 120Hz screen does not run them twice as fast.
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const step = Math.min((now - last) / (1000 / 60), 4)
      last = now
      draw(step)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('click', onClick)
    }
  }, [target, count, split])

  return <canvas ref={ref} aria-hidden className={cn('pointer-events-none text-text', className)} />
}
