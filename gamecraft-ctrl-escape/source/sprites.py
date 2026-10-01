"""Pixel-art sprites for CTRL + ESCAPE, drawn from character grids."""
import os
from PIL import Image, ImageChops

OUT = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(OUT, exist_ok=True)

PAL = {
    ".": None,
    "K": (16, 18, 38),      # outline
    "H": (58, 40, 34),      # hair
    "h": (92, 64, 52),      # hair highlight
    "S": (242, 194, 155),   # skin
    "s": (214, 158, 120),   # skin shadow
    "E": (16, 18, 38),      # eye
    "W": (255, 255, 255),
    "C": (45, 226, 230),    # cyan
    "c": (24, 150, 170),    # cyan shadow
    "P": (43, 58, 103),     # pants
    "B": (235, 238, 250),   # shoes
    "M": (190, 80, 80),     # mouth
    "G": (196, 210, 255),   # robot body
    "g": (140, 156, 214),   # robot shadow
    "D": (10, 15, 36),      # screen
    "Y": (255, 194, 51),    # amber
    "y": (204, 140, 20),    # amber shadow
    "N": (247, 37, 133),    # magenta
    "n": (160, 18, 92),     # magenta shadow
    "R": (255, 236, 90),    # glowing eye
    "Z": (70, 76, 110),     # grey (empty)
    "z": (40, 44, 70),
    "L": (124, 255, 160),   # mint
    "T": (150, 95, 60),     # wood
    "t": (105, 62, 38),     # wood dark
    "V": (155, 229, 100),   # lime frame
    "v": (95, 160, 60),     # lime frame dark
}

DOOR = """
.....VVVVVV.....
...VVvvvvvvVV...
..VvvTTTTTTvvV..
.VvTTTTTTTTTTvV.
.VvTTtTTTTtTTvV.
VvTTTtTTTTtTTTvV
VvTTTtTTTTtTTTvV
VvTTTtTTTTtTTTvV
VvTTTtTTTTtTTTvV
VvTTTtTTTTtTTTvV
VvTTTtTTTTtYYTvV
VvTTTtTTTTtYyTvV
VvTTTtTTTTtTTTvV
VvTTTtTTTTtTTTvV
VvTTTtTTTTtTTTvV
VvTTTtTTTTtTTTvV
VvTTTtTTTTtTTTvV
VvttttttttttttvV
VVVVVVVVVVVVVVVV
"""

KAI = """
.....KKKKKK.....
...KKhHHHHHKK...
..KHhHHHHHHHHK..
.KHHHHHHHHHHHHK.
.KHHHHHHHHHHHHK.
.KHHSHHHHHHSHHK.
.KHSSSSSSSSSSHK.
.KSSEWSSSSEWSSK.
.KSSEESSSSEESSK.
.KsSSSSSSSSSSsK.
..KSSSSMMSSSSK..
...KKSSSSSSKK...
....KKKSSKKK....
..KKCCCKKCCCKK..
.KCCCCCWWCCCCCK.
.KCCCCCWWCCCCCK.
KCcKCCCCCCCCKcCK
KCcKCCCCCCCCKcCK
KSSKcCCCCCCcKSSK
.KK.KccccccK.KK.
....KPPPPPPK....
....KPPKKPPK....
....KPPK.KPPK...
...KBBBK.KBBBK..
...KKKK...KKKK..
"""

BYTE = """
.......KK.......
......KYYK......
.......KK.......
.......KK.......
..KKKKKKKKKKKK..
.KGGGGGGGGGGGGK.
.KGKKKKKKKKKKgK.
.KGKDDDDDDDDKgK.
.KGKDCCDDDCCKgK.
.KGKDCCDDDCCKgK.
.KGKDDDDDDDDKgK.
.KGKDCDDDDCDKgK.
.KGKDDCCCCDDKgK.
.KGKKKKKKKKKKgK.
.KGGGGGGGGGGGgK.
..KKKKKKKKKKKK..
.....KGGGGK.....
...KKGGGGGGKK...
..KGKGGCCGGKGK..
..KGKGGCCGGKGK..
..KYKGGGGGGKYK..
...K.KggggK.K...
.....KGKKGK.....
....KKGK.KGKK...
....KKKK.KKKK...
"""

NULL = """
...K...........K....
..KNK.........KNK...
..KNNK..KKKK.KNNK...
...KNKKKNNNNKKNK....
....KNNNNNNNNNNK....
...KNNNNNNNNNNNNK...
..KNNNNNNNNNNNNNNK..
..KNNKKKNNNNKKKNNK..
.KNNKRRRKNNKRRRKNNK.
.KNNKRRKKNNKKRRKNNK.
.KNNNKKKNNNNKKKNNNK.
.KnNNNNNNKKNNNNNNnK.
..KnNNNNNNNNNNNNnK..
..KnKWKWKWKWKWKnK...
...KKWKWKWKWKWKK....
...KnKKKKKKKKKKnK...
....KnNNNNNNNNnK....
.....KKnNNNNnKK.....
.......KKKKKK.......
"""

SHIELD = """
KKKKKKKKKKKK
KCCCCCCCCCCK
KCWWCCCCCCcK
KCWCCCCCCCcK
KCCCCCCCCCcK
KCCCCCCCCCcK
.KCCCCCCCcK.
.KCCCCCCCcK.
..KCCCCCcK..
...KCCCcK...
....KCcK....
.....KK.....
"""

SHIELD_EMPTY = SHIELD.replace("C", "z").replace("W", "Z").replace("c", "z").replace("K", "Z")

CHIP = """
.K.K.K.K.K.
KKKKKKKKKKK
KYYYYYYYYyK
.KYKKKKKYyK.
KKYKyyyKYyKK
.KYKyyyKYyK.
KKYKKKKKYyKK
.KYYYYYYYyK.
KKyyyyyyyyKK
.KKKKKKKKKK.
..K.K.K.K.K.
"""


def norm(grid):
    rows = [r for r in grid.strip("\n").split("\n")]
    w = max(len(r) for r in rows)
    return [r.ljust(w, ".") for r in rows]


def render(grid, scale, name, glitch=False):
    rows = norm(grid)
    h, w = len(rows), len(rows[0])
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            col = PAL.get(ch)
            if col:
                px[x, y] = col + (255,)
    img = img.resize((w * scale, h * scale), Image.NEAREST)
    if glitch:
        img = glitchify(img, scale)
    img.save(os.path.join(OUT, name))
    return img


def glitchify(img, scale):
    """Chromatic offset + sliced rows for a corrupted-virus look."""
    w, h = img.size
    pad = scale * 2
    canvas = Image.new("RGBA", (w + pad * 2, h), (0, 0, 0, 0))
    alpha = img.split()[3]
    cyan = Image.new("RGBA", img.size, (45, 226, 230, 255))
    cyan.putalpha(alpha.point(lambda a: int(a * 0.55)))
    canvas.alpha_composite(cyan, (pad - scale, 0))
    canvas.alpha_composite(img, (pad, 0))
    # shift two horizontal slices
    for (y0, y1, dx) in [(int(h * 0.32), int(h * 0.38), scale), (int(h * 0.70), int(h * 0.75), -scale)]:
        band = canvas.crop((0, y0, canvas.width, y1))
        clear = Image.new("RGBA", band.size, (0, 0, 0, 0))
        canvas.paste(clear, (0, y0))
        canvas.alpha_composite(band, (max(dx, 0), y0) if dx > 0 else (0, y0))
        if dx < 0:
            canvas.paste(clear, (0, y0))
            canvas.alpha_composite(band.crop((-dx, 0, band.width, band.height)), (0, y0))
    return canvas


if __name__ == "__main__":
    render(KAI, 16, "kai.png")
    render(BYTE, 16, "byte.png")
    render(NULL, 16, "null.png")
    render(NULL, 16, "null_glitch.png", glitch=True)
    render(SHIELD, 12, "shield.png")
    render(SHIELD_EMPTY, 12, "shield_empty.png")
    render(CHIP, 12, "chip.png")
    render(DOOR, 12, "door.png")
    chip_empty = CHIP.replace("Y", "Z").replace("y", "z")
    render(chip_empty, 12, "chip_empty.png")
    print("sprites written to", OUT)
