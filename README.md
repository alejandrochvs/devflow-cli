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

Generates a `.devflow.json` config file in your project root. Prompts for your ticket base URL and creates a starter config with default scopes and checklist items.

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

## Configuration

Create a `.devflow.json` in your project root (or run `devflow init`):

```json
{
  "ticketBaseUrl": "https://github.com/org/repo/issues",
  "scopes": [
    { "value": "auth", "description": "Authentication & login" },
    { "value": "ui", "description": "UI components" },
    { "value": "api", "description": "API layer" }
  ],
  "branchTypes": ["feat", "fix", "chore", "refactor", "docs", "test", "release", "hotfix"],
  "commitTypes": [
    { "value": "feat", "label": "feat:     A new feature" },
    { "value": "fix", "label": "fix:      A bug fix" }
  ],
  "checklist": [
    "Code follows project conventions",
    "Self-reviewed the changes",
    "No new warnings or errors introduced"
  ]
}
```

### Config Options

| Option | Description | Default |
|--------|-------------|---------|
| `ticketBaseUrl` | Base URL for linking tickets in PRs (e.g., `https://github.com/org/repo/issues`) | — |
| `scopes` | List of scopes with `value` and `description`. Enables searchable selection in commit command. | `[]` (free text input) |
| `branchTypes` | Allowed branch type prefixes. | `["feat", "fix", "chore", "refactor", "docs", "test", "release", "hotfix"]` |
| `commitTypes` | Commit types shown in the selection menu. Each has `value` and `label`. | Standard conventional commit types |
| `checklist` | PR checklist items added to the template. | Basic code review items |

### Scopes

When `scopes` is an empty array, the commit command shows a free text input for scope. When populated, it shows a searchable list that can be filtered by typing.

The commit command also infers the scope from previous commits on the branch (`git log main..HEAD`) and pre-selects it as the default.

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
