# Issue #4 — App shell & navigation skeleton: proof of work

Built and ran the Inflow mobile app on a booted iOS simulator (iPhone 16 Pro,
iOS 18.6) and captured the 4-tab shell, the modal Lesson Player, and the
onboarding stack, in both light and dark themes, with Vietnamese UI copy.

## How it was run
- `cd mobile && yarn install`
- `cd ios && pod install`
- `npx react-native start` (Metro, from this worktree)
- `npx react-native run-ios --udid <iPhone 16 Pro>` → built & launched
- Navigated with the mobile MCP / `xcrun simctl io … screenshot`.
- Dark mode captured via `xcrun simctl ui <dev> appearance dark`
  (theme preference is `system`, so the app follows the OS appearance).

## Screenshots
- `01-learn-tab-light.png` — Học (Home) tab, the launch root. CTAs into the
  Lesson Player and onboarding.
- `02-create-tab-light.png` — Tạo (Create) tab.
- `03-challenge-tab-light.png` — Thử thách (Challenge) tab.
- `04-profile-tab-light.png` — Hồ sơ (Profile) tab (active tab highlighted teal).
- `05-lesson-player-modal-light.png` — Lesson Player presented as a **modal**
  over the tabs (card slides up; previous screen peeks at the top edge).
- `06-onboarding-welcome-light.png` — Onboarding stack, Welcome step.
- `07-onboarding-topics-light.png` — Onboarding stack, Topics step (proves the
  onboarding stack navigates).
- `08-learn-tab-dark.png` — Học tab in **dark** theme.
- `09-lesson-player-modal-dark.png` — Lesson Player modal in **dark** theme.

## Acceptance criteria → evidence
- Four tabs, Vietnamese labels (Học / Tạo / Thử thách / Hồ sơ), themed → 01–04, 08.
- Root stack hosts onboarding stack + tab shell → 06–07 (onboarding), 01 (shell).
- Lesson Player presents as a modal stack over the tabs → 05, 09.
- Typed navigation, each tab + Lesson Player route to a themed placeholder → all.
- Tab bar and headers respect light/dark theme → light (01–07) vs dark (08–09).

## Lint / typecheck
- The mobile package defines no `lint` script and ships no ESLint config/binary
  (eslint/prettier are listed only as unmet peer deps of
  `@react-native/eslint-config`), so the typecheck is the gating check.
- `node_modules/.bin/tsc --noEmit` → **passes** (exit 0), before and after.
