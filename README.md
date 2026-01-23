# @alejandrochaves/devflow-cli

Interactive CLI for branch creation, conventional commits, and PR management.

## Install

```bash
npm install -D @alejandrochaves/devflow-cli
```

## Quick Start

```bash
# Initialize config in your project
npx devflow init

# Create a branch
npx devflow branch

# Stage files and commit
npx devflow commit

# Create or update a PR
npx devflow pr
```

Or add scripts to your `package.json`:

```json
{
  "scripts": {
    "branch": "devflow branch",
    "commit": "devflow commit",
    "pr": "devflow pr"
  }
}
```

## Commands

### `devflow init`

Interactive setup wizard that configures your entire project. Walks you through:

1. **Ticket base URL** — for linking tickets in PRs
2. **Scopes** — add project-specific scopes one by one (or use defaults)
3. **PR checklist** — customize or use defaults
4. **package.json scripts** — auto-adds `commit`, `branch`, `pr` scripts
5. **Commitlint** — creates config with the devflow parser preset, installs deps
6. **Husky** — installs, initializes, creates `commit-msg` hook
7. **CI workflow** — optionally generates `.github/workflows/ci.yml` (lint, typecheck, test)

### `devflow branch`

Interactive branch creation with consistent naming.

**Flow:**
1. Select branch type (feat, fix, chore, refactor, docs, test, release, hotfix)
2. Enter ticket number (or leave blank for `UNTRACKED`)
3. Enter short description (auto-kebab-cased)
4. Preview and confirm

**Branch format:**
```
type/TICKET_description
```

**Examples:**
```
feat/ENV-123_add-budget-sharing
fix/PROJ-45_correct-calculation-overflow
chore/UNTRACKED_update-dependencies
```

### `devflow commit`

Interactive conventional commit with file staging, scope selection, and ticket inference.

**Flow:**
1. If no files are staged, select files to stage (checkbox selection)
2. Select commit type
3. Select or enter scope (searchable list if configured, free text otherwise)
4. Enter commit message
5. Confirm if breaking change
6. Preview and confirm

**Commit format:**
```
type[ticket](scope): message
```

The ticket is automatically inferred from the branch name. If the branch doesn't follow the `type/TICKET_description` format, it defaults to `UNTRACKED`.

**Examples:**
```
feat[ENV-123](auth): add biometric login
fix[PROJ-45](budget): correct calculation overflow
chore[UNTRACKED](deps): update dependencies
refactor[ENV-200]!(api): restructure endpoints
```

The `!` after the ticket indicates a breaking change.

### `devflow pr`

Create or update a pull request with an auto-filled template.

**Flow:**
1. Checks if a PR already exists for the current branch (offers to update)
2. Infers the base branch (closest remote branch by merge-base)
3. Enter PR title (pre-filled from branch description)
4. Enter optional summary
5. Preview PR body with template
6. Confirm and create/update

**Features:**
- Auto-detects existing PRs and offers update flow
- Infers base branch using `git merge-base` comparison
- Pre-fills commit list in the summary
- Auto-labels from branch type (feat → `feature`, fix → `bug`, etc.)
- Auto-labels from commit scopes
- Self-assigns with `@me`
- Creates as draft by default
- Links ticket if `ticketBaseUrl` is configured

**PR template includes:**
- Summary (with commit list)
- Ticket (linked if base URL configured)
- Type of Change (checkboxes, auto-checked from branch type)
- Screenshots table
- Test Plan
- Checklist (customizable via config)

### `devflow status`

At-a-glance view of your current branch context:
- Branch name, type, ticket, and description
- Inferred base branch
- Commit count with recent messages
- Working tree status (staged/modified/untracked)
- PR link and state (if exists)

### `devflow amend`

Re-edit the last commit message using the same guided prompts. Pre-fills all fields from the existing message. Also includes any staged changes in the amend.

### `devflow cleanup`

Finds and deletes local branches that are:
- Merged into `main`
- Tracking a remote branch that no longer exists

Fetches remote state first, shows checkbox selection, and asks for confirmation before force-deleting unmerged branches.

### `devflow changelog`

Generates a changelog entry from conventional commits since the last git tag:
- Groups by type (Features, Bug Fixes, etc.)
- Highlights breaking changes
- Auto-suggests the next version (semver bump based on commit types)
- Prepends to `CHANGELOG.md`

### `devflow doctor`

Checks that all devflow dependencies are properly configured:
- git, node (>= 18), gh CLI + auth
- `.devflow.json`, commitlint config, husky hooks
- `package.json` scripts

### `devflow completions`

Outputs shell completion scripts for tab-completion of commands:

```bash
# zsh (add to ~/.zshrc)
eval "$(devflow completions --shell zsh)"

# bash (add to ~/.bashrc)
eval "$(devflow completions --shell bash)"
```

## Global Options

Commands that modify git state support `--dry-run` to preview without executing:

```bash
devflow commit --dry-run
devflow branch --dry-run
devflow pr --dry-run
devflow amend --dry-run
devflow cleanup --dry-run
devflow changelog --dry-run
```

## Configuration

Create a `.devflow.json` in your project root (or run `devflow init`):

```json
{
  "ticketBaseUrl": "https://github.com/org/repo/issues",
  "scopes": [
    { "value": "auth", "description": "Authentication & login", "paths": ["src/auth/**"] },
    { "value": "ui", "description": "UI components", "paths": ["src/components/**"] },
    { "value": "api", "description": "API layer", "paths": ["src/api/**", "src/services/**"] }
  ],
  "branchTypes": ["feat", "fix", "chore", "refactor", "docs", "test", "release", "hotfix"],
  "commitTypes": [
    { "value": "feat", "label": "feat:     A new feature" },
    { "value": "fix", "label": "fix:      A bug fix" }
  ],
  "commitFormat": "{type}[{ticket}]{breaking}({scope}): {message}",
  "checklist": [
    "Code follows project conventions",
    "Self-reviewed the changes",
    "No new warnings or errors introduced"
  ],
  "prTemplate": {
    "sections": ["summary", "ticket", "type", "screenshots", "testPlan", "checklist"],
    "screenshotsTable": true
  },
  "prReviewers": ["copilot"]
}
```

### Config Options

| Option | Description | Default |
|--------|-------------|---------|
| `ticketBaseUrl` | Base URL for linking tickets in PRs | — |
| `scopes` | List of scopes with `value`, `description`, and optional `paths` for auto-inference | `[]` (free text input) |
| `scopes[].paths` | Glob patterns to auto-suggest this scope when matching files are staged | — |
| `branchTypes` | Allowed branch type prefixes | `["feat", "fix", "chore", ...]` |
| `commitTypes` | Commit types shown in selection menu (`value` + `label`) | Standard conventional types |
| `commitFormat` | Commit message format with `{type}`, `{ticket}`, `{breaking}`, `{scope}`, `{message}` placeholders | `{type}[{ticket}]{breaking}({scope}): {message}` |
| `checklist` | PR checklist items | Basic code review items |
| `prTemplate.sections` | PR body sections to include | All sections |
| `prTemplate.screenshotsTable` | Include before/after screenshots table | `true` |
| `prReviewers` | Default PR reviewers (GitHub usernames) | — |

### Scopes

When `scopes` is an empty array, the commit command shows a free text input for scope. When populated, it shows a searchable list that can be filtered by typing.

**Scope inference** works in two ways (first match wins):

1. **From file paths** — if a scope has `paths` configured, staged files are matched against those glob patterns. The scope with the most matching files is suggested.
2. **From git history** — previous commits on the branch (`git log main..HEAD`) are parsed for existing scopes.

Example with paths:
```json
{
  "scopes": [
    { "value": "auth", "description": "Authentication", "paths": ["src/auth/**", "src/hooks/useAuth*"] },
    { "value": "ui", "description": "UI components", "paths": ["src/components/**"] }
  ]
}
```

If you stage `src/auth/login.ts`, the `auth` scope is auto-suggested.

## Commitlint Integration

If you use [commitlint](https://commitlint.js.org/) to enforce commit conventions, add this parser preset to handle the `type[ticket](scope): message` format:

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)\[.*?\]!?\((.+)\): (.+)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  rules: {
    'subject-case': [0],
  },
};
```

## Git Hooks

Pair with [husky](https://typicode.github.io/husky/) for a guided commit experience:

```bash
# .husky/commit-msg
npx --no -- commitlint --edit $1 || {
  echo ""
  echo "  Commit message does not follow the required format."
  echo "  Use: npm run commit"
  echo ""
  exit 1
}
```

## Requirements

- Node.js >= 18
- Git
- [GitHub CLI (gh)](https://cli.github.com/) — required for the `pr` command

## License

MIT
