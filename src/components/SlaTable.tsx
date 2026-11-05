import type { Dict } from '@/content/types'

export default function SlaTable({ net }: { net: Dict['net'] }) {
  return (
    <div>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {net.slaHead.map((h) => (
              <th
                key={h}
                className="u-mono border-b border-line2 pb-3 text-[10px] font-medium tracking-[0.14em] text-faint last:text-right [&:not(:first-child)]:text-right"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {net.sla.map((row) => (
            <tr key={row.k} className="border-b border-line last:border-b-0">
              <td className="py-3.5 text-[13px] text-muted">{row.k}</td>
              {row.v.map((v, i) => (
                <td
                  key={`${row.k}-${i}`}
                  className={`u-mono py-3.5 text-right text-[14.5px] ${i === 2 ? 'font-semibold' : ''}`}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-[12.5px] leading-[1.9] text-faint">{net.slaNote}</p>
    </div>
  )
}
