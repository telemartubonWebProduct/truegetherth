import localFont from "next/font/local";

// The site's two typefaces, served from this repository (next/font/google made
// builds fail now and then, and a build should never wait on a font server).
// Inter draws Latin text and numbers, Anuphan draws Thai; Inter's file holds no
// Thai glyphs, so Thai falls through to Anuphan in the same stack. Both are
// variable fonts under the SIL Open Font License (LICENSE-*.txt beside this
// file). Every root layout imports these objects, so each font is defined and
// hosted once.

export const inter = localFont({
  src: "./inter-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
});

export const anuphan = localFont({
  src: "./anuphan-thai-wght-normal.woff2",
  weight: "100 700",
  style: "normal",
  display: "swap",
  variable: "--font-anuphan",
});

/** Class names that set --font-inter and --font-anuphan on an element. */
export const fontVariables = `${inter.variable} ${anuphan.variable}`;
