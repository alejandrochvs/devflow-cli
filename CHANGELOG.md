# Changelog








## [1.4.0] - 2026-01-28

### Other

- feat: Implement escape key for back navigation (#10)

## [1.3.2] - 2026-01-25

### Documentation

- strengthen issue-first workflow in AI instructions

## [1.3.1] - 2026-01-25

### Documentation

- update CLAUDE.md with issues command
- add documentation and tests for issues command

## [1.3.0] - 2026-01-25

### Features

- add GitHub Projects v2 integration with devflow issues command

### Documentation

- add stats badges to homepage
- add stats badges and sponsor links

### Chores

- track devflow version metadata

## [1.2.0] - 2026-01-25

### Features

- add update command with version tracking

## [1.1.0] - 2026-01-25

### Other

- Add non-interactive flags to all commands for AI agents (#1)

## [1.0.0] - 2026-01-25

### Other

- feat[UNTRACKED]!: move config to .devflow/config.json and improve init flow

## [0.6.0] - 2026-01-23

### Features

- **comments** — Added `--resolved` and `--unresolved` flags for filtering comment threads
- **comments** — Switched to GitHub GraphQL API for accurate thread resolution status
- **roadmap** — Added GitLab full support plan (git host abstraction + `glab` CLI integration)

### Fixes

- **docs** — Removed release trigger from docs workflow to avoid GitHub Pages environment protection errors

## [0.5.0] - 2026-01-23

### Features

- **comments** — New command to show PR reviews and inline comments with diff context (`devflow comments` / `devflow cm`)
- **Documentation site** — VitePress-powered docs at devflow.alejandrochaves.dev with landing page, command reference, and configuration guide
- **Roadmap** — Public roadmap page with planned ticket provider integrations (GitHub, Jira, Linear, GitLab, Azure DevOps, Shortcut, Trello, Notion)

## [0.3.0] - 2025-01-23

### Features

- **undo** — New command to soft-reset the last commit (`devflow undo`)
- **fixup** — New command to create fixup commits targeting previous commits (`devflow fixup`)
- **merge** — New command to merge PRs via GitHub CLI with squash/merge/rebase (`devflow merge`)
- **test-plan** — New command to define and manage test steps per branch (`devflow test-plan`)
- **Command aliases** — Single-letter shortcuts for all core commands (b, c, p, a, u, f, m, s, tp)
- **Branch protection** — Warns when committing directly to main/master/develop/production
- **Shareable configs** — `extends` field in `.devflow/config.json` for npm packages or relative paths
- **Monorepo awareness** — Auto-discovers workspace packages as scopes (npm, pnpm, lerna, nx, turborepo)
- **Update notifier** — Checks npm every 24h and shows notification when newer version available
- **Pre-push hook** — Optional lint + typecheck hook in `devflow init` wizard
- **Test plan in PR** — Stored test plan steps auto-populate the PR body

### Improvements

- Added unit tests with vitest (config, git utils, commit format, scope inference)
- Added MIT LICENSE
- Added GitHub Actions CI (Node 18/20/22)
- Added open source governance files (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)

## [0.2.0] - 2025-01-22

### Features

- **status** — New command showing branch context, commits, and PR info
- **amend** — New command to re-edit last commit with pre-filled prompts
- **cleanup** — New command to delete merged/gone local branches
- **changelog** — New command to generate changelog from conventional commits
- **doctor** — New command to verify devflow dependencies and setup
- **completions** — Shell completion scripts for bash and zsh
- **Scope inference from paths** — Auto-suggest scope based on staged file glob patterns
- **Configurable commit format** — `commitFormat` field in config with placeholders
- **PR template config** — Customizable sections and reviewer defaults
- **Config validation** — Warns on unknown fields and missing required properties
- **Colored output** — ANSI colors without external dependencies
- **--dry-run flag** — Preview mode for all modifying commands
- **CI workflow generator** — Optional GitHub Actions setup in `devflow init`

## [0.1.1] - 2025-01-21

### Fixes

- Published README to npm

## [0.1.0] - 2025-01-21

### Features

- **branch** — Interactive branch creation with type/ticket/description format
- **commit** — Interactive conventional commit with file staging and scope selection
- **pr** — PR creation with auto-filled template, labels, and assignee
- **init** — Project setup wizard (scopes, checklist, commitlint, husky)
