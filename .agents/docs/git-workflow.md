# Git Workflow

## Conventional Commits

Format: `<type>(scope): description`

**Types**: `feat`, `fix`, `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`,
`revert`

**Scopes** describe the subject being changed, not where the file lives. The scope answers "what
part of the simulator is affected", so a fix to how the floor is measured is `fix(engine)` wherever
the code sits. Exception: `deps` and `deps-dev` for dependency changes.

**Constraints**, both enforced by commitlint:

- Subject line at most 100 characters
- Body lines at most 100 characters
- Imperative mood, "add" not "adds"

**Breaking changes** append `!` after the scope: `feat(engine)!: measure the floor from peak equity`

**Dependency bumps** are always `chore(deps)` or `chore(deps-dev)`, for every ecosystem, GitHub
Actions included. This matches what Dependabot emits in `.github/dependabot.yml`.

## Branch Naming

Format: `<type>/<short-description>`, where the type is the same conventional type chosen by intent
and the description is a few kebab-case words. No ticket ids, no author names, no random suffix.

Examples: `feat/replay-clock`, `fix/floor-ratchet`, `refactor/fill-stream`

**Never** use a tool-generated prefix such as `claude/`, `cursor/` or `codex/`. Rename the branch
rather than living with it.

## Atomic Commits

An atomic commit is one reviewable behaviour or concern. Not a directory, not a work session, not a
convenient batch of changed files.

- One behaviour, fix or refactor per commit
- Split unrelated changes in the same file with partial staging rather than bundling the file
- Keep files together only when committing either alone would leave the change incomplete
- Tests may always be their own commit, and bundling them with the code they cover is fine

## Commit Behaviour

- **Only commit when asked.** Finishing a task is not a request to commit it
- Respect the staging area. When files are already staged, commit those and add nothing
- Run `git status` before, and check `git diff --cached --name-status` to see what is really staged
- **Beware doubled pathspecs.** `git add` resolves relative to the current directory, so running
  `git add apps/web/x.ts` from inside `apps/web` resolves to `apps/web/apps/web/x.ts`, fails, and
  the commit never runs. A commit that did not happen looks exactly like one that had nothing to do,
  so confirm with `git status --porcelain` afterwards
- **Never** `--no-verify` or `LEFTHOOK=0`, for any reason
- **Never** add a Claude or co-author trailer

## Updating a Branch

A branch that fell behind is updated by **rebasing onto the base** with `git rebase origin/main`.
**Never** merge the base branch into a feature branch, and never offer to. Merge commits from the
base pollute the history, while a rebase keeps the branch a linear series of its own commits.

`git pull --rebase` as often as you like. It costs nothing.

## Pull Requests

Pass `npm run lint`, `npm run typecheck` and the tests before submitting.

**Merge method**: always a merge commit. Never squash and never rebase merge, so the atomic history
survives on `main`.

## Responding to Feedback

Feedback is a claim to check, not an instruction to obey. Read the code, confirm the problem is real
and reachable, and push back when it is not. A confidently worded comment is not evidence.
