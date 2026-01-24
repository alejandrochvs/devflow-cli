# pr

Create or update a pull request with an auto-filled template.

**Alias:** `devflow p`

## Flow

1. Checks if a PR already exists for the current branch (offers to update)
2. Infers the base branch (closest remote branch by merge-base)
3. Enter PR title (pre-filled from branch description)
4. Enter optional summary
5. Preview PR body with template
6. Confirm and create/update

## Features

- Auto-detects existing PRs and offers update flow
- Infers base branch using `git merge-base` comparison
- Pre-fills commit list in the summary
- Auto-labels from branch type (`feat` → `feature`, `fix` → `bug`, etc.)
- Auto-labels from commit scopes
- Self-assigns with `@me`
- Creates as draft by default
- Links ticket if `ticketBaseUrl` is configured

## PR Template Sections

- Summary (with commit list)
- Ticket (linked if base URL configured)
- Type of Change (checkboxes, auto-checked from branch type)
- Screenshots table
- Test Plan
- Checklist (customizable via config)

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview the PR body without creating |
