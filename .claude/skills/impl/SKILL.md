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

> For a large list (10+ issues, deep graph), prefer the `Workflow` tool to drive the waves deterministically (`pipeline`/`parallel` with the same worktree-isolation and per-issue agent brief). Only do this if the user has opted into orchestration; otherwise use parallel `Agent` calls.

## 4. The per-issue agent brief

Give each spawned agent a self-contained brief. Template:

```
Implement issue #<N>: "<title>" in <repo>.

Read first (source of truth, in this order):
- CLAUDE.md, CONTEXT.md (domain glossary — use these exact terms verbatim)
- docs/adr/* relevant to this area (don't re-decide settled architecture)
- the issue body below

<full issue body — What to build + Acceptance criteria>

Rules:
- This is a vertical slice: deliver a complete path through every layer it touches (schema/API/UI/state/tests), not one layer.
- Satisfy EVERY acceptance-criteria checkbox. They are the contract.
- Match surrounding code style, naming, and patterns. Use the project's existing libraries/conventions.
- Run the project's lint, typecheck, and tests; they must pass before you finish.
- Work on a branch named `impl/<N>-<short-slug>`. Commit with a clear message ending:
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
- Open a PR with `gh pr create`, body referencing "Closes #<N>", listing which acceptance criteria are met and any deliberately deferred.
- Do NOT touch files outside this issue's scope. Do NOT modify other issues' work.

Then, AFTER the code is committed and tests pass, finish the issue (see "Finish each issue" below):
1. Capture proof of work.
2. Embed the proof + a brief in the PR body.
3. Post a brief comment on the issue and swap its label to `review`.

Return: branch name, PR URL, lint/test status, the proof artifact path(s), and any acceptance criterion you could not meet (with why).
```

Fill `<full issue body>` with the actual fetched body. Keep each agent scoped to exactly one issue.

### Finish each issue (proof + brief + label)

Every agent must do this before returning — it is part of "done", not optional:

**1. Capture proof of work.** Pick the kind that actually demonstrates the slice works:
- **UI / mobile slice** → run the app on the booted iOS simulator (`yarn ios` from `mobile/`, or reuse an already-booted device) and **take a real screenshot** of the implemented screen/state — use the `mobile_take_screenshot` / `mobile_save_screenshot` tools, or `xcrun simctl io booted screenshot proof/issue-<N>/<state>.png`. For a multi-state slice (e.g. the Lesson Player absorption gesture), capture before/after frames. Save under `proof/issue-<N>/`.
- **Backend / engine / non-visual slice** → the proof is the **passing test run and/or a real API response**: save the relevant test output and a sample request/response to `proof/issue-<N>/result.md` (paste the `createLesson` JSON, the red→green diff, etc.). A screenshot of green tests counts too.
- Commit the `proof/issue-<N>/` files on the branch so screenshots have durable raw URLs.

**2. Embed proof in the PR.** Add a `## Proof of work` section to the PR body. Embed each screenshot by its raw URL on this branch:
`![<state>](https://raw.githubusercontent.com/<owner>/<repo>/<branch>/proof/issue-<N>/<state>.png)`
(or paste the `result.md` output for backend slices). Include a one-paragraph **brief** — what you built and how it maps to the acceptance criteria.

**3. Brief the issue + relabel.** Comment the same brief (+ PR link + proof) on the issue, then move it into review:
```bash
gh issue comment <N> --body "<brief + PR link + proof>"
gh issue edit <N> --add-label "review" --remove-label "ready-for-agent"
```
The `review` label means: implemented, proof attached, awaiting human review. Do **not** close the issue — let the merged PR close it via `Closes #<N>`.

## 5. Report

Summarize as a table: issue # · title · wave · status (✅ PR / ⚠️ partial / ❌ failed / ⏸ still blocked) · `review` labeled? · PR URL. Call out:

- Any issue left **blocked** because a blocker never closed in this run (and what it's waiting on).
- Any **failed** agent and the downstream issues that were consequently held.
- A suggested next command (e.g. review the `review`-labelled PRs, merge them, then re-run `/impl` on the deferred list).

Every successfully-implemented issue should end with: an open PR, a `## Proof of work` section (screenshot/test output), a brief comment on the issue, and the `review` label (with `ready-for-agent` removed). Flag any issue missing one of these.

Do not merge PRs yourself unless the user asked — opening them with proof attached and labelling `review` is the default.

## Notes

- The tracker is GitHub Issues via `gh`. Confirm the active `gh` account can write to the repo (`gh api user --jq .login`); switch with `gh auth switch` if needed.
- Worktree isolation is what makes parallel safe — without it, concurrent agents editing the same files corrupt each other. Keep `isolation: "worktree"`.
- If two ready issues are known to touch the same files heavily, consider running them in sequence instead of the same wave, and say so.
