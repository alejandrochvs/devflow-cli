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
6. **Husky** — installs, initializes, creates `commit-msg` hook + optional `pre-push` hook (lint + typecheck)
7. **CI workflow** — optionally generates `.github/workflows/ci.yml` (lint, typecheck, test)

### `devflow branch` (alias: `b`)

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

### `devflow commit` (alias: `c`)

Interactive conventional commit with file staging, scope selection, and ticket inference.

**Branch protection:** If you're on `main`, `master`, `develop`, or `production`, devflow warns you and asks for confirmation before proceeding.

**Flow:**
1. If no files are staged, select files to stage (checkbox selection)
2. Select commit type
3. Select or enter scope (searchable list if configured, free text otherwise)
4. Enter commit subject
5. Optional: enter commit body (longer description)
6. Confirm if breaking change (adds `BREAKING CHANGE:` footer)
7. Optional: enter ticket reference (added as `Refs: TICKET` footer)
8. Preview and confirm

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

### `devflow pr` (alias: `p`)

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

### `devflow test-plan` (alias: `tp`)

View or edit the test plan for the current branch. Test plan steps are stored locally and automatically included in the PR body.

**Flow:**
- If a test plan exists: view steps and choose to add, replace, or clear
- If no test plan: prompted to add steps

Steps are also optionally collected during `devflow branch` creation.

When you run `devflow pr`, stored test plan steps auto-populate the "Test Plan" section as checkboxes:

```markdown
## Test Plan

- [ ] Verify login flow with valid credentials
- [ ] Test error handling for expired tokens
- [ ] Confirm logout clears session data
```

### `devflow release` (alias: `rel`)

Automated release flow: version bump, changelog update, git tag, push, and GitHub release.

**Flow:**
1. Detects current version from `package.json`
2. Analyzes commits since last tag to suggest bump type (patch/minor/major)
3. Confirm version
4. Updates `CHANGELOG.md` with grouped commits
5. Commits version bump and changelog
6. Creates git tag
7. Pushes tag and commits
8. Creates GitHub release with changelog body

Requires `gh` CLI for the GitHub release step.

### `devflow review` (alias: `rv`)

List and interact with open pull requests.

**Flow:**
1. Lists open PRs for the repo with author, title, and status
2. Select a PR to inspect
3. Shows diff stat summary
4. Choose an action: checkout, approve, comment, request changes, or open in browser

Requires `gh` CLI.

### `devflow comments` (alias: `cm`)

Show PR reviews and inline comments with diff context. Displays all reviews and inline code comments grouped by file, with the surrounding diff hunk so you can see exactly what was commented on.

**Usage:**
```bash
# Comments for the current branch's PR
devflow comments

# Comments for a specific PR
devflow comments --number 303
```

Requires `gh` CLI.

### `devflow stash` (alias: `st`)

Named stash management with an interactive interface.

**Actions:**
- **Save** — stash with a descriptive name, optionally include untracked files
- **Pop** — apply and remove a stash
- **Apply** — apply without removing
- **Drop** — delete a stash
- **Show** — view the stash diff

### `devflow worktree` (alias: `wt`)

Manage git worktrees for working on multiple branches in parallel.

**Actions:**
- **Add** — create a new worktree (auto-creates branch if needed), suggests a path based on repo root
- **Remove** — select and remove a worktree (with force option for dirty trees)

Shows all existing worktrees with the current one highlighted.

### `devflow log` (alias: `l`)

Interactive commit history with actions.

**Flow:**
1. Shows commits on the current branch (since diverging from base)
2. Select a commit to inspect
3. Shows commit details and file stats
4. Choose an action: cherry-pick, revert, create fixup, or view full diff

### `devflow stats`

Show commit pattern analytics for the repository:

- **Commit types** — distribution with bar chart (feat, fix, chore, etc.)
- **Top scopes** — most frequently used scopes
- **Contributors** — commit counts per author
- **Summary** — total commits, local branches, first commit date

### `devflow lint-config` (alias: `lint`)

Validate `.devflow.json` for errors and warnings. Designed to run in CI pipelines (exits with code 1 on errors).

**Checks:**
- Valid JSON syntax
- Config structure validation (via `validateConfig`)
- Scopes have descriptions
- Scope path patterns contain globs or path separators
- PR template sections are recognized values
- Commit format placeholders are valid

```bash
# In CI
npx devflow lint-config
```

### `devflow undo` (alias: `u`)

Undo the last commit, keeping changes staged. Shows a preview of the commit that will be undone before confirming.

### `devflow fixup` (alias: `f`)

Create a fixup commit targeting a previous commit on the branch:

1. Shows recent commits on the branch
2. Select which commit to fix
3. Stage files (if needed)
4. Optionally auto-squash via interactive rebase

### `devflow merge` (alias: `m`)

Merge the current branch's PR via GitHub CLI:

1. Detects the PR for the current branch
2. Select merge strategy (squash, merge, rebase)
3. Optionally delete the branch and switch back to main

Requires `gh` CLI to be installed and authenticated.

### `devflow status` (alias: `s`)

At-a-glance view of your current branch context:
- Branch name, type, ticket, and description
- Inferred base branch
- Commit count with recent messages
- Working tree status (staged/modified/untracked)
- PR link and state (if exists)

### `devflow amend` (alias: `a`)

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
- git, node (>= 20), gh CLI + auth
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

## Command Aliases

| Command | Alias |
|---------|-------|
| `devflow branch` | `devflow b` |
| `devflow commit` | `devflow c` |
| `devflow pr` | `devflow p` |
| `devflow amend` | `devflow a` |
| `devflow undo` | `devflow u` |
| `devflow fixup` | `devflow f` |
| `devflow merge` | `devflow m` |
| `devflow release` | `devflow rel` |
| `devflow review` | `devflow rv` |
| `devflow comments` | `devflow cm` |
| `devflow stash` | `devflow st` |
| `devflow worktree` | `devflow wt` |
| `devflow log` | `devflow l` |
| `devflow status` | `devflow s` |
| `devflow test-plan` | `devflow tp` |
| `devflow lint-config` | `devflow lint` |

## Global Options

Commands that modify git state support `--dry-run` to preview without executing:

```bash
devflow commit --dry-run
devflow branch --dry-run
devflow pr --dry-run
devflow amend --dry-run
devflow undo --dry-run
devflow fixup --dry-run
devflow merge --dry-run
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

### Shareable Configs (`extends`)

Share a base configuration across projects using the `extends` field:

```json
{
  "extends": "@myorg/devflow-config",
  "ticketBaseUrl": "https://jira.myorg.com/browse"
}
```

The `extends` value can be:
- An npm package name (resolved from `node_modules`)
- A relative file path (e.g., `"./config/devflow-base.json"`)

The extended config is merged with local overrides — local fields take precedence.

### Monorepo Awareness

devflow automatically detects monorepo workspace setups and uses workspace packages as commit scopes when no scopes are configured. Supported:

- **npm/yarn workspaces** — `workspaces` field in `package.json`
- **pnpm workspaces** — `pnpm-workspace.yaml`
- **Lerna** — `lerna.json`
- **Nx** — `nx.json` with `project.json` files
- **Turborepo** — `turbo.json` (uses package.json workspaces)

Each workspace package becomes a scope with its directory as the `paths` pattern for auto-inference. For example, in a monorepo with `packages/auth` and `packages/ui`, staging a file in `packages/auth/src/login.ts` auto-suggests the `auth` scope.

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

The `devflow init` wizard can also set up a **pre-push** hook that runs lint and type checking before push:

```bash
# .husky/pre-push
npm run lint
npx tsc --noEmit
```

## Update Notifications

devflow checks for newer versions on npm once every 24 hours and displays a non-blocking notification if an update is available:

```
─ Update available: 0.2.0 → 0.3.0 (npm update @alejandrochaves/devflow-cli) ─
```

## Plugins

Extend devflow with custom commands via the plugin system. Plugins are automatically discovered from:

1. **npm packages** — any dependency matching `devflow-plugin-*` or `@scope/devflow-plugin-*`
2. **Config** — explicit list in `.devflow.json`:

```json
{
  "plugins": ["devflow-plugin-jira", "@myorg/devflow-plugin-deploy"]
}
```

### Writing a Plugin

A plugin is an npm package that exports a `register` function:

```typescript
import { Command } from "commander";

export function register(program: Command): void {
  program
    .command("deploy")
    .description("Deploy the current branch")
    .action(() => {
      // your logic here
    });
}
```

Plugins receive the Commander `program` instance and can add commands, options, or hooks.

## Requirements

- Node.js >= 20.12
- Git
- [GitHub CLI (gh)](https://cli.github.com/) — required for the `pr` command

## License

MIT
