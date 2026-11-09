'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { buildServerScene, type ServerModuleId } from './scene'
import type { Dict } from '@/content/types'

type ModelCopy = Dict['hero']['model']

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The SVG is intentionally memoised: hover/pin state lives in the parent, and
 * replacing the SVG subtree would restart the one-shot explode animation.
 */
const SceneSvg = memo(function SceneSvg({
  viewBox,
  inner,
  label,
}: {
  viewBox: string
  inner: string
  label: string
}) {
  return (
    <svg
      className="sm-svg"
      viewBox={viewBox}
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  )
})

export default function ServerModel({ model }: { model: ModelCopy }) {
  const [active, setActive] = useState<ServerModuleId | null>(null)
  const [pinned, setPinned] = useState(false)
  const [entered, setEntered] = useState(false)
  const rootRef = useRef<HTMLElement | null>(null)

  const scene = useMemo(() => buildServerScene(model.label), [model.label])
  const total = model.modules.length
  const current = model.modules.find((m) => m.id === active) ?? null
  const currentNo = current ? pad(model.modules.findIndex((m) => m.id === current.id) + 1) : pad(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 1900)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPinned(false)
        setActive(null)
      }
    }
    window.addEventListener('keydown', onKey)

    const onDocPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPinned(false)
        setActive(null)
      }
    }
    document.addEventListener('pointerdown', onDocPointer)

    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDocPointer)
    }
  }, [])

  const moduleFromEvent = (target: EventTarget | null) => {
    const el = target as Element | null
    return (el?.closest?.('[data-mod]')?.getAttribute('data-mod') ?? null) as ServerModuleId | null
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pinned || event.pointerType === 'touch') return
    const id = moduleFromEvent(event.target)
    setActive((prev) => (prev === id ? prev : id))
  }

  const onPointerLeave = () => {
    if (!pinned) setActive(null)
  }

  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const id = moduleFromEvent(event.target)
    if (!id) {
      setPinned(false)
      setActive(null)
      return
    }
    if (pinned && active === id) {
      setPinned(false)
      setActive(null)
      return
    }
    setPinned(true)
    setActive(id)
  }

  const select = (id: ServerModuleId) => {
    if (pinned && active === id) {
      setPinned(false)
      setActive(null)
      return
    }
    setPinned(true)
    setActive(id)
  }

  return (
    <section
      ref={rootRef}
      className="sm"
      data-active={active ?? ''}
      data-animate={entered ? 'false' : 'true'}
      aria-label={model.label}
      onPointerLeave={onPointerLeave}
    >
      <div
        className="sm-canvas"
        onPointerMove={onPointerMove}
        onClick={onClick}
      >
        <SceneSvg viewBox={scene.viewBox} inner={scene.inner} label={model.label} />
      </div>

      <div className="sm-rail">
        <div className="sm-rail-top">
          <span className="sm-count">
            {current ? `${currentNo} / ${pad(total)}` : `${pad(total)} MODULES`}
          </span>
          <div className="sm-tabs" role="group" aria-label={model.label}>
            {model.modules.map((m, i) => {
              const id = m.id as ServerModuleId
              return (
                <button
                  key={m.id}
                  type="button"
                  className="sm-tab"
                  data-on={active === id ? 'true' : 'false'}
                  aria-label={`${pad(i + 1)} ${m.title}`}
                  aria-pressed={pinned && active === id}
                  onMouseEnter={() => {
                    if (!pinned) setActive(id)
                  }}
                  onFocus={() => setActive(id)}
                  onBlur={() => {
                    if (!pinned) setActive(null)
                  }}
                  onClick={() => select(id)}
                >
                  {pad(i + 1)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="sm-copy" aria-live="polite" aria-atomic="true">
          <div key={current?.id ?? 'hint'} className="sm-copy-inner">
            <div className="sm-copy-grid">
              <div className="sm-copy-title">
                <h3>{current ? current.title : model.hint}</h3>
                <span className="sm-en">{current ? current.en : 'EXPLODED VIEW'}</span>
              </div>
              <p className={current ? undefined : 'sm-meta'}>
                {current ? current.desc : model.meta}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
