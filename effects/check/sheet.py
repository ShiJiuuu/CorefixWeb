#!/usr/bin/env python3
"""Stitch check/frames/*.png into a contact sheet (one frame per second).

Thin 1px line art disappears when averaged down to thumbnail size, so the
tiles are gain-lifted before the downscale. Layout and composition are
unchanged; only brightness is lifted so the drawing survives the resize.
"""
import glob, os
from PIL import Image, ImageDraw, ImageFont

SRC = os.path.join(os.path.dirname(__file__), "frames")
OUT = os.path.join(os.path.dirname(__file__), "contact-sheet.png")

files = sorted(glob.glob(os.path.join(SRC, "*.png")))
if not files:
    raise SystemExit("no frames - run capture.sh first")

COLS, ROWS = 4, 5
TW, TH = 480, 270
PAD = 10
GAIN = 2.6

SHEET_W = COLS * TW + PAD * (COLS + 1)
SHEET_H = ROWS * TH + PAD * (ROWS + 1)
sheet = Image.new("RGB", (SHEET_W, SHEET_H), (18, 18, 18))

try:
    font = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 17)
except Exception:
    font = ImageFont.load_default()

d = ImageDraw.Draw(sheet)
for i, f in enumerate(files[:COLS * ROWS]):
    im = Image.open(f).convert("L").point(lambda v: min(255, int(v * GAIN)))
    im = im.resize((TW, TH), Image.LANCZOS).convert("RGB")
    x = PAD + (i % COLS) * (TW + PAD)
    y = PAD + (i // COLS) * (TH + PAD)
    sheet.paste(im, (x, y))
    t = os.path.basename(f).split(".")[0].lstrip("f")
    d.rectangle([x, y, x + 56, y + 24], fill=(18, 18, 18))
    d.text((x + 7, y + 4), f"{int(t):02d}s", font=font, fill=(120, 120, 120))

sheet.save(OUT)
print(OUT, sheet.size)
