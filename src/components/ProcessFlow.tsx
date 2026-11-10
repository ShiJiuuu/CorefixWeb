'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ProcessFlow as Flow } from '@/content/types'

gsap.registerPlugin(ScrollTrigger)

/**
 * Service-flow diagram, drawn as inline SVG so it scales with the layout and follows
 * the site's black/white tokens (light + dark) instead of shipping a raster image.
 *
 * On scroll the legs draw themselves from their start point in the arrow direction,
 * and the five black nodes rise from below into their final positions.
 */
export default function ProcessFlow({ flow }: { flow: Flow }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    // Honour reduced-motion: leave the diagram in its finished state.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const paths = gsap.utils.toArray<SVGPathElement>('[data-pf-path]')
      paths.forEach((p) => {
        const len = p.getTotalLength()
        gsap.set(p, { attr: { 'stroke-dasharray': len, 'stroke-dashoffset': len } })
      })

      const nodes = gsap.utils.toArray<SVGGElement>('[data-pf-node]')
      const dots = gsap.utils.toArray<SVGCircleElement>('[data-pf-dot]')

      gsap.set(nodes, { y: 170, opacity: 0 })
      gsap.set(dots, { opacity: 0, scale: 0.2, transformOrigin: '50% 50%' })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top 88%', end: 'bottom 96%', scrub: 0.5 },
      })

      // Each node settles just as the leg feeding into it finishes drawing,
      // so the rise reads as part of the same scroll instead of racing ahead of it.
      const nodeStarts = [0, 0.36, 0.74, 1.04, 1.3]
      nodes.forEach((n, i) => {
        tl.to(
          n,
          { y: 0, opacity: 1, duration: 0.78, ease: 'power2.out' },
          nodeStarts[i] ?? i * 0.3,
        )
      })
      tl.to(dots, { opacity: 1, scale: 1, duration: 0.32, stagger: 0.06 }, 0.3)

      // The SVG marker draws itself at the end vertex no matter how much of the line is shown,
      // so each leg gets its arrowhead only once its stroke has arrived.
      paths.forEach((p, i) => {
        p.style.markerEnd = 'none'
        tl.to(
          p,
          {
            attr: { 'stroke-dashoffset': 0 },
            duration: 1,
            ease: 'none',
            onUpdate: () => {
              const off = parseFloat(p.getAttribute('stroke-dashoffset') || '0')
              p.style.markerEnd = off < 6 ? 'url(#pf-arrow)' : 'none'
            },
          },
          i * 0.15,
        )
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div data-reveal ref={rootRef}>
      <p className="u-mono mb-3 text-[9.5px] tracking-[0.16em] text-faint lg:hidden">SWIPE →</p>
      <div className="-mx-5 overflow-x-auto px-5 pb-2 [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
        <svg
        viewBox="40 125 1120 520"
        role="img"
        aria-label={flow.steps.unbox}
        className="h-auto w-full min-w-[900px]"
      >
        <defs>
          <marker
            id="pf-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="var(--ink)" />
          </marker>
        </defs>

        {/* arrows — one smooth curve per leg, single arrowhead at the destination node */}
        <g
          fill="none"
          stroke="var(--ink)"
          strokeWidth={1.1}
          strokeLinecap="round"
        >
          {/* intake → unbox / assign / inspect → approval */}
          <path data-pf-path d="M100 378 C100 250 190 160 300 160 C400 160 449 260 449 372" />
          {/* approval yes → repair */}
          <path data-pf-path d="M508 430 L716 430" />
          {/* approval no → dispatch */}
          <path data-pf-path d="M500 470 C570 548 690 588 788 590" />
          {/* repair → Fieldiags / GPU Burn / DCGM → decision */}
          <path data-pf-path d="M770 378 L770 320 C770 230 820 180 900 176 C980 176 1050 200 1050 260 L1050 378" />
          {/* decision fail → repair */}
          <path data-pf-path d="M998 430 L824 430" />
          {/* decision pass → dispatch */}
          <path data-pf-path d="M1094 462 C1112 520 1030 578 892 586" />
        </g>

        {/* stage markers sitting on the line */}
        <g fill="var(--ink)" stroke="var(--bg)" strokeWidth={3}>
          <circle data-pf-dot cx="122" cy="275" r="5" />
          <circle data-pf-dot cx="170" cy="210" r="5" />
          <circle data-pf-dot cx="354" cy="171" r="5" />
          <circle data-pf-dot cx="412" cy="224" r="5" />
          {/* the three test-loop stages are spaced along the path (20 / 60 / 80 %) */}
          <circle data-pf-dot cx="778.5" cy="261.8" r="5" />
          <circle data-pf-dot cx="974.2" cy="184.4" r="5" />
          <circle data-pf-dot cx="1050" cy="260.9" r="5" />
        </g>

        {/* step labels */}
        <g fill="var(--ink2)" fontSize={11.5}>
          <text x="136" y="280">{flow.steps.unbox}</text>
          <text x="156" y="204" textAnchor="end">{flow.steps.assign}</text>
          <text x="354" y="150" textAnchor="middle">{flow.steps.inspect}</text>
          {flow.steps.quote.map((line, i) => (
            <text key={line} x="428" y={214 + i * 18}>{line}</text>
          ))}
          <text x="794" y="267">{flow.steps.fieldiags}</text>
          <text x="974" y="163" textAnchor="middle">{flow.steps.burn}</text>
          <text x="1066" y="266">{flow.steps.dcgm}</text>
          <text x="928" y="556">{flow.steps.report}</text>
        </g>

        {/* yes / no */}
        <g fill="var(--faint)" fontSize={10.5} fontFamily="var(--font-mono)">
          <text x="613" y="416" textAnchor="middle">{flow.steps.yes}</text>
          <text x="600" y="528" textAnchor="middle">{flow.steps.no}</text>
          <text x="895" y="414" textAnchor="middle">{flow.steps.fail}</text>
          <text x="1108" y="440">{flow.steps.pass}</text>
        </g>

        <Node x={100} y={430} r={52} lines={flow.nodes.intake} />
        <Node x={450} y={430} r={58} lines={flow.nodes.approve} decision />
        <Node x={770} y={430} r={52} lines={flow.nodes.repair} />
        <Node x={1050} y={430} r={52} lines={flow.nodes.test} />
        <Node x={840} y={588} r={48} lines={flow.nodes.ship} />

        {/* footnote */}
        <foreignObject x="60" y="505" width="420" height="125">
          <div className="flex h-full flex-col justify-center gap-3 border border-dashed border-line2 px-5 py-4 text-[11.5px] leading-[1.9] text-muted">
            {flow.note.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </foreignObject>
        </svg>
      </div>
    </div>
  )
}

function Node({
  x,
  y,
  r,
  lines,
  decision = false,
}: {
  x: number
  y: number
  r: number
  lines: string[]
  decision?: boolean
}) {
  const firstDy = lines.length === 1 ? 4.5 : -3
  return (
    <g data-pf-node>
      {decision && (
        <circle
          cx={x}
          cy={y}
          r={r + 11}
          fill="none"
          stroke="var(--line2)"
          strokeWidth={1}
          strokeDasharray="3 4"
        />
      )}
      <circle cx={x} cy={y} r={r} fill="var(--ink)" />
      <text x={x} y={y} textAnchor="middle" fill="var(--inv-t)" fontSize={13} fontWeight={600}>
        {lines.map((line, i) => (
          <tspan key={line} x={x} dy={i === 0 ? firstDy : 18}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}
