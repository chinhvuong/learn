# Handoff: Inflow — Comprehensible-Input English Learning App (MVP)

## Overview
Inflow is a mobile app (Vietnamese-market, learners of English) built on the *comprehensible input* idea: learners turn content they already love — articles, videos, podcasts — into bilingual lessons, then read/listen while tapping unknown words to reveal meaning. The product's "North Star" metric is **Item nạp** (items absorbed): vocabulary, chunks, and grammar a learner has encountered and saved.

This bundle is a single HTML design file covering the full MVP screen set: design system, onboarding, the interactive core learning loop, lesson creation, profile, secondary/monetization screens, and edge/error states — in both **Light and Dark** themes.

## About the Design Files
The file in this bundle (`Inflow.dc.html`) is a **design reference created in HTML** — a prototype demonstrating intended look, copy, and behavior. **It is not production code to copy directly.** It is authored in a bespoke template runtime (a `<x-dc>` tag plus `support.js`); you should **not** ship that runtime.

Your task is to **recreate these designs in the target codebase's existing environment** (React Native, Flutter, SwiftUI, native Android, etc.) using its established patterns, component library, navigation, and state management. If no app environment exists yet, choose the most appropriate mobile framework and implement there. Treat the HTML as the spec for layout, color, type, copy, and interaction — not as a source to port line-by-line.

To view it: open `Inflow.dc.html` in a browser (keep `support.js` next to it). The page is a desktop gallery of phone frames; the **Core Loop** section's phone is fully interactive (tap words, listen, watch the North Star count up).

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, copy, and interaction states are all intentional. Recreate the UI pixel-accurately using the codebase's component primitives. The reference uses a light/dark token system (see **Design Tokens**) — wire these into the app's theming layer rather than hardcoding per-screen.

> Note on units: the reference is built at desktop scale inside ~390×844 phone frames. Treat the phone frame as a standard mobile viewport (~390pt wide). Pixel values below are as-authored; scale proportionally to the target device's points/dp.

> Note on language: all UI copy is **Vietnamese**; the English *lesson content* (article text, words) is intentionally English — that bilingual contrast is the core of the product. Keep the Vietnamese strings exact; they are the real product copy.

---

## Screens / Views

The gallery is organized into 7 sections (anchors in the file: `#system`, `#onboarding`, `#core`, `#create`, `#profile`, `#more`, `#edge`).

### 0 — Design System (`#system`)
Reference only — not a screen. Shows the palette (Flow teal / Absorbed amber / Slate ink), the type pairing (Be Vietnam Pro UI + Newsreader reading serif), and the **Item encoding legend** — how the 4 token types are visually marked in reading text:
- **Vocabulary**: thin (1.5px) teal underline.
- **Chunk** (multi-word phrase): bold text + thick (2.5px) teal underline.
- **Grammar**: teal-soft highlight pill (`--flow-soft` bg, `--flow-ink` text, 5px radius).
- **Absorbed**: once tapped/saved, the same token recolors from teal → **amber** (`--warm` family) — signaling it now counts toward the North Star.

### 1 — Onboarding (`#onboarding`)
First-run flow + auth. Screens, in order:
- **Splash / value prop** — Inflow logo, headline "Học tiếng Anh bằng chính nội dung bạn mê", subcopy about turning articles/video/podcast into lessons.
- **Interest picker** (2 states: empty, ≥3 selected) — wrap of tappable topic chips; "Chọn ít nhất 3". Progress dots at top (4 steps).
- **Reading level** — single-select list of levels (radio rows, 1.5px border, selected = teal).
- **First-lesson complete** — celebratory; "Bài đầu hoàn thành!" with a North Star summary card (amber-soft gradient).
- **Save-progress / sign-up prompt** — streak motif (🔥), "Lưu tiến độ của bạn", social + email buttons.
- **Login / welcome back** — email + password fields, "Chào mừng trở lại".
- **Notification opt-in** — "Bật thông báo?" with benefit rows + bell badge.

### 2 — Core Loop (`#core`) — THE KEY INTERACTIVE FLOW
This is the heart of the product and the one screen group that is fully interactive in the prototype. It is a multi-step in-lesson state machine. Steps (state key `lp.step`):
1. **home** → begin lesson.
2. **loading / processing** — spinner while the lesson is built (simulated 2s timeout).
3. **core** — flashcard-style intro of each new Item one at a time (`coreIdx` 0…N), with prev/next and jump-to-index dots. Order of ids: `reshaping, adopt, reluctant, giveup, lookfwd, cond`.
4. **reading** — the bilingual reading surface (Newsreader serif). Words are encoded per the legend. **Tap a token** → a meaning card pops up (definition + example), the token marks as *decided/absorbed* (recolors teal→amber), and a "+1" floats up to the **North Star counter**, which animates (count-up). "Biết hết phần còn lại" marks all remaining as known. Sentence-level translation can be toggled per sentence or all at once.
5. **listening** — audio mode: play/pause, slow-speed toggle, reveal-transcript, per-sentence translation toggle.
6. **quiz** — comprehension questions (3 items: main-idea, detail, inference). Tap an option → locks + reveals correct/incorrect; progress bar advances.
7. **complete** — lesson summary; North Star counts up (e.g. 1228→1234); CTA to continue.

Interactions to replicate precisely:
- **Token tap**: opens meaning card; first tap on a token sets `decided[id]=true` and triggers the float-up "+1" + counter animation. Re-tapping an absorbed token re-opens its card without re-incrementing.
- **North Star count-up**: animates the displayed number toward target in ~70–110ms ticks.
- Animations defined in the file (`@keyframes`): `popUp`, `ripple`, `floatPop`, `confettiFall`, `drift`, `riseFade`, `tokPop` (token absorb pop), `nsPop` (North Star pop), `spin`, `shimmer`, `pulseRing`.

### 3 — Create Lesson (`#create`)
"Biến nội dung bạn mê → bài học". Input methods: paste link (🔗), paste text, upload file. Shows empty and filled states of the link input, plus the building/processing transition into the core loop.

### 4 — Profile (`#profile`)
Learner home/stats. North Star total, streaks, skill level-up moment ("Kỹ năng Nghe đã lên B1!") with CEFR progression (A2→B1) and an explanatory card.

### 5 — More / Secondary (`#more`)
- **Discover Series** — "Khám phá Series": curated lesson collections, filter chips, "Dành cho bạn" rail, series cards (striped-placeholder cover, progress bar, "12 bài · ~50 phút · B1").
- **Paywall** — "Bạn vừa dùng hết 5 credit tạo tháng này", upgrade plan list + CTA.
- **Payment processing** — spinner, "Đang xử lý thanh toán…".
- **Paid welcome** — "Chào mừng tới Paid 🎉", feature unlock list.
- **Settings + Delete account** — confirm sheet ("Xoá tài khoản?", irreversible), password-changed success, account-deleted goodbye.

### 6 — Edge States (`#edge`)
- **Lesson build failed** — "Không tạo được bài" (link couldn't be fetched).
- **Offline** — "Mất kết nối" (offline lessons are a Paid feature).
- **Unsupported content** — "Nội dung không phù hợp".

---

## Interactions & Behavior

- **Theme**: app supports Light + Dark, driven by a `data-theme` attribute swapping the CSS custom-property set. In production, wire to the app's theme context / system appearance. The gallery header has a Light/Dark segmented toggle (dev affordance only).
- **Token reveal** (core loop): tap → meaning card + state transition candidate→absorbed (teal→amber) + "+1" float + North Star increment. See section 2.
- **Count-up animation**: number interpolates to target over short interval ticks.
- **Quiz**: options lock after first selection; correct/incorrect revealed; progress bar = `answeredCount / total`.
- **Sentence translation**: toggle per-sentence or all (`senOpen` map; `lpToggleAllSent` opens all if any closed, else closes all).
- **Listening controls**: play/pause, slow toggle, reveal transcript, translation toggle.
- **Loading**: lesson build and payment both show a spinner with a simulated delay before advancing.
- **Transitions**: cards enter with `popUp`/`floatPop`; absorbed tokens pop with `tokPop`; primary CTA may pulse with `pulseRing`.

## State Management
The prototype keeps everything in one component's state. For production, model at least:
- `theme`: `'light' | 'dark'`.
- **Core-loop machine** (`lp`): `step` (`home|loading|processing|core|reading|listening|quiz|complete`), `mode` (`read|listen`), `coreIdx`, `decided` (map of token id → absorbed), `card` (currently open meaning card id), `senOpen` (per-sentence translation flags), `quizIdx` + `quizAns` map, `listenSlow`/`listenText`/`listenTrans`/`paused`, `nsBig` (animating North Star value).
- **North Star**: `ns` / `nsLive` numeric counters that animate toward targets.
- Per-token visual state derives from `decided` + token `kind` (vocab/chunk/grammar).
- Lesson content (tokens, definitions, examples, quiz questions, sentence translations) is static demo data in the prototype — in production this comes from the lesson-build API. See `lpData()`, `lpQuizData()` in the file for the exact demo content and structure to model your DTOs on.

## Design Tokens

Authored as CSS custom properties; two full sets (light + dark). Colors are in `oklch()` — convert to hex/RGB as your platform needs, or keep OKLCH if supported.

### Colors — Light
| Token | Value | Role |
|---|---|---|
| `--bg` | `oklch(0.955 0.009 232)` | App canvas (cool near-white) |
| `--bg-2` | `oklch(0.925 0.012 232)` | Secondary canvas |
| `--app-bg` | `oklch(0.987 0.005 232)` | Phone screen bg |
| `--surface` | `oklch(1 0 0)` | Cards / sheets |
| `--surface-2` | `oklch(0.965 0.007 232)` | Inset / muted surface |
| `--hair` | `oklch(0.918 0.008 232)` | Hairline divider |
| `--border` | `oklch(0.885 0.010 232)` | Default border |
| `--ink` | `oklch(0.27 0.021 250)` | Primary text |
| `--ink-2` | `oklch(0.475 0.019 250)` | Secondary text |
| `--ink-3` | `oklch(0.625 0.015 250)` | Tertiary / captions |
| `--flow` | `oklch(0.595 0.097 215)` | **Primary (teal)** — actions, progress, nav |
| `--flow-press` | `oklch(0.515 0.094 215)` | Primary pressed |
| `--flow-ink` | `oklch(0.44 0.088 218)` | Teal text on light |
| `--flow-soft` | `oklch(0.935 0.034 210)` | Teal-soft fill (grammar pills) |
| `--warm` | `oklch(0.685 0.125 64)` | **Absorbed (amber)** — items, North Star, streak |
| `--warm-ink` | `oklch(0.515 0.118 56)` | Amber text |
| `--warm-soft` | `oklch(0.93 0.052 72)` | Amber-soft fill |
| `--on-flow` | `oklch(0.99 0.01 220)` | Text on teal |

### Colors — Dark
| Token | Value |
|---|---|
| `--bg` | `oklch(0.17 0.013 250)` |
| `--bg-2` | `oklch(0.205 0.014 250)` |
| `--app-bg` | `oklch(0.205 0.015 250)` |
| `--surface` | `oklch(0.245 0.017 250)` |
| `--surface-2` | `oklch(0.225 0.016 250)` |
| `--hair` | `oklch(0.295 0.016 250)` |
| `--border` | `oklch(0.33 0.018 250)` |
| `--ink` | `oklch(0.955 0.006 232)` |
| `--ink-2` | `oklch(0.745 0.013 232)` |
| `--ink-3` | `oklch(0.595 0.014 238)` |
| `--flow` | `oklch(0.72 0.10 200)` |
| `--flow-press` | `oklch(0.66 0.10 200)` |
| `--flow-ink` | `oklch(0.80 0.082 200)` |
| `--flow-soft` | `oklch(0.315 0.05 212)` |
| `--warm` | `oklch(0.80 0.122 70)` |
| `--warm-ink` | `oklch(0.83 0.10 73)` |
| `--warm-soft` | `oklch(0.335 0.052 64)` |
| `--on-flow` | `oklch(0.18 0.022 235)` |

### Typography
- **UI / headings / numerals**: **Be Vietnam Pro** (weights 400/500/600/700/800) — full Vietnamese support. Headings use negative letter-spacing (~ -0.4 to -1.2px) and weight 800.
- **Reading surface (English lesson text)**: **Newsreader** serif (optical-size 6–72; 400/500, plus italics) — gives lessons an "article" feel.
- Both from Google Fonts. Approx scale seen: display 38px / H2 23–27px / body 14–16px / caption 11.5–13px / micro label 10.5–11px (uppercase, 1.4–1.6px tracking).

### Radius
Common values: `5px` (token pills), `9–11px` (buttons/chips/nav), `14–18px` (cards/inputs), `22–26px` (large feature tiles), `50%` (avatars/dots). Phone screen corners ~ large rounded; physical bezel `--bezel: #0a0d12` (light) / `#05070a` (dark).

### Shadows
| Token | Light |
|---|---|
| `--shadow-sm` | `0 1px 2px rgba(22,42,62,.06), 0 1px 1px rgba(22,42,62,.04)` |
| `--shadow-md` | `0 2px 4px rgba(22,42,62,.05), 0 10px 24px -10px rgba(22,42,62,.16)` |
| `--shadow-lg` | `0 4px 8px rgba(22,42,62,.06), 0 24px 48px -16px rgba(22,42,62,.22)` |

(Dark shadows are heavier/black — see the `[data-theme="dark"]` block in the file.)

### Component-level props (from the prototype)
The root design exposes three tweakable flags worth keeping as app-level settings:
- `defaultTheme`: `'light' | 'dark'`.
- `showAnnotations` (default true): whether reading tokens show their type encoding (underlines/pills).
- `readingSerif` (default true): use Newsreader serif on the reading surface vs. the UI sans.

## Assets
- **No raster images.** Cover/illustration areas use **striped CSS placeholders** (`repeating-linear-gradient`). Replace with real series/cover art in production.
- **Fonts**: Be Vietnam Pro + Newsreader via Google Fonts (`<link>` in the file head).
- **Icons / decoration**: a few inline SVGs (the Inflow logo "flow" waves) and emoji used as quick illustration (🎉 🔥 👋 😕 📡 ★). Replace emoji with the app's real icon set where appropriate.
- The Inflow logo is a simple 2-wave SVG on a teal gradient rounded square — recreate as a vector asset.

## Files
- `Inflow.dc.html` — the complete design (all sections, both themes, interactive core loop, and the logic class with exact demo content and state machine).
- `support.js` — the prototype runtime. **Reference only — do not ship.** Needed only to open the HTML in a browser.

To study the exact interaction logic and demo data, read the `<script ... data-dc-script>` block near the end of `Inflow.dc.html` — methods prefixed `lp*` implement the core-loop state machine; `lpData()` / `lpQuizData()` hold the lesson content; the `:root` / `[data-theme="dark"]` blocks at the top hold all tokens.
