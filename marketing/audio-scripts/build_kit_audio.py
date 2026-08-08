#!/usr/bin/env python3
"""Build the 3AM Relapse Kit audio from the plain text scripts.

Same voice and chain as nights 1 to 7 (edge-tts, en-US-AvaNeural, rate -15%,
pitch -2Hz), with one thing added: a guided protocol is mostly silence. A line
that reads

    [pause 150]

becomes 150 seconds of real silence in the mp3, which is where the listener
actually writes, breathes or waits. Without it a twenty minute protocol would
be twenty minutes of talking, which is the opposite of the product.

Silence is encoded at the same 24 kHz mono 48 kbps as the speech so the whole
file concatenates without re-encoding, and the subtitle timings of each spoken
chunk are shifted by everything that came before them.

Usage:  python3 build_kit_audio.py [name ...]     (default: all kit-*.txt)
Output: artifacts/sleep-reset/public/audio/<name>.mp3 and .vtt
"""

from __future__ import annotations

import re
import subprocess
import sys
import tempfile
from pathlib import Path

VOICE = "en-US-AvaNeural"
RATE = "-15%"
PITCH = "-2Hz"

HERE = Path(__file__).resolve().parent
OUT_DIR = HERE.parent.parent / "artifacts" / "sleep-reset" / "public" / "audio"

PAUSE_RE = re.compile(r"^\s*\[pause\s+(\d+(?:\.\d+)?)\s*\]\s*$")
SRT_TIME_RE = re.compile(
    r"(\d+):(\d\d):(\d\d)[,.](\d\d\d)\s*-->\s*(\d+):(\d\d):(\d\d)[,.](\d\d\d)"
)


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, capture_output=True)


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(out.stdout.strip())


def parse(script: str) -> list[tuple[str, object]]:
    """Split a script into ("speak", text) and ("pause", seconds) parts."""
    parts: list[tuple[str, object]] = []
    buffer: list[str] = []

    def flush() -> None:
        text = "\n".join(buffer).strip()
        buffer.clear()
        if text:
            parts.append(("speak", text))

    for line in script.splitlines():
        m = PAUSE_RE.match(line)
        if m:
            flush()
            parts.append(("pause", float(m.group(1))))
        else:
            buffer.append(line)
    flush()
    return parts


def speak(text: str, dest: Path, srt: Path) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as fh:
        fh.write(text)
        src = Path(fh.name)
    try:
        run(["edge-tts", "--voice", VOICE, f"--rate={RATE}", f"--pitch={PITCH}",
             "--file", str(src), "--write-media", str(dest),
             "--write-subtitles", str(srt)])
    finally:
        src.unlink(missing_ok=True)


def silence(seconds: float, dest: Path) -> None:
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
         "-i", "anullsrc=r=24000:cl=mono", "-t", f"{seconds}",
         "-c:a", "libmp3lame", "-b:a", "48k", str(dest)])


def stamp(seconds: float) -> str:
    h, rest = divmod(max(seconds, 0.0), 3600)
    m, s = divmod(rest, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}"


def shift_cues(srt: Path, offset: float) -> list[str]:
    """SRT cues from one chunk, moved to their place in the finished file."""
    cues: list[str] = []
    blocks = [b for b in srt.read_text(encoding="utf-8").split("\n\n") if b.strip()]
    for block in blocks:
        lines = block.strip().splitlines()
        timing = next((i for i, l in enumerate(lines) if SRT_TIME_RE.search(l)), None)
        if timing is None:
            continue
        m = SRT_TIME_RE.search(lines[timing])
        start = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3)) + int(m.group(4)) / 1000
        end = int(m.group(5)) * 3600 + int(m.group(6)) * 60 + int(m.group(7)) + int(m.group(8)) / 1000
        text = "\n".join(lines[timing + 1:]).strip()
        if not text:
            continue
        cues.append(f"{stamp(start + offset)} --> {stamp(end + offset)}\n{text}")
    return cues


def build(script_path: Path) -> None:
    name = script_path.stem
    parts = parse(script_path.read_text(encoding="utf-8"))
    if not parts:
        raise SystemExit(f"{name}: nothing to say")

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        pieces: list[Path] = []
        cues: list[str] = []
        offset = 0.0
        spoken = 0.0
        quiet = 0.0

        for i, (kind, value) in enumerate(parts):
            piece = tmpdir / f"{i:03d}.mp3"
            if kind == "speak":
                srt = tmpdir / f"{i:03d}.srt"
                speak(str(value), piece, srt)
                cues.extend(shift_cues(srt, offset))
                spoken += duration(piece)
            else:
                silence(float(value), piece)
                quiet += duration(piece)
            offset += duration(piece)
            pieces.append(piece)

        listing = tmpdir / "parts.txt"
        listing.write_text("".join(f"file '{p}'\n" for p in pieces), encoding="utf-8")
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        mp3 = OUT_DIR / f"{name}.mp3"
        run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0",
             "-i", str(listing), "-c", "copy", str(mp3)])

        vtt = OUT_DIR / f"{name}.vtt"
        vtt.write_text("WEBVTT\n\n" + "\n\n".join(cues) + "\n", encoding="utf-8")

    total = duration(mp3)
    print(f"{name}: {total/60:5.1f} min total "
          f"({spoken/60:.1f} spoken, {quiet/60:.1f} silent) -> {mp3.name}, {vtt.name}")


def main(argv: list[str]) -> int:
    names = argv[1:] or sorted(p.stem for p in HERE.glob("kit-*.txt"))
    for name in names:
        build(HERE / f"{name}.txt")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
