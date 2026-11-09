#!/usr/bin/env python3
"""Measure where each exploded group lands on screen (1920x1080 stage)."""
import subprocess, os, sys
from PIL import Image

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL = "file:///Users/shijiu/CorefixWeb/effects/dgx-intro.html"
OUT = "/tmp/bbox"
os.makedirs(OUT, exist_ok=True)

GROUPS = ["board", "fabric", "compute", "power", "front", "top", "left", "right", "floor"]

def shot(t, only):
    p = f"{OUT}/{only}_{t}.png"
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--window-size=1920,1080", "--force-device-scale-factor=1",
                    "--virtual-time-budget=1200", f"--screenshot={p}",
                    f"{URL}?t={t}&only={only}&hidehud=1"],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return p

def bbox(p, thresh=8):
    im = Image.open(p).convert("L")
    m = im.point(lambda v: 255 if v > thresh else 0)
    b = m.getbbox()
    return b

if __name__ == "__main__":
    t = sys.argv[1] if len(sys.argv) > 1 else "3.9"
    print(f"t={t}")
    boxes = {}
    for g in GROUPS:
        p = shot(t, g)
        b = bbox(p)
        boxes[g] = b
        print(f"  {g:8s} {b}")
    # report overlapping pairs
    print("  overlaps:")
    names = [n for n in GROUPS if boxes[n]]
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            a, b = boxes[names[i]], boxes[names[j]]
            if a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]:
                ox = min(a[2], b[2]) - max(a[0], b[0])
                oy = min(a[3], b[3]) - max(a[1], b[1])
                print(f"    {names[i]} x {names[j]}  {ox} x {oy} px")
