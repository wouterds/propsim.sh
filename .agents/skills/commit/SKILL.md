---
name: commit
description: Create commits with proper conventional commit messages
---

# Commit

Every message here is checked by commitlint through lefthook, so a message that does not parse is
refused at commit time rather than landing badly.

## Step 1: Analyze git status

Run `git status` and work out which of these you are in:

- **staged files** under "Changes to be committed"
- **unstaged changes** under "Changes not staged for commit"
- **untracked files**

## Step 2: Determine the strategy

### Scenario A: files already staged

- **DO NOT** add any additional files
- **ONLY** commit what is already staged
- The user chose these files, so respect the choice

### Scenario B: nothing staged

Create atomic commits from the work done. Group related changes, one logical change per commit:

- Dependency changes (`package.json` + `package-lock.json`) go in their own commit
- One commit per feature or fix
- Refactoring stays separate from behaviour changes
- Documentation gets its own commit when it is substantial

Beware of pathspecs that sweep in more than you mean. `git add apps/web` takes new files in that
directory as well as the ones you were targeting. Check `git diff --cached --name-status` before
committing.

## Step 3: Analyze the changes

Run `git diff --staged`, or `git diff` when nothing is staged yet:

- Understand what changed and why
- Identify the type: feat, fix, refactor, build, docs, style, perf, chore, ci, test
- Determine the scope if one applies
- Check whether it is a breaking change

## Step 4: Read recent history first

Run `git log --oneline -10` before writing anything. This history is uniform on purpose: a
conventional subject in the imperative, lowercase after the colon, and a body explaining why rather
than what. Match it.

## Step 5: Craft the message

```
<type>[optional scope]: <description>

[optional body]
```

**Format constraints, both enforced by commitlint:**

- **Title**: at most 100 characters
- **Body**: every line at most 100 characters, so wrap by hand

**Guidelines:**

- **Description**: imperative mood ("add" not "added"), lowercase first word
- **Body**: explain why. What problem it solves, what the trade-off was, what would otherwise go
  wrong. The diff already says what changed
- **Never** add a Claude or co-author trailer of any kind

**Dependency commits** match what Dependabot emits in `.github/dependabot.yml`, so hand-written and
automated bumps read alike:

- `chore(deps): <action> <package>` for production dependencies
- `chore(deps-dev): <action> <package>` for development dependencies
- Actions are "add", "bump" or "remove"
- Every ecosystem uses `chore`, GitHub Actions bumps included. There is no `build(deps)` and no
  `ci(deps)` here

## Step 6: Create the commit

- **NEVER** use `--no-verify` or `LEFTHOOK=0`
- **NEVER** add files that were not already staged in Scenario A
- Use one `-m` flag per paragraph, and keep every line inside 100 characters yourself
- For a body that needs hard wrapping, pipe it in: `printf '%s\n' 'title' '' 'line' | git commit -F -`
- **NEVER** feed a bare heredoc to `-m`. It arrives as one long line, which fails the body length
  rule with a message that does not point at the cause

A body line over 100 characters is the failure you will actually hit. commitlint reports
`body-max-line-length` and the commit is refused, so wrap before you commit rather than after.

## Examples

```
fix(engine): measure the floor from peak equity rather than the last fill

The trailing limit only moved when a position closed, so an unrealised high left
the floor behind and a breach that Lucid would have triggered never fired here.
```

```
chore(deps-dev): add vitest

The rule engine is a pure function over a fill stream, so its branches are worth
pinning before the first app exists to run them in.
```
