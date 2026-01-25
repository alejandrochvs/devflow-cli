# Claude Code Instructions for DevFlow

## Project Overview

This is devflow-cli, an interactive CLI for Git workflow automation. When working on this project or projects that use devflow, follow these guidelines.

## Using DevFlow Commands

**Always prefer devflow commands over raw git for:**
- Project issues: `devflow issues` to list/work on issues
- Create issues: `devflow issue` instead of `gh issue create`
- Branches: `devflow branch` instead of `git checkout -b`
- Commits: `devflow commit` instead of `git commit`
- PRs: `devflow pr` instead of `gh pr create`

## Quick Reference

| Task | Command |
|------|---------|
| Check status | `devflow status` |
| List project issues | `devflow issues` |
| Start work on issue | `devflow issues --work` |
| Create new issue | `devflow issue` |
| New branch | `devflow branch` |
| Commit changes | `devflow commit` or `devflow commit -m "message"` |
| Create/update PR | `devflow pr` |
| Amend last commit | `devflow amend` |
| View PR comments | `devflow comments` |

## Commit Format

This project uses: `{type}[{ticket}]({scope}): {message}`

Example: `feat[ENV-123](auth): add OAuth2 login`

## Before Making Changes (Issue-First Workflow)

1. Check current status: `devflow status`
2. Check project board: `devflow issues`
3. Start work on existing issue: `devflow issues --work --issue <N> --yes`
4. Or create new issue with branch: `devflow issue --type task --title "..." --create-branch --yes`

## After Making Changes

1. Stage files: `git add <files>`
2. Commit: `devflow commit`
3. When ready: `devflow pr` (auto-moves issue to "In Review")

## Dry Run

Use `--dry-run` to preview any command without executing:
```bash
devflow commit --dry-run
devflow pr --dry-run
```

## Non-Interactive Mode

All commands support flags to bypass interactive prompts. Use `--yes` to skip confirmations:

```bash
# Create branch without prompts
devflow branch --type feat --ticket 123 --description "add-login" --yes

# Commit without prompts
devflow commit --type feat --scope auth --message "add login" --all --yes

# Create PR without prompts
devflow pr --title "Add login" --summary "Implements login flow" --yes
```

## Full Documentation

See `.devflow/AI_INSTRUCTIONS.md` for complete command reference and workflows.
