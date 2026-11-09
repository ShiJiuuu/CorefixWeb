#!/usr/bin/env python3
"""Coarse visual dump of a rendered frame (this session has no image preview)."""
import sys
from PIL import Image

RAMP = " .:-=+*#%@"

def art(path, cols=150, gamma=0.75, gain=1.0, crop=None):
    im = Image.open(path).convert("L")
    if crop:
        im = im.crop(crop)
    W, H = im.size
    aspect = 0.5  # character cell is twice as tall as wide
    rows = max(8, int(cols * (H / W) * aspect))
    sx, sy = W / cols, H / rows
    out = []
    for r in range(rows):
        line = []
        for c in range(cols):
            b = (int(c * sx), int(r * sy), int((c + 1) * sx), int((r + 1) * sy))
            px = im.crop(b).getdata()
            px = list(px)
            mean = sum(px) / len(px)
            peak = max(px)
            v = (mean * 0.55 + peak * 0.65) / 255 * gain
            v = max(0.0, min(1.0, v)) ** gamma
            line.append(RAMP[min(9, int(v * 9.99))])
        out.append("".join(line))
    return "\n".join(out)

if __name__ == "__main__":
    p = sys.argv[1]
    cols = int(sys.argv[2]) if len(sys.argv) > 2 else 150
    print(art(p, cols))
