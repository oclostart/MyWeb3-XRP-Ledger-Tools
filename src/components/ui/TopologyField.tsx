import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

export interface TopologyFieldProps {
  /**
   * Where the sphere's centre stands in the canvas, as fractions of its
   * width and height — `{ x: 0.5, y: 0.5 }`, the middle, by default. `x: 1`
   * puts the centre on the right edge, so half the sphere runs off it.
   */
  anchor?: { x: number; y: number }
  /** The sphere's size against the original's — 380 across a desktop, 200 a phone. */
  scale?: number
  /** Placement and strength — the hub sets it fixed behind the page, faint. */
  className?: string
}

/** Nodes on the sphere, and how near two must be to be joined (on a unit sphere). */
const NODES = 120
const LINK = 0.45
/** The camera the original frames it with: 650 back, a 60° field of view. */
const CAMERA = 650
const FOV = (60 * Math.PI) / 180
/** Depth fog: whole at 300 from the camera, gone by 950. */
const FOG_NEAR = 300
const FOG_FAR = 950

type Node = { x: number; y: number; z: number; size: number; speed: number; offset: number }

/** A Fibonacci sphere: points spread evenly over a unit sphere, each with its own pulse. */
function makeNodes(): Node[] {
  return Array.from({ length: NODES }, (_, i) => {
    const phi = Math.acos(-1 + (2 * i) / NODES)
    const theta = Math.sqrt(NODES * Math.PI) * phi
    return {
      x: Math.cos(theta) * Math.sin(phi),
      y: Math.sin(theta) * Math.sin(phi),
      z: Math.cos(phi),
      size: Math.random() * 1.5 + 1,
      speed: Math.random() * 0.02 + 0.015,
      offset: Math.random() * Math.PI * 2,
    }
  })
}

/** Every pair close enough to join, with the line's strength — stronger the nearer. */
function makeLinks(nodes: Node[]) {
  const links: { a: number; b: number; alpha: number }[] = []
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a + 1; b < nodes.length; b++) {
      const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y, nodes[a].z - nodes[b].z)
      if (d < LINK) links.push({ a, b, alpha: (1 - d / LINK) * 0.8 })
    }
  }
  return links
}

/**
 * A slowly turning sphere of points and the lines between them — the "Nexus
 * topology field" the client chose for the tools hub (2026-10-13), drawn
 * behind the page, faint.
 *
 * **Drawn here, not embedded.** The supplied component ran the effect's whole
 * demo page in an iframe, fetching Tailwind, three.js, Google Fonts and a
 * stock photo from other hosts on every visit, with its colours as literals.
 * This is the same field on one 2D canvas, with the original's numbers: 120
 * nodes on a Fibonacci sphere, joined below 0.45 apart; a camera 650 back
 * with a 60° view; the sphere 380 across on a desktop and 200 on a phone,
 * turning 0.0018 a frame about its vertical, 0.0006 about its depth and
 * tilted 0.2; each node pulsing on its own speed, from 40% to whole; the far
 * side fading into fog between 300 and 950; a soft glow behind it; the lines
 * added light on light.
 *
 * Its colour is the element's own `color` — a text token set by class — so no
 * colour lives here. Under reduced motion it draws once and holds still. It
 * takes no pointer and is hidden from assistive tech: it says nothing.
 */
export function TopologyField({ anchor = { x: 0.5, y: 0.5 }, scale = 1, className }: TopologyFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { x: anchorX, y: anchorY } = anchor

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const nodes = makeNodes()
    const links = makeLinks(nodes)
    // The token's colour as the browser resolved it; strength goes through
    // `globalAlpha`, so no colour is ever written here.
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

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      const radius = (width > 768 ? 380 : 200) * scale
      const focal = height / 2 / Math.tan(FOV / 2)
      const cx0 = width * anchorX
      const cy0 = height * anchorY
      // Turned as three.js turns an XYZ Euler: about z, then y, then x.
      const ry = time * 0.0018
      const rz = time * 0.0006
      const rx = 0.2
      const [cy, sy, cz, sz, cx, sx] = [Math.cos(ry), Math.sin(ry), Math.cos(rz), Math.sin(rz), Math.cos(rx), Math.sin(rx)]

      const points = nodes.map((n) => {
        const x1 = n.x * cz - n.y * sz
        const y1 = n.x * sz + n.y * cz
        const x2 = x1 * cy + n.z * sy
        const z2 = -x1 * sy + n.z * cy
        const y3 = y1 * cx - z2 * sx
        const z3 = y1 * sx + z2 * cx
        const depth = CAMERA - z3 * radius
        const perspective = focal / depth
        const fog = Math.min(Math.max((depth - FOG_NEAR) / (FOG_FAR - FOG_NEAR), 0), 1)
        return { x: cx0 + x2 * radius * perspective, y: cy0 - y3 * radius * perspective, perspective, seen: 1 - fog }
      })

      // The glow: a soft light behind the sphere, 2.8 of its radius across.
      const glowRadius = radius * 1.4 * (focal / CAMERA)
      const glow = ctx.createRadialGradient(cx0, cy0, 0, cx0, cy0, glowRadius)
      glow.addColorStop(0, ink)
      glow.addColorStop(1, 'transparent')
      ctx.globalAlpha = 0.06
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      ctx.globalCompositeOperation = 'lighter'
      ctx.lineWidth = 1
      ctx.strokeStyle = ink
      for (const link of links) {
        const a = points[link.a]
        const p = points[link.b]
        const alpha = link.alpha * 0.65 * Math.min(a.seen, p.seen)
        if (alpha < 0.01) continue
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'

      ctx.fillStyle = ink
      nodes.forEach((n, i) => {
        const p = points[i]
        const pulse = (Math.sin(time * n.speed + n.offset) + 1) / 2
        const size = (n.size + pulse * 1.8) * p.perspective
        ctx.globalAlpha = (0.4 + pulse * 0.6) * p.seen
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1
    }

    resize()
    const observer = new ResizeObserver(() => {
      resize()
      if (still) draw(0)
    })
    observer.observe(canvas)

    if (still) {
      draw(0)
      return () => observer.disconnect()
    }

    // In the original's frames — it counted one a frame at 60 a second — so
    // the turn keeps its pace on a 120Hz screen too.
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      draw(((now - start) / 1000) * 60)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [anchorX, anchorY, scale])

  return <canvas ref={ref} aria-hidden className={cn('pointer-events-none text-text', className)} />
}
