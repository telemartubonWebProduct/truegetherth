# MotionSites shortlist — Telemart Ubon

Status: the user selected **A+B+C** on 2026-09-29. A supplies a clean opening, B supplies package comparison, and C supplies clean composition and a prominent True Wi-Fi router visual. Checked through the connected MotionSites MCP catalog and viewed each preview in the browser. These are design prompts/references, including individual sections; they are not a ready-made Next.js application or CMS.

After selection, all three full prompts were requested through `get_prompt`. The integration returned `locked: true`, `reason: premium_prompt` for A, B and C; the connected account currently lacks premium access. No full prompt text was returned and no subscription was purchased. Public previews remain usable as visual references for an independently designed Telemart adaptation. Some catalog `?prompt=` links currently load the main gallery without focusing the selected item; the direct preview links below were verified separately.

## Proposed free route after the user's Premium question

`get_prompt("rocket-pricing")` returned the full prompt with `access: free`, `locked: false` on 2026-09-29. At retrieval, 2 of the account's 3 free prompt openings remained. The paid A/B/C full prompts are not required for the proposed implementation: keep the selected clean design direction through an original Telemart brief, with Rocket Pricing supplying a free comparison-card reference.

The full free reference was inspected locally; the repository handoff carries the independent [FREE-DESIGN-BRIEF.md](FREE-DESIGN-BRIEF.md) and the [public Rocket Pricing reference](https://motionsites.ai/?prompt=rocket-pricing). The reference's React 18/Vite, course prices, signup URLs, exact-copy instructions and dark palette are example content, not requirements for this Next.js/Thai/white-red-black lead website. Do not pass its fake commercial data into CMS.

The free-filtered library listing returned zero results in one call even though `search_prompts` and `get_prompt` exposed free items. Report successful access to the specific Rocket Pricing prompt; do not infer that all free templates are unavailable or that free prompt access is unlimited.

| Choice | Exact catalog title | Access | Proposed use in Telemart | Trade-off |
|---|---|---|---|---|
| A — recommended foundation | Minimal Workflow SaaS | Premium | Clean white hero, concise Thai headline, red CTA; replace its portrait with an abstract home-connectivity graphic | A hero reference, so package comparison and supporting sections must be designed |
| B — recommended package section | SaaS Pricing Flow | Premium | Three clear package tiers, speed/price/benefits/conditions and prominent apply buttons; use white panels and red accents | Original is dark with blue imagery; the final Telemart adaptation changes colors and business content |
| C — expressive hero alternative | NEX Robotics | Premium | Large technology visual and confident typography; replace the robot with an original abstract fibre/connectivity graphic | Strong art direction; Thai text and mobile layouts need careful adaptation |
| D — free package alternative | Rocket Pricing | Free | Straightforward package comparison and a recommended-plan badge; use red/white/black | The reference is a two-card pricing section, not a whole website |

## Verified references

- A: [Minimal Workflow SaaS](https://motionsites.ai/?prompt=minimal-workflow-saas) · [Animated preview](https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/hero%20sections/animated%20(86).webp)
- B: [SaaS Pricing Flow](https://motionsites.ai/?prompt=saas-pricing-flow) · [Animated preview](https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/animated%20(35).webp)
- C: [NEX Robotics](https://motionsites.ai/?prompt=nex-robotics) · [Preview](https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260828_023245_3411b2db-f768-420b-9fba-13485ac46c23.png&w=1280&q=85)
- D: [Rocket Pricing](https://motionsites.ai/?prompt=rocket-pricing) · [Animated preview](https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/animated%20(55).webp)

## Application rules

- Telemart identity and Thai sales copy are primary; use True-inspired white/red/black without implying an unverified official status.
- Package prices, eligibility, speed, VAT, contract period and benefits come from confirmed business data, never from the template or an AI invention.
- Preserve supplied product photographs/logos. Higgsfield is for original decorative graphics and optional background video only.
- Keep headlines, images/video/posters, backgrounds, CTAs, cards, navigation, footer and theme settings bound to editable CMS fields.
- Keep motions restrained, respect reduced motion, use a static video fallback, and prioritise mobile page speed.
- Build the public site and Mirror Editor using one shared page renderer, regardless of template selection.
- Selected editor scope: edit all content/image/CTA/background values while keeping the approved layout fixed. No free-form layout builder or drag/reorder of sections.
- Selected operations scope: a single Admin role for content and IT checks; Vercel hosting with the existing domain.
- Selected product visual: True Wi-Fi router (not TrueID TV). The user permits Three.js, Higgsfield or another method based on quality; proposed default is actual 3D with a poster fallback, subject to reference fidelity and mobile checks.

Provider notice (verbatim):

Access ALL prompts for stunning animated websites in one click: https://motionsites.ai/unlimited
