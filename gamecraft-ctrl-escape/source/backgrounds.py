"""Backgrounds (one per game area) and 8-bit sound effects."""
import math
import os
import random
import struct
import wave

from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(OUT, exist_ok=True)
W, H = 1920, 1080

THEMES = {
    "menu": (45, 226, 230),
    "s1": (45, 226, 230),
    "s2": (255, 122, 69),
    "s3": (169, 139, 255),
    "s4": (155, 229, 100),
    "core": (247, 37, 133),
}


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def background(name, accent, seed):
    rnd = random.Random(seed)
    top, bottom = (6, 9, 26), (14, 20, 52)
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=lerp(top, bottom, y / H))

    # soft glow in the upper-right corner
    glow = Image.new("L", (W, H), 0)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W - 900, -600, W + 500, 600], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(220))
    img = Image.composite(Image.new("RGB", (W, H), accent), img, glow)

    over = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(over)

    # perspective grid floor
    horizon = int(H * 0.70)
    for i in range(14):
        t = (i / 13) ** 2.2
        y = horizon + int((H - horizon) * t)
        od.line([(0, y), (W, y)], fill=accent + (int(18 + 30 * t),), width=2)
    cx = W // 2
    for i in range(-16, 17):
        x_bottom = cx + i * 260
        x_top = cx + i * 40
        od.line([(x_top, horizon), (x_bottom, H)], fill=accent + (26,), width=2)

    # pixel dust
    for _ in range(140):
        x, y = rnd.randrange(0, W), rnd.randrange(0, horizon)
        s = rnd.choice([3, 4, 6])
        a = rnd.randrange(30, 110)
        col = accent if rnd.random() < 0.6 else (255, 255, 255)
        od.rectangle([x, y, x + s, y + s], fill=col + (a,))

    # scanlines
    for y in range(0, H, 4):
        od.line([(0, y), (W, y)], fill=(0, 0, 0, 22))

    img = Image.alpha_composite(img.convert("RGBA"), over).convert("RGB")
    img.save(os.path.join(OUT, f"bg_{name}.jpg"), quality=86, optimize=True)


# ---------- 8-bit sounds ----------
RATE = 22050


def square(freq, dur, vol=0.35, duty=0.5):
    n = int(RATE * dur)
    out = []
    for i in range(n):
        t = i / RATE
        phase = (t * freq) % 1.0
        v = vol if phase < duty else -vol
        env = min(1.0, (n - i) / (RATE * 0.03))  # short release
        out.append(v * env)
    return out


def sweep(f0, f1, dur, vol=0.35):
    n = int(RATE * dur)
    out, phase = [], 0.0
    for i in range(n):
        f = f0 + (f1 - f0) * (i / n)
        phase = (phase + f / RATE) % 1.0
        env = min(1.0, (n - i) / (RATE * 0.04))
        out.append((vol if phase < 0.5 else -vol) * env)
    return out


def write_wav(name, samples):
    with wave.open(os.path.join(OUT, name), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32000)) for s in samples))


def sounds():
    c5, e5, g5, c6 = 523.25, 659.25, 783.99, 1046.5
    write_wav("snd_correct.wav", square(e5, 0.09) + square(g5, 0.09) + square(c6, 0.22, duty=0.25))
    write_wav("snd_wrong.wav", sweep(320, 90, 0.42, vol=0.3))
    write_wav("snd_victory.wav",
              square(c5, 0.12) + square(e5, 0.12) + square(g5, 0.12) + square(c6, 0.12)
              + square(g5, 0.10) + square(c6, 0.45, duty=0.25))
    write_wav("snd_gameover.wav", square(g5 / 2, 0.22) + square(e5 / 2, 0.22) + square(c5 / 2, 0.22) + sweep(c5 / 2, 70, 0.6, vol=0.3))
    write_wav("snd_start.wav", sweep(200, 1200, 0.25, vol=0.25) + square(c6, 0.15, duty=0.25))


if __name__ == "__main__":
    for i, (name, accent) in enumerate(THEMES.items()):
        background(name, accent, seed=i + 7)
    sounds()
    print("backgrounds + sounds written")
