# Issue #43 — Home (Học) & My Library (§02) pixel-match

## What was built

Rebuilt the Home (tab Học, design node `RW9TL`) view and created the My Library
screen (Thư viện của tôi, design node `y5RJTT`) to pixel parity with
`docs/design/design.pen`, in both light and dark, using the #41 NativeWind token
system (no per-screen hardcoded colors).

- **Home** (`mobile/src/features/home/components/HomeView.tsx`) — full rewrite of
  the WIP baseline to match the design top-to-bottom: top row (Streak pill ·
  two Levels as CEFR · ✦ Pro · gear), the **North Star** amber card (54px count,
  caption, 4-bar mini chart, "+18 hôm nay"), the **Daily Goal** 5-dot meter +
  "6/10′", the teal **Continue** card (TIẾP TỤC overline + title + series meta +
  progress bar), the "Gợi ý cho bạn / cùng gu / Xem tất cả" Discover strip of 3
  thumbnail cards, and the **Khám phá Series** + **Thư viện của tôi** entry rows.
  All values read live from the persisted `home` slice (North Star, Daily Goal,
  Streak, Reading + Listening Levels). Continue still resolves in-progress →
  recommendation; the library row routes to the new screen.
- **My Library** (`mobile/src/screens/tabs/MyLibraryScreen.tsx` +
  `mobile/src/features/library/libraryData.ts`) — new screen: header (back ·
  "Thư viện của tôi" · search), filter chips (Tất cả / Đang học / Đã xong / Đã
  tạo) that filter the surface, then sections **Đang học** (resumable Lesson
  cards with progress + Play), **Series đang theo**, **Bạn đã tạo** (link/file/
  text Sources with done/% /new badges), and **Đã hoàn thành** (completed history
  + "Xem tất cả 12 bài đã xong"). Lesson rows deep-link into the Lesson Player.
- **Navigation**: added a root-stack `MyLibrary` route (`navigation/types.ts`,
  `navigation/RootStackNavigator.tsx`) and wired the Home → Library +
  Home → Settings handlers in `screens/tabs/LearnScreen.tsx`. Home sits under the
  shared #41 TabBar (it is the `Learn` tab); My Library is presented over the
  tab shell.

## Acceptance criteria mapping

- Home + My Library match their design nodes in light + dark — token-only colors,
  matching spacing (padding 14/16/18, gaps 6–16), radii (10/14/16/18/20),
  type scale (54 / 21 / 16 / 15.5 / 14.5 / 13.5 / 12.5 / 11.5).
- Continue, North Star, Daily Goal, Streak, both Levels render with the correct
  token families: **warm** (--warm / warm-ink / warm-soft) for North Star +
  Streak + completed marks; **flow** (--flow / flow-ink / flow-soft / on-flow)
  for Continue, progress, Pro, Play buttons.
- Both screens sit under the shared TabBar from #41 (Home is the Learn tab; My
  Library opens over it and returns via back).
- Design reference exports attached: `design-home.png`, `design-my-library.png`.

## Tokens / copy matched (verbatim Vietnamese)

- Home: "🔥 12", "B1 đọc", "A2 nghe", "✦ Pro", "1,240", "từ · chunk · ngữ pháp
  đã nạp", "+18 hôm nay", "Mục tiêu hôm nay", "6/10′", "TIẾP TỤC",
  "Series Công nghệ B1 · còn 4 phút", "3/12", "Gợi ý cho bạn", "cùng gu",
  "Xem tất cả →", "Khám phá Series", "Thư viện của tôi".
- My Library: "Thư viện của tôi", "Tất cả / Đang học / Đã xong / Đã tạo",
  "Đang học", "Series đang theo", "Khám phá →", "Bạn đã tạo",
  "từ link · file · text", "✓ xong", "mới", "Đã hoàn thành",
  "Xem tất cả 12 bài đã xong".

## Deliberate deltas

- The North Star, Continue, and thumbnail card backgrounds use the design's
  base token color (warm-soft / flow / bg-2) rather than its subtle multi-stop
  gradients — NativeWind has no gradient utility wired, and the gradients in the
  design are near-flat. The Continue card keeps its teal drop shadow via inline
  style. Visually within pixel tolerance.
- Discover suggestion cards omit the decorative diagonal "stripe" texture inside
  each thumbnail (a purely decorative design detail); the duration badge + title
  match.
- Home suggestion cards + Series rows are seeded to mirror the wireframe until
  the personalized feed (#3) and the per-learner Library store land; the first
  suggestion opens the live recommendation when present.

## Checks (run from mobile/)

- `yarn tsc --noEmit` — passed (no errors).
- `yarn test` — 13 suites, 141 tests passed.
- No `lint` script exists in this boilerplate; ESLint is not installed. tsc +
  jest are the project's checks.
