# AGENTS.md

Prop trading simulator. Replays a futures session against a prop firm's account rules, so the same
session can be traded twice and the two runs compared. Nothing is live and nothing is ordered.

## Guiding Principle

> "I love to build. I focus on building complex things as simple as possible. I love to find ways to
> reduce complexity when solving problems." — Wouter

This is the bar every change is held to. The problem is allowed to be complex, the solution is not.
When two approaches both work, the one that leaves less behind wins, even when it takes longer to
find.

## Quick Reference

- **Stack**: Turborepo with npm workspaces, Node 24+, TypeScript. Biome for lint and formatting,
  lefthook and commitlint on the way in
- **Lint & typecheck**: `npm run lint:fix && npm run typecheck`
- **Test**: `npm test`

There are **no apps and no packages yet**. The root manifest holds the toolchain only, and the
workspace globs are declared for the first one to land in. Do not assume a directory exists.

## The Constraint That Shapes Everything

**The rule engine is a pure function over a fill stream.** It never reaches for a clock, a socket or
a feed. Whatever produced the fills, stored bars or a delayed live tape, the engine cannot tell and
must not care.

That is what makes replay free rather than a second implementation, so anything that couples the
engine to where its input came from is the change to refuse.

## Critical Rules

- **NEVER** bypass pre-commit hooks (`--no-verify`, `LEFTHOOK=0`)
- **NEVER** call biome directly. Use `npm run lint` or `npm run lint:fix` from the root
- **NEVER** commit without being explicitly asked
- **NEVER** add a Claude or co-author trailer to a commit
- **NEVER** use an em dash in text drafted for a human to publish: commit messages, PR and review
  comments, issue bodies, chat replies. Rephrase with a period or a comma. It is the clearest tell
  that a comment was machine-written, whoever's name it goes out under. Does not apply to these docs
- Dependency bumps are `chore(deps)` or `chore(deps-dev)`, every ecosystem, actions included
- Atomic commits, conventional messages, 100 characters per line
- Focus on what is asked. No out-of-scope refactors
- Prefer minimal solutions, measured by the complexity left behind rather than by diff size
- Find root causes. No temporary or hacky fixes
- A simulated number that looks right is not the same as one that is right. Never tune a rule until
  the output matches an expectation

## Detailed Guides

> [!IMPORTANT]
> The files below are **part of these instructions**, not optional background. Read every one of
> them at the start of a session, before you plan or change anything. Some harnesses inline the
> `@` imports at the bottom of this file automatically. If yours does not, open each path yourself.
> Rules in these files carry the same weight as the Critical Rules above.

- [Code Standards](.agents/docs/code-standards.md) - style, TypeScript, comments, refactoring
- [Testing](.agents/docs/testing.md) - what earns a spec, and proving it can fail
- [Workflow](.agents/docs/workflow.md) - thinking, planning, verifying, fixing
- [Git Workflow](.agents/docs/git-workflow.md) - commits, branches, rebasing

## Skills

- [`commit`](.agents/skills/commit/SKILL.md) - conventional messages, and splitting work into atomic
  commits
- [`code-review`](.agents/skills/code-review/SKILL.md) - adversarial review, gated before raising
- [`arena`](.agents/skills/arena/SKILL.md) - N candidates at one task, then graft the winners
- [`grill-me`](.agents/skills/grill-me/SKILL.md) - interrogate a design before it is built
- [`unslop`](.agents/skills/unslop/SKILL.md) - cut AI tells from any writing. Always applies

Symlinked into `.claude/skills`, so they are live from either path.

@.agents/docs/code-standards.md
@.agents/docs/testing.md
@.agents/docs/workflow.md
@.agents/docs/git-workflow.md
