#!/usr/bin/env python3
"""Numeric review of each rendered second."""
import glob, os, statistics
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), "frames")

def pct(im, box, thresh):
    c = im.crop(box)
    d = list(c.getdata())
    return sum(1 for v in d if v > thresh) / len(d) * 100

print(f"{'t':>3}  {'bbox>40':<26} {'lines%':>7} {'left(0-620)':>11} {'labelBG':>8} {'label_txt%':>10}")
for f in sorted(glob.glob(os.path.join(SRC, "*.png"))):
    t = int(os.path.basename(f).split(".")[0].lstrip("f"))
    im = Image.open(f).convert("L")
    W, H = im.size
    mask = im.point(lambda v: 255 if v > 40 else 0)
    bb = mask.getbbox()
    lines = sum(mask.getdata()) / 255 / (W * H) * 100
    left = pct(im, (0, 0, 620, H), 40)
    # background right next to the label column (text starts at 1520)
    strip = im.crop((1480, 372, 1516, 600))
    bg = statistics.median(list(strip.getdata()))
    lb = pct(im, (1520, 350, 1884, 620), 40)
    print(f"{t:3d}  {str(bb):<26} {lines:7.2f} {left:11.2f} {bg:8.0f} {lb:10.2f}")
