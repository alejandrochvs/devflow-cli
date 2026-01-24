# Configuration

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

## Config Options

| Option | Description | Default |
|--------|-------------|---------|
| `ticketBaseUrl` | Base URL for linking tickets in PRs | — |
| `scopes` | List of scopes with `value`, `description`, and optional `paths` | `[]` (free text input) |
| `scopes[].paths` | Glob patterns to auto-suggest this scope when matching files are staged | — |
| `branchTypes` | Allowed branch type prefixes | `["feat", "fix", "chore", ...]` |
| `commitTypes` | Commit types shown in selection menu (`value` + `label`) | Standard conventional types |
| `commitFormat` | Commit message format with placeholders | `{type}[{ticket}]{breaking}({scope}): {message}` |
| `checklist` | PR checklist items | Basic code review items |
| `prTemplate.sections` | PR body sections to include | All sections |
| `prTemplate.screenshotsTable` | Include before/after screenshots table | `true` |
| `prReviewers` | Default PR reviewers (GitHub usernames) | — |

## Scopes

When `scopes` is an empty array, the commit command shows a free text input for scope. When populated, it shows a searchable list that can be filtered by typing.

**Scope inference** works in two ways (first match wins):

1. **From file paths** — if a scope has `paths` configured, staged files are matched against those glob patterns. The scope with the most matching files is suggested.
2. **From git history** — previous commits on the branch (`git log main..HEAD`) are parsed for existing scopes.

### Example with paths

```json
{
  "scopes": [
    { "value": "auth", "description": "Authentication", "paths": ["src/auth/**", "src/hooks/useAuth*"] },
    { "value": "ui", "description": "UI components", "paths": ["src/components/**"] }
  ]
}
```

If you stage `src/auth/login.ts`, the `auth` scope is auto-suggested.

## Shareable Configs (`extends`)

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

## Monorepo Awareness

devflow automatically detects monorepo workspace setups and uses workspace packages as commit scopes when no scopes are configured. Supported:

- **npm/yarn workspaces** — `workspaces` field in `package.json`
- **pnpm workspaces** — `pnpm-workspace.yaml`
- **Lerna** — `lerna.json`
- **Nx** — `nx.json` with `project.json` files
- **Turborepo** — `turbo.json` (uses package.json workspaces)

Each workspace package becomes a scope with its directory as the `paths` pattern for auto-inference. For example, in a monorepo with `packages/auth` and `packages/ui`, staging a file in `packages/auth/src/login.ts` auto-suggests the `auth` scope.
