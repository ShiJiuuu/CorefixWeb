import sys, os
from PIL import Image, ImageFilter

RAMP = " ..:-=+*#%@"

def grid_full(path, w=96, h=27):
    im = Image.open(path).convert("L")
    im = im.filter(ImageFilter.MaxFilter(3))
    W, H = im.size
    px = im.load()
    cw, ch = W / w, H / h
    lines = []
    for cy in range(h):
        row = ""
        for cx in range(w):
            xa, xb = int(cx*cw), int((cx+1)*cw)
            ya, yb = int(cy*ch), int((cy+1)*ch)
            m = 0
            for y in range(ya, yb, 2):
                for x in range(xa, xb, 2):
                    v = px[x, y]
                    if v > m: m = v
            v = m / 255.0
            lv = 0 if v < 0.06 else min(9, int((v ** 0.55) * 9.7))
            row += RAMP[lv]
        lines.append(row)
    return im, lines

def bbox(im, thr=20):
    W, H = im.size
    px = im.load()
    minx, miny, maxx, maxy = W, H, -1, -1
    for y in range(0, H, 2):
        for x in range(0, W, 2):
            if px[x, y] > thr:
                minx = min(minx, x); maxx = max(maxx, x)
                miny = min(miny, y); maxy = max(maxy, y)
    return (minx, miny, maxx, maxy)

for p in sys.argv[1:]:
    im, lines = grid_full(p)
    bb = bbox(im)
    print("=" * 96)
    print(f"{os.path.basename(p)}  bbox={bb}  {bb[2]-bb[0]}x{bb[3]-bb[1]}   (frame 1920x1080)")
    for i, l in enumerate(lines):
        print(f"{i:02d} {l}")
