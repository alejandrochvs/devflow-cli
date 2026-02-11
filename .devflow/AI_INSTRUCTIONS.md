# DevFlow - AI Agent Instructions

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

## Rules for AI Agents

1. **Use devflow instead of git for:**
   - Branches: `devflow branch` not `git checkout -b`
   - Commits: `devflow commit` not `git commit`
   - PRs: `devflow pr` not `gh pr create`

2. **Commit format:** `{type}[{ticket}]{breaking}({scope}): {message}`
   - Example: `feat[123](auth): add OAuth2 login`

3. **Branch format:** `{type}/{ticket}_{description}`
   - Example: `feat/123_add-login`

4. **Before making changes:**
   - Check status: `devflow status`
   - Create branch if needed: `devflow branch`

5. **After making changes:**
   - Stage files: `git add <files>`
   - Commit: `devflow commit`
   - When ready: `devflow pr`

6. **Use `--dry-run` to preview** any command without executing

7. **Back navigation:** Press Escape to return to the previous step

## Non-Interactive Mode (AI-Friendly)

All commands support flags to bypass interactive prompts. Use `--yes` to skip confirmations.

### Branch Command
```bash
devflow branch --type feat --ticket 123 --description "add-login" --yes
devflow branch --type fix --ticket UNTRACKED --description "typo" --yes
devflow branch --type feat --ticket 456 --description "oauth" --test-plan "Login works|Logout works" --yes
```

### Commit Command
```bash
devflow commit --type feat --scope auth --message "add OAuth2 login" --all --yes
devflow commit --type fix --message "fix typo" --files "src/app.ts,src/index.ts" --yes
devflow commit --type feat --message "add API" --breaking --breaking-desc "Changes API format" --yes
```

### PR Command
```bash
devflow pr --title "Add OAuth2 login" --summary "Implements OAuth2 flow" --yes
devflow pr --title "Feature X" --base develop --ready --yes
```

### Issue Command
```bash
devflow issue --type bug --title "Login crashes on iOS" --body "Steps to reproduce..." --yes
devflow issue --type user-story --json '{"asA":"user","iWant":"to login","soThat":"I can access my account"}' --yes
devflow issue --type task --title "Update deps" --create-branch --branch-desc "update-deps" --yes
```

### Amend Command
```bash
devflow amend --type fix --message "correct typo" --yes
devflow amend --scope auth --message "add validation" --yes
```

### Undo Command
```bash
devflow undo --yes
```

### Fixup Command
```bash
devflow fixup --target abc1234 --all --yes
devflow fixup --target abc1234 --files "src/app.ts" --auto-squash --yes
```

### Cleanup Command
```bash
devflow cleanup --all --yes
devflow cleanup --branches "feat/old,fix/done" --force --yes
```

### Merge Command
```bash
devflow merge --method squash --yes
devflow merge --method rebase --yes
```

### Stash Command
```bash
devflow stash --action save --message "WIP: feature X" --include-untracked
devflow stash --action pop --index 0 --yes
devflow stash --action drop --index 0 --yes
```

### Test Plan Command
```bash
devflow test-plan --add "Step 1|Step 2|Step 3"
devflow test-plan --replace "New step 1|New step 2"
devflow test-plan --clear
devflow test-plan --show
```

### Changelog Command
```bash
devflow changelog --version 2.0.0 --yes
```

### Review Command
```bash
devflow review --pr 123 --action checkout
devflow review --pr 123 --action approve --comment "LGTM!"
devflow review --pr 123 --action comment --comment "Please fix the typo"
devflow review --pr 123 --action request-changes --comment "Needs error handling"
```

### Worktree Command
```bash
devflow worktree --action list
devflow worktree --action add --branch feat/new-feature --path ../project-new-feature
devflow worktree --action remove --path ../project-old --yes
```

### Release Command
```bash
devflow release --bump patch --yes
devflow release --bump minor --yes
devflow release --version 2.0.0 --yes
```

## Common Workflows

### New Feature
```bash
devflow branch          # Create feature branch
# ... make changes ...
git add <files>
devflow commit          # Commit with proper format
devflow pr              # Create pull request
```

### Quick Fix
```bash
git add <files>
devflow commit -m "fix typo in login form"
devflow amend           # If you need to add more changes
```

### Fully Automated Workflow (for AI agents)
```bash
# Create branch
devflow branch --type feat --ticket 123 --description "add-login" --yes

# Make changes and commit
git add -A
devflow commit --type feat --scope auth --message "add login form" --yes

# Create PR
devflow pr --title "Add login form" --summary "Implements login UI" --yes
```
