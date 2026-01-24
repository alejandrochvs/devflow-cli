# Linear Provider (Plugin)

## Priority: Medium
## Status: Planned
## Release: Plugin — `devflow-plugin-linear`

## Overview

Linear integration as an external plugin. Uses the Linear GraphQL API to fetch issues and map them into devflow's ticket provider interface. Linear is popular among startups and modern engineering teams.

## Config

```json
{
  "plugins": ["devflow-plugin-linear"],
  "ticketProvider": {
    "type": "linear",
    "team": "ENG"
  }
}
```

## Authentication

Linear uses personal API keys or OAuth:

1. **Environment variable**:
   ```bash
   LINEAR_API_KEY=lin_api_xxxxx
   ```

2. **Interactive login**:
   ```bash
   npx devflow linear-login
   ```
   Opens Linear settings page, user pastes API key. Stored in `~/.devflow/linear-credentials.json`.

## API (GraphQL)

```graphql
# List assigned issues
query {
  viewer {
    assignedIssues(
      filter: { state: { type: { nin: ["completed", "canceled"] } } }
      first: 50
      orderBy: updatedAt
    ) {
      nodes {
        identifier    # "ENG-142"
        title
        labels { nodes { name } }
        url
        state { name type }
      }
    }
  }
}

# Get single issue
query {
  issue(id: "ENG-142") {
    identifier
    title
    labels { nodes { name } }
    url
    description
  }
}
```

## Provider Implementation

```typescript
export class LinearTicketProvider implements TicketProvider {
  constructor(private config: { team: string }) {}

  listOpen(): Ticket[] {
    // GraphQL query for viewer.assignedIssues
    // Filter by team prefix if configured
    // Map to Ticket[]
  }

  getById(id: string): Ticket | undefined {
    // GraphQL query for issue by identifier
    // Map to Ticket
  }
}
```

## Ticket Format

Linear uses team-prefixed IDs (e.g., `ENG-142`). Branch format:
```
feat/ENG-142_add-biometric-login
```

## Label-to-Type Mapping

Linear uses both labels and issue state/priority:

```typescript
const LINEAR_LABEL_TO_BRANCH: Record<string, string> = {
  Bug: "fix",
  Feature: "feat",
  Improvement: "refactor",
  Documentation: "docs",
  Chore: "chore",
};
```

## Extra Features

### Auto-transition on branch creation
Move issue to "In Progress" when a branch is created:

```json
{
  "ticketProvider": {
    "type": "linear",
    "autoTransition": true,
    "inProgressState": "In Progress"
  }
}
```

Uses the Linear `issueUpdate` mutation to change state.

### PR linking
Uses Linear's magic link format (auto-detected by Linear):
```markdown
## Ticket

[ENG-142](https://linear.app/team/issue/ENG-142)
```

Linear also auto-links PRs when the branch contains the issue ID.

### Cycle awareness
Optionally filter issues by current cycle:

```json
{
  "ticketProvider": {
    "type": "linear",
    "currentCycleOnly": true
  }
}
```

## Plugin Structure

```
devflow-plugin-linear/
├── package.json
├── src/
│   ├── index.ts          # register() + provider export
│   ├── provider.ts       # LinearTicketProvider
│   ├── auth.ts           # API key management
│   └── graphql.ts        # Linear GraphQL client
└── dist/
```

## Dependencies

```json
{
  "dependencies": {
    "graphql-request": "^6.0.0"
  }
}
```

## Verification

1. `devflow branch` with Linear provider shows team issues in picker
2. Issue identifier preserved in branch name (ENG-142)
3. Labels map correctly to branch types
4. Auto-transition moves issue to "In Progress"
5. PR body links to Linear issue
6. Cycle filtering works when configured
7. Graceful fallback when Linear API is unreachable
