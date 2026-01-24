# Trello Provider (Plugin)

## Priority: Low-Medium
## Status: Planned
## Release: Plugin — `devflow-plugin-trello`

## Overview

Trello integration as an external plugin. Uses the Trello REST API to fetch cards assigned to the user from configured boards/lists.

## Config

```json
{
  "plugins": ["devflow-plugin-trello"],
  "ticketProvider": {
    "type": "trello",
    "board": "Engineering",
    "lists": ["To Do", "In Progress"]
  }
}
```

## Authentication

Trello uses API key + token:

1. **Environment variables**:
   ```bash
   TRELLO_API_KEY=your_api_key
   TRELLO_TOKEN=your_token
   ```

2. **Interactive login**:
   ```bash
   npx devflow trello-login
   ```
   Opens Trello's token generation page in browser, user pastes the token. Stored in `~/.devflow/trello-credentials.json`.

   - API key: obtained from https://trello.com/power-ups/admin (developer key)
   - Token: generated via authorize URL with read permissions

## API Endpoints Used

| Action | Endpoint | Purpose |
|--------|----------|---------|
| Get boards | `GET /1/members/me/boards?fields=name,id` | List user's boards |
| Get lists | `GET /1/boards/{boardId}/lists?fields=name,id` | Get board columns |
| Get cards | `GET /1/lists/{listId}/cards?fields=name,id,shortLink,labels,idMembers&members=true` | Fetch cards from list |
| Get card | `GET /1/cards/{cardId}?fields=name,id,shortLink,labels,desc` | Get card details |
| Move card | `PUT /1/cards/{cardId}?idList={listId}` | Auto-transition |

## Provider Implementation

```typescript
export class TrelloTicketProvider implements TicketProvider {
  constructor(private config: { board: string; lists: string[] }) {}

  listOpen(): Ticket[] {
    // 1. GET /members/me/boards → find board by name
    // 2. GET /boards/{id}/lists → find lists matching config
    // 3. GET /lists/{id}/cards → filter by member assignment
    // Map cards to Ticket[] using card shortLink as ID
  }

  getById(id: string): Ticket | undefined {
    // GET /cards/{shortLink}
    // Map to Ticket
  }
}
```

## Ticket Format

Trello cards have a `shortLink` (8-char alphanumeric, e.g., `aBcD1234`) and a numeric `idShort` (board-scoped incrementing number). Use `idShort` for readable branches:

```
feat/42_add-biometric-login
```

If the user prefers the shortLink for uniqueness:
```json
{
  "ticketProvider": {
    "type": "trello",
    "idFormat": "shortLink"
  }
}
```
→ `feat/aBcD1234_add-biometric-login`

## Label-to-Type Mapping

Trello labels have names and colors. Map by name:

```typescript
const TRELLO_LABEL_TO_BRANCH: Record<string, string> = {
  Bug: "fix",
  Feature: "feat",
  Enhancement: "feat",
  Chore: "chore",
  Documentation: "docs",
  Refactor: "refactor",
};
```

If labels are color-only (no names), optionally map by color:

```json
{
  "ticketProvider": {
    "type": "trello",
    "colorMapping": {
      "red": "fix",
      "green": "feat",
      "yellow": "chore"
    }
  }
}
```

## PR Integration

Trello has no native git auto-linking. The PR body includes a clickable link:

```markdown
## Ticket

[#42](https://trello.com/c/aBcD1234)
```

Trello Power-Ups (like GitHub integration) can pick up PR links, but that's outside devflow's scope.

## Extra Features

### Auto-transition on branch creation

Move card to "In Progress" list when a branch is created:

```json
{
  "ticketProvider": {
    "type": "trello",
    "autoTransition": true,
    "inProgressList": "In Progress"
  }
}
```

### Board auto-detection

If `board` is not configured, show a board picker during first use:
```
? Which Trello board do you use for this project?
  > Engineering
    Product Backlog
    Design Tasks
```

Save selection to `.devflow.json` automatically.

### List filtering

Only show cards from specific lists (e.g., exclude "Done", "Blocked"):

```json
{
  "ticketProvider": {
    "type": "trello",
    "lists": ["Backlog", "To Do", "In Progress"]
  }
}
```

## Plugin Structure

```
devflow-plugin-trello/
├── package.json
├── src/
│   ├── index.ts          # register() + provider export
│   ├── provider.ts       # TrelloTicketProvider
│   ├── auth.ts           # API key + token management
│   └── api.ts            # Trello REST client
└── dist/
```

## Dependencies

None beyond Node.js built-ins (uses `https` module or `fetch` for API calls).

## Verification

1. `devflow branch` shows Trello cards from configured board/lists
2. Card labels map correctly to branch types
3. `idShort` used as ticket ID in branch name by default
4. Auto-transition moves card to "In Progress" list
5. PR body links to Trello card URL
6. Board auto-detection works when board not configured
7. Graceful fallback when Trello API is unreachable or credentials missing
