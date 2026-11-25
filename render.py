#!/usr/bin/env python3
"""
Render a TikTok-style vertical video (1080x1920, 9:16) with animated white
text on a black background, from a JSON episode script.

Usage:
    python3 render.py episodes/ep01.json                 # -> out/ep01.mp4
    python3 render.py episodes/*.json                    # render all
    python3 render.py episodes/ep01.json --music song.mp3
    python3 render.py episodes/ep01.json --preview       # saves a PNG still

Text markup inside a slide:
    *word*  or  *several words*   -> highlighted in the accent colour
    \n                            -> forced line break
"""
import argparse, json, math, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30

# Keep text inside the area TikTok's UI does not cover (caption + buttons sit
# at the bottom and right edge). TikTok publishes no official safe zone, so
# these margins are deliberately generous.
SAFE_LEFT, SAFE_RIGHT = 90, W - 170
SAFE_TOP, SAFE_BOTTOM = 260, H - 520

FONT_DIR = Path("/usr/share/fonts/opentype/inter")
FONTS = {
    "black": FONT_DIR / "Inter-Black.otf",
    "bold": FONT_DIR / "Inter-Bold.otf",
    "medium": FONT_DIR / "Inter-Medium.otf",
}
FALLBACK_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

STYLES = {
    #         font     size  colour
    "big":    ("black", 104, (255, 255, 255)),
    "normal": ("bold",   76, (255, 255, 255)),
    "small":  ("medium", 54, (190, 190, 190)),
}
DEFAULT_ACCENT = (255, 204, 0)


def font(name, size):
    path = FONTS[name]
    return ImageFont.truetype(str(path) if path.exists() else FALLBACK_FONT, size)


def tokenize(text):
    """Split text into (word, highlighted, newline_before) tokens."""
    tokens, in_hl = [], False
    for li, line in enumerate(text.split("\n")):
        for wi, raw in enumerate(line.split()):
            starts, ends = raw.startswith("*"), "*" in raw[1:]  # allows *word*.
            hl = in_hl or starts
            tokens.append((raw.replace("*", ""), hl, li > 0 and wi == 0))
            if starts and not ends:
                in_hl = True
            if ends:
                in_hl = False
    return tokens


def layout(tokens, fnt, max_w):
    """Greedy word wrap. Returns lines of [(word, hl, width)]."""
    space = fnt.getlength(" ")
    lines, cur, cur_w = [], [], 0
    for word, hl, nl in tokens:
        ww = fnt.getlength(word)
        if cur and (nl or cur_w + space + ww > max_w):
            lines.append(cur)
            cur, cur_w = [], 0
        cur_w += ww + (space if cur else 0)
        cur.append((word, hl, ww))
    if cur:
        lines.append(cur)
    return lines, space


def ease_out(t):
    return 1 - (1 - max(0.0, min(1.0, t))) ** 3


class Slide:
    def __init__(self, d, accent):
        fname, size, self.color = STYLES[d.get("style", "normal")]
        self.font = font(fname, size)
        self.accent = accent
        self.tokens = tokenize(d["text"])
        self.lines, self.space = layout(self.tokens, self.font, SAFE_RIGHT - SAFE_LEFT)
        self.word_delay = d.get("word_delay", 0.12)  # seconds between words
        n = len(self.tokens)
        self.reveal = n * self.word_delay + 0.25
        # default hold scales with word count (~3.3 words per second of reading)
        self.hold = d.get("hold", max(1.4, n / 3.3))
        self.fade = 0.25
        self.duration = self.reveal + self.hold + self.fade

    def draw(self, img, t):
        d = ImageDraw.Draw(img)
        asc, desc = self.font.getmetrics()
        lh = int((asc + desc) * 1.12)
        y0 = SAFE_TOP + (SAFE_BOTTOM - SAFE_TOP - lh * len(self.lines)) // 2
        out_a = 1 - ease_out((t - (self.duration - self.fade)) / self.fade)
        idx = 0
        for li, line in enumerate(self.lines):
            line_w = sum(w for _, _, w in line) + self.space * (len(line) - 1)
            x = SAFE_LEFT + (SAFE_RIGHT - SAFE_LEFT - line_w) / 2
            y = y0 + li * lh
            for word, hl, ww in line:
                p = ease_out((t - idx * self.word_delay) / 0.22)
                a = p * out_a
                if a > 0:
                    base = self.accent if hl else self.color
                    col = tuple(int(c * a) for c in base)      # fade over black
                    d.text((x, y + (1 - p) * 28), word, font=self.font, fill=col)
                x += ww + self.space
                idx += 1


def draw_chrome(img, ep, t, total, accent):
    """Series label at the top + thin progress bar."""
    d = ImageDraw.Draw(img)
    parts = [ep.get("series", "").upper()]
    if "episode" in ep:
        parts.append(f"EP {ep['episode']}")
    label = "  ·  ".join(p for p in parts if p)
    f = font("bold", 34)
    d.text(((W - f.getlength(label)) / 2, 170), label, font=f, fill=(120, 120, 120))
    y = SAFE_TOP - 20
    d.rectangle([SAFE_LEFT, y, SAFE_RIGHT, y + 4], fill=(40, 40, 40))
    d.rectangle([SAFE_LEFT, y, SAFE_LEFT + (SAFE_RIGHT - SAFE_LEFT) * min(1, t / total), y + 4],
                fill=accent)


def render(path, outdir, music=None, preview=False):
    ep = json.loads(Path(path).read_text())
    accent = tuple(ep.get("accent", DEFAULT_ACCENT))
    slides = [Slide(s, accent) for s in ep["slides"]]
    total = sum(s.duration for s in slides)
    nframes = int(math.ceil(total * FPS))
    out = Path(outdir) / (Path(path).stem + (".png" if preview else ".mp4"))
    out.parent.mkdir(parents=True, exist_ok=True)

    def frame(i):
        t = i / FPS
        img = Image.new("RGB", (W, H), (0, 0, 0))
        draw_chrome(img, ep, t, total, accent)
        start = 0
        for s in slides:
            if t < start + s.duration:
                s.draw(img, t - start)
                break
            start += s.duration
        return img

    if preview:
        frame(int((slides[0].reveal + 0.3) * FPS)).save(out)
        print("preview:", out)
        return

    cmd = ["ffmpeg", "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    if music:
        cmd += ["-stream_loop", "-1", "-i", music, "-map", "0:v", "-map", "1:a",
                "-af", f"afade=t=out:st={max(0, total - 1.5):.2f}:d=1.5"]
    else:  # silent track so the file has audio; add a TikTok sound in-app
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"]
    cmd += ["-t", f"{nframes / FPS:.3f}",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(nframes):
        proc.stdin.write(frame(i).tobytes())
    proc.stdin.close()
    if proc.wait() != 0:
        raise SystemExit(f"ffmpeg failed for {path}")
    print(f"rendered {out}  ({total:.1f}s)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("episodes", nargs="+", help="episode JSON file(s)")
    ap.add_argument("-o", "--outdir", default="out")
    ap.add_argument("--music", help="optional audio file (looped, faded out)")
    ap.add_argument("--preview", action="store_true", help="save one PNG frame instead of a video")
    a = ap.parse_args()
    for e in a.episodes:
        render(e, a.outdir, a.music, a.preview)
