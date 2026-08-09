#!/usr/bin/env python3
"""Bake the Sleep Wired lockup onto the generated night stills.

Colours and type come from artifacts/sleep-reset/src/styles/funnel.css so the
Hotmart assets read as the same product as the funnel: ink #06080b, warm white
#ece7de, brass #c8a24c, Fraunces for display, Inter for UI.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

INK = (6, 8, 11)
TEXT = (236, 231, 222)
TEXT2 = (165, 160, 150)
BRASS = (200, 162, 76)

FR = "/tmp/swfonts/Fraunces.ttf"
IN = "/tmp/swfonts/Inter.ttf"


def font(path, size, wght=None, opsz=None, soft=0, wonk=0):
    """Fraunces defaults to opsz 9 / wght 900 / WONK 1, which is the chunky
    display cut. The funnel uses the refined end, so pin the axes."""
    f = ImageFont.truetype(path, size)
    vals = []
    for a in f.get_variation_axes():
        n = (a["name"].decode() if isinstance(a["name"], bytes) else str(a["name"])).lower()
        if "weight" in n and wght:
            v = wght
        elif "optical" in n and opsz:
            v = opsz
        elif "soft" in n:
            v = soft
        elif "wonky" in n:
            v = wonk
        else:
            v = a["default"]
        vals.append(max(a["minimum"], min(a["maximum"], v)))
    f.set_variation_by_axes(vals)
    return f


def tracked(draw, xy, text, fnt, fill, track=0):
    """Draw text with manual letter-spacing; returns the advance width."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + track
    return x - xy[0] - (track if text else 0)


def measure(draw, text, fnt, track=0):
    return sum(draw.textlength(c, font=fnt) for c in text) + track * max(len(text) - 1, 0)


def wrap(draw, text, fnt, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= maxw or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def darken(img, top=0.35, bottom=0.94, from_y=0.30):
    """Vertical scrim so the type always sits on near-black."""
    w, h = img.size
    grad = Image.new("L", (1, h))
    px = grad.load()
    start = int(h * from_y)
    for y in range(h):
        if y < start:
            a = top
        else:
            t = (y - start) / max(h - start, 1)
            a = top + (bottom - top) * (t ** 1.5)
        px[0, y] = int(255 * a)
    grad = grad.resize((w, h))
    return Image.composite(Image.new("RGB", (w, h), INK), img, grad)


def side_scrim(img, strength=0.9, from_x=0.42):
    w, h = img.size
    grad = Image.new("L", (w, 1))
    px = grad.load()
    start = int(w * from_x)
    for x in range(w):
        a = strength if x < start else strength * (1 - ((x - start) / max(w - start, 1)) ** 1.2)
        px[x, 0] = int(255 * a)
    grad = grad.resize((w, h))
    return Image.composite(Image.new("RGB", (w, h), INK), img, grad)


def fit(src, size):
    """Cover-crop to the target box."""
    tw, th = size
    im = Image.open(src).convert("RGB")
    sw, sh = im.size
    s = max(tw / sw, th / sh)
    im = im.resize((max(int(sw * s), tw), max(int(sh * s), th)), Image.LANCZOS)
    nw, nh = im.size
    return im.crop(((nw - tw) // 2, (nh - th) // 2, (nw - tw) // 2 + tw, (nh - th) // 2 + th))


def cover(src, out, title, sub, size=1080):
    im = darken(fit(src, (size, size)), top=0.30, bottom=0.95, from_y=0.34)
    d = ImageDraw.Draw(im)
    pad = int(size * 0.085)

    f_eyebrow = font(IN, int(size * 0.026), wght=600, opsz=32)
    f_title = font(FR, int(size * 0.082), wght=460, opsz=144)
    f_sub = font(IN, int(size * 0.029), wght=400, opsz=32)

    maxw = size - pad * 2
    lines = wrap(d, title, f_title, maxw)
    lh = int(size * 0.098)
    sub_lines = wrap(d, sub, f_sub, maxw) if sub else []
    slh = int(size * 0.042)

    block = lh * len(lines) + (int(size * 0.028) + slh * len(sub_lines) if sub_lines else 0)
    y = size - pad - block - int(size * 0.005)

    rule_y = y - int(size * 0.075)
    d.rectangle([pad, rule_y, pad + int(size * 0.06), rule_y + max(2, size // 540)], fill=BRASS)
    tracked(d, (pad, rule_y + int(size * 0.026)), "SLEEP WIRED", f_eyebrow, BRASS,
            track=size * 0.0055)

    for ln in lines:
        d.text((pad, y), ln, font=f_title, fill=TEXT)
        y += lh
    if sub_lines:
        y += int(size * 0.028)
        for ln in sub_lines:
            d.text((pad, y), ln, font=f_sub, fill=TEXT2)
            y += slh

    im.save(out, quality=94, subsampling=0)
    print("  ->", out, im.size)


def banner(src, out, head, sub, w=1440, h=480):
    # The generated still keeps its empty black half on the right; mirror it so
    # the type sits on the black and the lit bed stays visible beside it.
    im = fit(src, (w, h)).transpose(Image.FLIP_LEFT_RIGHT)
    im = side_scrim(darken(im, top=0.20, bottom=0.34, from_y=0.0),
                    strength=0.62, from_x=0.10)
    d = ImageDraw.Draw(im)
    pad = int(w * 0.055)

    f_eyebrow = font(IN, 22, wght=600, opsz=32)
    f_head = font(FR, 58, wght=460, opsz=144)
    f_sub = font(IN, 25, wght=400, opsz=32)

    maxw = int(w * 0.60)
    lines = wrap(d, head, f_head, maxw)
    lh = 70
    block = 34 + lh * len(lines) + 22 + 34
    y = (h - block) // 2

    d.rectangle([pad, y, pad + 64, y + 2], fill=BRASS)
    tracked(d, (pad, y + 20), "SLEEP WIRED", f_eyebrow, BRASS, track=6)
    y += 78
    for ln in lines:
        d.text((pad, y), ln, font=f_head, fill=TEXT)
        y += lh
    y += 16
    d.text((pad, y), sub, font=f_sub, fill=TEXT2)

    im.save(out, quality=94, subsampling=0)
    print("  ->", out, im.size)


def only(p):
    return sorted(Path(p).glob("*.png"))[0]


OUT = Path("/tmp/sw-covers/final")
OUT.mkdir(parents=True, exist_ok=True)

JOBS = [
    ("test", "01_7-night-protocol.jpg", "The 7-Night Protocol", "For people who wake at 3AM"),
    ("p2", "02_recovery-pack.jpg", "The Recovery Pack", "For the nights that go wrong"),
    ("p3", "03_3am-relapse-kit.jpg", "The 3AM Relapse Kit", "When one bad night becomes seven"),
    ("p4", "04_3am-anxiety-protocol.jpg", "The 3AM Anxiety Protocol", "The 3AM track, on its own"),
    ("p5", "05_second-seat.jpg", "Second Seat", "The same protocol, one more login"),
]

for folder, name, title, sub in JOBS:
    print(folder)
    cover(only(f"/tmp/sw-covers/{folder}"), OUT / name, title, sub)

print("banner")
banner(only("/tmp/sw-covers/banner"), OUT / "00_checkout-banner.jpg",
       "You fall asleep fine. You wake at 3AM.",
       "Seven nights. One payment. No subscription, ever.")
