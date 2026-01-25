# Notion Provider (Plugin)

## Priority: Low
## Status: Planned
## Release: Plugin — `devflow-plugin-notion`

## Overview

Notion integration as an external plugin. Uses the Notion REST API to fetch tasks from a user-configured database. Requires more config than other providers because Notion databases have custom schemas.

## Config

```json
{
  "plugins": ["devflow-plugin-notion"],
  "ticketProvider": {
    "type": "notion",
    "database": "Tasks",
    "properties": {
      "title": "Task Name",
      "status": "Status",
      "assignee": "Assignee",
      "type": "Category",
      "ticketId": "Ticket ID",
      "doneValues": ["Done", "Archived", "Cancelled"]
    }
  }
}
```

## Authentication

Notion uses internal integration tokens:

1. **Environment variable**:
   ```bash
   NOTION_API_TOKEN=secret_xxxxx
   ```

2. **Interactive login**:
   ```bash
   npx devflow notion-login
   ```
   Prompts user to:
   1. Create an integration at https://www.notion.so/my-integrations
   2. Share the database with the integration
   3. Paste the token

   Stored in `~/.devflow/notion-credentials.json`.

## The Ticket ID Problem

Notion page IDs are UUIDs (`a1b2c3d4-e5f6-...`), which are unusable in branch names. Solutions:

### Option A: Custom "Ticket ID" property (Recommended)

If the database has a property like "Ticket ID" with values like `PROJ-142`:

```json
{
  "properties": {
    "ticketId": "Ticket ID"
  }
}
```

Branch: `feat/PROJ-142_add-biometric-login`

### Option B: Auto-incrementing row number

Use the database row's position as a numeric ID:

```json
{
  "properties": {
    "ticketId": "__row_number__"
  }
}
```

Branch: `feat/142_add-biometric-login`

### Option C: Short UUID

Use first 8 characters of the page UUID:

```json
{
  "properties": {
    "ticketId": "__short_id__"
  }
}
```

Branch: `feat/a1b2c3d4_add-biometric-login`

## API Endpoints Used

| Action | Endpoint | Purpose |
|--------|----------|---------|
| Search databases | `POST /v1/search` (filter: database) | Find database by name |
| Query database | `POST /v1/databases/{id}/query` | Fetch filtered tasks |
| Get page | `GET /v1/pages/{id}` | Get task details |
| Update page | `PATCH /v1/pages/{id}` | Auto-transition status |

## Database Query Filter

```json
{
  "filter": {
    "and": [
      {
        "property": "Status",
        "status": { "does_not_equal": "Done" }
      },
      {
        "property": "Assignee",
        "people": { "contains": "user-id" }
      }
    ]
  },
  "sorts": [{ "property": "Created", "direction": "descending" }]
}
```

## Provider Implementation

```typescript
export class NotionTicketProvider implements TicketProvider {
  constructor(private config: NotionConfig) {}

  listOpen(): Ticket[] {
    // 1. POST /search → find database by name
    // 2. POST /databases/{id}/query → filter by assignee + not done
    // 3. Extract title, ticketId, type from configured property names
    // Map to Ticket[]
  }

  getById(id: string): Ticket | undefined {
    // If ticketId is a custom property: query database with filter
    // If UUID-based: GET /pages/{id}
    // Map to Ticket
  }
}
```

## Property-to-Type Mapping

Since the "type" property is user-defined, mapping is configured:

```json
{
  "ticketProvider": {
    "type": "notion",
    "typeMapping": {
      "Bug": "fix",
      "Feature": "feat",
      "Task": "chore",
      "Improvement": "refactor",
      "Documentation": "docs"
    }
  }
}
```

If no `typeMapping` is provided, fall back to the default label mapping.

## PR Integration

No native git integration. PR body includes a Notion link:

```markdown
## Ticket

[PROJ-142](https://notion.so/a1b2c3d4e5f6...)
```

## Extra Features

### Setup wizard

Because Notion config is complex, provide an interactive setup:

```bash
npx devflow notion-setup
```

1. Connects to API, lists shared databases
2. User selects their task database
3. Auto-detects property names (title, status, assignee)
4. Asks which property to use as ticket ID
5. Writes config to `.devflow/config.json`

### Auto-transition

Move task to "In Progress" on branch creation:

```json
{
  "ticketProvider": {
    "type": "notion",
    "autoTransition": true,
    "inProgressValue": "In Progress"
  }
}
```

### View filtering

Filter by a specific database view (Notion views = saved filters):

```json
{
  "ticketProvider": {
    "type": "notion",
    "view": "My Tasks"
  }
}
```

Note: Notion API doesn't directly support view filtering, so this would replicate the view's filter config.

## Plugin Structure

```
devflow-plugin-notion/
├── package.json
├── src/
│   ├── index.ts          # register() + provider export
│   ├── provider.ts       # NotionTicketProvider
│   ├── auth.ts           # Token management
│   ├── api.ts            # Notion REST client
│   └── setup.ts          # Interactive setup wizard
└── dist/
```

## Dependencies

```json
{
  "dependencies": {
    "@notionhq/client": "^2.0.0"
  }
}
```

## Limitations

- Notion API rate limit: 3 requests/second (may need caching for large databases)
- No native git auto-linking (unlike GitHub/Linear/Jira)
- Database must be shared with the integration manually
- Custom schemas mean more config overhead for the user

## Verification

1. `npx devflow notion-setup` detects databases and configures properties
2. `devflow branch` shows Notion tasks in picker
3. Custom ticket ID property used in branch name
4. Type property maps to branch types via configured mapping
5. Auto-transition updates page status
6. Graceful fallback when API is unreachable
7. Handles databases with missing/optional properties without crashing
