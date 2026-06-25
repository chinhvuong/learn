# Issue #44 — Lesson Player: Cover → Warm-up → Reading immersion (§10)

Design references exported from `docs/design/design.pen` (Pencil MCP) and the
matching running-app screenshots captured on the booted iOS simulator
(iPhone 16 Pro, RN debug build off this branch's JS bundle).

## Screen-by-screen

| Screen (node) | Design ref | Running app |
|---|---|---|
| LP1 Cover · YouTube (`ZeE5Q`) | `design-cover-youtube.png` | `impl-cover-youtube-light.png`, `impl-cover-youtube-dark.png` |
| LP1 Cover · Article (`LvMs5`) | `design-cover-article.png` | `impl-cover-article-light.png` |
| LP1 Cover · Podcast (`tiWTV`) | `design-cover-podcast.png` | `impl-cover-podcast-light.png` |
| LP1 Cover · Raw text (`fvpcK`) | `design-cover-text.png` | `impl-cover-text-light.png` |
| LP2 Warm-up deck (`oFKYA`) | `design-warmup-deck.png` | `impl-warmup-deck-light.png`, `impl-warmup-deck-dark.png` |
| LP2b Warm-up list (`L8QvdJ`) | `design-warmup-list.png` | `impl-warmup-list-light.png` |
| LP3 Reading p1 (`ZVzfM`) | `design-reading-p1.png` | `impl-reading-p1-light.png`, `impl-reading-p1-dark.png` |
| LP3b Reading p3 + Item popup (`edu17`) | `design-reading-p3.png` | `impl-reading-p3-light.png` |
| LP3c Reading p5 + finish (`oyotO`) | `design-reading-p5.png` | `impl-reading-p5-light.png` |
| Absorption gesture (teal→amber + North Star +1) | `design-reading-p3.png` | `impl-reading-absorb-popup-light.png`, `impl-reading-absorb-popup-dark.png` |

## Notes
- Reached via the Home "Tiếp tục" (Continue) card, which points at the bundled
  §10 flagship Lesson; the player runs Cover → Warm-up → Reading → (existing
  quiz → complete).
- The 4 per-Source-type Cover variants are reachable in-app by tapping the
  Cover's ↗ (share) which cycles youtube → article → podcast → text.
- Absorption gesture verified live: tapping a teal Item recolors it amber and
  counts the North Star up (1,228 → 1,229 → 1,230 …), in both light and dark.
- All design tokens via the OKLCH NativeWind token system; Vietnamese copy
  matches the pen; English appears only as Lesson content.
</content>
