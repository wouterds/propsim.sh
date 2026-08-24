# Testing

## Framework

- **Vitest**, one config per workspace, fanned out by turbo like every other task
- **Node environment**, UTC. Nothing here needs a browser yet
- No end-to-end tests, and none without being asked for one

## File Naming

Specs are **co-located** as `*.spec.ts` beside the file they cover, so a module and its test move
together and an untested module is visible from the directory listing.

## Structure

- `describe`/`it` with "should..." names
- Mark each phase with `// given`, `// when`, `// then`, even for a one-liner. Empty phases can be
  omitted
- Cover the error case first
- Import `describe`, `it`, `expect` from `vitest` rather than relying on globals

## What Deserves a Test

Test count is not a quality signal. A suite earns trust by staying small enough that a red run is
worth reading, so every spec has to justify the runtime it costs.

Write a test when it pins behaviour someone can break: a branch with real logic, a boundary, an
error path, a bug you just fixed. Two shapes look like coverage and are not:

- **Smoke tests.** "It renders", "it does not throw", "the function is defined". These pass against
  almost any implementation, so a green run reports nothing
- **Deletion tests.** When you remove a feature, the deleted code is the proof. A spec asserting the
  feature is gone pins the absence forever, and the next person who needs it back has to delete a
  test that looks deliberate

If you cannot name the defect a test catches, delete it.

**The arithmetic here is the product, so it is what earns specs.** The rule engine is a pure
function over a fill stream with no network and no clock of its own, which means its every branch is
reachable from a literal array of fills. There is nothing to mock and no excuse for leaving it
unpinned.

The defects worth writing first are the ones that never throw:

- A floor that fails to ratchet. Feed a peak of `+424.50` followed by a close at `+264.50` and
  assert the floor moved once and did not come back down
- Unrealised profit and loss counted on one side only. A position open and down has to reach the
  floor exactly as a closed one does, and an open position up has to raise it immediately
- A breach checked per fill rather than per tick, which lets a position that breached intraday
  survive because it closed green
- The soft floor and the hard floor treated as one thing. One resets on the next session and is
  measured from the day's open, the other never resets and is measured from peak equity

None of these throws. None fails a typecheck. Every number downstream is quietly wrong.

## Make Sure The Test Can Fail

A green test is not evidence until you have seen it go red.

- **Assert the outcome, not the shape.** Counting results or checking a function was called leaves
  most wrong implementations passing. Assert the value that would change if the bug came back
- **Cover both sides of a boundary.** Testing only the side that rounds up leaves an off-by-one free
- A test that cannot fail while the test above it passes adds runtime, not coverage
- **Break the source and re-run before claiming coverage.** Revert the one file, watch it go red,
  restore it:

```bash
git stash push -- packages/engine/src/floor.ts   # or edit the value by hand
npm test --workspace @propsim/engine              # expect red; green means it proves nothing
git stash pop
```

For a brand-new source file there is nothing to revert to, so mutate the behaviour by hand and put
it back the same way. Commit first either way, since the restore discards uncommitted work in that
file.

## Running Tests

```bash
npm test                                 # every workspace, through turbo
npm test --workspace @propsim/engine     # one of them
npx vitest run src/floor.spec.ts         # one file, from inside the workspace
npx vitest                               # watch, from inside the workspace
```

## No Tests Is Allowed

Every config sets `passWithNoTests`. A workspace with nothing worth pinning is not a red run. Wiring
and transport are not worth a mock that proves the wiring calls itself.

That is not licence to skip the part that matters. There is still no substitute for running a
session through the engine and reading what came out.
