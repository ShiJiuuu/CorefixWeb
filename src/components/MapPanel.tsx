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

/* GCJ-02 coordinates used when an AMap key is configured. Keyed by Site.id, never by the localized name. */
const LATLON: Record<string, [number, number]> = {
  shenzhen: [22.5431, 114.0579],
  shanghai: [31.2304, 121.4737],
  beijing: [39.9042, 116.4074],
  ningxia: [38.4872, 106.2309],
  ulanqab: [40.9909, 113.1334],
  hami: [42.8333, 93.5151],
  xining: [36.6171, 101.7782],
  wuhu: [31.3534, 118.4329],
  guizhou: [26.647, 106.6302],
}

/** Falls back to the geographic centre only when a site has no known coordinate. */
const coord = (s: Site): [number, number] => LATLON[s.id] ?? [35.5, 109]

/** AMap takes [lng, lat]; the table above is [lat, lng] because that is how it is written down. */
const lngLat = (s: Site): [number, number] => {
  const [lat, lng] = coord(s)
  return [lng, lat]
}

/* Minimal shape of the AMap JS API 2.0 surface this component actually calls. */
type AMapOptions = Record<string, unknown>

interface AMapMap {
  setMapStyle(style: string): void
  destroy(): void
}

interface AMapOverlay {
  setMap(map: AMapMap | null): void
  on(event: string, handler: () => void): void
  setOptions?(options: AMapOptions): void
}

interface AMapNamespace {
  Map: new (el: HTMLElement, options: AMapOptions) => AMapMap
  Marker: new (options: AMapOptions) => AMapOverlay
  Circle: new (options: AMapOptions) => AMapOverlay
}

declare global {
  interface Window {
    AMap?: AMapNamespace
    _AMapSecurityConfig?: { securityJsCode: string }
  }
}

const MAP_STYLE_LIGHT = 'amap://styles/whitesmoke'
const MAP_STYLE_DARK = 'amap://styles/dark'

let amapLoader: Promise<void> | null = null

/** Loads AMap JS API 2.0 once; the security code has to be on window before the script runs. */
function loadAMap(key: string, securityJsCode?: string): Promise<void> {
  if (window.AMap) return Promise.resolve()
  if (!amapLoader) {
    amapLoader = new Promise<void>((resolve, reject) => {
      window._AMapSecurityConfig = securityJsCode ? { securityJsCode } : undefined
      const s = document.createElement('script')
      s.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => {
        amapLoader = null
        reject(new Error('AMap JS API failed to load'))
      }
      document.head.appendChild(s)
    })
  }
  return amapLoader
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
    const key = process.env.NEXT_PUBLIC_AMAP_KEY
    if (!key) return

    let cancelled = false
    let map: AMapMap | null = null
    let observer: MutationObserver | null = null

    const isDark = () => document.documentElement.classList.contains('dark')
    const mapStyle = () => (isDark() ? MAP_STYLE_DARK : MAP_STYLE_LIGHT)

    const init = () => {
      if (cancelled || !window.AMap || !mapEl.current) return
      try {
        const AMap = window.AMap
        map = new AMap.Map(mapEl.current, {
          center: [109, 35.5],
          zoom: 4,
          rotation: 0,
          pitch: 0,
          mapStyle: mapStyle(),
          // Static illustration: the map must not pan, zoom, rotate or trap the page scroll.
          dragEnable: false,
          jogEnable: false,
          zoomEnable: false,
          scrollWheel: false,
          doubleClickZoom: false,
          keyboardEnable: false,
          touchZoom: false,
          rotateEnable: false,
          pitchEnable: false,
        })
        // the constructor option is not always honoured before the first tile batch
        map.setMapStyle(mapStyle())

        // 800km coverage circle around every operating site; colour follows the theme
        const coverage = {
          strokeColor: isDark() ? '#F3F3F0' : '#0A0A0A',
          fillColor: isDark() ? '#F3F3F0' : '#0A0A0A',
        }
        const circles: AMapOverlay[] = []
        sites
          .filter((s) => !s.plan)
          .forEach((s) => {
            const circle = new AMap.Circle({
              center: lngLat(s),
              radius: 800000,
              bubble: true,
              ...coverage,
              strokeOpacity: 0.35,
              strokeWeight: 1,
              fillOpacity: 0.03,
              zIndex: 10,
            })
            circle.setMap(map)
            circles.push(circle)
          })

        // filled dot = operating site, ring = planned site
        sites.forEach((s, i) => {
          const marker = new AMap.Marker({
            position: lngLat(s),
            anchor: 'center',
            zIndex: 100 + i,
            content: `<span style="display:block;width:10px;height:10px;border-radius:9999px;cursor:pointer;${
              s.plan
                ? 'border:1.5px solid var(--ink);'
                : 'background:var(--ink);box-shadow:0 0 0 4px var(--line);'
            }"></span>`,
          })
          marker.on('mouseover', () => setActive(i))
          marker.on('click', () => setActive(i))
          marker.setMap(map)
        })

        // keep the basemap in step with the light/dark toggle
        observer = new MutationObserver(() => {
          map?.setMapStyle(mapStyle())
          const next = {
            strokeColor: isDark() ? '#F3F3F0' : '#0A0A0A',
            fillColor: isDark() ? '#F3F3F0' : '#0A0A0A',
          }
          circles.forEach((c) => c.setOptions?.(next))
        })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

        setReady(true)
      } catch {
        // keep the schematic layer: the map simply never takes over
      }
    }

    loadAMap(key, process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE)
      .then(init)
      .catch(() => {})

    return () => {
      cancelled = true
      observer?.disconnect()
      map?.destroy()
      map = null
      setReady(false)
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
              <div key={`r-${s.id}`}>
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
                key={s.id}
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

          {/* AMap canvas layer: AMap rewrites the container's position to relative, so it needs a
              sized (absolutely positioned) wrapper or it collapses to zero height inside this box. */}
          <div className="absolute inset-0">
            <div ref={mapEl} className="h-full w-full" />
          </div>

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
                <dd className="text-[13.5px] font-medium">{v}</dd>
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
              key={s.id}
              type="button"
              onMouseEnter={() => setActive(i)}
              className={`bg-bg px-3 py-2.5 text-left text-[12.5px] transition-colors hover:bg-bg2 ${
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
