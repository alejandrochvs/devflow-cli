---
outline: [2, 3]
---

# Roadmap

devflow's ticket provider system connects your issue tracker directly into the branch/commit/PR workflow. GitHub Issues is built into core. Other providers are available as plugins.

## Provider Interface

All providers implement the same interface — your workflow stays identical regardless of which tracker you use:

```typescript
interface TicketProvider {
  listOpen(options?: { assignee?: string }): Ticket[];
  getById(id: string): Ticket | undefined;
}
```

Configure in `.devflow.json`:

```json
{
  "ticketProvider": {
    "type": "github"
  }
}
```

## Integrations

### GitHub Issues <Badge type="tip" text="Built-in" /> <Badge type="tip" text="Available" />

|  |  |
|--|--|
| **Auth** | `gh` CLI (already required) |
| **Config** | Zero — works out of the box |
| **Ticket format** | `#142` |
| **Branch** | `feat/142_add-biometric-login` |
| **PR auto-close** | `Closes #142` |

**Features:**
- Issue picker in `devflow branch` (assigned to you, open)
- Auto-infer branch type from issue labels (`bug` → `fix`, `enhancement` → `feat`)
- Pre-fill branch description from issue title
- `Closes #N` in PR body for auto-close on merge

---

### Jira <Badge type="warning" text="Plugin" /> <Badge type="info" text="Planned" />

|  |  |
|--|--|
| **Package** | `devflow-plugin-jira` |
| **Auth** | API token + email (env var or interactive login) |
| **Ticket format** | `PROJ-142` |
| **Branch** | `feat/PROJ-142_add-biometric-login` |
| **Auto-transition** | Moves issue to "In Progress" |

**Features:**
- JQL-powered issue filtering
- Issue type → branch type mapping (Bug → fix, Story → feat)
- Auto-transition on branch creation
- Clickable Jira links in PR body

---

### Linear <Badge type="warning" text="Plugin" /> <Badge type="info" text="Planned" />

|  |  |
|--|--|
| **Package** | `devflow-plugin-linear` |
| **Auth** | API key (env var or interactive login) |
| **Ticket format** | `ENG-142` |
| **Branch** | `feat/ENG-142_add-biometric-login` |
| **Auto-transition** | Moves issue to "In Progress" |

**Features:**
- GraphQL API integration
- Team-scoped issue listing
- Current cycle filtering
- Auto-transition on branch creation
- Linear auto-links PRs from branch name

---

### GitLab <Badge type="warning" text="Plugin" /> <Badge type="info" text="Planned" />

|  |  |
|--|--|
| **Package** | `devflow-plugin-gitlab` |
| **Auth** | `glab` CLI (mirrors `gh` pattern) |
| **Ticket format** | `#142` |
| **Branch** | `feat/142_add-biometric-login` |
| **MR auto-close** | `Closes #142` |

**Features:**
- Uses `glab` CLI (zero extra auth config)
- Label → branch type mapping
- Milestone filtering
- Optional: override `devflow pr` to use `glab mr create`

---

### Azure DevOps <Badge type="warning" text="Plugin" /> <Badge type="info" text="Planned" />

|  |  |
|--|--|
| **Package** | `devflow-plugin-azure` |
| **Auth** | `az` CLI with DevOps extension |
| **Ticket format** | `AB#142` |
| **Branch** | `feat/AB#142_add-biometric-login` |
| **Auto-transition** | Moves work item to "Active" |

**Features:**
- WIQL-powered work item queries
- Work item type → branch type mapping
- Iteration/sprint filtering
- Area path filtering for large projects
- `AB#N` format for auto-linking

---

### Shortcut <Badge type="warning" text="Plugin" /> <Badge type="info" text="Planned" />

|  |  |
|--|--|
| **Package** | `devflow-plugin-shortcut` |
| **Auth** | API token (env var or interactive login) |
| **Ticket format** | `sc-142` |
| **Branch** | `feat/sc-142_add-biometric-login` |
| **Auto-transition** | Moves story to "In Progress" |

**Features:**
- Story type → branch type mapping (bug, feature, chore)
- Current iteration filtering
- Shortcut auto-links from branch name

---

### Trello <Badge type="warning" text="Plugin" /> <Badge type="info" text="Planned" />

|  |  |
|--|--|
| **Package** | `devflow-plugin-trello` |
| **Auth** | API key + token (env var or interactive login) |
| **Ticket format** | `#42` (card number) |
| **Branch** | `feat/42_add-biometric-login` |
| **Auto-transition** | Moves card to "In Progress" list |

**Features:**
- Board + list filtering
- Card labels → branch type mapping
- Color-based label mapping (for unnamed labels)
- Board auto-detection on first use

---

### Notion <Badge type="warning" text="Plugin" /> <Badge type="info" text="Planned" />

|  |  |
|--|--|
| **Package** | `devflow-plugin-notion` |
| **Auth** | Integration token (env var or interactive login) |
| **Ticket format** | Custom property or row number |
| **Branch** | `feat/PROJ-142_add-biometric-login` |
| **Auto-transition** | Updates status property |

**Features:**
- Custom database property mapping (flexible schema)
- Interactive setup wizard (`npx devflow notion-setup`)
- Configurable type mapping
- Multiple ticket ID strategies (custom prop, row number, short UUID)

::: warning Note
Notion requires more configuration than other providers due to its custom database schemas. The setup wizard handles this interactively.
:::

---

## Status Legend

| Badge | Meaning |
|-------|---------|
| <Badge type="tip" text="Built-in" /> | Ships with devflow core, no install needed |
| <Badge type="tip" text="Available" /> | Feature is implemented and ready to use |
| <Badge type="warning" text="Plugin" /> | Install as separate npm package |
| <Badge type="info" text="Next Release" /> | Coming in the next minor version |
| <Badge type="info" text="Planned" /> | On the roadmap, not yet started |

## Writing a Provider Plugin

See the [Plugins guide](/plugins) for the general plugin system. Provider plugins export an additional `createTicketProvider` function:

```typescript
import { Command } from "commander";
import type { TicketProvider } from "@alejandrochaves/devflow-cli";

export function register(program: Command): void {
  // Optional: add auth commands (e.g., "jira-login")
}

export function createTicketProvider(
  config: Record<string, unknown>
): TicketProvider {
  return new MyProvider(config);
}
```
