# Inflow

> Name encodes the two core promises: comprehensible **in**put + staying **in flow** (keeping the learning momentum).

An app that lets learners build lessons from content they personally find interesting (articles, podcasts, YouTube), plus curated level-based series. The core promise is comprehension of content you love, not rote memorization.

## Language

**Comprehensible Input (CI)**:
The learning philosophy at the app's core — learners acquire a language by consuming large amounts of interesting, understandable content rather than by drilling. The backbone of the product.
_Avoid_: Immersion (too broad), study

**SRS (Spaced Repetition)**:
A lightweight, optional auxiliary layer for reviewing Absorbed Items. It supports CI but is never the central loop. Surfaced primarily as **review-in-context** — the system deliberately re-surfaces already-Absorbed Items inside *new* Lessons/Challenges so review feels like natural re-encounter — plus an **optional 60-second quick review** the learner chooses to open for rarely-re-encountered items. Never a mandatory due-queue; **no red debt badge** — review is an opportunity, not a debt.
_Avoid_: Flashcards-first, Anki-mode, due queue

**Target Language**:
The language being learned. Fixed to English in the MVP, but modeled as a parameter, not hardcoded.

**Native Language**:
The learner's first language, used for translations and grammar explanations. Fixed to Vietnamese in the MVP, modeled as a parameter.
_Avoid_: Mother tongue, L1 (in user-facing copy)

**Source**:
The raw original content a lesson is built from — an article, podcast, YouTube video, or pasted text. Has a type, a URL or file, a language, and a length.
_Avoid_: Material, content (when precision matters), import

**Lesson**:
The analyzed, packaged learning unit produced from a Source. Every Lesson has a **common core** — its Items (Vocabulary/Chunk/Grammar Point), a bilingual passage, and the original text — plus one or more **Practice Modes** switched on by the Source type. This is what a learner "studies." Curated lessons and user-generated lessons are the same entity; they differ only in ownership and whether they belong to a Series.
_Avoid_: Module, unit, course

**Practice Mode**:
A type-specific activity layered onto a Lesson's common core. Audio Sources (YouTube/podcast) turn on **Listening Replay** (re-hear each item/sentence with the original audio), which trains the learner's Listening Level. Text-only Sources (article/text) center on the bilingual reading, training the Reading Level. New Source types add new Practice Modes without changing the core. (TTS-ing a text Source for listening practice is a deferred, optional mode.)
_Avoid_: Exercise, activity (when precision matters)

**Series**:
An ordered collection of Lessons grouped to be followed in sequence, typically by level. Curated by the app team in the MVP.
_Avoid_: Course, track, path

**Level**:
A learner's proficiency, and equivalently the difficulty of a Source/Lesson/Series, on a shared scale. Displayed to users as CEFR (A1–C2); stored internally as a fine 0–100 score so the recommendation engine can match learners to suitably-difficult Lessons. Self-selected at onboarding and self-correcting over time (the learner flags Lessons as too easy/too hard and the score adjusts). A learner has **two separate Levels — Reading and Listening** — because reading proficiency commonly outpaces listening; recommendation matches each skill independently. Progression is **continuous (i+1)**: recommendation always serves content a notch above the current fine score and is never gated by CEFR bands. When the fine score crosses a band boundary (e.g. A2→B1) the app fires a celebratory **Level up** moment automatically from behavior — no test. Series are *tagged* by band for browsing/cold-start, not used as gates.
_Avoid_: Rank, grade, difficulty (when referring to the learner)

**Bilingual Passage**:
The reading surface of a Lesson: the Target-Language text is primary and prominent; the Native-Language translation is revealed **on demand** by tapping a sentence or word (never shown side-by-side by default), forcing the learner to attempt comprehension from context first. Tapping an unknown word both reveals its meaning and marks it Absorbed (this is the absorption gesture). Already-Absorbed Items are highlighted inline.
_Avoid_: Parallel text, side-by-side, translation view

**Item**:
A single learnable thing extracted from a Lesson. Exactly one of three types — Vocabulary, Chunk, or Grammar Point. Items are what the stats count and what SRS reviews.

**Vocabulary**:
A single word worth learning (stored as a lemma), e.g. `negotiate`, `reluctant`. The smallest Item.
_Avoid_: Word, term, token

**Chunk**:
A fixed multi-word expression or collocation that carries meaning as one block and is learned whole, e.g. `give up`, `look forward to`, `make a decision`. The product's signature selling point (learn by chunk → speak naturally). Detected by a **hybrid** approach (see ADR-0004): a reference Chunk Inventory provides high-confidence anchors with stable IDs/explanations/Levels, while the LLM surfaces novel collocations as lower-confidence candidates. Every Chunk is **normalized to a canonical form** (lemmatized) so variants like `make/making a decision` collapse to one stable entity for counting, SRS, and dedup.
_Avoid_: Phrase, collocation (in UI), n-gram

**Grammar Point**:
A reusable pattern or rule with a fillable slot — e.g. present perfect, second conditional, `used to + V`. Distinguished from a Chunk by being a template the learner re-applies with different words, not fixed content. A Grammar Point is **a stable entry in the Grammar Inventory**, not free-form text — so it has a fixed ID, can be counted, reviewed, deduped, and matched to a Level.
_Avoid_: Grammar rule, structure (ambiguous)

**Grammar Inventory**:
A predefined closed catalog of ~150–250 grammar points, each mapped to a CEFR band and carrying one authored-once Vietnamese explanation. The engine **classifies** a Source's sentences against this catalog ("which inventory points appear here?") rather than inventing grammar descriptions. This makes Grammar Points stable, level-aware, consistent, and cheap to explain. (See ADR-0003.)
_Avoid_: Grammar list, taxonomy

**Deduplication rule**: a fixed expression with no replaceable slot → Chunk; a template with a slot → Grammar Point; a single word → Vocabulary. Every Item belongs to exactly one type, never counted twice.

**Candidate Item**:
The objective, shared layer: every Item worth noting in a Source, each tagged with its own difficulty, extracted once and cached/shared across all learners (the derived layer of ADR-0001). What an individual learner actually sees as "notable for me" is a personal projection — Candidate Items filtered and prioritized by that learner's Level and Item Status. So A2 and C1 importing the same Source share one Candidate Item set but get different personal views.
_Avoid_: Raw item, global item

**Item Status** (per learner):
The learner's relationship to an Item — `New`, `Learning`, or `Known`. During a Lesson the system auto-extracts candidate Items; the learner quickly marks each known/unknown. Only items marked unknown enter the learner's Absorbed store and the SRS queue. This known/unknown signal also feeds the recommendation engine (many unknowns → Lesson too hard → lower Level).

**Completed Lesson**:
A Lesson the learner has finished by **processing every projected Candidate Item** (marking each known/unknown), not merely scrolling to the end. Completion is what triggers the Next Lesson recommendation, counts toward the Streak/Daily Goal, increments the North Star, and consumes a Creation Credit — so it must reflect real learning behavior, not skimming.
_Avoid_: Done, finished, viewed

**Absorbed**:
An Item the learner has taken into their personal store (because they marked it unknown and started learning it). Stats count Absorbed Items; SRS reviews them. Distinct from Items merely present in a Lesson.
_Avoid_: Saved, collected, learned (ambiguous)

**Interest Profile**:
An evolving model of what a learner enjoys, built primarily from the Lessons they complete plus explicit feedback. Its signals are **topic, author/source, keyword, and format** (article vs lecture vs talk vs blog…), each independently weightable. It drives the Next Lesson recommendation alongside the learner's per-skill Level. Recommendation is mostly i+1 (a notch harder) but may deliberately serve a *slightly easier* Lesson to preserve momentum.
_Avoid_: Taste graph, preferences (when precision matters)

**Recommendation Reason**:
The human-readable, behavior-grounded explanation shown with every recommended Lesson (e.g. "you keep returning to CAP theorem — by a new author, at your B2 level"), accompanied by a **match %** and signal tags. Makes the recommendation feel like it understands the learner and builds trust.
_Avoid_: Why this, explanation

**Preference Tuner**:
A quick yes/no control set (the "Help Inflow learn" prompt) that lets the learner directly accept/reject Interest Profile signals — by author, topic, and keyword — actively steering future recommendations. Shown **periodically or when the system's confidence about the learner's taste is low**, not on every completion (to avoid fatigue). On the Lesson-complete screen it lives **below the fold**, beneath the session recap, the single Top pick, and the one-tap "Continue" — so the momentum fast-path stays default and discovery/tuning is opt-in by scrolling.
_Avoid_: Feedback form, survey

**Discover** (Lesson Feed):
A personalized, scrollable surface of recommended Lessons the learner browses and picks from — the **Browse** mode, complementing the **Guided** mode ("Continue / next Lesson" that keeps momentum). At MVP it is simply the expandable "recommended for you" list; it grows into a true personalized feed once behavior data is rich. Strictly distinct from the **Challenge Feed** (Reels-style Challenges, entertainment/funnel) — different names, different content, no overlap.
_Avoid_: Feed (unqualified), my feed

**Next Lesson recommendation**:
What the app surfaces immediately after a Lesson to keep the learner's momentum. Sourced in priority order: (A) the next Lesson in the current Series; (B) a matching Lesson from the pre-generated pool; (D) the next part of the learner's own imported Sources. On-the-fly web generation (C) is deferred past MVP. Matching uses per-skill Level + Interest Profile (same topic, same author, etc.). The Interest Profile is seeded at onboarding by asking the learner to pick a few favorite topics, optionally refined by a quick swipe over sample Lessons.

**Constraint**: every Source/Lesson carries topic + author/source metadata so recommendation can match. Curated content is tagged by hand; user-imported content is auto-tagged by the system.

**Challenge** (Reading Challenge):
A short, vertical, swipeable video (Reels/TikTok style) authored by the app team: simple Target-Language text that **scrolls at a fixed pace like a teleprompter** over an aesthetic background with music, tagged with a Level badge (e.g. B1) and a topic. The "challenge" is keeping reading pace — so it primarily trains **reading fluency/speed**, not listening. An AI voice-over is **optional** (background music alone is fine). A **separate entity from a Lesson** — NOT analyzed into Items, never enters SRS, not part of recommendation matching beyond its Level/topic tag. Its job is engagement/retention and viral, shareable top-of-funnel acquisition; incidental extensive reading is a bonus.
_Avoid_: Lesson, clip, short (when precision matters)

Surfaced as its own tab on the Home screen. Two bridges back to the core: a "go deeper on this topic" CTA opening a related Lesson/Series, and outward sharing (watermark + app link) for viral acquisition. Built after the core learning loop.

A Challenge is **authored as structured data** (text + Level + topic + chosen background + chosen music from prebuilt libraries), and the in-app feed renders it dynamically at playback — so producing one is filling a quick template, not editing a video. The same structured data feeds an **MP4 export pipeline** (with watermark + app link) for posting to TikTok/Reels. One authoring step, two outputs.

In the feed, each Challenge has right-rail like / save / share controls; the "go deeper on this topic" CTA appears at the **end** of each Challenge (after the text finishes), so it never interrupts the lean-back swipe. Challenges do not count toward the learning Streak.

**Golden First Lesson**:
A small set of hand-crafted, heavily-QA'd Lessons (roughly one per CEFR band) used as the very first Lesson in onboarding — shorter than normal, on a universally-likeable neutral topic, engineered to guarantee an easy win and a satisfying North Star jump (the aha moment) before the learner is asked to sign up. After it, recommendation hands off to the Starter Series matching the learner's chosen topic.
_Avoid_: Demo lesson, sample, tutorial

**Starter Series**:
A short curated Series (~10–15 Lessons) matched to the learner's onboarding Level, fully open on the Free Plan. Long enough to get the learner hooked on the core loop, not a 5-Lesson teaser.

**Creation Credit**:
The Free Plan's monthly allowance for turning the learner's own Source into a Lesson. Weighted toward cheap source types (text/article cost less than audio) so learners taste the signature "import your content" magic repeatedly without burning unbounded cost. A **failed creation never consumes a Credit** (bad URL, unfetchable, moderation-rejected) — the learner is only charged for a Lesson they actually get.
_Avoid_: Token, point (overloaded)

**Free Plan**:
No cost. Opens one full Starter Series for consumption plus a monthly pool of Creation Credits (text generous, audio tightly limited).

**Paid Plan**:
$16/month, or an annual plan at ~35% off (~$119/year). Removes the consumption cap, greatly raises creation limits (soft fair-use cap only), and unlocks **offline download** of Lessons (text + audio) for study without signal. There is no separate countdown free-trial — the Free Plan *is* the trial; the upgrade prompt fires contextually at the moment the learner hits a wall (out of Credits, finished the Starter Series, wants podcast listening, wants offline), with a headline that matches the trigger and the annual option highlighted by default. The paywall is always a **soft wall** — dismissible, dropping the learner back to Free — never a hard block. At MVP (mobile-only) the subscription is sold through the app stores and absorbs Apple's 15% Small Business fee; web billing to recover that fee comes later.

Offline support is **download-and-sync**, not offline-first: learners (Paid) pre-download a queue of upcoming Lessons including audio; progress (Item Status, completion, North Star) is recorded locally and synced on reconnect. Creating/importing Sources always requires connectivity (server-side LLM/ASR). The Golden First Lesson ships bundled in-app so the first run works even on weak signal.
_Avoid_: Premium, pro (unless chosen as the marketing name)

**North Star metric**:
The single headline number shown largest on Home: the learner's **cumulative** count of **Absorbed** Items ("words/chunks/grammar you've taken in"). Minutes of Input and Streak are secondary indicators beneath it. Distinct from the **session recap** on the Lesson-complete screen, which reports just-this-Lesson stats (minutes studied, Items absorbed this session, and the skill-specific Level — Listening Level for a listening Lesson, Reading Level for a reading one).
_Avoid_: Score, XP (unless chosen as a gamified alias)

**Daily Goal**:
A learner-set small target (e.g. 10 minutes, or 5 new Items) that defines whether a day counts toward the Streak. Self-set so busy learners can keep the Streak honest without guilt.

**Streak**:
Consecutive days the learner met their Daily Goal. Driven only by core learning (completing Lessons / absorbing Items) — swiping the Challenge feed does not keep the learning Streak alive, though Challenges may have their own separate indicator.

**Celebration moment**:
The reward shown after completing a Lesson, in two tiers to avoid fatigue. Meeting the **Daily Goal** (an everyday event) is folded into the Lesson-complete screen as a small "goal met" badge plus a rest-or-continue choice — no separate screen. A **major milestone** (Streak 7/30/100, a Level up, a round North Star number) gets a dedicated full-screen celebration with confetti and a shareable Milestone Card. Every celebration offers a guilt-free "rest, see you tomorrow" exit to protect sustainable habit over bingeing.
_Avoid_: Reward screen, popup

**Milestone Card**:
An auto-generated, attractive shareable image marking a moment worth showing off (1,000 Items Absorbed, 7/30-day Streak, Level up). The only sharing surface inside the core learning loop; it exists to be voluntarily posted, not to be a heavily-built feature. Primary viral acquisition lives in the Challenge feed, not here.
_Avoid_: Badge, share sheet

## Relationships

- A **Source** produces one Lesson by default, and is auto-segmented into multiple **Lessons** only when it exceeds the ~3–5 minute target.
- A public-URL **Source** is analyzed once and cached/shared globally (its cost is per-unique-Source, not per-user), and becomes a candidate for the pre-generated pool (B). Private pasted-text/file Sources stay per-user.
- The expensive listening timestamps are generated lazily, only when a learner opens Listening Replay.
- Importing a Source has a **first-class share-sheet path**: from YouTube/browser/podcast apps, the learner taps Share → "Create lesson" and lands in the app with the Source pre-filled — the primary in-the-wild capture path, not just manual paste.
- Lesson creation is **hybrid-async**: text and cache-hit Sources finish inline; long jobs (podcast ASR) process in the background and notify the learner when ready.
- Curated content (Starter Series, the pool) is produced by the team running the **same** lesson-creation engine in an admin role, then given a human QA pass and arranged into Series — so the creation engine is the first thing built. User-generated Lessons skip the human QA pass.
- How a Source is segmented and what a Lesson contains depends on the Source's difficulty Level. A Source's difficulty is computed per skill: a **Reading difficulty** (from text — item-CEFR distribution + readability) and, for audio Sources, a separate **Listening difficulty** (text difficulty plus delivery features like speech rate), each calibrated over time by learners' too-easy/too-hard flags.
- A **Series** is an ordered sequence of **Lessons**.
