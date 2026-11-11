'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { FlowStageKey, ProcessFlow as Flow } from '@/content/types'

gsap.registerPlugin(ScrollTrigger)

type Box = { x: number; y: number; w: number; h: number }
type Align = 'left' | 'center' | 'right'

type StageLayout = {
  /** Invisible hit area around the dot, so clicking the dot works too. */
  dot: { cx: number; cy: number }
  label: Box & { align: Align }
  /** Explainer panel anchor: it hangs above or below the label, growing by its own height. */
  tip: { x: number; side: 'above' | 'below'; xAlt?: number }
}

/**
 * Positions are hand-placed against the curve geometry (viewBox 40 30 1120 615):
 * the labels keep their original anchors, the panels sit next to the label they
 * belong to and stay clear of the five black nodes.
 */
const LAYOUT: Record<FlowStageKey, StageLayout> = {
  unbox: {
    dot: { cx: 122, cy: 275 },
    label: { x: 132, y: 266, w: 170, h: 26, align: 'left' },
    tip: { x: 160, side: 'below' },
  },
  assign: {
    dot: { cx: 170, cy: 210 },
    label: { x: 40, y: 190, w: 120, h: 26, align: 'right' },
    tip: { x: 44, side: 'below' },
  },
  inspect: {
    dot: { cx: 354, cy: 171 },
    label: { x: 288, y: 134, w: 132, h: 26, align: 'center' },
    tip: { x: 296, side: 'below' },
  },
  quote: {
    dot: { cx: 412, cy: 224 },
    label: { x: 422, y: 196, w: 220, h: 48, align: 'left' },
    tip: { x: 428, side: 'above', xAlt: 520 },
  },
  fieldiags: {
    dot: { cx: 778.5, cy: 261.8 },
    label: { x: 788, y: 253, w: 150, h: 26, align: 'left' },
    tip: { x: 700, side: 'above' },
  },
  burn: {
    dot: { cx: 974.2, cy: 184.4 },
    label: { x: 898, y: 143, w: 152, h: 26, align: 'center' },
    tip: { x: 928, side: 'below' },
  },
  dcgm: {
    dot: { cx: 1050, cy: 260.9 },
    label: { x: 1060, y: 252, w: 100, h: 26, align: 'left' },
    tip: { x: 936, side: 'above' },
  },
}

/**
 * Anchor the card to the label edge: below it, or above it — and if there is no room
 * left above (long English copy), drop it under the label instead.
 */
function tipPlacement(key: FlowStageKey, h: number) {
  const { label, tip } = LAYOUT[key]
  if (tip.side === 'below') return { x: tip.x, y: label.y + label.h + 9 }
  const y = label.y - 9 - h
  if (y < viewY + 4) {
    return { x: tip.xAlt ?? tip.x, y: label.y + label.h + 9 }
  }
  return { x: tip.x, y }
}

/** Explainer panel footprint, in SVG user units. */
const TIP_W = 218
/** Estimated card height before the real one is measured; the panel sizes itself to its copy. */
const TIP_H = 152
const viewX = 40
const viewY = 30
const viewW = 1120

const STAGE_ORDER: FlowStageKey[] = [
  'unbox',
  'assign',
  'inspect',
  'quote',
  'fieldiags',
  'burn',
  'dcgm',
]

/**
 * Service-flow diagram, drawn as inline SVG so it scales with the layout and follows
 * the site's black/white tokens (light + dark) instead of shipping a raster image.
 *
 * On scroll the legs draw themselves from their start point in the arrow direction,
 * and the five black nodes rise from below into their final positions.
 *
 * Hovering a stage label (or its dot) reveals a small explainer card next to it with the
 * purpose, the standard and the record it leaves; moving away hides it again. Touch
 * devices, where there is no hover, open and close it with a tap.
 * The dots and their count are unchanged — no stage was added or removed.
 */
export default function ProcessFlow({ flow }: { flow: Flow }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [active, setActive] = useState<FlowStageKey | null>(null)
  const [panelH, setPanelH] = useState(TIP_H)
  /** Pointer devices get the card on hover; touch screens tap it instead. */
  const canHover = useRef(true)

  useEffect(() => {
    canHover.current = window.matchMedia('(hover: hover)').matches
  }, [])

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

  // Escape closes the card; a click anywhere outside a stage closes it too.
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  const reveal = (key: FlowStageKey) => setActive(key)
  const conceal = (key: FlowStageKey) => setActive((cur) => (cur === key ? null : cur))
  /** Tap toggles the card on touch screens; with a mouse the hover gestures already handle it. */
  const tap = (key: FlowStageKey) => {
    if (!canHover.current) setActive((cur) => (cur === key ? null : key))
  }

  const tipPos = active ? tipPlacement(active, panelH) : null

  // Measure the card in SVG units so it can hang off the label edge whatever the copy length.
  useEffect(() => {
    if (!active) return
    const el = panelRef.current
    const svg = svgRef.current
    if (!el || !svg) return
    const scale = svg.getBoundingClientRect().width / viewW || 1
    setPanelH(el.getBoundingClientRect().height / scale)
  }, [active, flow])

  // On narrow tap screens the diagram scrolls sideways; bring the opened card into view
  // (never on hover — the page would jump while the pointer sweeps across the diagram).
  useEffect(() => {
    if (canHover.current) return
    if (!active || !tipPos) return
    const sc = scrollerRef.current
    const svg = svgRef.current
    if (!sc || !svg) return
    const scale = svg.getBoundingClientRect().width / viewW
    const left = (tipPos.x - viewX) * scale
    const right = left + TIP_W * scale
    const pad = 12
    if (right > sc.scrollLeft + sc.clientWidth - pad) {
      sc.scrollTo({ left: right - sc.clientWidth + pad, behavior: 'smooth' })
    } else if (left < sc.scrollLeft + pad) {
      sc.scrollTo({ left: Math.max(0, left - pad), behavior: 'smooth' })
    }
  }, [active, tipPos])

  const stepsOf = (key: FlowStageKey): string[] =>
    key === 'quote' ? flow.steps.quote : [flow.steps[key]]

  return (
    <div data-reveal ref={rootRef}>
      <p className="u-mono mb-3 text-[9.5px] tracking-[0.16em] text-faint lg:hidden">SWIPE →</p>
      <div ref={scrollerRef} className="-mx-5 overflow-x-auto px-5 pb-2 [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
        <svg
          ref={svgRef}
          viewBox="40 30 1120 615"
          role="img"
          aria-label={flow.steps.unbox}
          className="h-auto w-full min-w-[900px]"
          onClick={(e) => {
            if (!(e.target as Element).closest('[data-pf-stage], [data-pf-dot-hit]')) setActive(null)
          }}
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
          <g fill="none" stroke="var(--ink)" strokeWidth={1.1} strokeLinecap="round">
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
            {STAGE_ORDER.map((key) => (
              <circle key={key} data-pf-dot cx={LAYOUT[key].dot.cx} cy={LAYOUT[key].dot.cy} r={5} />
            ))}
          </g>

          {/* clickable hit areas over the dots */}
          {STAGE_ORDER.map((key) => (
            <circle
              key={`hit-${key}`}
              data-pf-dot-hit={key}
              cx={LAYOUT[key].dot.cx}
              cy={LAYOUT[key].dot.cy}
              r={14}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => reveal(key)}
              onMouseLeave={() => conceal(key)}
              onClick={() => tap(key)}
            >
              <title>{flow.tips[key].title}</title>
            </circle>
          ))}

          {/* step labels — buttons, so clicking one opens its explainer */}
          {STAGE_ORDER.map((key) => {
            const l = LAYOUT[key].label
            const isActive = active === key
            return (
              <foreignObject
                key={`label-${key}`}
                x={l.x}
                y={l.y}
                width={l.w}
                height={l.h}
                className="overflow-visible"
              >
                <div
                  className={`flex h-full ${
                    l.align === 'left'
                      ? 'justify-start'
                      : l.align === 'center'
                        ? 'justify-center'
                        : 'justify-end'
                  }`}
                >
                  <button
                    type="button"
                    data-pf-stage={key}
                    aria-expanded={isActive}
                    onMouseEnter={() => reveal(key)}
                    onMouseLeave={() => conceal(key)}
                    onFocus={() => reveal(key)}
                    onClick={() => tap(key)}
                    className={`max-w-full cursor-pointer rounded-[3px] px-1 text-left text-[11.5px] leading-[1.45] transition-colors duration-150 ${
                      isActive
                        ? 'bg-[var(--ink)] font-semibold text-[var(--bg)]'
                        : 'text-ink2 hover:bg-bg2 hover:text-ink'
                    } ${l.align === 'center' ? 'text-center' : l.align === 'right' ? 'text-right' : ''}`}
                  >
                    {stepsOf(key).map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </button>
                </div>
              </foreignObject>
            )
          })}

          {/* yes / no */}
          <g fill="var(--faint)" fontSize={10.5} fontFamily="var(--font-mono)">
            <text x="613" y="416" textAnchor="middle">
              {flow.steps.yes}
            </text>
            <text x="600" y="528" textAnchor="middle">
              {flow.steps.no}
            </text>
            <text x="895" y="414" textAnchor="middle">
              {flow.steps.fail}
            </text>
            <text x="1108" y="440">{flow.steps.pass}</text>
          </g>

          {/* the free-standing report caption keeps its original SVG text */}
          <text x="928" y="556" fill="var(--ink2)" fontSize={11.5}>
            {flow.steps.report}
          </text>

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

          {/* explainer card — drawn last so it floats above the diagram */}
          {active && (
            <foreignObject
              x={tipPos?.x ?? 0}
              y={tipPos?.y ?? 0}
              width={TIP_W}
              height={panelH + 2}
              className="overflow-visible"
            >
              <div
                ref={panelRef}
                role="dialog"
                onMouseEnter={() => reveal(active)}
                onMouseLeave={() => conceal(active)}
                aria-label={flow.tips[active].title}
                className="flex w-full flex-col rounded-[4px] border border-line2 bg-bg px-3.5 py-3 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="u-mono text-[8.5px] tracking-[0.16em] text-faint">
                    {String(STAGE_ORDER.indexOf(active) + 1).padStart(2, '0')} / {flow.tips[active].title}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    aria-label="close"
                    className="-mt-0.5 shrink-0 cursor-pointer text-[10px] leading-none text-faint transition-colors hover:text-ink"
                  >
                    ✕
                  </button>
                </div>

                <ul className="mt-2 flex flex-col gap-1.5">
                  {flow.tips[active].items.map((item) => (
                    <li key={item} className="flex gap-1.5 text-[9.4px] leading-[1.6] text-ink2">
                      <span aria-hidden="true" className="mt-[2px] shrink-0 text-faint">
                        ·
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </foreignObject>
          )}
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
