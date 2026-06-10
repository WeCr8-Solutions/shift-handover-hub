---
name: incremental-bugfix-loop
description: Use when fixing bugs or making small incremental improvements. Enforces a tight reproduce → isolate → minimal-fix → verify loop with one change at a time, signal-first debugging, and no scope creep.
---

# Incremental Bug-Fix & Improvement Loop

Use this skill any time the user reports a bug, a regression, a small UX nit, or asks for an incremental polish. It keeps changes small, verified, and reversible.

## Core principles

1. **One change per loop.** Never bundle unrelated fixes. If you notice another issue, note it and continue.
2. **Signal before code.** Read the actual evidence (console logs, network, session replay, runtime errors, failing test output, file contents) before editing anything.
3. **Reproduce first.** State the exact reproduction in one sentence. If you can't reproduce or locate the cause, stop and ask — don't guess-fix.
4. **Minimal diff.** Prefer `code--line_replace` over rewrites. Touch only the lines required.
5. **Stay in the layer the user asked about.** UI bug → UI/presentation only. Don't refactor business logic or schemas unless asked.
6. **Verify before claiming done.** Pick the cheapest signal that proves the fix: re-read the edited region, check console/network, run the targeted test, or inspect the preview.
7. **No silent scope creep.** No "while I'm here" refactors, dependency bumps, or design changes.

## The loop

```text
1. Reproduce   → one-sentence repro + suspected file(s)
2. Investigate → read signals + relevant files in parallel
3. Diagnose    → state root cause in one sentence
4. Fix         → smallest possible edit
5. Verify      → cheapest signal that confirms it
6. Report      → one short sentence to the user
```

If step 5 fails, return to step 2 with what you learned. After 3 failed attempts on the same error, change approach (simplify, split the change, or ask the user).

## Parallelize reads, serialize writes

- Batch independent reads (files, logs, network) into one tool-call block.
- Apply edits one file at a time when they depend on each other; parallel edits are fine only for fully independent files.

## When NOT to use this skill

- Net-new features, multi-file refactors, schema/RLS changes, or anything ambiguous in scope — those need a plan first, not a loop.
- "Make it look better" with no specific defect — ask for the specific thing to change.

## Anti-patterns (reject these)

- Rewriting a whole file to fix one line.
- Adding logging or comments as the "fix".
- Bumping dependencies to dodge a bug.
- Disabling a test or lint rule instead of fixing the cause.
- Claiming a fix without checking any signal.
- Catch-all `try/catch` that swallows the real error.

## Output shape

End each loop with one short sentence: what changed and how it was verified. No recap lists.
