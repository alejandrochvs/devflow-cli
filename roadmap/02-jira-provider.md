# Jira Provider (Plugin)

## Priority: Medium
## Status: Planned
## Release: Plugin — `devflow-plugin-jira`

## Overview

Jira integration as an external plugin (`devflow-plugin-jira`). Uses the Jira REST API to fetch issues assigned to the user and map them into devflow's ticket provider interface.

## Config

```json
{
  "plugins": ["devflow-plugin-jira"],
  "ticketProvider": {
    "type": "jira",
    "host": "myorg.atlassian.net",
    "project": "PROJ"
  }
}
```

## Authentication

Jira Cloud uses API tokens. The plugin stores credentials via one of:

1. **Environment variables** (recommended for CI):
   ```bash
   JIRA_EMAIL=user@company.com
   JIRA_API_TOKEN=token_here
   ```

2. **Interactive login** (first-time setup):
   ```bash
   npx devflow jira-login
   ```
   Stores token in `~/.devflow/jira-credentials.json` (gitignored).

## API Endpoints Used

| Action | Endpoint | Purpose |
|--------|----------|---------|
| List issues | `GET /rest/api/3/search?jql=assignee=currentUser() AND status!=Done` | Fetch open issues |
| Get issue | `GET /rest/api/3/issue/{issueKey}` | Get issue details |
| Get transitions | `GET /rest/api/3/issue/{issueKey}/transitions` | For auto-transitioning |
| Transition issue | `POST /rest/api/3/issue/{issueKey}/transitions` | Move to "In Progress" |

## Provider Implementation

```typescript
export class JiraTicketProvider implements TicketProvider {
  constructor(private config: { host: string; project: string }) {}

  listOpen(): Ticket[] {
    // GET /search with JQL: project = PROJ AND assignee = currentUser() AND status != Done
    // Map response.issues to Ticket[]
  }

  getById(id: string): Ticket | undefined {
    // GET /issue/PROJ-{id}
    // Map to Ticket
  }
}
```

## Ticket Format

Jira tickets use project-prefixed IDs (e.g., `PROJ-142`). The branch format becomes:
```
feat/PROJ-142_add-biometric-login
```

The full Jira key is preserved in the branch name (unlike GitHub which uses just the number).

## Label-to-Type Mapping

Jira uses "issue types" instead of labels:

```typescript
const JIRA_TYPE_TO_BRANCH: Record<string, string> = {
  Bug: "fix",
  Story: "feat",
  Task: "chore",
  "Sub-task": "chore",
  Epic: "feat",
  Improvement: "refactor",
};
```

## Extra Features

### Auto-transition on branch creation
When a branch is created from a Jira issue, optionally transition the issue to "In Progress":

```json
{
  "ticketProvider": {
    "type": "jira",
    "autoTransition": true,
    "inProgressStatus": "In Progress"
  }
}
```

### PR linking
Format ticket in PR body as a clickable Jira link:
```markdown
## Ticket

[PROJ-142](https://myorg.atlassian.net/browse/PROJ-142)
```

## Plugin Structure

```
devflow-plugin-jira/
├── package.json
├── src/
│   ├── index.ts          # register() + provider export
│   ├── provider.ts       # JiraTicketProvider
│   ├── auth.ts           # Credential management
│   └── api.ts            # Jira REST client
└── dist/
```

## Plugin Registration

```typescript
import { Command } from "commander";
import { JiraTicketProvider } from "./provider.js";

export function register(program: Command): void {
  program
    .command("jira-login")
    .description("Authenticate with Jira")
    .action(async () => { /* ... */ });
}

// Provider export (devflow will look for this)
export function createTicketProvider(config: Record<string, unknown>): TicketProvider {
  return new JiraTicketProvider(config as JiraConfig);
}
```

## Verification

1. `devflow branch` with Jira provider shows Jira issues in the picker
2. Issue types map correctly to branch types
3. Auto-transition moves issue to "In Progress" on branch creation
4. PR body links to Jira issue with full URL
5. Graceful fallback when Jira API is unreachable
