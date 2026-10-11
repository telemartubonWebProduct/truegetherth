# The pictures of the four steps: sources and prompts

Four small paintings for the slip in "How it works" on the home page, one for each step, in the manner of the page's opening picture (`design/hero/tableau`). The owner asked for them on 11 Oct 2026: the slip's picture was a bed of strokes and looked empty. What the site does with them is in `docs/renovation/R11-STEP-PICTURES.md`.

| Step | File in `source/` | What it shows |
| --- | --- | --- |
| 1. Choose a service | `1-choose.png` | The muse with her headphones picks the middle of three cards; a cherub points at it |
| 2. Get in touch | `2-contact.png` | One cherub on the phone, another letting a winged letter go |
| 3. Area check | `3-area.png` | The sea god looks through a spyglass at a house among palms; a beam of light falls on it |
| 4. Installation booked | `4-install.png` | The goddess sets the router on the house's roof; a cherub holds an hourglass |

Made with Higgsfield (model `gpt_image_2`, 16:9, 1K, medium quality: 1344 × 752, one credit each on the owner's account), each on the first try. After changing a source, run `node scripts/media/step-pictures.mjs`; a changed picture goes in a new folder (`steps-v2`), as with the hero.

## What to check before keeping a picture

- **No lettering and no logo anywhere**, above all on the router and on any phone or card. No generator may draw a True logo, a LINE logo or any other mark. The cards of step 1 carry three plain arcs and nothing else.
- Nothing states a speed, a price, a date or an offer. (The hourglass of step 4 stands for the appointment; a calendar would come back with numbers.)
- The router of step 4 is the site's own: a low white box, six paddle antennas splayed like a crown, a row of green lights. `design/hero/tableau/reference/router-plain.png` is attached for it.
- Everything that matters sits in the middle band of the picture: on a phone the slip shows a strip 16:7, so the top and the bottom of each picture are lost.
- Everyone is dressed. Higgsfield refuses the hero painting itself as a reference picture (its cherubs and the sea god are bare), and the same check may refuse a result; hence the tunics and the sea god's robe. For the same reason the pictures were made from words, with only the router attached.

## The prompts

Each prompt is the same first paragraph and the same last paragraph around its own scene.

First paragraph:

```text
A classical oil painting in the manner of an 18th-century European allegorical ceiling painting: soft warm golden light, luminous cumulus clouds in cream and pale gold against a soft blue sky, visible brushwork and the fine craquelure of an old canvas, gentle academic realism.
```

Last paragraph:

```text
Wide composition: all the action sits in the middle band of the picture, with calm sky and cloud along the top and bottom edges, so it can be cropped to a wide strip. Everyone is fully clothed. No text, no letters, no numbers, no logos, no brand marks, no watermark, no signature.
```

### 1. Choose a service

```text
Scene: a young muse with light brown hair, in a flowing pale yellow-gold classical robe and wearing modern white over-ear headphones, sits on a cloud. Three plain cream-coloured cards float in the air in front of her in a row. Each card shows only one small painted symbol of three curved golden arcs, like a wireless signal, and nothing else. She reaches out and touches the middle card, which glows brightest with warm golden light. Beside her a small winged child in a short white tunic points at the same card with delight.
```

### 2. Get in touch

```text
Scene: two small winged children in short white tunics on a cloud. The one on the left holds a modern smartphone to its ear and smiles as it talks; the phone is plain, its screen dark. The one on the right lets go of a small folded paper letter that flies away to the right on a pair of little white dove wings, trailing a thin ribbon of golden light across the sky.
```

Add `no app icons` to the last paragraph.

### 3. Area check

```text
Scene: on the left, an old sea god with a long grey beard and long grey hair, wearing a full blue-grey robe that covers his chest and both shoulders, leans forward from a bank of cloud and looks through a brass spyglass. He looks down to the right at a small modern Thai house with a gabled red-tiled roof, standing among palm and banana trees on a green hillside far below. A single narrow beam of golden light falls from the clouds exactly onto the house. A small winged child in a short white tunic beside him points down at the house.
```

### 4. Installation booked

Attach `design/hero/tableau/reference/router-plain.png` and put this paragraph before the scene:

```text
The attached image shows a home Wi-Fi router. Paint that same router in oil paint: a low, wide, flat white box with softly rounded corners, a top covered in fine diagonal vent slats, a row of small green status lights along its front, and exactly six long white paddle antennas that splay outward like a crown. It is completely plain: no lettering and no logo anywhere on it.
```

```text
Scene: a young goddess with long wavy golden-brown hair, in a flowing white classical robe with a red sash across her body, kneels on a low cloud and with both hands gently sets the white router on the ridge of the red-tiled roof of a small modern Thai house among palm and banana trees. Soft rings and rays of golden light spread out from the router over the house. A small winged child in a short white tunic hovers beside her holding a small brass hourglass.
```
