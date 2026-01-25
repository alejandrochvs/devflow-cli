# Claude Code Instructions for DevFlow

## Project Overview

This is devflow-cli, an interactive CLI for Git workflow automation. When working on this project or projects that use devflow, follow these guidelines.

## Using DevFlow Commands

**Always prefer devflow commands over raw git for:**
- Branches: `devflow branch` instead of `git checkout -b`
- Commits: `devflow commit` instead of `git commit`
- PRs: `devflow pr` instead of `gh pr create`
- Issues: `devflow issue` instead of `gh issue create`

## Quick Reference

| Task | Command |
|------|---------|
| New branch | `devflow branch` |
| Commit changes | `devflow commit` or `devflow commit -m "message"` |
| Create/update PR | `devflow pr` |
| Create issue | `devflow issue` |
| Amend last commit | `devflow amend` |
| Check status | `devflow status` |
| View PR comments | `devflow comments` |

## Commit Format

This project uses: `{type}[{ticket}]({scope}): {message}`

Example: `feat[ENV-123](auth): add OAuth2 login`

## Before Making Changes

1. Check current status: `devflow status`
2. Create a branch if needed: `devflow branch`

## After Making Changes

1. Stage files: `git add <files>`
2. Commit: `devflow commit`
3. When ready: `devflow pr`

## Dry Run

Use `--dry-run` to preview any command without executing:
```bash
devflow commit --dry-run
devflow pr --dry-run
```

## Full Documentation

See `.devflow/AI_INSTRUCTIONS.md` for complete command reference and workflows.
