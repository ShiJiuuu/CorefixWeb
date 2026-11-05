import type { Dict } from '@/content/types'

export default function WorkOrder({ wo }: { wo: Dict['wo'] }) {
  return (
    <div className="border border-line2 bg-card shadow-[0_24px_60px_-40px_rgba(0,0,0,0.45)]" data-hero-fade>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <span className="u-mono text-[11px] tracking-[0.16em] text-muted">{wo.label}</span>
        <span className="u-mono text-[11px] tracking-[0.06em]">{wo.no}</span>
      </div>

      <div className="px-5 py-4">
        {wo.rows.map((r) => (
          <div
            key={r.k}
            className="flex justify-between gap-5 border-b border-line py-3 text-[13.5px] last:border-b-0"
          >
            <span className="u-mono pt-0.5 text-[10px] tracking-[0.08em] text-faint">{r.k}</span>
            <span className="max-w-[280px] text-right leading-relaxed">{r.v}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-line bg-bg2 px-5 py-5">
        <p className="u-mono mb-4 text-[10px] tracking-[0.16em] text-faint">{wo.trackLabel}</p>
        <div className="flex items-center">
          {wo.track.map((t, i) => {
            const done = i < wo.trackCurrent
            const now = i === wo.trackCurrent
            return (
              <div key={t} className="relative flex-1 text-center">
                {i < wo.track.length - 1 && (
                  <span
                    className="absolute left-1/2 top-[3px] h-px w-full"
                    style={{ background: done ? 'var(--ink)' : 'var(--line2)' }}
                  />
                )}
                <span
                  className="mx-auto mb-2 block h-[7px] w-[7px] rounded-full"
                  style={{
                    background: done || now ? 'var(--ink)' : 'var(--line2)',
                    boxShadow: now ? '0 0 0 4px var(--line)' : undefined,
                  }}
                />
                <span
                  className={`text-[10px] ${done || now ? 'text-ink' : 'text-faint'}`}
                >
                  {t}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex border-t border-line">
        {wo.kpis.map((k) => (
          <div key={k.l} className="flex-1 border-r border-line px-5 py-4 last:border-r-0">
            <p className="u-mono text-[26px] font-semibold leading-none tracking-tight" data-count={k.v}>
              {k.v}
            </p>
            <p className="mt-2 text-[10.5px] tracking-[0.05em] text-faint">{k.l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
