# commit

Interactive conventional commit with file staging, scope selection, and ticket inference.

**Alias:** `devflow c`

<img src="/gifs/commit.gif" alt="devflow commit demo" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin: 16px 0;" />

## Branch Protection

If you're on `main`, `master`, `develop`, or `production`, devflow warns you and asks for confirmation before proceeding.

## Flow

1. If no files are staged, select files to stage (checkbox selection)
2. Select commit type
3. Select or enter scope (searchable list if configured, free text otherwise). You can also add a new scope inline — it will be saved to your config.
4. Enter commit subject
5. Optional: enter commit body (longer description)
6. Confirm if breaking change (adds `BREAKING CHANGE:` footer)
7. Optional: enter ticket reference (added as `Refs: TICKET` footer)
8. Preview and confirm

## Commit Format

```
type[ticket](scope): message
```

The ticket is automatically inferred from the branch name. If the branch doesn't follow the `type/TICKET_description` format, it defaults to `UNTRACKED`.

## Examples

```
feat[ENV-123](auth): add biometric login
fix[PROJ-45](budget): correct calculation overflow
chore[UNTRACKED](deps): update dependencies
refactor[ENV-200]!(api): restructure endpoints
```

The `!` after the ticket indicates a breaking change.

## Options

| Option      | Description                          |
| ----------- | ------------------------------------ |
| `--dry-run` | Preview the commit without executing |

## Adding Scopes

When scopes are configured, the scope selection step includes an **➕ Add new scope** option at the bottom of the list. Selecting it lets you define a scope name and description, which is immediately saved to `.devflow/config.json` and used for the current commit.
