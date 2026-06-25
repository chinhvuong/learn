# Issue #42 — Onboarding flow, pixel-perfect to `design.pen`

## What was built

The full §01 Onboarding flow (`EuQIR`) was brought to pixel parity with `design.pen`, end-to-end navigable from app launch through to the core-loop entry: **Welcome → Topics (empty/selected) → Reading Level → Result + Daily Goal → Signup (or Login) → Push priming → Main tab shell**. The navigation, onboarding Redux state, topic catalog, CEFR options and Daily Goal presets already existed (#41 baseline + onboarding slice); this slice rebuilt the screen UIs against the exact Pencil specs (`batch_get` per node), using only the established NativeWind token system (`bg-flow`, `bg-flow-soft`, `text-flow-ink`, `bg-warm-soft`, `text-warm-ink`, `bg-app-bg`, `bg-surface`, `text-on-flow`, `border-hair`, `text-ink/ink2/ink3`) — no hardcoded colors. All UI copy is the verbatim Vietnamese already in `vi.json`; new Welcome-hero strings were added to `vi.json` + `en.json`.

Each screen re-themes light/dark automatically because every color is a token (the `useColors()` JS reads the same light/dark sets, and inline shadows use `colors.flow`). The Topics empty↔selected toggle is driven by the real `selectedTopicIds` state with the exact selected styling from `myPdm` (flow-soft fill, flow border, 16px teal check circle) and the gated bottom bar (muted `surface2` button + `Chọn thêm N nữa` → flow button + `Đã chọn N ✓`).

## Per-screen mapping to acceptance criteria

- **01 Welcome (`v0Vkv`)** — Rebuilt from minimal stub to full hero: brand row (Inflow mark + In/flow two-tone wordmark + VI→EN language pill), floating "The Daily" podcast card (warm play thumb, sparkles badge, 22-bar equalizer with 9 played teal bars, `"a [groundbreaking] idea"` amber Chunk annotation), three rotated Source-type chips (Podcast/Video/Bài viết), two-tone headline (`Học tiếng Anh bằng` ink / `nội dung bạn mê` flow, 27px/800), subtitle, `ShieldCheck` proof line, gradient-shadow CTA `Bắt đầu miễn phí` + arrow, `Đã có tài khoản? Đăng nhập`. Top-down flow-soft→app-bg wash via SVG. Tokens: flow/warm/warm-soft/warm-ink/surface/hair/ink/ink2/ink3/on-flow.
- **02a/02b Topics (`e6t3i` / `myPdm`)** — Emoji chips (matches design — emoji, not icons), `px-14 py-10` r-12, gap 7, flex-wrap gap 8. Unselected surface+border / ink; selected flow-soft + flow border + flow-ink label + 16px teal check circle (white `Check`). 3-segment progress (first filled). Bottom bar with top hairline, hint + gated button exactly per both states.
- **03 Reading Level (`MHhZf`)** — Radio moved to the **left** as a 20×20 r-10 control (selected = flow fill + white `Check`, not a dot), card `p-14` r-14, selected flow-soft + flow border (no shadow per design), title 24/800, options 15.5/700 + example 13.5. Hint is a single warm-soft card (text already carries the 💡). Full-width flow CTA. Progress 2/3.
- **05 Result + Daily Goal (`N5NT6Z`)** — North Star card is now a **solid warm-soft** card (r-18, `py-20 px-18`) — replaced the previous SVG gradient — with `NORTH STAR` (11/letterSpacing 2), 58px number, `+N Item vừa nạp` (14/600), and the by-type breakdown row (gap 16), all warm-ink. 🎉 48 + title 23/800. Goal radio cards left-aligned (flow check) matching the level cards. Full-width flow CTA.
- **06 Signup (`a21pD`)** — Centered hero: 🔥 in 64×64 warm-soft r-18 tile, title 26/800, body 14.5. Bottom: Apple (ink fill, app-bg text) / Google (surface+border) / ✉️ Dùng Email (surface+border), each r-14 `py-15` 15.5/600; terms line 12/ink3. Keeps the real anonymous→account migration and the email sub-mode.
- **06b Login (`NoJf8`)** — Back chevron 38×38 r-12 surface+border, InflowLogo 56/16 (the design's flow-gradient `waves` tile), title 26/800, fields via `AppInput`, divider, 2-up Apple/Google, footer. Same brand refinement applied to Register (the email-signup destination). Both set `headerShown: false` so the screen owns its chrome.
- **07 Push priming (`JvIDh`)** — 🔔 in 72×72 flow-soft r-20 tile with the amber `1` badge (24×24, app-bg ring), title 26/800, two benefit **cards** (surface+border, 42×42 flow-soft emoji tiles 🔥/✨), full-width `Bật thông báo` flow button + plain `Để sau` (ink3). Finishes onboarding and resets to `Main`.

## Deliberate deltas

- **Topics layout** uses RN flex-wrap rather than the design's hand-authored fixed rows — visually identical, but reflows correctly across device widths (the static .pen rows are a canvas artifact).
- **Welcome background glow/sparkle dots** from the .pen (decorative radial glow + 2 spark ellipses) are approximated by the gradient wash; the load-bearing hero elements (card, chips, annotation) are reproduced faithfully.
- **Login/Register** keep the existing `AppInput`/zod form logic (real validation) under the design's refreshed chrome; the .pen shows static field mocks only.

## Verification

- `tsc --noEmit`: clean (exit 0, no errors).
- `jest`: **Test Suites: 13 passed, 13 total · Tests: 141 passed, 141 total**.
- No mobile ESLint config exists in this project, so lint is N/A for `mobile/` (the repo's `yarn lint` is a backend script).
- Per the issue, the iOS simulator was **not** run (shared resource; #43 in parallel) — verified against the Pencil design exports only. Reference images: `design-*.png` in this folder; the orchestrator captures the running-app side.
