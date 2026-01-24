# GitHub Issues Provider (Built-in)

## Priority: High
## Status: Planned
## Release: Next Minor (0.5.0)

## Overview

Add GitHub Issues integration into devflow core, with a provider interface that plugins can implement for Jira/Linear/etc. GitHub is built-in since `gh` CLI is already required. Current manual-input behavior is preserved as default when no provider is configured.

## Design

### Provider Interface

New file `src/providers/tickets.ts` defines the contract:

```typescript
export interface Ticket {
  id: string;          // "142"
  title: string;       // "Add biometric login"
  labels: string[];    // ["bug", "auth"]
  url?: string;        // Full URL to the issue
}

export interface TicketProvider {
  listOpen(options?: { assignee?: string }): Ticket[];
  getById(id: string): Ticket | undefined;
}
```

### GitHub Provider

Built-in implementation using `gh issue list` and `gh issue view`:

- `listOpen()` → `gh issue list --assignee @me --state open --json number,title,labels,url`
- `getById(id)` → `gh issue view <id> --json number,title,labels,url`

### Config

```json
{
  "ticketProvider": {
    "type": "github"
  }
}
```

When `ticketProvider` is absent or `undefined`, current behavior is preserved (manual text input for ticket).

## Files to Modify/Create

### 1. `src/providers/tickets.ts` (NEW)

- `Ticket` interface
- `TicketProvider` interface
- `GitHubTicketProvider` class implementing the interface
  - Uses `execSync` with `gh issue` commands (same pattern as pr.ts)
  - Error handling: returns empty array / undefined on failure (soft fail)
- `createProvider(config)` factory function — returns `GitHubTicketProvider` for type "github", `undefined` otherwise
- Maps issue labels to branch types: `bug` → `fix`, `enhancement` → `feat`, etc.

### 2. `src/config.ts`

- Add `ticketProvider?: { type: string; [key: string]: unknown }` to `DevflowConfig` interface
- No default value (undefined = manual input preserved)
- Add to valid field whitelist in `validateConfig()`

### 3. `src/commands/branch.ts`

Current flow:
```
ticket = input("Ticket number (leave blank for UNTRACKED):")
```

New flow when `ticketProvider` is configured:
```
? How do you want to select the ticket?
  > Pick from open issues (assigned to me)
    Enter manually
    Skip (UNTRACKED)
```

If "Pick from open issues":
- Fetch issues via provider.listOpen({ assignee: "@me" })
- Show select prompt with issue list: `#142 Add biometric login (bug, auth)`
- Selected issue fills: ticket = "142", description = issue title (kebab-cased)

If "Enter manually": current behavior
If "Skip": ticket = "UNTRACKED"

**Branch type inference from issue labels:**
When a provider is configured, reorder prompts:
1. Ask how to select ticket (pick/manual/skip)
2. If pick → select issue → infer type from labels → ask type with inferred default
3. If manual/skip → ask type normally (current flow)
4. Ask description (pre-filled from issue title if picked)

### 4. `src/commands/pr.ts`

**Auto-close syntax:**

When `ticketProvider.type === "github"` and ticket is numeric:
- Change ticket section from `[#142](url)` to `Closes #142` (GitHub auto-close syntax)
- GitHub automatically closes the issue when the PR is merged

### 5. `src/commands/commit.ts`

No changes needed. Ticket inference from branch name (`inferTicket()`) continues to work — the ticket ID in the branch is the issue number.

### 6. `src/commands/init.ts`

Add a step to the init wizard:
- "Do you use GitHub Issues for ticket tracking?" (yes/no)
- If yes: add `"ticketProvider": { "type": "github" }` to generated config

## Label-to-Type Mapping

```typescript
const LABEL_TO_BRANCH_TYPE: Record<string, string> = {
  bug: "fix",
  enhancement: "feat",
  feature: "feat",
  documentation: "docs",
  refactor: "refactor",
  test: "test",
  chore: "chore",
  maintenance: "chore",
};
```

## Behavior Summary

| Config State | Branch Command | PR Command |
|---|---|---|
| No `ticketProvider` | Manual input (current) | Link with ticketBaseUrl (current) |
| `ticketProvider: { type: "github" }` | Issue picker + manual fallback | "Closes #N" syntax |

## Verification

1. **No config (backward compat):** `devflow branch` prompts for ticket manually — unchanged
2. **With GitHub provider:** `devflow branch` shows issue picker, selecting an issue fills ticket + description + suggests type
3. **PR with GitHub provider:** PR body contains `Closes #142` and issue auto-closes on merge
4. **gh not authenticated:** Issue picker gracefully falls back to manual input with a warning
5. **Tests:** Unit tests for `GitHubTicketProvider` and label-to-type mapping
