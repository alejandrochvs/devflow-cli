# changelog

Generates a changelog entry from conventional commits since the last git tag.

## Features

- Groups by type (Features, Bug Fixes, etc.)
- Highlights breaking changes
- Auto-suggests the next version (semver bump based on commit types)
- Prepends to `CHANGELOG.md`

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview the changelog without writing to file |
