# Azure DevOps Provider (Plugin)

## Priority: Low
## Status: Planned
## Release: Plugin — `devflow-plugin-azure`

## Overview

Azure DevOps Work Items integration as an external plugin. Uses the `az` CLI (Azure CLI with DevOps extension) for authentication and work item queries.

## Config

```json
{
  "plugins": ["devflow-plugin-azure"],
  "ticketProvider": {
    "type": "azure-devops",
    "organization": "myorg",
    "project": "MyProject"
  }
}
```

## Authentication

Uses Azure CLI:

```bash
# Install Azure CLI + DevOps extension
brew install azure-cli
az extension add --name azure-devops

# Authenticate
az login
az devops configure --defaults organization=https://dev.azure.com/myorg project=MyProject
```

## CLI Commands Used

| Action | Command | Purpose |
|--------|---------|---------|
| List work items | `az boards work-item query --wiql "..." -o json` | Fetch assigned items |
| Get work item | `az boards work-item show --id <id> -o json` | Get item details |
| Check install | `az --version` | Verify az is available |

## WIQL Query

```sql
SELECT [System.Id], [System.Title], [System.WorkItemType], [System.Tags]
FROM WorkItems
WHERE [System.AssignedTo] = @Me
  AND [System.State] <> 'Closed'
  AND [System.State] <> 'Done'
ORDER BY [System.ChangedDate] DESC
```

## Provider Implementation

```typescript
export class AzureDevOpsTicketProvider implements TicketProvider {
  constructor(private config: { organization: string; project: string }) {}

  listOpen(): Ticket[] {
    // execSync: az boards work-item query --wiql "..." -o json
    // Then fetch details for each ID
    // Map to Ticket[]
  }

  getById(id: string): Ticket | undefined {
    // execSync: az boards work-item show --id <id> -o json
    // Map to Ticket
  }
}
```

## Ticket Format

Azure DevOps uses numeric IDs. Branch format:
```
feat/AB#142_add-biometric-login
```

The `AB#` prefix is Azure DevOps' linkable format.

## Work Item Type Mapping

Azure DevOps uses "Work Item Types" instead of labels:

```typescript
const ADO_TYPE_TO_BRANCH: Record<string, string> = {
  Bug: "fix",
  "User Story": "feat",
  Feature: "feat",
  Task: "chore",
  Issue: "fix",
  Epic: "feat",
};
```

## PR Integration

Azure DevOps PRs support auto-complete with work item linking:

```markdown
## Ticket

AB#142
```

Azure DevOps auto-links work items when the PR description or commit contains `AB#<id>`.

## Extra Features

### Iteration/Sprint filtering
Filter by current iteration:

```json
{
  "ticketProvider": {
    "type": "azure-devops",
    "currentIteration": true
  }
}
```

### Area path filtering
Filter by area path (useful for large projects):

```json
{
  "ticketProvider": {
    "type": "azure-devops",
    "areaPath": "MyProject\\Backend"
  }
}
```

### Auto-transition
Move work item to "Active" on branch creation:

```json
{
  "ticketProvider": {
    "type": "azure-devops",
    "autoTransition": true
  }
}
```

## Plugin Structure

```
devflow-plugin-azure/
├── package.json
├── src/
│   ├── index.ts          # register() + provider export
│   ├── provider.ts       # AzureDevOpsTicketProvider
│   └── az.ts             # az CLI wrapper
└── dist/
```

## Dependencies

None beyond Node.js built-ins — uses `az` CLI via `execSync`.

## Verification

1. `devflow branch` shows work items from Azure DevOps
2. Work item types map to branch types
3. PR body includes `AB#142` for auto-linking
4. Iteration filtering works
5. `az` not installed: graceful fallback to manual input
