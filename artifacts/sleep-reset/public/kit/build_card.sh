#!/usr/bin/env bash
# Renders the one page card from its HTML source into the two forms a buyer
# actually uses: an A5 PDF to print and leave in the bedside drawer, and a tall
# PNG to save on the phone, where it can be opened without unlocking anything
# bright. Same markup for both, so the wording can never drift apart.
#
#   bash build_card.sh
#
# Requires google-chrome and python3 with Pillow (only to crop the PNG down to
# the content, since headless Chrome screenshots a viewport, not a document).
set -euo pipefail

cd "$(dirname "$0")"
SRC="file://$PWD/first-90-seconds.html"
CHROME_FLAGS=(--headless --disable-gpu --no-sandbox --virtual-time-budget=8000 --hide-scrollbars)

google-chrome "${CHROME_FLAGS[@]}" --no-pdf-header-footer \
  --print-to-pdf=first-90-seconds.pdf "$SRC" 2>/dev/null

pages=$(pdfinfo first-90-seconds.pdf | awk '/^Pages:/ {print $2}')
if [ "$pages" != "1" ]; then
  echo "first-90-seconds.pdf came out $pages pages. The card is a one pager, fix the print CSS." >&2
  exit 1
fi

# 1170 wide is the width the stylesheet zooms three times, so the card lays out
# as a 390 px phone and renders at retina density. Do not change this number
# without changing the media query it is pinned to.
google-chrome "${CHROME_FLAGS[@]}" --window-size=1170,7200 \
  --screenshot=first-90-seconds.png "$SRC" 2>/dev/null

python3 - <<'PY'
from PIL import Image

img = Image.open("first-90-seconds.png").convert("RGB")
ink = img.getpixel((2, 2))
bottom = img.height
for y in range(img.height - 1, -1, -1):
    row = img.crop((0, y, img.width, y + 1)).getcolors(img.width)
    if not (len(row) == 1 and row[0][1] == ink):
        bottom = min(y + 90, img.height)   # keep a little breathing room
        break
img.crop((0, 0, img.width, bottom)).save("first-90-seconds.png")
print(f"first-90-seconds.png: {img.width}x{bottom}")
PY

echo "first-90-seconds.pdf: 1 page A5"
