# Screens & Flows — UX Spec (MVP)

> Companion to `CONTEXT.md` (glossary), `docs/adr/*` (decisions), `docs/prd/0001-mvp.md` (feature scope).
> Wireframes are low-fidelity ASCII sketches capturing layout intent and decisions — not final visuals.
> Target Language = English, Native Language = Vietnamese. App name: **Inflow** ("Ella" in mockups was a placeholder).

## Navigation model

Bottom tab bar, 4 tabs:

```
[ Học ]   [ Tạo ]   [ Thử thách ]   [ Hồ sơ ]
 Learn     Create     Challenge       Profile
 (Home)    (Import)   (Feed)          (Stats)
```

- **Học (Home)** is the root screen on every launch.
- **Thử thách (Challenge Feed)** is built after the core loop.

## Flow map

```
ONBOARDING
Welcome → Topics → Reading Level → Golden First Lesson
  → Result + Daily Goal → Sign up → (priming) Push permission
                │
                ▼
          HOME (Học)
   ┌────────┬────────┬──────────┬────────┐
   ▼        ▼        ▼          ▼
 Học      Tạo     Thử thách    Hồ sơ
   │        │        │            │
   │        │        │            └─ North Star · Levels · Streak · Milestones · My Collection
   │        │        └─ Challenge feed (swipe) → end-CTA "go deeper" / share
   │        └─ Paste URL/text/upload (or share-sheet) → Processing → Lesson ready
   │
   ▼
 LESSON PLAYER
   ├─ Reading: Bilingual Passage (tap-reveal + mark Items)
   └─ Listening: Listening Replay (audio-first, reveal text)
   ▼
 Process all Items → COMPLETE
   ▼
 Completion + session recap + North Star jump
   ├─ (Daily Goal met) → folded "goal met" badge + rest/continue
   ├─ (major milestone) → full-screen Celebration + shareable Milestone Card
   ▼
 ★ Next Lesson (A→B→D, preloaded, 1 tap) ──► back into Lesson Player

 PAYWALL — soft, contextual (out of Credits / Starter Series done / podcast / offline)
 SERIES browse + detail · SETTINGS · EDGE STATES
```

---

## ONBOARDING

### 1. Welcome
**Purpose:** one-line promise; entry.
```
┌───────────────────────────────┐
│        [ logo ]               │
│  Học tiếng Anh bằng chính      │
│  nội dung bạn mê               │
│  Biến bài viết · video ·       │
│  podcast yêu thích → bài học   │
│      [ Bắt đầu ]              │
│  Đã có tài khoản? Đăng nhập    │
└───────────────────────────────┘
```

### 2. Chọn chủ đề (Topics)
**Purpose:** seed the Interest Profile (cold start). Pick ≥3.
```
┌───────────────────────────────┐
│  Bạn thích đọc/nghe về gì?     │
│  Chọn ít nhất 3                │
│  [💻Công nghệ][✈️Du lịch]      │
│  [⚽Thể thao][🎬Phim][💼K.doanh]│
│  [🔬Khoa học][🎵Nhạc][🍳Ẩm thực]│
│  [🧠Tâm lý][📰Tin tức] …       │
│  Đã chọn 3 ✓   [ Tiếp tục ]   │
└───────────────────────────────┘
```

### 3. Level Đọc (self-select Reading Level)
**Purpose:** self-select Reading Level with plain-language CEFR examples. Listening Level is seeded as Reading − 1 band (no separate screen) and self-corrects later.
```
┌───────────────────────────────┐
│  Trình độ đọc hiểu của bạn?    │
│ ○ A2 "câu đơn giản, hội thoại  │
│       chậm"                    │
│ ◉ B1 "tin tức dễ, video có     │
│       phụ đề theo kịp"         │
│ ○ B2 "phim/podcast hiểu phần   │
│       lớn, đọc báo thoải mái"  │
│ ○ Chưa chắc → để app dò giúp   │
│  💡 Yên tâm, app tự nắn theo bạn│
│  [ Tiếp tục ]                 │
└───────────────────────────────┘
```

### 4. Golden First Lesson
**Purpose:** the aha moment, **before signup**. This screen IS the reading Lesson Player (see §9), but uses a hand-crafted, heavily-QA'd Golden First Lesson (one per CEFR band) tuned for a guaranteed easy win. Ships bundled in-app (works on weak signal).

### 5. Kết quả + Daily Goal
**Purpose:** show the North Star jump + session recap, then set the Daily Goal.
```
┌───────────────────────────────┐
│    🎉 Bài đầu hoàn thành!      │
│    +8 Item vừa nạp             │
│  📘5 từ · 🧩2 chunk · ⚙1 NP    │
│  Đặt mục tiêu mỗi ngày:        │
│  ☕ Nhẹ ~5'                    │
│  🔥 Đều đặn ~10'  ◉ (mặc định) │
│  🚀 Nghiêm túc ~20'           │
│  [ Tiếp tục ]                 │
└───────────────────────────────┘
```

### 6. Đăng ký (delayed signup)
**Purpose:** capture account *after* the aha; anchor on the progress just made; migrate anonymous progress.
```
┌───────────────────────────────┐
│  Lưu tiến độ của bạn           │
│  Bạn vừa nạp 8 Item & mở streak│
│  [  Tiếp tục với Apple   ]     │
│  [  Tiếp tục với Google  ]     │
│  [  Dùng Email           ]     │
│  Điều khoản · Bảo mật          │
└───────────────────────────────┘
```

### 7. Push priming (after signup)
**Purpose:** explain the benefit before the iOS system prompt (one-shot permission). Framed around Streak reminders + "your Lesson is ready" notifications.
```
┌───────────────────────────────┐
│  🔔 Bật thông báo?             │
│  • Nhắc bạn giữ streak 🔥       │
│  • Báo khi bài học của bạn      │
│    đã sẵn sàng                 │
│  [ Bật thông báo ]            │
│  [ Để sau ]                   │
└───────────────────────────────┘
```

---

## CORE LOOP

### 8. Home (tab Học)
**Purpose:** habit-centric root. Biggest action = re-enter the flow. North Star = emotional reward.
**Key decision:** the **Continue** button dominates; it **resumes an in-progress Lesson** first, falling back to the recommended next Lesson.
```
┌───────────────────────────────┐
│ 🔥12   B1 đọc · A2 nghe     ⚙  │
├───────────────────────────────┤
│         1,240                 │ ← North Star (cumulative Absorbed)
│   từ · chunk · ngữ pháp đã nạp │
│        ▁▂▃▅  +18 hôm nay       │
├───────────────────────────────┤
│ Mục tiêu hôm nay  ●●●○○  6/10' │ ← Daily Goal
├───────────────────────────────┤
│ ┌───────────────────────────┐ │
│ │ ▶  TIẾP TỤC                │ │ ← resume in-progress, else next rec
│ │ "The Future of AI" · 4 phút │ │
│ │ Series Công nghệ B1 · 3/12  │ │
│ └───────────────────────────┘ │
├───────────────────────────────┤
│ Gợi ý cho bạn  (cùng gu)       │
│ [▢ 4'][▢ 6'][▢ 3']  →         │ ← Discover entry (expandable list)
├───────────────────────────────┤
│ [Học] [Tạo] [Thử thách] [Hồ sơ]│
└───────────────────────────────┘
```

### 9–10b. Lesson Player — structure overview

**Structure (decision B):** the Bilingual Passage is the **core**; tapping any Item opens its **type-specific detail card** inline; an optional **consolidation + 60-second quick review** closes the Lesson. It is *not* a multi-tab study tool (guards against drifting into flashcard-study). Full state inventory:

- **A — Passage** (the core input): A1 reading default · A2 Item tapped → card · A3 sentence translation revealed · A4 listening, audio playing/text hidden · A5 listening, text revealed · A6 Item replay / slow.
- **B — Item detail cards**, 3 type variants: B1 Vocabulary · B2 Chunk · B3 Grammar Point.
- **C — Consolidation/review** (optional, end of Lesson): C1 new-Items summary · C2 60s quick review (SRS-in-context).
- **D — Listening practice:** D1 per-Item replay drill · D2 slow mode.
- **E — Chrome/global:** E1 progress ("đã quyết 9/12") · E2 Complete button enabled-state · E3 pause/exit → resume later (powers Home "Continue") · E4 audio loading/buffering.

§9 = passage **reading** states (A1–A3); §10 = passage **listening** states (A4–A6); §10b = cards/consolidation/practice/chrome (B/C/D/E).

### 9. Lesson Player — Reading (Bilingual Passage)
**Purpose:** read English-primary; reveal Vietnamese on demand; mark Items — all one gesture.
**Key decisions:** tap = "don't know" → reveal meaning + 🔊 + auto-Absorbed (turns "learning" color); untapped-at-end = "known"; completion = scrolled through (all Items implicitly decided). Item types are encoded typographically. Already-Absorbed Items pre-highlighted.
```
┌───────────────────────────────┐
│ ✕  The Future of AI    đã quyết 9/12│
├───────────────────────────────┤
│  Artificial intelligence is   │
│  r̲e̲s̲h̲a̲p̲i̲n̲g how we work. Many  │  vocab = underline
│  companies 𝗴𝗶𝘃𝗲 𝘂𝗽 old ways    │  chunk  = bold
│  and adopt new tools ░every    │  grammar= tinted bg
│  day░.                        │
│  ┌─────────────────────────┐  │
│  │ give up · chunk          │  │ ← tap popup
│  │ → từ bỏ                  │  │
│  │ 🔊 nghe   ✓ Đã lưu học   │  │
│  └─────────────────────────┘  │
│  〔 Dịch cả câu 〕  (tùy chọn) │
├───────────────────────────────┤
│        [ Hoàn thành ]          │
└───────────────────────────────┘
```

### 10. Lesson Player — Listening (Listening Replay)
**Purpose:** train real listening — audio first, text revealed on demand.
**Key decisions:** sentence-by-sentence; transcript hidden by default ("Hiện lời"); replay sentence / slow / replay an individual Item's audio span (needs timestamps); revealed text has the same tappable-Item absorption flow; optional karaoke (read-along) mode in Settings for beginners.
```
┌───────────────────────────────┐
│ ✕  Podcast · Daily English  ⋯  │
├───────────────────────────────┤
│        ((( ◉ )))               │
│        câu 4 / 18              │
│  ┌───────────────────────────┐│
│  │   ◌ lời đang ẩn — nghe thử ││
│  │        👁  Hiện lời        ││
│  └───────────────────────────┘│
│   ⏮   🐢 chậm   ↻ nghe lại  ⏭ │
│  — sau khi Hiện lời —          │
│  "Many people 𝗴𝗶𝘃𝗲 𝘂𝗽 too     │
│   early."        〔 dịch 〕    │
│  ↻ Nghe lại riêng "give up"   │
├───────────────────────────────┤
│        [ Hoàn thành ]          │
└───────────────────────────────┘
```

### 10b. Lesson Player — Item cards, consolidation & practice

#### B — Item detail cards (3 type variants)
Opened by tapping an Item in the passage. Each carries the known/learning toggle (the absorption action). The variants differ by what they show:
- **Vocabulary (B1):** word · IPA · 🔊 · part of speech · CEFR · VI meaning · the sentence from the passage.
- **Chunk (B2):** chunk · 🔊 · CEFR · VI meaning · **usage pattern** (e.g. "+ V-ing") · passage example · **anchor vs candidate** indicator (ADR-0004).
- **Grammar Point (B3):** name · CEFR · **pattern with the fillable slot** · the **authored VI explanation** (ADR-0003) · passage example.
```
TỪ VỰNG (B1)              CHUNK (B2)                  NGỮ PHÁP (B3)
┌────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│ reluctant      ✕   │  │ look forward to    ✕   │  │ Câu điều kiện loại 2 ✕ │
│ /rɪˈlʌktənt/  🔊   │  │ 🔊   chunk · B1        │  │ ngữ pháp · B1          │
│ tính từ · B2       │  │ → mong chờ              │  │ Mẫu: If + QK đơn,      │
│ → miễn cưỡng       │  │ ⚙ theo sau: V-ing       │  │      would + V         │
│ Trong bài:         │  │ Trong bài:              │  │ Giải thích: giả định   │
│ "She was reluctant │  │ "I look forward to      │  │ không có thật ở hiện   │
│  to leave."        │  │  seeing you."           │  │ tại. (soạn sẵn)        │
│                    │  │ ● Trong từ điển (anchor)│  │ Trong bài:             │
│ [Đã biết][Lưu ✓]   │  │ [Đã biết][Lưu ✓]        │  │ "If I had time, I'd…"  │
└────────────────────┘  └────────────────────────┘  │ [Đã hiểu][Lưu ✓]       │
                                                     └────────────────────────┘
```

#### C — Consolidation / quick review (optional, end of Lesson)
```
C1 TÓM TẮT ITEM MỚI            C2 ÔN NHANH 60s (tùy chọn)
┌──────────────────────────┐   ┌──────────────────────────┐
│ Bạn vừa nạp 12 Item       │   │ Ôn nhanh · 1/8           │
│ 📘 Từ vựng (7) →          │   │  "reluctant" nghĩa là?   │
│ 🧩 Chunk (4) →            │   │  [ miễn cưỡng ]          │
│ ⚙ Ngữ pháp (1) →          │   │  [ Nhớ ] [ Chưa nhớ ]    │
│ [ Ôn nhanh ] [ Bỏ qua ]   │   │  (không badge nợ)        │
└──────────────────────────┘   └──────────────────────────┘
```

#### D — Listening practice
- **D1 Per-Item replay drill:** step through the Lesson's Items, replaying each one's audio span (uses Item timestamps).
- **D2 Slow mode:** any sentence/Item replays at reduced speed.

#### E — Chrome / global states
- **E1 Progress** — "đã quyết 9/12" (Items decided).
- **E2 Complete button** — disabled until all projected Items are decided; then enabled.
- **E3 Pause / exit** — leaves the Lesson in-progress; Home's "Continue" resumes it exactly here.
- **E4 Loading / buffering** — audio fetch / lazy timestamp generation in progress.

### 11. Completion + Recommend
**Purpose:** reward (North Star jump) + keep momentum (1-tap next).
**Key decisions (layout B):** above the fold = session recap + ONE Top pick + "Học tiếp" (1 tap, preloaded). Below the fold = more recommendations, Preference Tuner, Discover. Recommendation shows a Reason + match %. When the Daily Goal is met, a "goal met" badge + rest/continue choice fold in here (no separate screen).
```
┌───────────────────────────────┐
│         🎉 Hoàn thành!          │  (✓ Mục tiêu hôm nay đạt — if met)
│        +12 Item đã nạp         │
│   📘 7 từ · 🧩 4 chunk · ⚙ 1 NP │
│    1,228 ───▶ 1,240           │ ← North Star animates
│    🔥 Streak 12               │
│  ┌───────────────────────────┐│
│  │ TIẾP THEO                  ││
│  │ ▶ "AI in Healthcare" · 5'  ││
│  │ 💡 vì cùng chủ đề Công nghệ ││ ← Recommendation Reason + 94% match
│  │ [  Học tiếp  → ]           ││
│  └───────────────────────────┘│
│ ─── below the fold ───        │
│  More you might like (3 thẻ)  │
│  Help Inflow learn ✓/✗ (định kỳ)│ ← Preference Tuner
│  〔 Ôn nhanh 〕 〔 Nghỉ — hẹn mai 〕│
└───────────────────────────────┘
```

### 12. Celebration (two tiers)
**Purpose:** reward milestones without fatigue.
- **Daily Goal met (everyday):** folded into §11 (badge + rest/continue). No dedicated screen.
- **Major milestone (Streak 7/30/100, Level up, round North Star):** dedicated full-screen with confetti + shareable Milestone Card. Always offers a guilt-free "rest, see you tomorrow."
```
┌───────────────────────────────┐
│        ✨ 🔥 7 🔥 ✨           │
│   Streak 7 ngày liên tục!      │
│   [ confetti ]                │
│   [  Milestone Card đẹp  ]     │
│   [ Chia sẻ ↗ ]               │ ← Milestone Card
│   [ Tiếp tục học → ]          │
│   〔 Nghỉ ngơi 👋 〕            │
└───────────────────────────────┘
```

### 13. Tạo Lesson (tab Tạo) + Processing
**Purpose:** the signature feature — turn loved content into a Lesson.
**Key decisions:** share-sheet is a first-class capture path; Credits shown before creating; cache-hit opens instantly; long audio processes async with notification; failed creation never charges a Credit; private text/file labeled "only you".
```
CREATE                          PROCESSING
┌──────────────────────────┐   ┌──────────────────────────┐
│ Biến nội dung bạn mê →    │   │ Đang tạo bài học…         │
│ bài học                  │   │ ✓ Lấy nội dung            │
│ 🔗 Dán link               │   │ ✓ Tìm từ·chunk·NP         │
│ [ YouTube·podcast·báo ]   │   │ ⏳ Dịch song ngữ          │
│  — hoặc —                 │   │ ○ (audio) chuẩn bị nghe   │
│ 📝 Dán text  📎 Tải file  │   │ ⚡ Đã có sẵn? → mở ngay    │
│ 💡 Đang xem? Share →"Tạo" │   │ (audio dài → "báo khi     │
│ Credit tháng  ●●●○○ 3/5   │   │  xong 🔔")                │
│ [ Phân tích → ]          │   └──────────────────────────┘
└──────────────────────────┘
```

### 14. Hồ sơ / Stats (tab Hồ sơ)
**Purpose:** trophy case first (motivation); "My Collection" is a secondary door (avoid drifting into flashcard management).
```
┌───────────────────────────────┐
│  @user                    ⚙   │
│         1,240                 │ ← North Star
│   📘 820 từ · 🧩 310 chunk    │
│   · ⚙ 110 ngữ pháp            │
├───────────────────────────────┤
│  Đọc  B1 ▓▓▓▓░ →B2            │ ← 2 Levels, progress to next band
│  Nghe A2 ▓▓░░░ →B1            │
├───────────────────────────────┤
│  🔥 Streak 12   ⏱ 14h Input   │
│  [Lịch streak ▦▦▦▦▦▦▦]        │
├───────────────────────────────┤
│  🏅 Milestone (chạm để share)  │
│  [1000 từ][streak 7][lên B1]  │
├───────────────────────────────┤
│  📚 KHO CỦA TÔI  (Từ·Chunk·NP)→│ ← Absorbed collection (secondary)
└───────────────────────────────┘
```

### 15. Paywall (soft, contextual)
**Purpose:** convert at the wall moment; never trap.
**Key decisions:** headline matches the trigger; lists unlocked value (not price first); annual highlighted by default; always dismissible (✕ → back to Free).
```
┌───────────────────────────────┐
│ ✕                             │
│  Bạn vừa dùng hết 5 credit tạo │ ← trigger-matched headline
│  tháng này 👏                  │
│  Nâng cấp để mở khóa:          │
│   ✓ Tạo bài không giới hạn      │
│   ✓ Học mọi Series             │
│   ✓ Luyện nghe podcast          │
│   ✓ Tải offline                │
│  ┌──────────────┐┌───────────┐│
│  │ NĂM  ◉        ││ THÁNG  ○   ││
│  │ $119/năm      ││ $16/tháng  ││
│  │ ≈$9.9/th -35% ││            ││
│  └──────────────┘└───────────┘│
│        [ Nâng cấp ]            │
│   Khôi phục mua · Điều khoản    │
└───────────────────────────────┘
```

### 16. Challenge Feed (tab Thử thách — built after core)
**Purpose:** engagement + viral funnel. Teleprompter text scrolling at fixed pace; reading-fluency practice.
**Key decisions:** vertical swipe; rendered dynamically from structured data; right-rail like/save/share; "go deeper" CTA at the END of each Challenge (doesn't interrupt the swipe); does not count toward the learning Streak; share carries watermark + app link.
```
┌───────────────────────────────┐
│ [B1] ▾                     ⚙   │
│     (nền: thành phố đêm)       │
│      "YES, YOU CAN"            │ ← highlight line
│   Today, I will tell you      │   ❤️  like
│   something important.        │   🔖  save
│   Sometimes life feels hard.  │   ↗   share
│   But remember: Yes, you can. │ ← teleprompter scroll
│  ▶━━━━━━━━━━━ 00:18 / 01:03    │ ← pace bar
│  ┌───────────────────────────┐│
│  │ 💡 Học sâu chủ đề này  →    ││ ← CTA at end
│  └───────────────────────────┘│
│ [Học][Tạo][Thử thách][Hồ sơ]  │
└───────────────────────────────┘
```

---

## SECONDARY

### 17. Series — Browse + Detail
**Key decision:** the Starter Series is fully open on Free; other Series lock (lock → soft paywall trigger).
```
BROWSE                         DETAIL
┌──────────────────────────┐   ┌──────────────────────────┐
│ Khám phá Series      🔍   │   │ ← Công nghệ B1            │
│ Level:[B1▾] Chủ đề:[▾]    │   │ 12 bài·~50'·B1           │
│ ★ Dành cho bạn (Starter) │   │ ▓▓▓░░░░ 3/12             │
│ ┌─────────┐┌──────────┐  │   │ [ Tiếp tục bài 4 → ]     │
│ │Công nghệ││ Du lịch   │  │   │ ✓ 1 The Future of AI  4' │
│ │B1·3/12  ││ B1·mới    │  │   │ ✓ 2 Smartphones       3' │
│ └─────────┘└──────────┘  │   │ ▶ 4 AI in Healthcare  5' │
│ Tất cả Series            │   │   6 🔒 (ngoài Starter →   │
│ [Kinh doanh][Khoa học]…  │   │      Paid)               │
└──────────────────────────┘   └──────────────────────────┘
```

### 18. Settings
```
┌───────────────────────────────┐
│ ← Cài đặt                      │
│ TÀI KHOẢN  user@… · Free       │
│   [ Nâng cấp Paid ]            │
│ HỌC TẬP                        │
│   Mục tiêu ngày    10' ▾       │
│   Level Đọc B1▾ · Nghe A2▾     │
│   Karaoke khi nghe   ⬤ off     │
│ NỘI DUNG                       │
│   Tải offline (Paid)     →     │
│   Kho của tôi            →     │
│ THÔNG BÁO                      │
│   Nhắc streak        ⬤ on      │
│   Báo bài đã sẵn sàng ⬤ on     │
│ Khôi phục mua · Đăng xuất      │
└───────────────────────────────┘
```

### 19. Edge states
```
TẠO LỖI                        MẤT SÓNG (Free)
┌──────────────────────────┐   ┌──────────────────────────┐
│ 😕 Không tạo được bài     │   │ 📡 Mất kết nối            │
│ Link không lấy được nội   │   │ Học offline cần gói Paid  │
│ dung. Thử link / dán text │   │ [ Tìm hiểu Paid ]        │
│ [Thử lại] [Dán text]      │   │ (Paid: hiện bài đã tải)  │
│ ⚠ KHÔNG trừ credit        │   └──────────────────────────┘
└──────────────────────────┘
NỘI DUNG BỊ TỪ CHỐI (moderation, ADR-0001)
┌──────────────────────────┐
│ ⚠️ Nội dung không phù hợp  │
│ Vi phạm chính sách (NSFW/ │
│ bất hợp pháp) → không tạo  │
│ [ Đã hiểu ]               │
└──────────────────────────┘
```

---

## Design-system notes (for visual design)

- **Item type encoding** (consistent everywhere Items appear): Vocabulary = underline · Chunk = bold · Grammar Point = tinted background. Absorbed Items use a distinct "known/learning" color.
- **Level badges**: CEFR (A1–C2) front-facing; Reading and Listening are separate and may differ.
- **North Star**: cumulative, hero-sized on Home and Profile; animates on increment. Distinct from per-session recap on completion.
- **Tone**: encouraging, sustainable-habit (never guilt/FOMO); every celebration offers a guilt-free rest exit.
- **Momentum-first**: the 1-tap "Continue/next" is the visual anchor of Home and Completion; discovery/tuning lives below the fold.
- **Two consumption modes**: Guided ("Continue / next") vs Browse ("Discover"). Keep "Discover" (Lessons) visually distinct from the "Challenge Feed" (entertainment).
