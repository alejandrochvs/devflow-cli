# Shortcut Provider (Plugin)

## Priority: Low
## Status: Planned
## Release: Plugin — `devflow-plugin-shortcut`

## Overview

Shortcut (formerly Clubhouse) integration as an external plugin. Uses the Shortcut REST API to fetch stories assigned to the user.

## Config

```json
{
  "plugins": ["devflow-plugin-shortcut"],
  "ticketProvider": {
    "type": "shortcut",
    "workspace": "myorg"
  }
}
```

## Authentication

Shortcut uses API tokens:

1. **Environment variable**:
   ```bash
   SHORTCUT_API_TOKEN=xxxxxxxx
   ```

2. **Interactive login**:
   ```bash
   npx devflow shortcut-login
   ```
   Prompts for token (generated at app.shortcut.com/settings/account/api-tokens). Stored in `~/.devflow/shortcut-credentials.json`.

## API Endpoints Used

| Action | Endpoint | Purpose |
|--------|----------|---------|
| Get member | `GET /api/v3/member` | Get current user ID |
| Search stories | `GET /api/v3/search/stories?query=owner:me state:started,unstarted` | Fetch assigned stories |
| Get story | `GET /api/v3/stories/{id}` | Get story details |

## Provider Implementation

```typescript
export class ShortcutTicketProvider implements TicketProvider {
  constructor(private config: { workspace: string }) {}

  listOpen(): Ticket[] {
    // GET /search/stories with owner:me filter
    // Map stories to Ticket[]
  }

  getById(id: string): Ticket | undefined {
    // GET /stories/{id}
    // Map to Ticket
  }
}
```

## Ticket Format

Shortcut uses `sc-` prefixed numeric IDs. Branch format:
```
feat/sc-142_add-biometric-login
```

## Story Type Mapping

```typescript
const SHORTCUT_TYPE_TO_BRANCH: Record<string, string> = {
  bug: "fix",
  feature: "feat",
  chore: "chore",
};
```

## PR Integration

Shortcut auto-links stories when branch names contain `sc-<id>`:
```markdown
## Ticket

[sc-142](https://app.shortcut.com/myorg/story/142)
```

## Extra Features

### Iteration filtering
Filter by current iteration:

```json
{
  "ticketProvider": {
    "type": "shortcut",
    "currentIteration": true
  }
}
```

### Auto-transition
Move story to "In Progress" on branch creation.

## Plugin Structure

```
devflow-plugin-shortcut/
├── package.json
├── src/
│   ├── index.ts          # register() + provider export
│   ├── provider.ts       # ShortcutTicketProvider
│   └── api.ts            # Shortcut REST client
└── dist/
```

## Verification

1. `devflow branch` shows Shortcut stories in picker
2. Story types map to branch types
3. Branch name includes `sc-` prefix for auto-linking
4. Graceful fallback when API is unreachable
