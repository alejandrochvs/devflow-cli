# branch

Interactive branch creation with consistent naming.

**Alias:** `devflow b`

## Flow

**Without GitHub Issues integration:**
1. Select branch type (`feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `release`, `hotfix`)
2. Enter ticket number (skipped if not in branch format)
3. Enter short description (auto-kebab-cased)
4. Preview and confirm

**With GitHub Issues integration** (`ticketProvider: { type: "github" }`):
1. Choose how to select ticket (pick from issues, enter manually, or skip)
2. If picking: select from open issues assigned to you
3. Branch type auto-inferred from issue labels
4. Description pre-filled from issue title
5. Preview and confirm

## GitHub Issues Integration

When `ticketProvider` is configured, you get an issue picker:

```
? How do you want to select the ticket?
  > Pick from open issues (assigned to me)
    Enter manually
    Skip (UNTRACKED)

? Select an issue:
  > #142 Add biometric login (bug, auth)
    #138 Update dependencies (chore)
    #135 Fix login on mobile (bug)

  Inferred type from labels: fix
```

**Label to branch type mapping:**

| Label | Branch Type |
|-------|-------------|
| `bug` | `fix` |
| `enhancement`, `feature` | `feat` |
| `documentation` | `docs` |
| `refactor`, `tech-debt` | `refactor` |
| `test` | `test` |
| `chore`, `maintenance` | `chore` |

Configure in `.devflow/config.json`:

```json
{
  "ticketProvider": {
    "type": "github"
  }
}
```

## Branch Format

The format is configurable via `branchFormat` in `.devflow/config.json`. Default depends on your preset:

| Preset | Format | Example |
|--------|--------|---------|
| Scrum | `{type}/{ticket}_{description}` | `feat/ENV-123_add-login` |
| Kanban | `{type}/{ticket}_{description}` | `fix/BUG-45_fix-crash` |
| Simple | `{type}/{description}` | `feat/add-login` |

### Available Placeholders

| Placeholder | Description |
|-------------|-------------|
| `{type}` | Branch type (feat, fix, etc.) |
| `{ticket}` | Ticket number or UNTRACKED |
| `{description}` | Kebab-cased description |
| `{scope}` | Optional scope |

### Custom Formats

```json
{
  "branchFormat": "{type}/{scope}/{ticket}_{description}"
}
```

Results in: `feat/auth/ENV-123_add-oauth`

## Examples

**Scrum/Kanban (with ticket):**
```
feat/ENV-123_add-budget-sharing
fix/PROJ-45_correct-calculation-overflow
chore/UNTRACKED_update-dependencies
```

**Simple (no ticket):**
```
feat/add-budget-sharing
fix/correct-calculation-overflow
chore/update-dependencies
```

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview the branch name without creating it |
