#!/usr/bin/env python3
"""Mirror of the page's camera math — parses dgx-intro.html and reports framing."""
import re, os

HTML = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dgx-intro.html")
src = open(HTML).read()

OX, OY, DEP, VER = 700, 730, 0.52, -0.40
def P(x, y, z): return (OX + x + DEP * z, OY - y + VER * z)

GROUPS = {"board": (10, -25), "fabric": (15, -135), "compute": (30, -170),
          "power": (30, -200), "front": (-170, 240)}

beat_re = re.compile(
    r"\{\s*group:\s*'(\w+)'.*?sub:\s*\[([\d\s,\.]+)\].*?mw:\s*(\d+),\s*mh:\s*(\d+),\s*an:\s*\[([\d\s,\.]+)\].*?title:\s*'([^']+)'", re.S)

print(f"{'beat':12} {'s':>5}  {'subject on screen':<30} {'w x h':>11}  anchor  right-edge")
for m in beat_re.finditer(src):
    g, sub, mw, mh, an, title = m.groups()
    sub = [float(v) for v in sub.split(',')]
    an = [float(v) for v in an.split(',')]
    mw, mh = int(mw), int(mh)
    dx, dy = GROUPS[g]
    xs, ys = [], []
    for i in range(8):
        x = sub[3] if i & 1 else sub[0]
        y = sub[4] if i & 2 else sub[1]
        z = sub[5] if i & 4 else sub[2]
        q = P(x, y, z); xs.append(q[0] + dx); ys.append(q[1] + dy)
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    s = min(mw / (x1 - x0 + 1), mh / (y1 - y0 + 1), 9)
    cx, cy, sx, sy = (x0 + x1) / 2, (y0 + y1) / 2, 890, 520
    tx, ty = sx - cx * s, sy - cy * s
    a = P(*an)
    ax, ay = (a[0] + dx) * s + tx, (a[1] + dy) * s + ty
    print(f"{title:12} {s:5.2f}  ({x0*s+tx:5.0f},{y0*s+ty:5.0f},{(x1)*s+tx:5.0f},{(y1)*s+ty:5.0f})"
          f" {((x1-x0)*s):6.0f}x{((y1-y0)*s):<5.0f}  ({ax:5.0f},{ay:4.0f}) {(x1)*s+tx:6.0f}")
