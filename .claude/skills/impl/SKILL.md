---
name: impl
description: Implement one or more issues from the project tracker in parallel, respecting "Blocked by" dependencies. Use when the user types /impl with a list of issue IDs/URLs, or asks to implement/solve/build issues in parallel. Only runs issues whose blockers are already resolved; defers blocked ones.
---

# Impl

Take a list of issue IDs/URLs and implement them **in parallel**, one isolated agent per issue. Only an issue with **no open blocker** is dispatched; blocked issues wait until their blockers close, then run in the next wave.

`$ARGUMENTS` is a whitespace- or comma-separated list of issue references — bare numbers (`5`), `#5`, or full URLs (`https://github.com/owner/repo/issues/5`). If empty, ask the user which issues to implement (or offer to run every open `ready-for-agent` issue with no open blocker).

## 1. Resolve the list

For each reference, normalize to an issue number and fetch it:

```bash
gh issue view <n> --json number,title,body,state,labels,url
```

Drop anything already `state == "CLOSED"` (note it in the summary). Keep the body — the **Acceptance criteria** are the contract the implementing agent must satisfy, and the **Blocked by** section defines dependencies.

## 2. Build the dependency graph

Parse each issue's `## Blocked by` section for `#N` references. For every blocker, check its state:

```bash
gh issue view <blockerN> --json number,state,title
```

Classify each requested issue:

- **Ready** — no blockers, or every blocker is `CLOSED`. Eligible to run now.
- **Blocked** — at least one blocker is still `OPEN`. Hold it.

A blocker may be open but *also in this run's list*. That's fine — it just runs in an earlier wave; the blocked issue becomes ready once that wave's PR is merged/closed.

If the user said "ignore blockers" / "force", skip this gating and treat everything as ready (warn that parallel agents touching shared files may conflict).

## 3. Run in waves

Loop until no Ready issues remain:

1. Take all currently-Ready issues. Dispatch them **concurrently** — one `Agent` per issue, **all in a single message** so they run in parallel. Use `isolation: "worktree"` so each agent works in its own git worktree and parallel file edits never collide.
2. Wait for the wave to finish. Collect each agent's result (branch name, PR URL, pass/fail).
3. Re-evaluate the Blocked set against the now-updated issue states (re-run the `gh issue view` state checks — a merged PR that closed a blocker promotes its dependents to Ready).
4. If any agents failed, do **not** promote issues that depended on them; report the failure and stop cascading down that branch of the graph.

Never dispatch a blocked issue early. "Parallel" means *independent* issues run together — not that dependencies are ignored.

**The iOS simulator is a single shared resource — serialize it.** Writing code, running lint, and running unit tests happen in parallel across worktrees. But anything that **boots/builds/runs the app on the simulator** (Metro + `yarn ios`) and **screenshots** it — i.e. the design-fidelity diff and the UI proof-of-work — must run **one agent at a time, linearly**. Concurrent app runs collide on the one booted device and the Metro port. So in a wave: let agents implement + unit-test concurrently, then have them take the simulator **in turn** for the run/screenshot step (a simple lock: only one agent builds-and-captures at a time; the others wait). If that serialization is awkward to coordinate across parallel agents, do the simulator run + screenshot capture in the **orchestrator** after each agent's code lands on the branch, one issue at a time.

> For a large list (10+ issues, deep graph), prefer the `Workflow` tool to drive the waves deterministically (`pipeline`/`parallel` with the same worktree-isolation and per-issue agent brief). Only do this if the user has opted into orchestration; otherwise use parallel `Agent` calls.

## 3a. Branch & PR model

Decide the branch **before** dispatching, and pass it into every agent brief:

- **One issue** → branch `impl/<N>-<short-slug>`, one PR (`Closes #<N>`).
- **Multiple issues** → **ONE shared branch** for the whole run (e.g. `impl/batch-<N1>-<N2>-…` or a short name the user gives) and **ONE PR** that closes them all (`Closes #<a>`, `Closes #<b>`, …). Do **not** create a branch or PR per issue.

Parallelism still uses worktrees, but they all feed the single branch:

1. Create the shared branch once, off the current base (usually `main`).
2. Each wave's agents run in their own worktree **created from the shared branch's current tip**, so a later wave sees earlier waves' work (needed when a batched issue depends on another in the same run).
3. When an agent finishes, **integrate its commits onto the shared branch** (fast-forward if possible, else merge/cherry-pick; issues are file-scoped so conflicts should be rare — resolve or report if not). Commit its `proof/issue-<N>/` there too.
4. After the **final** wave, push the shared branch and open the single PR. Each issue still gets its own `review` label + brief comment + proof — only the branch and PR are shared.

So agents do **not** open their own PRs in batch mode (the orchestrator opens the one combined PR). In single-issue mode the one branch == one PR, same as before.

## 4. The per-issue agent brief

Give each spawned agent a self-contained brief. Template:

```
Implement issue #<N>: "<title>" in <repo>.
Branch to use: <BRANCH>. Run mode: <SOLO | BATCH> (BATCH = share the branch, do not open a PR).

Read first (source of truth, in this order):
- CLAUDE.md, CONTEXT.md (domain glossary — use these exact terms verbatim)
- docs/adr/* relevant to this area (don't re-decide settled architecture)
- the issue body below — especially its `## Design reference` section
- THE DESIGN ITSELF (for any slice with UI): open the exact section the issue's Design reference points to (see "Design fidelity" below). The design is the visual contract; the issue prose only summarizes it.

<full issue body — What to build + Acceptance criteria + Design reference>

Rules:
- This is a vertical slice: deliver a complete path through every layer it touches (schema/API/UI/state/tests), not one layer.
- Satisfy EVERY acceptance-criteria checkbox. They are the contract.
- For any UI, pixel-match the design section the issue references: exact Vietnamese copy, design tokens (never hardcode colors), spacing/radii/typography, and every state shown in the wireframes. Verify with a side-by-side (see "Design fidelity").
- Match surrounding code style, naming, and patterns. Use the project's existing libraries/conventions.
- Run the project's lint, typecheck, and tests; they must pass before you finish.
- Work on the branch you are told to use: `<BRANCH>` (the orchestrator picked it — it may be shared with other issues in this run). Commit with a clear message that names the issue (`#<N>: …`) and ends:
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
- PR handling: if you are told you are the ONLY issue in this run, open the PR yourself (`gh pr create`, body "Closes #<N>"). If you are part of a BATCH, do NOT open a PR — just land your commits + `proof/issue-<N>/` on `<BRANCH>`; the orchestrator opens one combined PR for the whole batch.
- Do NOT touch files outside this issue's scope. Do NOT modify other issues' work — even on a shared branch, stay within your slice.

Then, AFTER the code is committed and tests pass, finish the issue (see "Finish each issue" below):
1. Capture proof of work.
2. Embed the proof + a brief in the PR body.
3. Post a brief comment on the issue and swap its label to `review`.

Return: branch name, PR URL (only if SOLO — in BATCH mode there is none yet), lint/test status, the proof artifact path(s), and any acceptance criterion you could not meet (with why).
```

Fill `<full issue body>` with the actual fetched body. Keep each agent scoped to exactly one issue.

### Design fidelity (UI slices)

For any issue that renders UI, "done" means it visually matches the design — not just that it functions. Each agent must:

1. **Open the target design.** From the issue's `## Design reference`:
   - Render the hi-fi handoff section in a browser: `mcp__playwright__browser_navigate` to `file:///<repo>/design_handoff_inflow_app/Inflow.dc.html#<anchor>` (the `support.js` runtime loads automatically), then `browser_take_screenshot` of the relevant phone frame. This is the pixel target.
   - Read the matching `docs/design/screens.md` section for the ASCII wireframe, the full state inventory, and exact Vietnamese copy.
   - Pull tokens/legend from the handoff README (OKLCH light+dark, type scale, Item-encoding legend).
2. **Implement to match** — tokens (no hardcoded colors), spacing, radii, typography, copy verbatim, light AND dark, and every state the wireframe shows.
3. **Diff it.** Screenshot your RN screen on the simulator (take the simulator **in turn** — never run two app builds at once; see the serialization rule in §3), place it **side-by-side** with the design screenshot, and list concrete mismatches (color, spacing, font, copy, missing state). Fix them and re-diff until it matches, or document any deliberate delta with a reason.

If the design and the issue text disagree, the design wins for visuals and the glossary/ADRs win for behavior — flag the conflict in the PR rather than guessing.

### Finish each issue (proof + brief + label)

Every agent must do this before returning — it is part of "done", not optional:

**1. Capture proof of work.** Pick the kind that actually demonstrates the slice works:
- **UI / mobile slice** → run the app on the booted iOS simulator (`yarn ios` from `mobile/`, or reuse an already-booted device) and **take a real screenshot** of the implemented screen/state — use the `mobile_take_screenshot` / `mobile_save_screenshot` tools, or `xcrun simctl io booted screenshot proof/issue-<N>/<state>.png`. For a multi-state slice (e.g. the Lesson Player absorption gesture), capture before/after frames. Save under `proof/issue-<N>/`. **Also save the design-fidelity diff**: the design screenshot (`proof/issue-<N>/design-<state>.png`) next to your implementation (`impl-<state>.png`), so the PR shows design-vs-built side-by-side.
- **Backend / engine / non-visual slice** → the proof is the **passing test run and/or a real API response**: save the relevant test output and a sample request/response to `proof/issue-<N>/result.md` (paste the `createLesson` JSON, the red→green diff, etc.). A screenshot of green tests counts too.
- Commit the `proof/issue-<N>/` files on the branch so screenshots have durable raw URLs.

**2. Embed proof.** In SOLO mode, add a `## Proof of work` section to the PR body. In BATCH mode there is no per-issue PR — instead write the proof into your issue comment (step 3) and the orchestrator aggregates a per-issue `### #<N>` block into the single combined PR. Either way, embed each screenshot by its raw URL on this branch:
`![<state>](https://raw.githubusercontent.com/<owner>/<repo>/<branch>/proof/issue-<N>/<state>.png)`
(or paste the `result.md` output for backend slices). Include a one-paragraph **brief** — what you built and how it maps to the acceptance criteria.

**3. Brief the issue + relabel.** Comment the same brief (+ PR link + proof) on the issue, then move it into review:
```bash
gh issue comment <N> --body "<brief + PR link + proof>"
gh issue edit <N> --add-label "review" --remove-label "ready-for-agent"
```
The `review` label means: implemented, proof attached, awaiting human review. Do **not** close the issue — let the merged PR close it via `Closes #<N>`.

## 5. Report

Summarize as a table: issue # · title · wave · status (✅ done / ⚠️ partial / ❌ failed / ⏸ still blocked) · `review` labeled?. Then give the **branch + PR**: one PR for the whole run in BATCH mode, or the single PR in SOLO mode. Call out:

- Any issue left **blocked** because a blocker never closed in this run (and what it's waiting on).
- Any **failed** agent and the downstream issues that were consequently held.
- Any integration conflict you had to resolve when landing an agent's commits on the shared branch.
- A suggested next command (e.g. review the combined PR, merge it, then re-run `/impl` on the deferred list).

Every successfully-implemented issue should end with: its commits + `proof/issue-<N>/` on the branch, a brief comment on the issue with proof, and the `review` label (with `ready-for-agent` removed) — plus the single combined PR (BATCH) or its own PR (SOLO) carrying the `## Proof of work`. Flag any issue missing one of these.

Do not merge the PR yourself unless the user asked — opening it with proof attached and labelling each issue `review` is the default.

## Notes

- The tracker is GitHub Issues via `gh`. Confirm the active `gh` account can write to the repo (`gh api user --jq .login`); switch with `gh auth switch` if needed.
- Worktree isolation is what makes parallel safe — without it, concurrent agents editing the same files corrupt each other. Keep `isolation: "worktree"`.
- If two ready issues are known to touch the same files heavily, consider running them in sequence instead of the same wave, and say so.
- One booted simulator = one app run at a time. Parallelize the coding and unit tests; **serialize the `yarn ios` run + screenshot** (design diff and UI proof). Never run two app builds on the simulator at once.
