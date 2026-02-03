# DevFlow - AI Agent Instructions

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

## Rules for AI Agents

1. **NEVER push directly to main** unless the user explicitly requests it
   - All changes MUST go through pull requests
   - Create a branch with `devflow branch`, make changes, then `devflow pr`
   - This rule applies even for "small" or "quick" fixes

2. **Use devflow instead of git/gh for:**
   - Branches: `devflow branch` not `git checkout -b`
   - Commits: `devflow commit` not `git commit`
   - PRs: `devflow pr` not `gh pr create`
   - Issues: `devflow issue` not `gh issue create`

3. **Commit format:** `{type}[{ticket}]{breaking}({scope}): {message}`
   - Example: `feat[123](auth): add OAuth2 login`

4. **Branch format:** `{type}/{ticket}_{description}`
   - Example: `feat/123_add-login`

5. **Use `--dry-run` to preview** any command without executing

## Issue-First Workflow

### Before Making Changes

1. Check current status: `devflow status`
2. Check project board: `devflow issues`
3. Start work on existing issue: `devflow issues --work --issue <N> --yes`
4. Or create new issue with branch: `devflow issue --type task --title "..." --create-branch --yes`

### After Making Changes

1. Stage files: `git add <files>`
2. Commit: `devflow commit`
3. When ready: `devflow pr` (auto-moves issue to "In Review")

## Features

### Test Plan from Acceptance Criteria

When creating a branch from an issue that has an `## Acceptance Criteria` section with checkboxes:

```markdown
## Acceptance Criteria

- [ ] User can log in with email
- [ ] User can log in with Google
- [ ] Error messages are shown for invalid credentials
```

DevFlow will automatically offer to use these as test plan steps. The test plan appears in your PR description.

### GitHub Projects Integration

DevFlow can automatically move issues on your project board:
- **In Progress**: When you create a branch for an issue
- **In Review**: When you open a PR

Run `devflow init` to set up project integration.

### Non-Interactive Mode

All commands support flags to bypass interactive prompts. Use `--yes` to skip confirmations:

```bash
# Create branch without prompts
devflow branch --type feat --ticket 123 --description "add-login" --yes

# Commit without prompts
devflow commit --type feat --scope auth --message "add login" --all --yes

# Create PR without prompts
devflow pr --title "Add login" --summary "Implements login flow" --yes
```

## Common Workflows

### New Feature (with issue)

```bash
devflow issues --work       # Pick an issue and create branch
# ... make changes ...
git add <files>
devflow commit              # Commit with proper format
devflow pr                  # Create pull request
```

### Quick Fix

```bash
devflow branch              # Create branch
git add <files>
devflow commit -m "fix typo in login form"
devflow pr
```

### Amend Changes

```bash
git add <files>
devflow amend               # Add to last commit
```
