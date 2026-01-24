# branch

Interactive branch creation with consistent naming.

**Alias:** `devflow b`

## Flow

1. Select branch type (`feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `release`, `hotfix`)
2. Enter ticket number (or leave blank for `UNTRACKED`)
3. Enter short description (auto-kebab-cased)
4. Preview and confirm

## Branch Format

```
type/TICKET_description
```

## Examples

```
feat/ENV-123_add-budget-sharing
fix/PROJ-45_correct-calculation-overflow
chore/UNTRACKED_update-dependencies
```

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview the branch name without creating it |
