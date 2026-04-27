---
name: devflow-usage
description: MANDATORY when working in any devflow-managed repo (one with a .devflow/config.json). Always use devflow commands instead of raw git/gh — `devflow branch` over `git checkout -b`, `devflow commit` over `git commit`, `devflow pr` over `gh pr create`. Never push directly to main; all changes go through PRs. Full command reference and non-interactive flag examples live in .devflow/AI_INSTRUCTIONS.md.
---

# DevFlow Usage

This repo uses [devflow](https://github.com/alejandrochvs/devflow-cli) for Git workflow automation. Apply these rules whenever making changes.

## Core rules

1. **Never push directly to main.** All changes go through pull requests, even small fixes.
2. **Use devflow commands, not raw git/gh:**
   - Branches: `devflow branch` (not `git checkout -b`)
   - Commits: `devflow commit` (not `git commit`)
   - PRs: `devflow pr` (not `gh pr create`)
   - Issues: `devflow issue` / `devflow issues` (not `gh issue ...`)
3. **Issue-first workflow** (when a project board is configured):
   - `devflow issues` to see Todo / In Progress
   - `devflow issues --work --issue <N> --yes` to start work (assigns, moves to In Progress, creates branch)
4. **Commit format:** `{type}[{ticket}]({scope}): {message}` — e.g. `feat[123](auth): add OAuth2 login`. The exact format is configured in `.devflow/config.json` (`commitFormat` field).
5. **Branch format:** `{type}/{ticket}_{description}` — e.g. `feat/123_add-login`. Configurable in `.devflow/config.json` (`branchFormat`).
6. **Press `Escape`** to go back a step in any multi-step prompt.
7. **Use `--dry-run`** to preview any command without executing.

## Non-interactive mode for AI agents

Append `--yes` to skip all confirmation prompts. Each command also accepts content flags so prompts can be skipped entirely:

```bash
devflow branch --type feat --ticket 123 --description "add-login" --yes
devflow commit --type feat --scope auth --message "add login" --all --yes
devflow pr --title "Add login" --summary "Implements login UI" --yes
```

Full per-command non-interactive examples live in `.devflow/AI_INSTRUCTIONS.md`.

## Full reference

For everything beyond the basics above — Quick Reference table, all command flags, common workflows, edge cases like merged/closed PRs — read `.devflow/AI_INSTRUCTIONS.md`. Treat that file as canonical.

## Why a skill plus an instructions file?

`.devflow/AI_INSTRUCTIONS.md` is the canonical, agent-agnostic reference (read by Cursor, Copilot, and any other AI tool). This skill is a Claude-Code-specific wrapper that surfaces the rules in Claude's available-skills list so they're always discoverable. Both files stay in sync via `devflow update`.
