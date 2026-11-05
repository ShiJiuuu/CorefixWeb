'use client'

import { useEffect, useRef, useState } from 'react'
import type { Site } from '@/content/types'

/* Schematic positions (percentages of the map box). Index-aligned with dict.net.sites. */
const POS: [number, number][] = [
  [66.2, 82],
  [78.0, 63.2],
  [69.7, 39.2],
  [53.6, 43.1],
  [64.7, 36.1],
  [32.8, 31.0],
  [46.4, 48.3],
  [73.2, 62.9],
  [54.2, 75.9],
]

/* GCJ-02 coordinates used when a Tencent Maps key is configured. */
const LATLON: Record<string, [number, number]> = {
  Shenzhen: [22.5431, 114.0579],
  Shanghai: [31.2304, 121.4737],
  Beijing: [39.9042, 116.4074],
  Ningxia: [38.4872, 106.2309],
  Ulanqab: [40.9909, 113.1334],
  Hami: [42.8333, 93.5151],
  Xining: [36.6171, 101.7782],
  Wuhu: [31.3534, 118.4329],
  Guizhou: [26.647, 106.6302],
}

declare global {
  interface Window {
    TMap?: any
    _TMapSecurityConfig?: { serviceHost: string }
  }
}

export default function MapPanel({
  sites,
  hint,
  legend,
  title,
}: {
  sites: Site[]
  hint: string
  legend: string[]
  title: string
}) {
  const [active, setActive] = useState(0)
  const mapEl = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  const current = sites[active] ?? sites[0]

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TMAP_KEY
    if (!key) return
    let cancelled = false

    const init = () => {
      if (cancelled || !window.TMap || !mapEl.current) return
      try {
        const TMap = window.TMap
        const map = new TMap.Map(mapEl.current, {
          center: new TMap.LatLng(35.5, 109),
          zoom: 4,
          baseMap: { type: 'vector' },
        })
        const built = sites.filter((s) => !s.plan)
        const plan = sites.filter((s) => s.plan)
        const circleStyle = new TMap.CircleStyle({
          color: '#0A0A0A0A',
          borderColor: '#0A0A0A80',
          borderWidth: 1.5,
        })
        new TMap.MultiCircle({
          map,
          styles: { c: circleStyle },
          geometries: built.map((s, i) => ({
            id: `c${i}`,
            styleId: 'c',
            center: new TMap.LatLng(...(LATLON[s.name] ?? [35, 110])),
            radius: 800000,
          })),
        })
        const dot = `data:image/svg+xml;utf8,${encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="5" fill="#0A0A0A"/></svg>',
        )}`
        const ring = `data:image/svg+xml;utf8,${encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="4.5" fill="none" stroke="#0A0A0A" stroke-width="1.6"/></svg>',
        )}`
        const markers = new TMap.MultiMarker({
          map,
          styles: {
            b: new TMap.MarkerStyle({ width: 16, height: 16, url: dot, anchor: 'center' }),
            p: new TMap.MarkerStyle({ width: 16, height: 16, url: ring, anchor: 'center' }),
          },
          geometries: [
            ...built.map((s, i) => ({
              id: String(i),
              styleId: 'b',
              position: new TMap.LatLng(...(LATLON[s.name] ?? [35, 110])),
            })),
            ...plan.map((s, i) => ({
              id: String(built.length + i),
              styleId: 'p',
              position: new TMap.LatLng(...(LATLON[s.name] ?? [35, 110])),
            })),
          ],
        })
        ;['click', 'mouseover'].forEach((ev) => {
          try {
            markers.on(ev, (e: any) => {
              const id = Number(e?.geometry?.id)
              if (!Number.isNaN(id)) setActive(id)
            })
          } catch {}
        })
        setReady(true)
      } catch {}
    }

    if (window.TMap) {
      init()
    } else {
      const s = document.createElement('script')
      s.src = `https://map.qq.com/api/gljs?v=1.exp&key=${key}`
      s.async = true
      s.onload = init
      document.head.appendChild(s)
    }
    return () => {
      cancelled = true
    }
  }, [sites])

  return (
    <div className="grid border-b border-line2 lg:grid-cols-[1fr_420px]">
      <div className="border-line px-5 pb-6 pt-7 sm:px-8 lg:border-r lg:pl-20 lg:pr-6">
        <div className="relative h-[420px] overflow-hidden border border-line sm:h-[520px]">
          {/* schematic layer (default) */}
          <div
            className={`u-gridbg absolute inset-0 bg-bg transition-opacity duration-500 ${
              ready ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ backgroundSize: '46px 46px, 46px 46px' }}
          >
            {sites.slice(0, 5).map((s, i) => (
              <div key={`r-${s.name}`}>
                <span
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-line2 bg-ink/[0.02]"
                  style={{
                    left: `${POS[i][0]}%`,
                    top: `${POS[i][1]}%`,
                    width: '22%',
                    aspectRatio: '1',
                  }}
                />
                <span
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/40"
                  style={{
                    left: `${POS[i][0]}%`,
                    top: `${POS[i][1]}%`,
                    width: '22%',
                    aspectRatio: '1',
                    animation: `cf-pulse 2.6s ease-out ${i * 0.5}s infinite`,
                  }}
                />
              </div>
            ))}

            {sites.map((s, i) => (
              <button
                key={s.name}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${POS[i]?.[0] ?? 50}%`, top: `${POS[i]?.[1] ?? 50}%` }}
                aria-label={s.name}
              >
                <span className="flex flex-col items-center gap-1.5">
                  <span
                    className={`block h-[9px] w-[9px] rounded-full transition-shadow ${
                      s.plan ? 'border border-ink bg-transparent' : 'bg-ink'
                    } ${active === i ? 'shadow-[0_0_0_4px_var(--line)]' : ''}`}
                  />
                  <span
                    className={`u-mono whitespace-nowrap text-[9px] tracking-[0.1em] transition-colors ${
                      active === i ? 'font-semibold text-ink' : 'text-muted group-hover:text-ink'
                    }`}
                  >
                    {s.name}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {/* tencent map layer */}
          <div ref={mapEl} className="absolute inset-0" />

          <span className="u-mono absolute left-3 top-3 text-[9px] tracking-[0.16em] text-faint">
            {title}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-5">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-ink" />
            <span className="u-mono text-[9px] tracking-[0.1em] text-muted">{legend[0]}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border border-ink" />
            <span className="u-mono text-[9px] tracking-[0.1em] text-muted">{legend[1]}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border border-dashed border-line2" />
            <span className="u-mono text-[9px] tracking-[0.1em] text-muted">{legend[2]}</span>
          </span>
        </div>
      </div>

      <div className="px-5 pb-8 pt-2 sm:px-8 lg:py-7 lg:pl-9 lg:pr-20">
        <div className="border border-line2 p-6" data-reveal>
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-[30px] font-semibold leading-none tracking-tight">{current.name}</h3>
            <span className="u-mono border border-line2 px-2.5 py-1 text-[9px] tracking-[0.12em] text-muted">
              {current.tag}
            </span>
          </div>
          <dl className="mt-5 border-t border-line">
            {[
              ['COVERAGE', current.coverage],
              ['ARRIVAL', current.arrival],
              ['RESPONSE', '7×24'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 border-b border-line py-3">
                <dt className="u-mono pt-0.5 text-[9.5px] tracking-[0.1em] text-faint">{k}</dt>
                <dd className="text-[12.5px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="u-mono mt-4 text-[9.5px] leading-[1.9] tracking-[0.1em] text-faint">
            {hint}
            <br />
            800KM ≤24H · 1500KM ≤48H
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-px bg-line">
          {sites.slice(0, 6).map((s, i) => (
            <button
              key={s.name}
              type="button"
              onMouseEnter={() => setActive(i)}
              className={`bg-bg px-3 py-2.5 text-left text-[11.5px] transition-colors hover:bg-bg2 ${
                active === i ? 'text-ink' : 'text-muted'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
