# cleanup

Finds and deletes local branches that are no longer needed.

## Targets

Branches that are:
- Merged into `main`
- Tracking a remote branch that no longer exists

## Flow

1. Fetches remote state
2. Shows checkbox selection of deletable branches
3. Asks for confirmation before force-deleting unmerged branches

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview which branches would be deleted |
