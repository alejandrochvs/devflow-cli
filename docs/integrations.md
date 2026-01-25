# Integrations

## Commitlint

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

## Husky

Pair with [husky](https://typicode.github.io/husky/) for a guided commit experience:

### commit-msg hook

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

### pre-push hook

The `devflow init` wizard can set up a **pre-push** hook that runs lint and type checking before push:

```bash
# .husky/pre-push
npm run lint
npx tsc --noEmit
```

## CI Workflow

The `devflow init` wizard can generate a `.github/workflows/ci.yml` that runs lint, typecheck, and tests on pull requests.

You can also validate your devflow configuration in CI:

```bash
npx devflow lint-config
```

This exits with code 1 on errors, making it suitable for CI pipelines.

## Update Notifications

devflow checks for newer versions on npm once every 24 hours and displays a non-blocking notification if an update is available:

```
─ Update available: 0.2.0 → 0.3.0 (npm update @alejandrochaves/devflow-cli) ─
```

## AI Agents

Help AI coding assistants (Claude Code, Cursor, GitHub Copilot, etc.) understand how to use devflow by adding instruction files to your project.

### Claude Code

Create a `CLAUDE.md` in your project root:

```markdown
# Claude Code Instructions

## Git Workflow

Use devflow for all git operations:
- `devflow branch` - Create branches
- `devflow commit` - Make commits
- `devflow pr` - Create/update PRs

## Commit Format

This project uses: `{type}[{ticket}]({scope}): {message}`

## Quick Commands

| Task | Command |
|------|---------|
| New branch | `devflow branch` |
| Commit | `devflow commit -m "message"` |
| Create PR | `devflow pr` |
| Check status | `devflow status` |
```

### Cursor / Generic AI Agents

Create `.devflow/AI_INSTRUCTIONS.md` with detailed command reference:

```markdown
# DevFlow CLI - AI Agent Instructions

## Commands

### devflow branch
Create branches with consistent naming.
Format: `{type}/{ticket}_{description}`

### devflow commit
Create conventional commits.
Format: `{type}[{ticket}]({scope}): {message}`

### devflow pr
Create or update pull requests with structured body.

## Workflow

1. `devflow branch` - Start new work
2. `devflow commit` - Commit changes
3. `devflow pr` - Open PR when ready
```

### Cursor Rules

Create `.cursorrules` for Cursor AI:

```
When working with git in this project:
- Use `devflow branch` instead of `git checkout -b`
- Use `devflow commit` instead of `git commit`
- Use `devflow pr` instead of `gh pr create`
- Always use --dry-run first if uncertain
```

These files help AI agents maintain consistent workflows and commit conventions across your team.
