# Getting Started

## Prerequisites

- **Node.js** >= 20.12
- **Git**
- [**GitHub CLI (gh)**](https://cli.github.com/) — required for PR and release commands

## Installation

```bash
npm install -D @alejandrochaves/devflow-cli
```

## Init Wizard

Run the interactive setup wizard to configure your project:

```bash
npx devflow init
```

The wizard walks you through:

1. **Ticket base URL** — for linking tickets in PRs
2. **Scopes** — add project-specific scopes (or use defaults)
3. **PR checklist** — customize or use defaults
4. **package.json scripts** — auto-adds `commit`, `branch`, `pr` scripts
5. **Commitlint** — creates config with the devflow parser preset
6. **Husky** — installs and creates `commit-msg` hook + optional `pre-push` hook
7. **CI workflow** — optionally generates `.github/workflows/ci.yml`

## Quick Start

Add scripts to your `package.json`:

```json
{
  "scripts": {
    "branch": "devflow branch",
    "commit": "devflow commit",
    "pr": "devflow pr"
  }
}
```

Then use the core workflow:

```bash
# Create a branch
npx devflow branch

# Stage files and commit
npx devflow commit

# Create or update a PR
npx devflow pr
```

## Global Options

Commands that modify git state support `--dry-run` to preview without executing:

```bash
devflow commit --dry-run
devflow branch --dry-run
devflow pr --dry-run
```

## Command Aliases

Most commands have short aliases for quick access:

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
