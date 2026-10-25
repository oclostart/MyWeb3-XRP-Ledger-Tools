import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

export interface ParticlesFieldProps {
  /** Placement and strength — the merchant tools set it fixed under the page. */
  className?: string
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  /** Radius now, the most it grows to, and which way it is going. */
  r: number
  rMax: number
  rGrowing: boolean
  /** Strength now, the most it reaches, and which way it is going. */
  a: number
  aMax: number
  aGrowing: boolean
}

/** particles.js's numbers, as the client's component sets them. */
const PER_AREA = 140 / 800 // 140 for every 800 thousand square pixels
const SIZE = 3
const SIZE_MIN = 1
const SIZE_SPEED = 2
const OPACITY = 0.7
const OPACITY_MIN = 0.3
const OPACITY_SPEED = 1
const SPEED = 2
const LINK = 160
const LINK_OPACITY = 0.4
const LINK_WIDTH = 1.2
const GRAB = 220
const GRAB_OPACITY = 0.8
const PUSH = 4
/** Clicks add particles; past this many they stop, so a busy visitor cannot slow the page. */
const LIMIT = 320

function spawn(width: number, height: number, x?: number, y?: number): Particle {
  const rMax = Math.random() * SIZE
  const aMax = Math.random() * OPACITY
  // particles.js: a random heading, then each component scaled at random.
  return {
    x: x ?? Math.random() * width,
    y: y ?? Math.random() * height,
    vx: (Math.random() - 0.5) * Math.random(),
    vy: (Math.random() - 0.5) * Math.random(),
    r: Math.max(rMax * Math.random(), 0.5),
    rMax: Math.max(rMax, SIZE_MIN),
    rGrowing: Math.random() > 0.5,
    a: Math.max(aMax * Math.random(), OPACITY_MIN),
    aMax: Math.max(aMax, OPACITY_MIN),
    aGrowing: Math.random() > 0.5,
  }
}

/**
 * Drifting points joined by lines when they come near, reaching for the
 * pointer and multiplying on a click — the "Particles BG" the client chose for
 * the merchant tools' pages (2026-10-14).
 *
 * **Drawn here, not loaded.** The supplied component fetched particles.js
 * (2015) from a CDN at run time and coloured it cyan. This draws the same field
 * on one canvas with the component's own settings: 140 points for every 800
 * thousand square pixels; radii up to 3 and strength up to 70%, each breathing
 * between its own floor and ceiling; drifting at random up to a pixel a frame
 * and bouncing off the edges; points within 160 joined by a 1.2 line that
 * fades with distance from 40%. **Under the pointer, every point within 220
 * reaches for it** with a line up to 80% ("grab"), and **a click adds four
 * points** where it lands ("push"), up to 320 in all.
 *
 * Its colour is the canvas's own `color`, a text token, through `globalAlpha`
 * — the brand's white rather than the source's cyan. The canvas takes no
 * pointer; it follows the pointer over the whole window, so a click still
 * lands on what was pressed. Under reduced motion it draws once, holds still
 * and answers nothing. Hidden from assistive tech.
 */
export function ParticlesField({ className }: ParticlesFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const ink = getComputedStyle(canvas).color
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let particles: Particle[] = []
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      const want = Math.round(((width * height) / 1000) * PER_AREA)
      if (particles.length < want) particles.push(...Array.from({ length: want - particles.length }, () => spawn(width, height)))
      else particles = particles.slice(0, Math.max(want, 0))
    }
    resize()

    let pointer: { x: number; y: number } | null = null
    const onMove = (e: PointerEvent) => {
      const frame = canvas.getBoundingClientRect()
      pointer = { x: e.clientX - frame.left, y: e.clientY - frame.top }
    }
    const onLeave = () => {
      pointer = null
    }
    const onClick = (e: MouseEvent) => {
      const frame = canvas.getBoundingClientRect()
      const x = e.clientX - frame.left
      const y = e.clientY - frame.top
      for (let i = 0; i < PUSH && particles.length < LIMIT; i++) particles.push(spawn(width, height, x, y))
    }

    const draw = (step: number) => {
      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = ink
      ctx.fillStyle = ink

      for (const p of particles) {
        if (step > 0) {
          p.x += p.vx * (SPEED / 2) * step
          p.y += p.vy * (SPEED / 2) * step
          if (p.x - p.r < 0 || p.x + p.r > width) p.vx = -p.vx
          if (p.y - p.r < 0 || p.y + p.r > height) p.vy = -p.vy
          p.x = Math.min(Math.max(p.x, 0), width)
          p.y = Math.min(Math.max(p.y, 0), height)
          // Breathing: each between its floor and its own ceiling.
          p.r += (p.rGrowing ? 1 : -1) * (SIZE_SPEED / 100) * step
          if (p.r >= p.rMax) p.rGrowing = false
          if (p.r <= SIZE_MIN) p.rGrowing = true
          p.a += (p.aGrowing ? 1 : -1) * (OPACITY_SPEED / 100) * step
          if (p.a >= p.aMax) p.aGrowing = false
          if (p.a <= OPACITY_MIN) p.aGrowing = true
        }
      }

      ctx.lineWidth = LINK_WIDTH
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d > LINK) continue
          ctx.globalAlpha = LINK_OPACITY * (1 - d / LINK)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      if (pointer) {
        for (const p of particles) {
          const d = Math.hypot(p.x - pointer.x, p.y - pointer.y)
          if (d > GRAB) continue
          ctx.globalAlpha = GRAB_OPACITY * (1 - d / GRAB)
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(pointer.x, pointer.y)
          ctx.stroke()
        }
      }

      for (const p of particles) {
        ctx.globalAlpha = p.a
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(p.r, 0.5), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const observer = new ResizeObserver(() => {
      resize()
      if (still) draw(0)
    })
    observer.observe(canvas)

    if (still) {
      draw(0)
      return () => observer.disconnect()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('click', onClick)

    // Paced in particles.js's frames — 60 a second — so a 120Hz screen does
    // not run it twice as fast.
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
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('click', onClick)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className={cn('pointer-events-none text-text', className)} />
}
