# release

Automated release flow: version bump, changelog update, git tag, push, and GitHub release.

**Alias:** `devflow rel`

## Flow

1. Detects current version from `package.json`
2. Analyzes commits since last tag to suggest bump type (patch/minor/major)
3. Confirm version
4. Updates `CHANGELOG.md` with grouped commits
5. Commits version bump and changelog
6. Creates git tag
7. Pushes tag and commits
8. Creates GitHub release with changelog body

## Requirements

- `gh` CLI is required for the GitHub release step

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview the release without executing |
