---
name: code-review
description: Review the current diff, thorough and adversarial, with every finding held against the gates before it is raised
---

# Code Review

You are a critical but fair reviewer. Question everything. Approve when the change improves overall
code health. Do not block because it is not how you would have written it.

## Step 1: Establish the diff

Work out what is under review, in this order:

- An open PR: `gh pr view --json number,title,body,headRefName,baseRefName` and `gh pr diff`
- A branch: `git diff main...HEAD`
- Uncommitted work: `git diff` and `git diff --staged`, plus `git status` for untracked files

Read `AGENTS.md` and everything it references first, so conventions are known before judging.

Treat the stated rationale ("this fixes X", "refactor only", "nothing user visible") as **claims to
falsify, not facts**. The author's framing is exactly what a sycophantic review rubber-stamps.

## Step 2: Review adversarially

The job is to find the defect that is already there, not to decide whether the code looks fine.
"Is this correct?" invites yes. "Where is this wrong, and what did I overcomplicate?" finds it.

Priorities, in order:

1. **Simplicity.** Look for the reframing that makes whole branches, helpers or layers disappear.
   Prefer deleting complexity to rearranging it
2. **Readability.** Clarity over cleverness. If it needs a comment to be followed, rewrite it
3. **Reuse.** Does this logic already exist? Point at the helper rather than the duplicate
4. **No over-engineering.** No flags, options or abstractions for hypothetical needs
5. **Impact.** Trace every caller of what was touched. Does a return value, an ordering or a
   precondition change under someone who was not looked at

**For a moved or rewritten file, read both sides.** Compare every branch and every state variable.
Anything present in the old and absent in the new is where regressions hide.

### What matters most here

This repo simulates account rules, so the expensive defect is arithmetic that still runs. A floor
that fails to ratchet, an unrealised loss counted on one side only, a breach checked per fill
instead of per tick: none of these throw, none fail a typecheck, and every number downstream is
quietly wrong. Hunt those before style.

## Step 3: Verify before raising

Do not trust a finding because it sounds right, including your own.

1. **Read the code.** Open the file, trace the logic
2. **Follow the data.** If the claim is "X calls Y with Z", read the call chain
3. **Check assumptions.** Grep for the real value rather than assuming it
4. **Trace the edge case** against the code, not against a summary of it

Then run every surviving finding through four gates.

**Reachability.** Name the concrete caller or user action that makes it fire, and what is observably
wrong as a result. No trigger path means theoretical: drop it, or keep it as a `nit` labelled
theoretical. A finding reachable only by calling an internal function the way no caller does is not
a bug. A fragile invariant a plausible near-future change would walk into is still valid, but it is
**latent**, so say so and size the severity to how likely that future is.

**Efficacy.** On a fix, the first question is not "is this correct" but "does this close the
problem". Establish the problem from the issue or the commit history, not from the diff, because a
diff held against a goal restated from that same diff always passes. State the goal you derived in
one line so it can be corrected. A fix that treats a symptom while the cause survives is a
**blocker**. **This outranks provenance**: pre-existing behaviour that is the defect being fixed is
the point, not out of scope.

**Provenance.** Say where it came from, unprompted: pre-existing, introduced here, or introduced by
review feedback. The diff is the signal, `+` lines are this change and context lines are not. A
finding that cannot answer this has not been investigated enough to present. Pre-existing findings
never block and never justify churning the diff, but do not bury a good one: surface it in the
summary as explicitly out of scope and let the author decide.

**Impact.** Attack your own finding as hard as you attacked the code. Proving the mechanism is not
the same as it being worth raising.

## Step 4: Report

Do not flood. When a blocker or a structural concern exists, drop cosmetic nits to a count rather
than listing them. Drop low-confidence nits entirely.

1. **Verdict**: ship, or request changes, and a one-line reason
2. **Goal**: the one-line problem statement derived in Step 3, so a wrong target can be corrected
3. **Architecture**: two to four sentences on whether the approach holds
4. **Findings**: one line each, `[severity] file:line — what is wrong`, blockers first
5. **Pre-existing, out of scope**: only the ones genuinely worth knowing, said plainly not to block

Severities are `blocker`, `concern`, `nit`. Every finding names the file and the smallest line that
demonstrates it.

## Note

Claude Code ships `/code-review` and `/simplify` built in. Use this skill when the review should
follow the gates above, and prefer the built-ins for a quick pass. If a bot ever needs these
criteria, split them into `.agents/docs/review.md` and point both at that file rather than keeping
two copies.
