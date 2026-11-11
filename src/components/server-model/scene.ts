/**
 * Axonometric exploded view of the Supermicro SYS-822GS-NB3RT (NVIDIA B300, 8U).
 * Built from the whitepaper's dimensions and front/rear views:
 *   356 W x 449 H x 950 D mm, 8x B300, 8x OSFP, 32 DIMM, 6x 6600W PSU,
 *   12 rear fans + 4 internal fans, front-service GPU and CPU drawers.
 *
 * The scene is emitted as a static SVG string so React only owns the hover state.
 */

export type ServerModuleId =
  | 'gpu'
  | 'gpu-board'
  | 'cpu'
  | 'net'
  | 'storage'
  | 'cooling'
  | 'power'
  | 'chassis'

type Face = 'top' | 'side' | 'front'
type Map2 = (u: number, v: number) => [number, number]
type Offset = [number, number, number]

const W = 356
const H = 449
const D = 950

/* width runs down-right, depth runs up-right, height runs up */
const AX = 0.78
const AY = 0.18
const BX = 0.92
const BY = -0.22

const n = (v: number) => (Math.round(v * 10) / 10).toString()
const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const clamp = (v: number) => Math.max(1, Math.min(4, v))

class Scene {
  private out: string[] = []
  private minX = Infinity
  private minY = Infinity
  private maxX = -Infinity
  private maxY = -Infinity
  private ox = 0
  private oy = 0

  private p(x: number, y: number, z: number): [number, number] {
    return [AX * x + BX * z, AY * x + BY * z - y]
  }

  private bound(x: number, y: number) {
    this.minX = Math.min(this.minX, x + this.ox)
    this.minY = Math.min(this.minY, y + this.oy)
    this.maxX = Math.max(this.maxX, x + this.ox)
    this.maxY = Math.max(this.maxY, y + this.oy)
  }

  private boundAt(x: number, y: number, z: number) {
    const q = this.p(x, y, z)
    this.bound(q[0], q[1])
  }

  private boundMap(m: Map2, u: number, v: number) {
    const q = m(u, v)
    this.bound(q[0], q[1])
  }

  private fill(tone: number, face: Face) {
    const t = face === 'top' ? tone : face === 'side' ? tone + 1 : tone - 1
    return `sm-f${clamp(t)}`
  }

  private poly(pts: number[][], cls: string) {
    this.out.push(
      `<polygon class="sm-face ${cls}" points="${pts
        .map((q) => `${n(q[0])},${n(q[1])}`)
        .join(' ')}"/>`,
    )
  }

  box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tone = 2,
    cls = '',
  ) {
    const top = [
      this.p(x, y + h, z),
      this.p(x + w, y + h, z),
      this.p(x + w, y + h, z + d),
      this.p(x, y + h, z + d),
    ]
    const side = [
      this.p(x + w, y, z),
      this.p(x + w, y, z + d),
      this.p(x + w, y + h, z + d),
      this.p(x + w, y + h, z),
    ]
    const front = [
      this.p(x, y, z),
      this.p(x + w, y, z),
      this.p(x + w, y + h, z),
      this.p(x, y + h, z),
    ]
    this.poly(top, `${this.fill(tone, 'top')} ${cls}`)
    this.poly(side, `${this.fill(tone, 'side')} ${cls}`)
    this.poly(front, `${this.fill(tone, 'front')} ${cls}`)
    for (const yy of [y, y + h]) {
      for (const xx of [x, x + w]) {
        for (const zz of [z, z + d]) this.boundAt(xx, yy, zz)
      }
    }
  }

  wireBox(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    cls = 'sm-wire',
  ) {
    this.box(x, y, z, w, h, d, 1, cls)
  }

  line3(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    cls = 'sm-detail',
  ) {
    const a = this.p(x1, y1, z1)
    const b = this.p(x2, y2, z2)
    this.out.push(
      `<line class="${cls}" x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}"/>`,
    )
    this.bound(a[0], a[1])
    this.bound(b[0], b[1])
  }

  private face(matrix: string, draw: (m: Map2) => void, map: Map2) {
    this.out.push(`<g transform="matrix(${matrix})">`)
    draw(map)
    this.out.push('</g>')
  }

  front(z: number, draw: (m: Map2) => void) {
    this.face(
      `${AX} ${AY} 0 -1 ${n(BX * z)} ${n(BY * z)}`,
      draw,
      (u, v) => [AX * u + BX * z, AY * u + BY * z - v],
    )
  }

  rear(z: number, draw: (m: Map2) => void) {
    this.front(z, draw)
  }

  side(x: number, draw: (m: Map2) => void) {
    this.face(
      `${BX} ${BY} 0 -1 ${n(AX * x)} ${n(AY * x)}`,
      draw,
      (u, v) => [AX * x + BX * u, AY * x + BY * u - v],
    )
  }

  top(y: number, draw: (m: Map2) => void) {
    this.face(
      `${AX} ${AY} ${BX} ${BY} 0 ${n(-y)}`,
      draw,
      (u, v) => [AX * u + BX * v, AY * u + BY * v - y],
    )
  }

  lrect(m: Map2, x: number, y: number, w: number, h: number, cls: string) {
    this.out.push(
      `<rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"/>`,
    )
    this.boundMap(m, x, y)
    this.boundMap(m, x + w, y)
    this.boundMap(m, x, y + h)
    this.boundMap(m, x + w, y + h)
  }

  lcircle(m: Map2, cx: number, cy: number, r: number, cls: string) {
    this.out.push(
      `<circle class="${cls}" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`,
    )
    this.boundMap(m, cx - r, cy - r)
    this.boundMap(m, cx + r, cy - r)
    this.boundMap(m, cx - r, cy + r)
    this.boundMap(m, cx + r, cy + r)
  }

  lline(m: Map2, x1: number, y1: number, x2: number, y2: number, cls: string) {
    this.out.push(
      `<line class="${cls}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`,
    )
    this.boundMap(m, x1, y1)
    this.boundMap(m, x2, y2)
  }

  fan(m: Map2, cx: number, cy: number, r: number, phase = 0) {
    this.lcircle(m, cx, cy, r, 'sm-fan-rim')
    this.lcircle(m, cx, cy, r * 0.92, 'sm-fan-ring')
    for (let i = 0; i < 7; i++) {
      const a = phase + (i * Math.PI * 2) / 7
      const a2 = a + 0.42
      const p0x = cx + r * 0.22 * Math.cos(a)
      const p0y = cy + r * 0.22 * Math.sin(a)
      const p1x = cx + r * 0.7 * Math.cos(a + 0.18)
      const p1y = cy + r * 0.7 * Math.sin(a + 0.18)
      const p2x = cx + r * 0.9 * Math.cos(a2)
      const p2y = cy + r * 0.9 * Math.sin(a2)
      this.out.push(
        `<path class="sm-fan-blade" d="M${n(p0x)},${n(p0y)} Q${n(p1x)},${n(p1y)} ${n(p2x)},${n(p2y)}"/>`,
      )
    }
    this.lcircle(m, cx, cy, r * 0.18, 'sm-fan-hub')
    this.boundMap(m, cx - r, cy - r)
    this.boundMap(m, cx + r, cy + r)
  }

  private module(
    id: ServerModuleId,
    offset: Offset,
    delay: number,
    draw: () => void,
  ) {
    const q = this.p(offset[0], offset[1], offset[2])
    const dx = q[0]
    const dy = q[1]
    this.ox = dx
    this.oy = dy
    this.out.push(
      `<g class="sm-mod" data-mod="${id}" transform="translate(${n(dx)} ${n(dy)})" style="--ex:${n(-dx)}px;--ey:${n(-dy)}px;--delay:${delay}s">`,
    )
    this.out.push('<g class="sm-explode"><g class="sm-lift">')
    draw()
    this.out.push('</g></g></g>')
    this.ox = 0
    this.oy = 0
  }

  private gpuModule(x: number, z: number) {
    /* substrate */
    this.box(x, 198, z, 64, 8, 180, 3)
    /* die */
    this.box(x + 19, 206, z + 28, 26, 5, 34, 1, 'sm-die')
    /* 8 HBM stacks, four on each side of the die */
    for (let i = 0; i < 4; i++) {
      const zz = z + 22 + i * 11
      this.box(x + 7, 206, zz, 9, 4, 11, 4, 'sm-hbm')
      this.box(x + 48, 206, zz, 9, 4, 11, 4, 'sm-hbm')
    }
    /* package outline */
    this.top(206, (m) => {
      this.lrect(m, x + 2, z + 4, 60, 172, 'sm-panel-line')
    })
    /* solid heatsink over the rear two thirds; the die/HBM end stays exposed */
    this.box(x + 4, 226, z + 64, 56, 78, 112, 2)
    this.top(304, (m) => {
      for (let i = 1; i < 9; i++) {
        const xx = x + 4 + (i * 56) / 9
        this.lline(m, xx, z + 64, xx, z + 176, 'sm-detail')
      }
    })
    this.front(z + 64, (m) => {
      for (let i = 1; i < 7; i++) {
        this.lline(m, x + 4 + (i * 56) / 7, 226, x + 4 + (i * 56) / 7, 304, 'sm-detail')
      }
    })
    /* four corner posts */
    this.line3(x + 7, 214, z + 70, x + 7, 226, z + 70, 'sm-detail')
    this.line3(x + 57, 214, z + 70, x + 57, 226, z + 70, 'sm-detail')
    this.line3(x + 7, 214, z + 160, x + 7, 226, z + 160, 'sm-detail')
    this.line3(x + 57, 214, z + 160, x + 57, 226, z + 160, 'sm-detail')
  }

  build(ariaLabel: string): { inner: string; viewBox: string } {
    const defs = `<defs>
      <pattern id="sm-perf" width="9" height="9" patternUnits="userSpaceOnUse">
        <circle cx="4.5" cy="4.5" r="1.35" class="sm-perf-dot"/>
      </pattern>
      <pattern id="sm-vent" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" class="sm-vent-line"/>
      </pattern>
    </defs>`

    /* ---------- chassis: base, rear frame, right side ---------- */
    this.module('chassis', [0, 0, 0], 0, () => {
      this.box(0, 0, 0, W, 10, D, 3)
      this.box(0, 10, 0, 10, 30, D, 2)
      this.box(W - 10, 10, 0, 10, 30, D, 2)
      /* rear frame */
      this.box(0, 10, D - 10, W, 10, 10, 2)
      this.box(0, H - 18, D - 10, W, 8, 10, 2)
      this.box(0, 10, D - 10, 10, H - 28, 10, 2)
      this.box(W - 10, 10, D - 10, 10, H - 28, 10, 2)
      /* feet */
      for (const xx of [18, W - 50]) {
        for (const zz of [32, D - 90]) this.box(xx, -12, zz, 32, 12, 58, 4)
      }
      /* side skins and open-top perimeter: a translucent 8U volume */
      this.box(0, 10, 0, 7, H - 28, D, 1, 'sm-shell')
      this.box(W - 7, 10, 0, 7, H - 28, D, 1, 'sm-shell')
      for (const xx of [0, W - 8]) {
        for (const zz of [0, D - 8]) this.box(xx, 10, zz, 8, H - 28, 8, 2, 'sm-shell')
      }
      this.side(W - 7, (m) => {
        for (let i = 0; i < 7; i++) {
          const zz = 180 + i * 92
          this.lline(m, zz, 300, zz, 390, 'sm-side-vent')
        }
        this.lrect(m, 110, 80, 730, 300, 'sm-side-outline')
      })
      /* bottom handles */
      for (const zz of [140, D - 260]) {
        this.box(18, 10, zz, 24, 8, 110, 2)
        this.box(W - 42, 10, zz, 24, 8, 110, 2)
      }
    })

    /* ---------- rear fan wall + four internal fans ---------- */
    this.module('cooling', [0, 10, 30], 0.2, () => {
      this.box(0, 168, 916, W, 260, 10, 2)
      this.rear(916, (m) => {
        const xs = [38, 108, 178, 248, 318]
        for (const yy of [390, 316]) {
          for (const xx of xs) this.fan(m, xx, yy, 28, xx * 0.02)
        }
        this.fan(m, 158, 205, 22, 0.4)
        this.fan(m, 198, 205, 22, 1.2)
        this.lrect(m, 12, 176, 332, 8, 'sm-panel-line')
        this.lrect(m, 12, 412, 332, 8, 'sm-panel-line')
      })
    })

    this.module('cooling', [50, 20, -200], 0.24, () => {
      for (const xx of [95, 150, 206, 261]) {
        this.box(xx - 24, 98, 120, 48, 48, 26, 2)
        this.front(120, (m) => {
          this.fan(m, xx, 122, 21, xx * 0.01)
        })
      }
    })

    /* ---------- power: six 6600 W supplies ---------- */
    this.module('power', [0, -15, 40], 0.28, () => {
      for (const xx of [20, 226]) {
        for (let row = 0; row < 3; row++) {
          const yy = 20 + row * 50
          this.box(xx, yy, 870, 110, 45, 80, 2)
          this.front(870, (m) => {
            this.lcircle(m, xx + 55, yy + 22.5, 17, 'sm-psu-fan')
            this.lrect(m, xx + 8, yy + 8, 8, 30, 'sm-psu-handle')
            this.lrect(m, xx + 92, yy + 10, 12, 8, 'sm-psu-socket')
          })
        }
      }
    })

    /* ---------- GPU tray ---------- */
    this.module('gpu-board', [0, 100, -10], 0.1, () => {
      /* tray frame */
      this.box(14, 180, 92, 10, 10, 786, 2)
      this.box(W - 24, 180, 92, 10, 10, 786, 2)
      this.box(14, 180, 92, W - 28, 10, 10, 2)
      this.box(14, 180, 868, W - 28, 10, 10, 2)
      /* baseboard */
      this.box(24, 190, 100, W - 48, 8, 780, 3)
      /* NVSwitch chips */
      for (let i = 0; i < 4; i++) {
        const xx = 54 + i * 70
        this.box(xx, 198, 720, 50, 7, 50, 2)
        this.top(205, (m) => {
          for (let k = 1; k < 6; k++) {
            this.lline(m, xx + (k * 50) / 6, 722, xx + (k * 50) / 6, 768, 'sm-detail')
          }
        })
      }
      /* board traces */
      this.top(198, (m) => {
        for (let i = 0; i < 8; i++) {
          const xx = 66 + (i % 4) * 74
          const zz = i < 4 ? 340 : 550
          this.lline(m, xx, zz, 78 + (i % 4) * 70, 745, 'sm-trace')
        }
      })
      /* front connectors, VRM row and busbar */
      for (let i = 0; i < 4; i++) this.box(44 + i * 70, 198, 118, 44, 6, 26, 2)
      for (let i = 0; i < 8; i++) this.box(30 + i * 37, 198, 158, 22, 8, 18, 2)
      this.box(28, 198, 182, 300, 4, 6, 4)
      this.top(198, (m) => {
        for (let i = 0; i < 8; i++) this.lrect(m, 34 + i * 37, 162, 14, 10, 'sm-card-chip')
      })
      this.box(26, 198, 200, 7, 5, 600, 4)
      this.box(W - 33, 198, 200, 7, 5, 600, 4)
      for (let i = 0; i < 12; i++) this.box(36 + i * 24, 198, 770, 12, 7, 16, 4)
    })

    this.module('gpu', [0, 180, -20], 0.16, () => {
      // Painter's algorithm: larger z sits further back, so the rear row has to be
      // laid down first — otherwise it paints over the front row's heatsinks.
      for (const zz of [460, 250]) {
        for (const xx of [34, 108, 182, 256]) this.gpuModule(xx, zz)
      }
    })

    /* ---------- CPU tray ---------- */
    this.module('cpu', [50, -30, -200], 0.22, () => {
      this.box(14, 76, 92, 10, 8, 786, 2)
      this.box(W - 24, 76, 92, 10, 8, 786, 2)
      this.box(24, 84, 100, W - 48, 8, 780, 3)
      /* CPU heatsinks */
      for (const xx of [60, 188]) {
        this.box(xx, 92, 420, 68, 34, 74, 2)
        this.top(126, (m) => {
          for (let i = 1; i < 6; i++) {
            this.lline(m, xx + (i * 68) / 6, 422, xx + (i * 68) / 6, 492, 'sm-detail')
          }
        })
        this.top(92, (m) => this.lrect(m, xx - 3, 417, 74, 80, 'sm-panel-line'))
      }
      /* 32 DIMMs as four eight-slot banks, so they still read at hero size */
      for (const bx of [16, 132, 176, 260]) {
        this.box(bx, 92, 350, 40, 30, 72, 3, 'sm-dimm-bank')
        this.top(122, (m) => {
          for (let i = 1; i < 8; i++) {
            this.lline(m, bx + (i * 40) / 8, 352, bx + (i * 40) / 8, 420, 'sm-detail')
          }
        })
        this.front(350, (m) => {
          for (let i = 1; i < 8; i++) {
            this.lline(m, bx + (i * 40) / 8, 94, bx + (i * 40) / 8, 120, 'sm-detail')
          }
        })
      }
      /* two PCIe switch heatsinks */
      for (const xx of [118, 186]) {
        this.box(xx, 92, 250, 52, 18, 60, 2)
        this.top(110, (m) => {
          for (let i = 1; i < 7; i++) {
            this.lline(m, xx + (i * 52) / 7, 252, xx + (i * 52) / 7, 308, 'sm-detail')
          }
        })
      }
      /* front PCIe cards */
      for (const xx of [38, 228]) {
        this.box(xx, 94, 200, 90, 4, 120, 3)
        this.box(xx, 98, 316, 90, 22, 5, 2)
        this.top(98, (m) => {
          for (let i = 0; i < 4; i++) this.lrect(m, xx + 8 + i * 20, 208, 10, 18, 'sm-card-chip')
        })
      }
      /* M.2 sticks */
      for (const xx of [40, 256]) this.box(xx, 92, 200, 60, 3, 20, 2)
      /* rear I/O and VRM blocks */
      for (const xx of [30, 90, 150, 210, 270]) this.box(xx, 92, 720, 44, 10, 90, 2)
      this.box(28, 92, 700, 300, 4, 8, 4)
      this.box(26, 92, 200, 7, 5, 560, 4)
      this.box(W - 33, 92, 200, 7, 5, 560, 4)
      for (let i = 0; i < 8; i++) this.box(40 + i * 36, 92, 600, 24, 9, 34, 2)
      this.top(92, (m) => {
        for (let i = 0; i < 6; i++) this.lline(m, 60 + i * 42, 200, 60 + i * 42, 760, 'sm-trace')
      })
      /* two front handles */
      for (const xx of [26, W - 66]) this.box(xx, 80, 88, 40, 6, 8, 2)
    })

    /* ---------- front bezel and lid ---------- */

    this.module('chassis', [-120, 0, -180], 0.38, () => {
      this.box(0, 420, 0, W, 29, 16, 2, 'sm-veil')
      this.box(0, 0, 0, W, 24, 16, 2, 'sm-veil')
      this.box(0, 24, 0, 14, 396, 16, 2, 'sm-veil')
      this.box(W - 14, 24, 0, 14, 396, 16, 2, 'sm-veil')
      /* perforated GPU intake */
      this.front(4, (m) => {
        this.lrect(m, 16, 116, W - 32, 262, 'sm-perf-base')
        this.lrect(m, 16, 116, W - 32, 262, 'sm-perf-fill')
      })
      /* bottom I/O strip */
      this.front(0, (m) => {
        this.lrect(m, 20, 32, 82, 64, 'sm-io-panel sm-veil')
        this.lrect(m, 113, 28, 74, 72, 'sm-io-panel sm-veil')
        this.lrect(m, 193, 28, 74, 72, 'sm-io-panel sm-veil')
        this.lrect(m, 278, 28, 58, 72, 'sm-io-panel sm-veil')
        for (let i = 0; i < 4; i++) this.lcircle(m, 30 + i * 13, 44, 3.2, 'sm-port')
        for (let i = 0; i < 3; i++) this.lrect(m, 119 + i * 20, 36, 14, 8, 'sm-port')
        for (let i = 0; i < 3; i++) this.lrect(m, 199 + i * 20, 36, 14, 8, 'sm-port')
        this.lrect(m, 288, 36, 38, 18, 'sm-port')
        this.lrect(m, 288, 62, 18, 12, 'sm-port')
        this.lrect(m, 310, 62, 16, 12, 'sm-port')
      })
    })

    /* ---------- 8x E1.S storage ---------- */
    this.module('storage', [-120, -30, -230], 0.42, () => {
      const groups = [20, 192]
      for (const gx of groups) {
        for (let i = 0; i < 4; i++) {
          const xx = gx + i * 38
          this.box(xx, 28, 0, 34, 40, 74, 2)
          this.front(0, (m) => {
            this.lrect(m, xx + 5, 38, 24, 18, 'sm-drive-handle')
            this.lcircle(m, xx + 29, 34, 2.4, 'sm-led')
            this.lrect(m, xx + 8, 44, 18, 3, 'sm-drive-line')
          })
        }
      }
    })

    /* ---------- 8x OSFP 800G ---------- */
    this.module('net', [-120, 25, -230], 0.46, () => {
      for (let i = 0; i < 8; i++) {
        const xx = 16 + i * 41
        this.box(xx, 384, 0, 34, 22, 52, 2)
        this.front(0, (m) => {
          this.lrect(m, xx + 4, 388, 26, 14, 'sm-port-dark')
          this.lrect(m, xx + 10, 404, 14, 2.5, 'sm-port-tab')
          this.lcircle(m, xx + 29, 394, 1.8, 'sm-led')
        })
      }
    })

    const pad = 16
    const w = this.maxX - this.minX + pad * 2
    const h = this.maxY - this.minY + pad * 2
    const box = `${n(this.minX - pad)} ${n(this.minY - pad)} ${n(w)} ${n(h)}`

    return {
      viewBox: box,
      inner: `<title>${escapeXml(ariaLabel)}</title>${defs}${this.out.join('')}`,
    }
  }
}

export function buildServerScene(ariaLabel: string) {
  return new Scene().build(ariaLabel)
}
