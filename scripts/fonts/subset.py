"""Cuts the site's Latin typeface, Inter, into the two files in src/fonts.

    pip install fonttools brotli
    python scripts/fonts/subset.py

A page fetches its fonts before its first paint, so their weight is felt by
every visitor. The file this starts from (scripts/fonts/source, Fontsource's
Latin cut of Inter's variable font) weighs 47 KB; most of that is letters and
weights the site does not set.

- inter-basic: what the site's own words use (ASCII, the punctuation and
  signs in BASIC below), in the weights the styles set (300 to 700). Every
  page asks for it up front.
- inter-more: the rest of the Latin cut (accented letters and rarer signs), in
  the same weights. A browser fetches it only when a page shows one of its
  characters: src/fonts/index.ts declares its unicode-range, which this script
  prints. Paste it there when BASIC changes.

Both keep kerning, tabular figures (the price tables) and the marks; the
fraction forms, which nothing sets, are left out. Anuphan, the Thai typeface,
is small already and is used as it came.
"""

import io
import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(HERE, "source", "inter-latin-wght-normal.woff2")
OUT = os.path.join(HERE, "..", "..", "src", "fonts")

WEIGHTS = (300, 700)
FEATURES = ["calt", "ccmp", "locl", "tnum", "pnum", "kern", "mark", "mkmk"]
# ASCII, then: no-break space, § © ® ° ± ² ³ · × é ÷, dashes, quotes, bullet, ellipsis, primes, €, ™, arrows, minus.
BASIC = list(range(0x20, 0x7F)) + [
    0xA0, 0xA7, 0xA9, 0xAE, 0xB0, 0xB1, 0xB2, 0xB3, 0xB7, 0xD7, 0xE9, 0xF7,
    0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x2032, 0x2033,
    0x20AC, 0x2122, 0x2191, 0x2193, 0x2212,
]  # fmt: skip


def cut(unicodes, name):
    font = instancer.instantiateVariableFont(TTFont(SOURCE), {"wght": WEIGHTS})
    # Saved and read again: the subsetter needs the tables the instancer left unread.
    held = io.BytesIO()
    font.flavor = None
    font.save(held)
    held.seek(0)
    font = TTFont(held)

    options = subset.Options()
    options.layout_features = FEATURES
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.glyph_names = False
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)

    path = os.path.join(OUT, name)
    font.flavor = "woff2"
    font.save(path)
    print(f"{name}: {os.path.getsize(path)} bytes, {len(font.getBestCmap())} characters")


def ranges(codes):
    """The codes as a CSS unicode-range."""
    codes = sorted(codes)
    runs, first, last = [], codes[0], codes[0]
    for code in codes[1:]:
        if code != last + 1:
            runs.append((first, last))
            first = code
        last = code
    runs.append((first, last))
    return ", ".join(f"U+{a:04X}" if a == b else f"U+{a:04X}-{b:04X}" for a, b in runs)


def main():
    every = set(TTFont(SOURCE).getBestCmap())
    basic = sorted(every & set(BASIC))
    missing = sorted(set(BASIC) - every)
    if missing:
        sys.exit("not in the source font: " + ", ".join(f"U+{code:04X}" for code in missing))
    # The null and the byte-order mark draw nothing; no page needs a font for them.
    more = sorted(every - set(basic) - {0x0000, 0xFEFF})
    cut(basic, "inter-basic-wght-normal.woff2")
    cut(more, "inter-more-wght-normal.woff2")
    print("unicode-range of inter-more:")
    print(ranges(more))


if __name__ == "__main__":
    main()
