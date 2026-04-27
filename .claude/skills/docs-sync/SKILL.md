---
name: devflow-docs-sync
description: MANDATORY when editing any file under src/ in the devflow repo (especially src/commands/, src/config.ts, src/index.ts, src/providers/, src/plugins.ts, src/monorepo.ts). Identifies which documentation surfaces need updating based on the project's source-to-docs map, proposes the edits in the same change, and bumps .devflow/version.json when .devflow/AI_INSTRUCTIONS.md is touched. Invoke BEFORE finalizing any code edit so docs ship with the change, not after.
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

---

## Source-to-docs map

| If you changed… | Update these surfaces |
|---|---|
| `src/commands/<X>.ts` (behavior/flags) | `docs/commands/<X>.md` (flow + options table), README `### devflow <X>` section, AI_INSTRUCTIONS.md per-command block |
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

---

## Scenario: behavior change in existing command

For any flag change, new prompt, removed option, or changed default:

1. Read `docs/commands/<X>.md` and verify the `## Flow` and `## Options` table are accurate.
2. Read README.md `### devflow <X>` subsection and verify options and examples.
3. Read AI_INSTRUCTIONS.md per-command block and verify the non-interactive flag examples still work.
4. If the change is user-visible, add an entry to `CHANGELOG.md` `[Unreleased]` under `### Features` or `### Bug Fixes`.

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
| `.devflow/version.json` `cliVersion: 1.6.1`; `package.json: 1.7.0` | Bump after any AI_INSTRUCTIONS.md touch |
| "Press Escape to go back" is in AI_INSTRUCTIONS.md and getting-started.md but not README | Add one-liner to README `## Commands` intro |
| CLAUDE.md Quick Reference has 9 rows; AI_INSTRUCTIONS.md has 7 rows | Reconcile — CLAUDE.md is the authoritative core-command list |

Only fix these proactively if the current edit touches the same file or area. Otherwise, just call them out.

---

## Out of scope

- `src/git.ts` — internal helpers only, no user-facing doc surface.
- `.publishing_strategy/` — marketing drafts, not product docs.
- `roadmap/*.md` — only update if the change introduces a new provider integration.
- `release_notes.md` — regenerated each release by `devflow release`, do not hand-edit.
- `CODE_OF_CONDUCT.md`, `SECURITY.md` — not feature-related.
