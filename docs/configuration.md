# Configuration

Create a `.devflow/config.json` in your project (or run `devflow init`):

```json
{
  "preset": "scrum",
  "branchFormat": "{type}/{ticket}_{description}",
  "ticketBaseUrl": "https://github.com/org/repo/issues",
  "scopes": [
    {
      "value": "auth",
      "description": "Authentication & login",
      "paths": ["src/auth/**"]
    },
    {
      "value": "ui",
      "description": "UI components",
      "paths": ["src/components/**"]
    },
    {
      "value": "api",
      "description": "API layer",
      "paths": ["src/api/**", "src/services/**"]
    }
  ],
  "branchTypes": [
    "feat",
    "fix",
    "chore",
    "refactor",
    "docs",
    "test",
    "release",
    "hotfix"
  ],
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
    "sections": [
      "summary",
      "ticket",
      "type",
      "screenshots",
      "testPlan",
      "checklist"
    ],
    "screenshotsTable": true
  },
  "prReviewers": ["copilot"]
}
```

## Presets

devflow includes three workflow presets that configure branch naming, issue templates, and PR structure:

| Preset   | Description                                                | Branch Format                   | Ticket Required |
| -------- | ---------------------------------------------------------- | ------------------------------- | --------------- |
| `scrum`  | Full Agile workflow with user stories, acceptance criteria | `{type}/{ticket}_{description}` | Yes             |
| `kanban` | Simpler flow-based workflow                                | `{type}/{ticket}_{description}` | Yes             |
| `simple` | Minimal configuration for small projects                   | `{type}/{description}`          | No              |
| `custom` | Start with Scrum defaults, customize everything            | Configurable                    | Configurable    |

### Scrum Preset

Best for teams using Scrum or Agile methodologies:

- **Issue types:** User Story, Bug, Task, Spike, Tech Debt
- **User stories** have As-a/I-want/So-that format with acceptance criteria
- **Full PR template** with screenshots table, test plan, detailed checklist

### Kanban Preset

Best for continuous flow workflows:

- **Issue types:** Feature, Bug, Improvement, Task
- **Simpler templates** focused on done criteria
- **Lighter PR template** without screenshots table

### Simple Preset

Best for personal projects or small teams:

- **Issue types:** Feature, Bug, Task (minimal fields)
- **No ticket required** in branch names
- **Minimal PR template** with just summary and checklist

## Config Options

| Option                        | Description                                                             | Default                                          |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| `preset`                      | Workflow preset (`scrum`, `kanban`, `simple`, `custom`)                 | `scrum`                                          |
| `branchFormat`                | Branch name format with placeholders                                    | `{type}/{ticket}_{description}`                  |
| `issueTypes`                  | Configurable issue types with fields and templates                      | Preset-dependent                                 |
| `ticketBaseUrl`               | Base URL for linking tickets in PRs                                     | —                                                |
| `scopes`                      | List of scopes with `value`, `description`, and optional `paths`        | `[]` (free text input)                           |
| `scopes[].paths`              | Glob patterns to auto-suggest this scope when matching files are staged | —                                                |
| `branchTypes`                 | Allowed branch type prefixes                                            | `["feat", "fix", "chore", ...]`                  |
| `commitTypes`                 | Commit types shown in selection menu (`value` + `label`)                | Standard conventional types                      |
| `commitFormat`                | Commit message format with placeholders                                 | `{type}[{ticket}]{breaking}({scope}): {message}` |
| `checklist`                   | PR checklist items                                                      | Basic code review items                          |
| `prTemplate.sections`         | PR body sections to include                                             | All sections                                     |
| `prTemplate.screenshotsTable` | Include before/after screenshots table                                  | `true`                                           |
| `prReviewers`                 | Default PR reviewers (GitHub usernames)                                 | —                                                |
| `ticketProvider`              | Ticket provider integration (see below)                                 | —                                                |

## Branch Format

The `branchFormat` option controls how branch names are generated. Available placeholders:

| Placeholder     | Description                          | Example     |
| --------------- | ------------------------------------ | ----------- |
| `{type}`        | Branch type (feat, fix, chore, etc.) | `feat`      |
| `{ticket}`      | Ticket number (or UNTRACKED)         | `ENV-123`   |
| `{description}` | Kebab-cased description              | `add-login` |
| `{scope}`       | Optional scope                       | `auth`      |

**Examples:**

```json
// Standard format (Scrum/Kanban)
"branchFormat": "{type}/{ticket}_{description}"
// Result: feat/ENV-123_add-login

// Simple format (no ticket)
"branchFormat": "{type}/{description}"
// Result: feat/add-login

// With scope
"branchFormat": "{type}/{scope}/{description}"
// Result: feat/auth/add-login
```

## Issue Types

Each preset defines different issue types. You can customize them with the `issueTypes` array:

```json
{
  "issueTypes": [
    {
      "value": "feature",
      "label": "Feature",
      "labelColor": "enhancement",
      "branchType": "feat",
      "fields": [
        {
          "name": "description",
          "prompt": "Describe the feature:",
          "type": "input",
          "required": true
        },
        {
          "name": "criteria",
          "prompt": "Done criteria:",
          "type": "list",
          "required": true
        }
      ],
      "template": "## Feature\n\n{description}\n\n### Done Criteria\n\n{criteria:checkbox}"
    }
  ]
}
```

### Field Types

| Type        | Description                        |
| ----------- | ---------------------------------- |
| `input`     | Single line text input             |
| `multiline` | Multi-line text editor             |
| `select`    | Dropdown with options              |
| `list`      | Collect multiple items until blank |

### Template Placeholders

| Syntax                  | Description                                |
| ----------------------- | ------------------------------------------ |
| `{field}`               | Simple value replacement                   |
| `{field:checkbox}`      | Render list as checkboxes                  |
| `{field:numbered}`      | Render list as numbered items              |
| `{field:section:Title}` | Conditional section (only if value exists) |

## Ticket Provider

The `ticketProvider` option integrates with your issue tracker to enable:

- **Issue picker** in `devflow branch` — select from open issues assigned to you
- **Auto-infer branch type** from issue labels (e.g., `bug` → `fix`)
- **Pre-fill branch description** from issue title
- **Auto-close syntax** in PR body (e.g., `Closes #123`)

### GitHub Issues (Built-in)

```json
{
  "ticketProvider": {
    "type": "github"
  }
}
```

When enabled, `devflow branch` offers three options:

```
? How do you want to select the ticket?
  > Pick from open issues (assigned to me)
    Enter manually
    Skip (UNTRACKED)
```

Selecting an issue:

- Sets ticket to the issue number
- Infers branch type from labels (`bug` → `fix`, `enhancement` → `feat`)
- Pre-fills description from issue title

PRs automatically use `Closes #N` syntax for auto-close on merge.

### Label to Branch Type Mapping

| Label                    | Branch Type |
| ------------------------ | ----------- |
| `bug`                    | `fix`       |
| `enhancement`, `feature` | `feat`      |
| `documentation`, `docs`  | `docs`      |
| `refactor`, `tech-debt`  | `refactor`  |
| `test`, `testing`        | `test`      |
| `chore`, `maintenance`   | `chore`     |

## Scopes

When `scopes` is an empty array, the commit command shows a free text input for scope. When populated, it shows a searchable list that can be filtered by typing.

**Scope inference** works in two ways (first match wins):

1. **From file paths** — if a scope has `paths` configured, staged files are matched against those glob patterns. The scope with the most matching files is suggested.
2. **From git history** — previous commits on the branch (`git log main..HEAD`) are parsed for existing scopes.

### Example with paths

```json
{
  "scopes": [
    {
      "value": "auth",
      "description": "Authentication",
      "paths": ["src/auth/**", "src/hooks/useAuth*"]
    },
    {
      "value": "ui",
      "description": "UI components",
      "paths": ["src/components/**"]
    }
  ]
}
```

If you stage `src/auth/login.ts`, the `auth` scope is auto-suggested.

### Adding scopes on the fly

During `devflow commit`, the scope selection list includes an **➕ Add new scope** option. The new scope is saved to `.devflow/config.json` and available for future commits.

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
