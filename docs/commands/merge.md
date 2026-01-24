# merge

Merge the current branch's PR via GitHub CLI.

**Alias:** `devflow m`

## Flow

1. Detects the PR for the current branch
2. Select merge strategy (squash, merge, rebase)
3. Optionally delete the branch and switch back to main

## Requirements

- `gh` CLI must be installed and authenticated

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview the merge without executing |
