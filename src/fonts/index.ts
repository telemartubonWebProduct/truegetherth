import localFont from "next/font/local";

// The site's two typefaces, served from this repository (next/font/google made
// builds fail now and then, and a build should never wait on a font server).
// Inter draws Latin text and numbers, Anuphan draws Thai; Inter's files hold no
// Thai glyphs, so Thai falls through to Anuphan in the same stack. Both are
// variable fonts under the SIL Open Font License (LICENSE-*.txt beside this
// file). Every root layout imports these objects, so each font is defined and
// hosted once.
//
// A page fetches its fonts before its first paint, so Inter comes in two cuts
// (scripts/fonts/subset.py): the letters, figures and signs the site's own
// words use, which every page asks for up front, and the rest of the Latin
// range (accented letters, rarer signs), which a browser fetches only when a
// page shows one of them. Both hold the weights the styles set, 300 to 700.

export const inter = localFont({
  src: "./inter-basic-wght-normal.woff2",
  weight: "300 700",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
});

/** The rest of Inter's Latin range. Named first in a stack: its unicode-range keeps it to its own characters. */
export const interMore = localFont({
  src: "./inter-more-wght-normal.woff2",
  weight: "300 700",
  style: "normal",
  display: "swap",
  variable: "--font-inter-more",
  preload: false,
  adjustFontFallback: false,
  // Printed by scripts/fonts/subset.py.
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+00A1-00A6, U+00A8, U+00AA-00AC, U+00AF, U+00B4-00B6, U+00B8-00D6, U+00D8-00E8, U+00EA-00F6, U+00F8-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+2002, U+2009, U+200B, U+201A, U+201E, U+2039-203A, U+2044",
    },
  ],
});

export const anuphan = localFont({
  src: "./anuphan-thai-wght-normal.woff2",
  weight: "100 700",
  style: "normal",
  display: "swap",
  variable: "--font-anuphan",
});

/** Class names that set --font-inter, --font-inter-more and --font-anuphan on an element. */
export const fontVariables = `${inter.variable} ${interMore.variable} ${anuphan.variable}`;
