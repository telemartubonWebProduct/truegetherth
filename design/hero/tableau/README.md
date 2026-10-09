# Hero tableau: sources and prompts

The home page's opening as a layered oil painting: a goddess lifts the True router over her head, with cherubs, a sea god and a muse around her, each holding something that needs the internet. The owner chose this on 8 Oct 2026 (concept A below). The picture is cut into layers so each figure can drift on its own; the page puts thin "signal" frames over them.

This file is the brief for the pictures: what to generate, in what order, and what to check before keeping one. What the site does with them is in `docs/renovation/R6-HERO-TABLEAU.md`.

## Two packs

There are two paintings: a wide one for desktop and an upright one for phones. The owner made both on 9 Oct 2026 with Nano Banana Pro (2K, 2752×1536 and 1536×2752, delivered as JPEG, some saved with a `.png` name):

- `source/master.jpg` — wide. It follows `drafts/draft-a-landscape.jpg` closely.
- `source/master-portrait.jpg` — upright, with its own figures: the goddess from the front, four cherubs, the sea god and the muse at her feet.

Each painting gives three pictures. Everything is derived from the painting itself, so the light and the brushwork agree across its layers.

**Where it stands (9 Oct 2026).** The wide painting is done and on the site: `master.jpg` (with the True router), `figures.png`, `plate.png`, `near-clouds.png`. Of the upright one only the sky is used (`plate-portrait.png`): `master-portrait.jpg` still has a generic router with five antennas, and `figures-portrait.png` kept the sky above and the clouds below the figures, with green only in between, so it cannot be cut. Until those two are made again (steps 1 and 2), the phone shows the wide painting's figures stood upright over the upright sky.

| # | Picture | Attach | Save in `source/` as |
|---|---|---|---|
| 1 | The painting with the True router in it | the painting and `reference/router-plain.png` | `master.png`, `master-portrait.png` |
| 2 | The figures alone, on green, no clouds | the painting from 1 | `figures.png`, `figures-portrait.png` |
| 3 | The sky alone, figures painted out | the painting from 1 | `plate.png`, `plate-portrait.png` |
| 4 | A bank of near cloud, on green (wide only; the phone reuses it) | the wide sky from 3 | `near-clouds.png` |

Settings: Nano Banana Pro, 4K if offered, otherwise 2K; two to four pictures per prompt, keep the best. Save the generator's own download, not a screenshot (a JPEG is fine; keep its real extension). Do step 1 first: steps 2 and 3 are made from its result.

## The router and the logo

**No generator may draw a True logo.** The real mark (`design/hero/router/trueonline.png`) is laid onto the router afterwards by the cutting script. `reference/router-plain.png` is the site's own 3D router (the still of the first hero, now `design/hero/router/poster-v3.webp`) with the True Online mark and the wording painted out, to attach as the picture of the router. If a picture comes back with lettering or a logo-like mark on the router, do not keep it.

The two paintings as first made do not show the True router: the wide one has a generic router with its antennas in a row and some small garbled lettering on its top, the upright one a router with five antennas. Step 1 puts the real one in. If that does not work out, the fallback is to lay the site's own 3D render of the router over the painted one in the cutting script: exact, but crisper than the paint around it.

## 1. Put the True router in the painting

Attach the painting first and `reference/router-plain.png` second. Once for each painting.

```text
The first attached image is a painting. The second attached image shows a home Wi-Fi router.

Change only one thing in the painting: replace the router that the goddess holds above her head with the router from the second image, painted in the same oil-paint style and the same warm light as the rest of the painting. It is a low, wide, flat white box with softly rounded corners, a top covered in fine diagonal vent slats, a smooth plain label area at the right of its top, a row of small green status lights along the front of its top, and exactly six long white paddle antennas that splay outward like a crown: two on the left, two at the back, two on the right. She holds it in both hands in the same place and at about the same size as the old router, tilted a little towards the viewer so that its top with the vent slats is visible, with all six antennas clear against the sky. The router carries no logo, no lettering, no numbers and no stickers anywhere: every surface is plain white.

Everything else stays exactly as it is: every figure, face, hand, robe and device, every cloud, the sky, the light, the brushwork and the colours, all in the same positions.

No text, no logos, no watermark.
```

To dress the sea god as well (in both paintings his chest is bare), add before the last line: `Also give the sea god a full blue-grey robe that covers his chest and both shoulders; nothing else about him changes.`

Keep the result only if the router has six splayed antennas and no lettering, her hands hold it believably, and nothing else in the painting moved.

## 2. The figures alone, on green

Attach the painting from step 1. The same prompt serves both paintings.

```text
Use the attached painting as the exact reference.

Keep every figure exactly as painted, together with what each one holds or wears: the goddess with the white router held above her head, every winged cherub with its device, the bearded sea god with his tablet, and the muse with her headphones. If the sea god sits on a rock, keep that rock and the white surf at its base. Same poses, faces, drapery, brushwork, lighting and colours; every figure stays in exactly the same position and at exactly the same size in the frame.

Remove everything else, and above all every cloud: no cloud, mist or haze remains anywhere, not behind the figures, not between them and not under their feet. Where a cloud hid part of a figure, paint the hidden part of that figure in the same style, the rest of the robe, the legs and the feet, so that the figure is whole. The figures simply float on the flat background. Remove also the sky, the sea, the rays and the glow of light.

Replace the whole background with one perfectly flat, uniform, pure chroma-key green (#00FF00). The green fills the entire frame around the figures and every gap between them, including the gaps between the router's antennas, between arms and bodies, and between wings and bodies. No shadow, no glow, no haze, no gradient and no brush texture on the green. No green tint and no green reflections on the figures: the white robes, the wings and the router stay neutral white and cream.

Each figure ends in a clean, crisp painted edge against the green, with no halo and no soft fade. Nothing is added. No text, no logos, no watermark.
```

Check: laid over the painting, every figure sits where it was; the green is one flat colour; green shows between the antennas; nothing white has turned greenish; **no cloud is left**.

The first attempt (9 Oct 2026, with an earlier wording that asked to keep "the small bank of cloud" under three of the figures) kept the painting's large clouds, which joined all six figures into one piece. Otherwise it was right: the figures stayed exactly in place and their edges against the green were crisp, so the method holds.

If one figure comes out wrong while the rest are good, make that figure again on its own and save it as `source/figure-<name>.png` (`goddess`, `cherub-phone`, `cherub-controller`, `cherub-laptop`, `sea-god`, `muse`; add `-portrait` for the upright painting):

```text
Use the attached painting as the exact reference. Keep only [THE FIGURE] exactly as painted, in exactly the same position and at exactly the same size in the frame, with the same pose, face, drapery, brushwork, lighting and colours. Remove everything else, including every other figure and every cloud. Replace the whole background with one perfectly flat, uniform, pure chroma-key green (#00FF00), with no shadow, glow, gradient or texture on it, and no green tint on the figure. The figure ends in a clean, crisp painted edge against the green. No text, no logos, no watermark.
```

`[THE FIGURE]` is one of: `the goddess holding the white router above her head` · `the cherub holding the smartphone` · `the cherub holding the game controller` · `the cherub carrying the laptop` · `the bearded sea god reading the tablet, with the rock he sits on` · `the muse with the headphones`.

## 3. The sky alone

Attach the painting from step 1. The same prompt serves both paintings.

```text
Use the attached painting as the exact reference.

Remove every figure completely, with everything they hold: the goddess and the router, every cherub and its device, the sea god with his tablet and the rock he sits on, and the muse. Paint what lies behind them, continuing the sky, the clouds, the golden radiance with its faint rays, and the sea, so that no trace, outline, shadow or ghost of any figure remains. Where the goddess stood and where figures sat, the cloud simply continues.

Keep everything else exactly as it is: every cloud in the same place, the same warm golden light glowing from the same point, the same dark areas, the same brushwork, craquelure and colours. The result is the same painting as an empty sky.

No people, no animals, no birds, no objects. No text, no logos, no watermark, no border.
```

Check: no ghost of a figure anywhere; the glow is where the router was; the clouds have not moved.

## 4. A bank of near cloud, on green

Attach the wide sky from step 3. This layer sits in front of everything and moves the most, which is what gives the picture its depth; it also covers the feet and hems of the figures that stand in cloud.

The picture that came back for this prompt on 9 Oct 2026 is not a cloud on green: it is the whole sky again, with green painted along the top of the lowest cloud bank. That is enough: the script takes, in each column, what lies below the lowest green. A picture that follows the prompt to the letter (a cloud bank on plain green) is read the same way.

```text
Use the attached painting only as the reference for style, colour and light: the same oil-paint brushwork, the same warm golden light, the same cream, gold and blue-grey cloud colours.

On a perfectly flat, uniform, pure chroma-key green (#00FF00) background, in wide 16:9 format, paint only one thing: a long, low bank of billowing cumulus cloud lying along the bottom edge of the picture. It is lowest at the left, about one tenth of the picture's height, and swells to about one third of the height at the right. Its tops are lit warm gold and cream; its underside is soft blue-grey. Its upper outline is a clearly defined, crisp painted edge of rounded billows against the green, with no mist, haze or wisps drifting off it. The cloud runs off the left, right and bottom edges of the picture.

Everything above the cloud is plain flat green: no sky, no sun, no rays, no other clouds, no figures, no shadow, no gradient and no texture on the green, and no green tint in the cloud. No text, no logos, no watermark.
```

## Painting a master from nothing

Not needed while the two paintings above are kept. To start a wide painting again, attach `reference/router-plain.png`; this wording asks for what makes the cutting easy (figures that do not touch, an empty dark corner for the headline, open sky along the top).

```text
Attached is a reference picture of a home Wi-Fi router. Paint this exact router into the picture described below: a low, wide, flat white box with softly rounded corners, a top covered in fine diagonal vent slats, a smooth plain label area at the right of the top, a row of small green status lights along the front of the top, and exactly six long white paddle antennas that splay outward like a crown: two on the left, two at the back, two on the right. The router carries no logo, no lettering and no stickers anywhere; the label area is left empty and every surface is plain white.

An original oil painting in the manner of 19th-century French academic painting, wide 16:9 landscape format: a mythological apotheosis in the heavens, with a gently humorous modern twist.

The goddess, the main figure. Slightly right of centre, a serene adult goddess stands on a bank of sunlit cloud, facing the viewer with her body turned slightly to the left. She wears a long ivory robe that covers her from shoulders to ankles, with one crimson red drape across her body. She holds the router high above her head in both hands, arms almost straight, tilted a little towards the viewer so that its top is visible, all six antennas clear against the bright sky. The tips of the antennas come no higher than about one eighth of the way down from the top edge of the picture. A soft golden radiance and faint rays of light spread from behind the router.

The attendants. There are six figures in all, and each one is separate: no figure touches, overlaps or hides any part of another, and clear sky shows between every figure and the next.
- Above and to the left of the goddess, a small winged cherub in the manner of Baroque ceiling painting, dressed in a long white gown that covers it from neck to ankles, flies holding a smartphone in both hands.
- Below and to the left of the goddess, a second cherub in the same long white gown flies holding a white video-game controller.
- Below and to the right of the goddess, a third cherub in the same long white gown flies carrying an open laptop.
- In the upper left quarter of the picture, a dignified old bearded sea god sits on a bank of cloud. He wears a full blue-grey robe that covers his chest, both shoulders and his legs, and reads a tablet held in both hands. His feet come no lower than the middle of the picture's height.
- At the far right, a muse in a long cream robe sits on a cloud, with white headphones over her ears and one hand raised to them, her eyes lifted to the router. She sits wholly inside the picture, well clear of the right edge.

Empty areas, which matter. The lower left of the picture, meaning the left 45 percent of the width and the bottom 45 percent of the height, holds no figures and no objects: only a calm, dark, deep teal sea far below and low shadowed clouds, darker than the rest of the painting. The top eighth of the picture is open sky only.

Light and paint. Warm golden-hour light from behind the router, towering cumulus clouds, a blue sky deepening towards the upper corners. Rich visible brushwork and the fine craquelure of an old canvas, sharp and finely detailed in the faces, the hands, the router and the devices. Palette: sky blue, ivory, cream, soft gold and muted teal; red appears only in the goddess's one crimson drape. The screens of the smartphone, the tablet and the laptop show a plain soft glow with nothing on them.

Every figure is fully and modestly dressed. No bare chests, no nudity. No text, no letters, no numbers, no logos, no brand marks, no watermark, no signature, no border and no picture frame: the painting fills the whole image from edge to edge.
```

If the generator refuses the cherubs, replace each "small winged cherub in the manner of Baroque ceiling painting" with `small winged spirit of victory, an adult woman at a third of the goddess's size` and keep the long white gowns.

## What the site does with them

`node scripts/media/hero-tableau.mjs` keys the green out of `figures.png`, splits it into its six figures, takes the near cloud from `near-clouds.png`, and writes the sky, every layer and the True Online mark to `public/media/hero-v4/` and each layer's place to `src/components/site/home/hero-tableau.ts`. With `--debug` it saves every cut-out on magenta and each arrangement laid flat to `shots/hero-tableau/`, to look at before the page. How it works, and what to do when a picture is made again, is in `docs/renovation/R6-HERO-TABLEAU.md`.

## The drafts (8 Oct 2026)

`drafts/` holds the concept drafts the owner chose from, and mock-ups of the page over them. Higgsfield, Seedream 5.0 Flash, 2K, 0.5 credit each (free plan: one job at a time, a batch of several is refused with "rate_limit_reached"). The provider's filter rejected three of seven requests as "nsfw" (the cherubs, and a bare-chested god); a rejected request is not charged.

- `draft-a-landscape`, `draft-a-portrait` — **A, chosen**: the goddess lifts the router; the figures stand apart, so they cut into layers.
- `draft-b-landscape` — B: a goddess hands the router down to a group; the best empty corner for the headline, but the group overlaps and gives about three layers.
- `draft-c-landscape` — C: a gathering on a marble terrace; no calm area for the headline and little depth.
- `mock-a-desktop.jpg`, `mock-a-phone.jpg`, `mock-b-desktop.jpg` — the navigation, headline, buttons and signal frames drawn over the drafts. On the phone the router must start below the navigation: the layers are placed with open sky above it.
