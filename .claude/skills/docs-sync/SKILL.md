---
name: devflow-docs-sync
description: MANDATORY when editing any file under src/ in the devflow repo (especially src/commands/, src/config.ts, src/index.ts, src/providers/, src/plugins.ts, src/monorepo.ts). Identifies which documentation surfaces need updating based on the project's source-to-docs map, proposes the edits in the same change, and bumps .devflow/version.json when .devflow/AI_INSTRUCTIONS.md is touched. Also updates VHS demo tapes when interactive prompt flows change, and re-records the webpage GIFs if affected. Invoke BEFORE finalizing any code edit so docs ship with the change, not after.
---

# DevFlow Documentation Sync

Whenever you change a file under `src/`, run this skill to check which docs need updating, propose and apply the edits, and ensure the four parallel documentation surfaces stay in sync with the code.

**Do not skip or defer.** Docs that lag behind a commit rot immediately; the right time to fix them is in the same change.

---

## When to invoke

- Any edit to `src/commands/<X>.ts` (new flag, new flow step, changed behavior)
- Any edit to `src/config.ts` (new config field, changed schema, new preset)
- Any edit to `src/index.ts` (new command wired up, new alias)
- Any edit to `src/providers/tickets.ts` or `src/providers/projects.ts`
- Any edit to `src/plugins.ts`, `src/monorepo.ts`, `src/test-plan.ts`, `src/update-notifier.ts`
- Any AI-facing change: new interactive prompt, new `--flag`, changed flow, escape key behavior

Invoke **before** writing the commit message so the doc edits are part of the same commit.

---

## Documentation surfaces

There are four primary surfaces that must stay in sync, plus secondary ones:

### Primary (must always check)
1. **`README.md`** — `## Commands` section (L45+) with `### devflow <name>` heading per command, plus aliases table at L430–451.
2. **`CLAUDE.md`** — Quick Reference table at L25–38 (only lists core commands: status, issues, issue, branch, commit, pr, amend, comments).
3. **`.devflow/AI_INSTRUCTIONS.md`** — Quick Reference table (L4–13) + one non-interactive block per command (`### Branch Command`, `### Commit Command`, etc.).
4. **`docs/commands/<name>.md`** — one file per command, sidebar in `docs/.vitepress/config.ts` L20–74 is the registry (must be updated when a new doc file is added).

### Secondary (check when relevant)
- `docs/configuration.md` — config schema tables
- `docs/getting-started.md` — aliases table at L104–125
- `docs/integrations.md` — CI, Husky, AI agent integration
- `docs/plugins.md` — plugin API
- `docs/workflows/release.md` — release ritual
- `CHANGELOG.md` — `[Unreleased]` section, grouped by `### Features` / `### Bug Fixes` / `### Documentation`
- `.github/pull_request_template.md` — checklist (fyi only, not edited by this skill)

### Tertiary (check when prompt flow changes)
- **`demos/**/*.tape`** — VHS terminal recordings; one tape per command. Must be updated any time a command's interactive prompt sequence, number of prompts, or default selections change. See **Tape-to-command map** below.

---

## Tape-to-command map

| Tape | Command source | Notes |
|---|---|---|
| `demos/core/branch.tape` | `src/commands/branch.ts` | |
| `demos/core/commit.tape` | `src/commands/commit.ts` | |
| `demos/core/amend.tape` | `src/commands/amend.ts` | |
| `demos/core/fixup.tape` | `src/commands/fixup.ts` | |
| `demos/core/merge.tape` | `src/commands/merge.ts` | |
| `demos/core/log.tape` | `src/commands/log.ts` | non-mutating; no confirm prompts |
| `demos/core/undo.tape` | `src/commands/undo.ts` | |
| `demos/setup/init.tape` | `src/commands/init.ts` | 11-step wizard; most fragile tape |
| `demos/setup/completions.tape` | `src/index.ts` (completions subcommand) | flag: `--shell bash` |
| `demos/setup/update.tape` | `src/commands/update.ts` | |
| `demos/setup/status.tape` | `src/commands/status.ts` | non-interactive; safe for CI |
| `demos/setup/doctor.tape` | `src/commands/doctor.ts` | non-interactive; safe for CI |
| `demos/setup/lint-config.tape` | `src/commands/lint-config.ts` | non-interactive; safe for CI |
| `demos/pr/pr.tape` | `src/commands/pr.ts` | |
| `demos/pr/review.tape` | `src/commands/review.ts` | |
| `demos/pr/comments.tape` | `src/commands/comments.ts` | |
| `demos/issues/issue.tape` | `src/commands/issue.ts` | long wizard with list-building step |
| `demos/issues/issues.tape` | `src/commands/issues.ts` | |
| `demos/issues/test-plan.tape` | `src/commands/test-plan.ts` | |
| `demos/stash/stash.tape` | `src/commands/stash.ts` | |
| `demos/stash/worktree.tape` | `src/commands/worktree.ts` | file is in `stash/` dir |
| `demos/release/changelog.tape` | `src/commands/changelog.ts` | |
| `demos/release/release.tape` | `src/commands/release.ts` | always use `--dry-run` in the tape |
| `demos/release/cleanup.tape` | `src/commands/cleanup.ts` | |
| `demos/release/stats.tape` | `src/commands/stats.ts` | non-interactive; safe for CI |
| `demos/workflows/full-feature.tape` | chains branch + commit + pr | update after any of those three change |
| `demos/workflows/bugfix.tape` | chains branch + commit + pr | same |
| `demos/workflows/review-workflow.tape` | chains review + comments + merge | update after any of those three change |
| `demos/workflows/release-workflow.tape` | chains changelog + release + cleanup | update after any of those three change |

**Key invariants to preserve when editing tapes:**
- Every mutating command ends with a `selectWithBack("Confirm action?")` — always needs a trailing `Enter`.
- `confirmWithBack` prompts default `true`; pressing `Enter` accepts. `selectWithBack` first option is index 0; pressing `Enter` selects it.
- `demos/release/release.tape` must use `devflow release --dry-run` — never cut a real release from a tape.
- Non-interactive tapes (`status`, `doctor`, `lint-config`, `completions`, `stats`) are executed in CI by `scripts/validate-tapes.sh`. Keep them passing.

**Verifying tapes:** Run `npm run demo:validate` — Phase 1 syntax-checks all 29 tapes; Phase 2 executes the 5 non-interactive ones against the built CLI. Full GIF re-recording happens via the release GIF workflow (`generate-demo-gifs.yml`) on tag push.

---

## Source-to-docs map

| If you changed… | Update these surfaces |
|---|---|
| `src/commands/<X>.ts` (behavior/flags, no prompt change) | `docs/commands/<X>.md` (flow + options table), README `### devflow <X>` section, AI_INSTRUCTIONS.md per-command block |
| `src/commands/<X>.ts` (prompt flow — new/removed/reordered prompts) | All of the above **plus** the corresponding tape in **Tape-to-command map** and any workflow tapes that chain this command |
| `src/commands/<X>.ts` (new command, no prior docs) | See **"New command" scenario** below |
| `src/config.ts` (schema, new field) | `docs/configuration.md` Config Options table, README "Config Options" L518–534, `docs/commands/lint-config.md` checks list |
| `src/index.ts` (new alias or command registration) | README aliases table L430–451, `docs/getting-started.md` aliases table L104–125, CLAUDE.md Quick Reference (core commands only), sidebar `docs/.vitepress/config.ts` |
| `src/providers/tickets.ts` or `src/providers/projects.ts` | `docs/configuration.md` "Ticket Provider" section, README "Config Options", `docs/commands/branch.md` "GitHub Issues Integration", `docs/commands/pr.md` "GitHub Issues Auto-Close" |
| `src/plugins.ts` | `docs/plugins.md`, README "## Plugins" L637–667 |
| `src/monorepo.ts` | `docs/configuration.md` "## Monorepo Awareness", README L553–563 |
| `src/test-plan.ts` | `docs/commands/test-plan.md`, README L144–162 |
| `src/update-notifier.ts` | README "## Update Notifications" L629–635 |
| `.devflow/AI_INSTRUCTIONS.md` (any change) | Bump `.devflow/version.json` — see version bump section below |
| `src/git.ts` | No doc surface — skip |

---

## Scenario: new command added

When a new `src/commands/<X>.ts` file is created or a new command is wired in `src/index.ts`, update these 8 surfaces in order:

1. **Create `docs/commands/<X>.md`** using the standard template:
   ```markdown
   # devflow <name>

   **Alias:** `devflow <alias>`

   <brief description>

   ## Flow
   ...

   ## Options

   | Option | Description |
   |--------|-------------|
   | ... | ... |
   ```
2. **Add to sidebar** in `docs/.vitepress/config.ts` under the appropriate group (Core Commands / Workflow / Info / Setup).
3. **Add `### devflow <X>`** section in README.md under `## Commands`.
4. **Add row** to README.md aliases table (L430–451).
5. **Add row** to `docs/getting-started.md` aliases table (L104–125).
6. **Add non-interactive block** to `.devflow/AI_INSTRUCTIONS.md` following the `### <Name> Command` pattern.
7. **Add row** to AI_INSTRUCTIONS.md Quick Reference table (L4–13).
8. **Add row** to CLAUDE.md Quick Reference table if it's a core workflow command.
9. **Add entry** to `CHANGELOG.md` `[Unreleased]` `### Features` section.
10. **Create `demos/<group>/<X>.tape`** — place it in the appropriate group folder (`core/`, `setup/`, `pr/`, `issues/`, `release/`). Add a row to the **Tape-to-command map** in this skill. Run `npm run demo:coverage` to confirm 100% coverage is maintained.

---

## Scenario: behavior change in existing command

For any flag change, new prompt, removed option, or changed default:

1. Read `docs/commands/<X>.md` and verify the `## Flow` and `## Options` table are accurate.
2. Read README.md `### devflow <X>` subsection and verify options and examples.
3. Read AI_INSTRUCTIONS.md per-command block and verify the non-interactive flag examples still work.
4. If the change is user-visible, add an entry to `CHANGELOG.md` `[Unreleased]` under `### Features` or `### Bug Fixes`.
5. If the prompt flow changed (new/removed/reordered prompts, new confirm step), see **Scenario: prompt flow changed** below.

---

## Scenario: prompt flow changed

When a command gains, loses, or reorders interactive prompts:

1. **Identify the tape** using the Tape-to-command map above.
2. **Read the tape** (`demos/<dir>/<X>.tape`) and map each keypress block to the current prompt sequence in `src/commands/<X>.ts`.
3. **Update the tape** — add/remove/reorder `Enter`, `Down`, `Type`, `Space` lines to match the new flow. Keep `Sleep` values reasonable (1.5s between prompts, 3s after a command runs).
4. **Check workflow tapes** — if the command is chained in any `demos/workflows/*.tape`, update those too.
5. **Verify** with `npm run demo:validate` (Phase 1 syntax + Phase 2 execution for non-interactive tapes). Interactive tapes are syntax-checked only; visually verify by running `vhs demos/<dir>/<X>.tape` locally if the flow is complex.

**Common pitfall:** Every mutating command ends with a trailing `selectWithBack("Confirm action?")`. If you add a new confirm step inside the flow, count whether it's `confirmWithBack` (Enter = yes) or `selectWithBack` (Enter = first option). Adding a step in the middle shifts all subsequent keypresses.

---

## Process to follow

1. **Identify changed files** — list files edited in this conversation (or run `git diff --name-only HEAD`).
2. **Look up rows** in the source-to-docs map above.
3. **Read each named doc surface** and compare against the actual new code.
4. **Propose a diff plan** — tell the user which files need updating and what specifically changes. Get confirmation if the scope is large.
5. **Apply the edits.**
6. **Bump version.json** if AI_INSTRUCTIONS.md was touched (see below).
7. **Check CHANGELOG** — if a `feat:` or `fix:` commit is being prepared, ensure `[Unreleased]` has a matching entry.

---

## Bumping .devflow/version.json

When `.devflow/AI_INSTRUCTIONS.md` is modified, bump `.devflow/version.json` to match the version in `package.json`:

```json
{
  "cliVersion": "<package.json version>",
  "generatedAt": "<current ISO date>",
  "files": {
    "aiInstructions": "<package.json version>"
  }
}
```

Read `package.json` for the current version, then overwrite `version.json` with the bumped values.

---

## Known drift (self-test — flag on first invocation)

These doc gaps exist in the repo right now. Flag them when relevant to the current change; fix them if the current change touches the area:

| Drift item | Fix |
|---|---|
| `src/commands/issues.ts` exists; `docs/commands/issues.md` is missing | Create the file; add to sidebar |
| `docs/.vitepress/config.ts` sidebar has no entry for `issues` | Add it |
| "Press Escape to go back" is in AI_INSTRUCTIONS.md and getting-started.md but not README | Add one-liner to README `## Commands` intro |
| CLAUDE.md Quick Reference has 9 rows; AI_INSTRUCTIONS.md has 7 rows | Reconcile — CLAUDE.md is the authoritative core-command list |

Only fix these proactively if the current edit touches the same file or area. Otherwise, just call them out.

**Webpage (docs site):** The docs site at `docs/` is deployed to Vercel on every push to `main`. After any doc edit, confirm the Vercel preview URL renders correctly. The `docs/commands/` pages are the primary user-facing reference; keep them current with every prompt-flow change.

---

## Out of scope

- `src/git.ts` — internal helpers only, no user-facing doc surface.
- `.publishing_strategy/` — marketing drafts, not product docs.
- `roadmap/*.md` — only update if the change introduces a new provider integration.
- `release_notes.md` — regenerated each release by `devflow release`, do not hand-edit.
- `CODE_OF_CONDUCT.md`, `SECURITY.md` — not feature-related.
