# issues

List and manage issues from your GitHub Project board. Enables issue-first development with automatic status tracking.

**Alias:** `devflow is`

## Prerequisites

- GitHub Project (v2) linked to your repository
- `project` configuration in `.devflow/config.json`
- `gh` CLI with project permissions (`gh auth refresh -s project`)

## Flow

1. Connects to your GitHub Project board
2. Lists issues grouped by status (Todo, In Progress, In Review, Done)
3. Optionally select an issue to start working on it

With `--work`: assigns the issue to you, moves it to "In Progress", and creates a branch.

## Options

| Option | Description |
|--------|-------------|
| `--status <status>` | Filter by status: `todo`, `in-progress`, `in-review`, `done` |
| `--available` | Show only unassigned Todo items |
| `--work` | Start working on an issue (assign, move to In Progress, create branch) |
| `--issue <number>` | Pre-select an issue number (used with `--work`) |
| `--branch-desc <desc>` | Branch description slug (used with `--work --yes`) |
| `--dry-run` | Preview actions without executing |
| `--yes` | Skip confirmation prompts |

## Examples

```bash
# List Todo and In Progress items
devflow issues

# Filter by status
devflow issues --status todo
devflow issues --status in-progress

# Show unassigned Todo items
devflow issues --available

# Start working interactively (assigns, moves to In Progress, creates branch)
devflow issues --work

# Non-interactive: start work on a specific issue
devflow issues --work --issue 42 --branch-desc "add-auth" --yes
```

## Issue-First Workflow

```bash
# 1. See available work
devflow issues

# 2. Pick an issue and start working
devflow issues --work --issue 42 --yes

# 3. Make changes and commit
git add <files>
devflow commit

# 4. Create PR (auto-moves issue to "In Review")
devflow pr
```

When you create a PR linked to an issue, devflow automatically moves the issue to "In Review" status on the project board.
