# Workflow

## Think Before Coding

- State assumptions rather than burying them. If you are unsure, say how unsure
- Where there are two readings of a request, give both instead of silently picking one
- If a simpler approach exists, say so, including when it means less of what was asked for
- If something is genuinely unclear, stop and name what is confusing

## Planning

- Enter plan mode for anything non-trivial: three or more steps, or a decision that is expensive to
  reverse
- Turn the task into a verifiable goal before starting. "Add the daily floor" becomes "write a spec
  where a session opens at 25,000 and loses 600, assert it locks out and the next session reopens"
- For a multi-step task, state the plan with the check for each step:

```
1. [step] -> verify: [check]
2. [step] -> verify: [check]
```

## Verification

Before claiming anything works:

- `npm run lint:fix && npm run typecheck && npm test`, always
- **Then `npm run lint` on its own**, which is the check the commit hook runs. `lint:fix` writes
  what it can and reports success while staying quiet about anything Biome classes as an unsafe fix,
  so **`lint:fix` passing is not `lint` passing**
- `npx knip` once it is wired in. A new file nothing imports, or an export nothing reads, is a
  mistake worth catching before it lands
- Then **run it and look**. Feed a real session through and read the numbers. A rule engine that
  compiles and passes its types can still put the floor in the wrong place on every tick

Further:

- A green typecheck is not evidence the behaviour is right, only that the types agree
- Review your own work adversarially before handing it over. "Is this correct?" invites yes. "Where
  is this wrong, and what did I overcomplicate?" finds the real answer
- **Turn every claim into a prediction and check it immediately. An explanation tests nothing.**
  An explanation is unfalsifiable by construction, so a wrong one can sit for hours looking like
  understanding. The same claim pointed at the next case instead of the last one dies in one command
- Never mark something done without having watched it work

## Bug Fixing

Fix autonomously. Point at the log, the failing assertion or the wrong number, then resolve it. Find
the root cause. No temporary patches, and no widening a type to silence an error that is telling the
truth.

Establish what the correct output is before changing anything. On a simulator the tempting fix is
the one that makes the number look right, which is also how a bug becomes a calibration.

## Subagents

- Use subagents to keep the main context clean
- Offload research, exploration and parallel analysis
- One task per subagent, so each stays focused

## Responding to Feedback

Feedback is a claim to check, not an instruction to obey. Read the code, confirm there is a real
reachable problem, and push back when there is not. A confidently worded comment is not evidence.

## Self-Improvement

When the user corrects you or shows frustration, save a memory so it does not happen twice. Capture
the rule, **why** they wanted it, and **when it applies**. Frustration in particular means the
mistake cost them time. Do not wait to be asked to remember.
