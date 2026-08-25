# Code Standards

## Style

- **Linter and formatter**: Biome, never ESLint or Prettier. Always through `npm run lint` or
  `npm run lint:fix`, never `biome` directly
- **Indentation**: 2 spaces. **Line width**: 100 characters
- **KISS**: the simplest thing that does the job. On a non-trivial change, stop and ask whether
  there is a shape that makes whole branches or helpers disappear. Prefer deleting complexity to
  rearranging it. If you wrote 200 lines and it could be 50, rewrite it
- **Clarity over cleverness**: clear names and obvious control flow. If a block needs a comment to
  be understood, first try to rewrite it so it does not
- **Named steps over long chains**: a short `filter().map()` is fine, but once a chain spans several
  operations or wraps across lines, unpack it into named intermediates. The names say what each
  stage produces
- **Ternaries**: single-expression assignments only, never nested. Use if/else when a branch has any
  weight to it
- **Guard clauses over ternary returns**: return early on the edge case rather than folding it in
- **Fallbacks**: `??` or `||` rather than a ternary that repeats the value

## TypeScript

- Avoid `any`. Prefer inference where the type is obvious, `satisfies` where it must be checked
  without widening
- Every package is `strict`, ES2022, bundler resolution
- Types describe what the caller actually receives. A function that returns a floor without the
  peak it was derived from should say so in its type, rather than handing back a wider object with
  fields that happen to be undefined

## Exports

`export const` with arrow functions, never `function`.

## Comments

Default to none. Names and small functions are the documentation.

- **The bar is misreading.** Comment only where leaving it out lets someone break or misuse the
  thing. Being non-obvious is not enough, and neither is being hard-won
- Explain **why**, never **what**. Delete anything that restates the code
- **One or two lines. Never a paragraph.** Reasoning that needs more belongs in the commit message,
  where it is attached to the change rather than to the file forever
- Write them in **ASD-STE100 Simplified Technical English**: short sentences, one idea each, active
  voice, plain words, no idiom and no metaphor
- **Omit every word that can go while it still reads.** A comment is read far more often than it was
  written
- Do not narrate the alternatives you rejected, or what an upstream "silently" does, or how a bug
  once felt. State the fact that prevents the mistake and stop

Worth a comment:

```ts
// The floor only rises. An assignment here gives back room the account already lost.
floor = Math.max(floor, peakEquity - limit);
```

Too long, same fact:

```ts
// The floor only ever rises, so this is a max against the previous value rather
// than an assignment. Assigning here would let a drawdown hand back room that
// the account has already given up for good.
```

Not worth one:

```ts
// Returns the current floor.
export const getFloor = () => floor;
```

## Change Discipline

- Every changed line traces to the request. No drive-by fixes, no reformatting on the way past
- Remove orphans **your** change creates. Mention pre-existing dead code rather than deleting it
- Match the surrounding style even where you would do it differently

## Duplication

Extract when the same ten lines appear twice, not for two or three.

Extracting is not the same as packaging. A helper whose every caller lives in one workspace belongs
in that workspace as a module. A workspace of its own buys a boundary nobody crosses, plus a
manifest, a tsconfig and a dependency edge to keep in step.

## Refactoring

Update every consumer directly and **never** re-export from the old location to soften a move, since
that leaves the debt in place. Grep for usages rather than assuming, and let `npm run typecheck`
prove you found them all.
