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

## Recommended Workflow (Issue-First Development)

**Always start with an issue for traceability.** This ensures all work is tracked and linked in the project board.

### Before Starting Any Work

1. **Check status:** `devflow status`
2. **Check project board:** `devflow issues` - see what's in Todo/In Progress
3. **Pick an existing issue or create a new one**

### Standard Tracked Workflow

```bash
# 1. Check current status
devflow status

# 2. See available issues on project board
devflow issues

# 3. Start work on an existing issue (assigns + moves to In Progress + creates branch)
devflow issues --work --issue 123 --yes

# 4. Make your changes...

# 5. Stage and commit
git add <files>
devflow commit

# 6. Create PR (auto-links to issue, moves issue to In Review)
devflow pr
```

### If No Relevant Issue Exists

```bash
# 1. Create issue + branch in one command
devflow issue --type task --title "Add user authentication" --create-branch --branch-desc "add-auth" --yes

# 2. Make changes, commit, and PR
git add <files>
devflow commit
devflow pr
```

## Rules for AI Agents

1. **Always check for or create an issue first:**
   - Check project board: `devflow issues`
   - Pick existing issue: `devflow issues --work --issue <N> --yes`
   - Or create new: `devflow issue --type <type> --title "..." --create-branch --yes`
   - This ensures full traceability in scrum/agile workflows

2. **Use devflow instead of git for:**
   - Issues: `devflow issues` / `devflow issue` not `gh issue`
   - Branches: `devflow branch` not `git checkout -b`
   - Commits: `devflow commit` not `git commit`
   - PRs: `devflow pr` not `gh pr create`

3. **Commit format:** `{type}[{ticket}]{breaking}({scope}): {message}`
   - Example: `feat[#123](auth): add OAuth2 login`

4. **Branch format:** `{type}/{ticket}_{description}`
   - Example: `feat/#123_add-login`

5. **Before making changes:**
   - Check status: `devflow status`
   - Check/pick issue: `devflow issues`
   - Start work: `devflow issues --work` or create branch: `devflow branch`

6. **After making changes:**
   - Stage files: `git add <files>`
   - Commit: `devflow commit`
   - When ready: `devflow pr`

7. **Use `--dry-run` to preview** any command without executing

## Non-Interactive Mode (AI-Friendly)

All commands support flags to bypass interactive prompts. Use `--yes` to skip confirmations.

### Issues Command (Project Board)
```bash
# List Todo and In Progress items
devflow issues

# Filter by status
devflow issues --status todo
devflow issues --status in-progress
devflow issues --status in-review

# Show unassigned Todo items
devflow issues --available

# Start work on an issue (assign + move to In Progress + create branch)
devflow issues --work --issue 123 --branch-desc "add-auth" --yes
```

### Issue Command (Create New)
```bash
devflow issue --type bug --title "Login crashes on iOS" --body "Steps to reproduce..." --yes
devflow issue --type user-story --json '{"asA":"user","iWant":"to login","soThat":"I can access my account"}' --yes
devflow issue --type task --title "Update deps" --create-branch --branch-desc "update-deps" --yes
```

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

### Issue-First Feature (Recommended)
```bash
# Check project board for existing issue
devflow issues

# Start work on issue #123
devflow issues --work --issue 123 --yes

# ... make changes ...
git add <files>
devflow commit

# Create PR (auto-moves issue to "In Review")
devflow pr
```

### New Feature (No Existing Issue)
```bash
# Create issue with branch
devflow issue --type task --title "Add feature X" --create-branch --branch-desc "feature-x" --yes

# ... make changes ...
git add <files>
devflow commit
devflow pr
```

### Quick Fix
```bash
git add <files>
devflow commit -m "fix typo in login form"
devflow amend           # If you need to add more changes
```

### Fully Automated Workflow (for AI agents)
```bash
# Option A: Work on existing issue
devflow issues --work --issue 123 --branch-desc "add-login" --yes
git add -A
devflow commit --type feat --scope auth --message "add login form" --yes
devflow pr --title "Add login form" --summary "Implements login UI" --yes

# Option B: Create new issue + branch
devflow issue --type task --title "Add login form" --create-branch --branch-desc "add-login" --yes
git add -A
devflow commit --type feat --scope auth --message "add login form" --yes
devflow pr --title "Add login form" --summary "Implements login UI" --yes
```

## Project Board Integration

When `project` is configured in `.devflow/config.json`, devflow automatically:

1. **`devflow issues`** - Lists items from your GitHub Project board
2. **`devflow issues --work`** - Assigns issue to you and moves to "In Progress"
3. **`devflow pr`** - Moves linked issue to "In Review" when PR is created
4. **Merge** - GitHub auto-closes issue (via "Closes #N" in PR body)

### Project Configuration Example
```json
{
  "project": {
    "enabled": true,
    "number": 1,
    "statusField": "Status",
    "statuses": {
      "todo": "Todo",
      "inProgress": "In Progress",
      "inReview": "In Review",
      "done": "Done"
    }
  }
}
```
