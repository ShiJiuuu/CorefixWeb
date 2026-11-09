#!/usr/bin/env bash
# Renders one frame per second of dgx-intro.html and stitches a contact sheet.
# usage: ./capture.sh [fps-divisor]   (default: 1 frame per second, 20 frames)
set -e
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p check/frames
rm -f check/frames/*.png
for t in $(seq 0 19); do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --window-size=1920,1080 --force-device-scale-factor=1 \
    --virtual-time-budget=1200 \
    --screenshot="check/frames/f$(printf '%02d' "$t").png" \
    "file://$PWD/dgx-intro.html?t=$t" >/dev/null 2>&1
  printf '.'
done
echo
python3 check/sheet.py
