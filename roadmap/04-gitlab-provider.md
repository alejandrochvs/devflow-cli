# GitLab Issues Provider (Plugin)

## Priority: Low-Medium
## Status: Planned
## Release: Plugin — `devflow-plugin-gitlab`

## Overview

GitLab Issues integration as an external plugin. Uses the `glab` CLI (GitLab's equivalent of `gh`) for zero-config authentication, similar to how the core GitHub provider uses `gh`.

## Config

```json
{
  "plugins": ["devflow-plugin-gitlab"],
  "ticketProvider": {
    "type": "gitlab"
  }
}
```

## Authentication

Uses `glab` CLI (mirrors the `gh` pattern):

```bash
# Install
brew install glab

# Authenticate
glab auth login
```

No additional credentials needed — `glab` handles it.

## CLI Commands Used

| Action | Command | Purpose |
|--------|---------|---------|
| List issues | `glab issue list --assignee=@me --per-page=50 -F json` | Fetch open issues |
| Get issue | `glab issue view <id> -F json` | Get issue details |
| Check install | `glab --version` | Verify glab is available |

## Provider Implementation

```typescript
export class GitLabTicketProvider implements TicketProvider {
  listOpen(): Ticket[] {
    // execSync: glab issue list --assignee=@me --per-page=50 -F json
    // Map response to Ticket[]
  }

  getById(id: string): Ticket | undefined {
    // execSync: glab issue view <id> -F json
    // Map to Ticket
  }
}
```

## Ticket Format

GitLab issues use numeric IDs (like GitHub). Branch format:
```
feat/142_add-biometric-login
```

## Label-to-Type Mapping

GitLab uses labels (similar to GitHub):

```typescript
const GITLAB_LABEL_TO_BRANCH: Record<string, string> = {
  bug: "fix",
  feature: "feat",
  enhancement: "feat",
  documentation: "docs",
  refactor: "refactor",
  chore: "chore",
  maintenance: "chore",
};
```

## PR (Merge Request) Integration

GitLab uses Merge Requests instead of Pull Requests. The plugin adapts:

- Auto-close syntax: `Closes #142` (same as GitHub, GitLab supports it)
- MR creation: Uses `glab mr create` instead of `gh pr create`

### Optional: Full MR command override

The plugin could optionally override the `pr` command to use `glab mr` commands:

```json
{
  "ticketProvider": {
    "type": "gitlab",
    "overridePrCommand": true
  }
}
```

This would make `devflow pr` use `glab mr create` instead of `gh pr create`.

## Extra Features

### Milestone filtering
Filter issues by current milestone:

```json
{
  "ticketProvider": {
    "type": "gitlab",
    "milestone": "Sprint 14"
  }
}
```

### Weight/Priority display
Show issue weight in the picker:
```
? Select an issue:
  #142 Add biometric login [P1, weight:5] (bug, auth)
  #138 Fix overflow [P2, weight:3] (bug)
```

## Plugin Structure

```
devflow-plugin-gitlab/
├── package.json
├── src/
│   ├── index.ts          # register() + provider export
│   ├── provider.ts       # GitLabTicketProvider
│   └── glab.ts           # glab CLI wrapper
└── dist/
```

## Dependencies

None beyond Node.js built-ins — uses `glab` CLI via `execSync` (same pattern as core `gh` usage).

## Verification

1. `devflow branch` with GitLab provider shows issues from `glab issue list`
2. Labels map correctly to branch types
3. MR body contains `Closes #142` for auto-close
4. `glab` not installed: graceful fallback to manual input
5. Optional MR command override works when configured
