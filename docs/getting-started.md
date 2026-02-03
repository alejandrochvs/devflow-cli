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

1. **Workflow preset** — choose Scrum, Kanban, Simple, or Custom
2. **Ticket base URL** — for linking tickets in PRs (skipped for Simple preset)
3. **Scopes** — add project-specific scopes (or use defaults)
4. **PR checklist** — customize or use defaults
5. **package.json scripts** — auto-adds `commit`, `branch`, `pr` scripts
6. **Commitlint** — creates config with the devflow parser preset
7. **Husky** — installs and creates `commit-msg` hook + optional `pre-push` hook
8. **CI workflow** — optionally generates `.github/workflows/ci.yml`

### Presets

| Preset | Best For |
|--------|----------|
| **Scrum** | Teams using Agile/Scrum with user stories and acceptance criteria |
| **Kanban** | Flow-based workflows with simpler issue types |
| **Simple** | Personal projects or small teams (no ticket numbers required) |
| **Custom** | Full control over all configuration options |

## Visual Walkthrough

See devflow in action with these demos of the core workflow:

### Creating a Branch

<img src="/gifs/branch.gif" alt="devflow branch demo" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />

### Making a Commit

<img src="/gifs/commit.gif" alt="devflow commit demo" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />

### Creating a PR

<img src="/gifs/pr.gif" alt="devflow pr demo" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />

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

## Interactive Navigation

All multi-step interactive commands support **back navigation**:

- Press **Escape** at any prompt to return to the previous step

This lets you review and change earlier choices without restarting the entire command.

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
