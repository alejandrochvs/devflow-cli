# DevFlow CLI - AI Agent Instructions

This document provides instructions for AI agents on how to use the devflow CLI tool effectively.

## Overview

devflow is an interactive CLI for Git workflow automation. It handles:
- Branch creation with consistent naming
- Conventional commit formatting
- Pull request creation and updates
- Issue creation with templates
- Various Git operations (amend, fixup, merge, etc.)

## When to Use DevFlow

Use devflow commands instead of raw git commands when:
- Creating branches (ensures consistent naming)
- Making commits (ensures conventional commit format)
- Creating/updating PRs (generates structured PR body)
- Creating GitHub issues (uses project templates)

## Command Reference

### Core Workflow Commands

#### `devflow branch` (alias: `b`)
Create a new branch with consistent naming.

```bash
# Interactive mode (recommended)
devflow branch

# Dry run to preview
devflow branch --dry-run
```

**When to use:** Starting work on a new feature, bug fix, or task.

**Branch format depends on preset:**
- Scrum/Kanban: `{type}/{ticket}_{description}` → `feat/ENV-123_add-login`
- Simple: `{type}/{description}` → `feat/add-login`

---

#### `devflow commit` (alias: `c`)
Create a conventional commit with the project's format.

```bash
# Interactive mode (stages files, prompts for details)
devflow commit

# Dry run to preview
devflow commit --dry-run

# Quick commit with message
devflow commit -m "add user authentication"
```

**When to use:** After making changes that should be committed.

**Commit format:** `{type}[{ticket}]({scope}): {message}`
Example: `feat[ENV-123](auth): add OAuth2 login flow`

---

#### `devflow pr` (alias: `p`)
Create or update a pull request.

```bash
# Create/update PR interactively
devflow pr

# Dry run to preview PR body
devflow pr --dry-run

# Target a specific base branch
devflow pr --base develop
```

**When to use:** When ready to open a PR or update an existing one.

---

#### `devflow issue` (alias: `i`)
Create a GitHub issue with project templates.

```bash
# Interactive mode
devflow issue

# Dry run to preview
devflow issue --dry-run
```

**When to use:** Creating new issues for features, bugs, tasks.

---

### Modification Commands

#### `devflow amend` (alias: `a`)
Amend the last commit.

```bash
devflow amend              # Amend with same message
devflow amend -m "new msg" # Amend with new message
devflow amend --no-edit    # Amend without editing message
```

---

#### `devflow fixup` (alias: `f`)
Create a fixup commit for a previous commit.

```bash
devflow fixup  # Select commit to fix interactively
```

---

#### `devflow undo` (alias: `u`)
Undo the last commit (keeps changes staged).

```bash
devflow undo
```

---

### PR Management Commands

#### `devflow review` (alias: `rv`)
View and checkout PRs for review.

```bash
devflow review         # List PRs to review
devflow review 123     # Checkout PR #123
```

---

#### `devflow comments` (alias: `cm`)
View PR review comments.

```bash
devflow comments              # Current branch's PR
devflow comments 123          # Specific PR
devflow comments --unresolved # Only unresolved comments
devflow comments --resolved   # Only resolved comments
```

---

#### `devflow merge` (alias: `m`)
Merge a PR with options.

```bash
devflow merge           # Merge current branch's PR
devflow merge 123       # Merge PR #123
devflow merge --squash  # Squash merge
devflow merge --rebase  # Rebase merge
```

---

### Utility Commands

#### `devflow status` (alias: `s`)
Show branch and PR status.

```bash
devflow status
```

---

#### `devflow log` (alias: `l`)
Show formatted commit log.

```bash
devflow log        # Commits on current branch
devflow log -n 20  # Last 20 commits
```

---

#### `devflow stash` (alias: `st`)
Interactive stash management.

```bash
devflow stash       # Stash changes
devflow stash pop   # Pop last stash
devflow stash list  # List stashes
```

---

#### `devflow cleanup`
Clean up merged branches.

```bash
devflow cleanup           # Interactive cleanup
devflow cleanup --dry-run # Preview what would be deleted
```

---

#### `devflow doctor`
Verify devflow setup and configuration.

```bash
devflow doctor
```

---

## Common Workflows

### Starting a New Feature

```bash
# 1. Create a branch
devflow branch
# Select: feat
# Enter ticket: ENV-123
# Enter description: add user authentication

# 2. Make changes and commit
devflow commit
# Select type: feat
# Enter scope: auth
# Enter message: add OAuth2 provider

# 3. Create PR when ready
devflow pr
```

### Fixing a Bug

```bash
# 1. Create a fix branch
devflow branch
# Select: fix
# Enter ticket: BUG-456
# Enter description: login button unresponsive

# 2. Commit the fix
devflow commit -m "handle touch events on mobile"

# 3. Create PR
devflow pr
```

### Quick Commit (When Context is Clear)

```bash
# Stage specific files first
git add src/auth/login.ts

# Quick commit with message
devflow commit -m "add password validation"
```

### Amending a Commit

```bash
# Make additional changes
git add .

# Amend the last commit
devflow amend --no-edit
```

### Creating an Issue Then Working on It

```bash
# Create issue (will offer to create branch after)
devflow issue
# Select type, fill in details
# Say "yes" to create branch
```

## Configuration

The project should have a `.devflow.json` in the root:

```json
{
  "preset": "scrum",
  "branchFormat": "{type}/{ticket}_{description}",
  "ticketBaseUrl": "https://github.com/org/repo/issues",
  "ticketProvider": { "type": "github" },
  "scopes": [
    { "value": "auth", "description": "Authentication" },
    { "value": "ui", "description": "UI components" }
  ]
}
```

### Presets

| Preset | Ticket Required | Issue Types |
|--------|-----------------|-------------|
| `scrum` | Yes | User Story, Bug, Task, Spike, Tech Debt |
| `kanban` | Yes | Feature, Bug, Improvement, Task |
| `simple` | No | Feature, Bug, Task |

### Ticket Provider

When `ticketProvider` is configured:
- `devflow branch` offers to pick from open GitHub issues
- Branch type is inferred from issue labels (bug → fix, enhancement → feat)
- Branch description is pre-filled from issue title
- PRs use `Closes #N` syntax for auto-close

## Best Practices for AI Agents

1. **Always use `--dry-run` first** when uncertain about the outcome
2. **Use devflow for commits** instead of `git commit` to maintain format consistency
3. **Use devflow for branches** instead of `git checkout -b` for naming conventions
4. **Check `devflow status`** to understand current branch and PR state
5. **Run `devflow doctor`** if something seems misconfigured
6. **Prefer interactive mode** when multiple inputs are needed
7. **Use quick commit `-m`** only when scope and type are clear from context

## Error Handling

If a devflow command fails:
1. Check if `gh` CLI is installed and authenticated (`gh auth status`)
2. Run `devflow doctor` to verify setup
3. Ensure you're in a git repository
4. Check if `.devflow.json` exists and is valid

## Notes

- All commands support `--help` for detailed options
- Most commands have short aliases (see command reference above)
- devflow reads configuration from `.devflow.json` in project root
- PR commands require GitHub CLI (`gh`) to be installed and authenticated
