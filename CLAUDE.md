# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

**Inflow** — a mobile app that teaches English to Vietnamese speakers through **Comprehensible Input**: learners turn content they already love (articles, YouTube, podcasts) into bilingual **Lessons**, then read/listen while tapping unknown words to absorb them. The name encodes the two promises: comprehensible **in**put + staying **in flow** (momentum). Target Language = English, Native Language = Vietnamese — both modeled as parameters, never hardcoded.

The repo is **docs-first**: the product is fully specified before most code exists. Two app folders are scaffolded from external templates and are still early:

- `backend/` — NestJS API + BullMQ worker (TypeScript, TypeORM/Postgres, Redis). Scaffolded from a reference NestJS service; trimmed to a skeleton + Firebase auth + users.
- `mobile/` — React Native 0.80 app (TypeScript, Redux Toolkit, NativeWind, React Navigation 7). Brought in from the `rn-rapid-boilerplate` template.
- `docs/`, `CONTEXT.md`, `design_handoff_inflow_app/` — the binding specification (see below).

## Read these before writing product code

The spec is authoritative; treat it as the source of truth over assumptions. Read in this order:

1. **`CONTEXT.md`** — the domain glossary. Every capitalized term in this codebase (Source, Lesson, Item, Chunk, Grammar Point, Candidate Item, Absorbed, North Star, Level, Series, Challenge, Creation Credit…) is defined there with precise meaning and an _Avoid_ list of wrong synonyms. **Use these exact terms** in code, types, and UI. Do not invent alternatives.
2. **`docs/adr/0001`–`0005`** — binding architecture decisions (summarized below). Don't re-decide these.
3. **`docs/prd/0001-mvp.md`** — MVP scope as 75 numbered user stories grouped by flow (onboarding, core loop, recommendation, creation, gamification, review, challenge feed, plans/paywall, settings/edge).
4. **`docs/design/screens.md`** — screen-by-screen UX spec with ASCII wireframes and the navigation/flow map.
5. **`design_handoff_inflow_app/`** — hi-fi visual design as `Inflow.dc.html` (open in a browser with `support.js` beside it; the Core Loop phone is interactive). It is a **spec, not code** — recreate it in React Native; **do not ship the `<x-dc>`/`support.js` runtime**. Design tokens (OKLCH light+dark sets), typography, and the Item encoding legend live in its README.

## Domain model essentials

The shape that requires reading multiple docs to grasp:

- A **Source** (article/podcast/YouTube/text) is analyzed into a **Lesson**. A Lesson's common core = its **Items** + a tap-to-reveal **Bilingual Passage** + the original text; **Practice Modes** (e.g. **Listening Replay** for audio) layer on by Source type.
- An **Item** is exactly one of three types — **Vocabulary** (a word/lemma), **Chunk** (fixed multi-word expression, the signature unit), **Grammar Point** (a reusable pattern). The dedup rule: fixed expression → Chunk; template with a slot → Grammar Point; single word → Vocabulary. Each Item is counted once.
- **Shared vs per-learner split (ADR-0001):** a Source is analyzed **once**; its derived layer (the objective set of **Candidate Items**, level/topic tags, timestamps) is cached and shared globally. What a learner _sees_ as "notable for me" is a **per-learner projection** filtered by their Level and Item Status. Personalization lives in a separate per-learner layer, never in re-extraction. The full bilingual passage / transcript text stays **importer-private** (copyright); only the derived layer is shared.
- The **absorption gesture:** tapping an unknown word in a Lesson both reveals its meaning and marks it **Absorbed** (recolors teal→amber, fires a +1 on the **North Star** — the cumulative count of Absorbed Items, the headline metric).
- A learner has **two Levels — Reading and Listening** — stored as a fine 0–100 score, shown as CEFR (A1–C2). Recommendation is continuous **i+1**, never gated by CEFR bands.

## Binding architecture decisions (ADRs)

- **0001** — Cache/share only the **derived layer** of public Sources; full text/transcript is importer-private. Source identity is hybrid: normalized URL (fast path) + content-hash (authoritative dedup key).
- **0002** — Full **Listening Replay** (incl. podcast ASR with word/sentence timestamps) ships in the MVP. Timestamps are shared derived data; transcript text is private. Curated audio is pre-generated; user audio is aligned lazily on first Listening Replay open.
- **0003** — **Grammar Points are a closed Inventory** (~150–250 entries, each CEFR-tagged with one authored Vietnamese explanation). The engine **classifies** sentences against it — never free-form grammar generation. Gives stable, countable, dedup-able IDs.
- **0004** — **Chunks are hybrid**: a reference Chunk Inventory (stable IDs) + LLM-detected novel candidates (lower confidence). **Every Chunk is normalized to a canonical lemmatized form** (mandatory) so variants collapse to one entity.
- **0005** — Lesson analysis is a **staged pipeline**, not one monolithic LLM call. Cheap no-reference steps batch together; grammar classification, chunk matching, and bilingual translation are separate stages that cache/retry independently and can use different models. Translation caches separately in the private layer.

## Backend (`backend/`)

NestJS with a **two-process split** driven by the `SERVICE_TYPE` env var (`api` | `worker` | `all`): `src/main.ts` dispatches to `bootstrap/api` or `bootstrap/worker`. Each feature module is split into `*-api.module.ts` (HTTP controllers) and `*-worker.module.ts` (BullMQ processors / scheduled sweepers) plus a `*.module.ts` that wires shared providers, so the headless worker never loads controllers. Postgres via TypeORM (entities + a repository-per-entity pattern over `abstract.entity`/`abstract.repository`); Redis backs both BullMQ and caching. Path aliases (`@config/*`, `@database/*`, `@modules/*`, `@shared/*`, …) are defined in `tsconfig.json`. Auth is Firebase ID-token verification via middleware that upserts the `users` row on every request.

Only two feature modules exist so far: **`modules/users`** is the one real domain module, and **`modules/demo`** is a copy-me reference that demonstrates the full pattern end-to-end (api/worker module split, a `publishers/` producer enqueuing onto a queue declared in `constants/`, and a `processors/` consumer). **When adding a feature module, mirror `demo`'s structure.** Disable it in production via `DEMO_ENABLED=false`.

**Firebase auth setup:** copy `.env.example` → `.env` and set `FIREBASE_PROJECT_ID` + `FIREBASE_SERVICE_ACCOUNT_JSON` (the full service-account JSON, base64-encoded). `yarn firebase:base64` encodes a local `firebase-admin-dev.json` to the clipboard for that var.

Commands (run inside `backend/`):

```bash
yarn install
docker-compose up -d            # local Postgres + Redis
yarn start:all:dev              # api + worker in one process, watch mode
yarn start:api:dev              # api only
yarn start:worker:dev           # worker only
yarn build                      # nest build → dist/
yarn lint        # / yarn lint:fix
yarn test                       # all jest
yarn test:unit   # / yarn test:e2e
yarn test -t "name substring"   # run a single test by name
yarn migration:run              # apply migrations  (also :generate, :revert, :show)
```

Copy `.env.example` → `.env` before running. Swagger is served at `/api/docs` in non-production.

## Mobile (`mobile/`)

React Native 0.80 (bare workflow, not Expo). Stack: **Redux Toolkit** + `redux-persist` + **MMKV** for state/storage, **NativeWind** (Tailwind) for styling with a generated OKLCH color token system (`src/config/colors.ts` → `scripts/generate-colors-css.js`), **React Navigation 7** (typed), **react-i18next** (UI copy is Vietnamese — keep strings exact), `zod` + a `react-hook-form`-style `useForm`. Path aliases via `babel-plugin-module-resolver`.

Commands (run inside `mobile/`):

```bash
yarn install
cd ios && bundle install && bundle exec pod install && cd ..   # iOS native deps
yarn start                      # Metro (also regenerates color CSS in watch)
yarn ios        # / yarn android
yarn generate-translation       # i18n helper
```

**Native rename:** the project still carries the boilerplate's native identity (`RapidBoilerplate`, package `com.monokaijs.rapidboilerplate`); only `app.json` `displayName` and the npm name are set to Inflow. Do a full native rename with the bundled tool rather than by hand: `yarn react-native-rename "Inflow" -b com.<org>.inflow`.

## Conventions

- **Use the glossary terms verbatim** (see `CONTEXT.md`). Naming precision is a product requirement here, not a preference.
- UI copy is **Vietnamese** and is real product copy — do not translate or paraphrase it. English appears only as _lesson content_ (the bilingual contrast is the point).
- Design colors: **teal (`--flow`)** = primary/actions/progress; **amber (`--warm`)** = Absorbed items / North Star / streak. Wire the light/dark token sets into the theme layer; don't hardcode per-screen.
</content>
</invoke>
