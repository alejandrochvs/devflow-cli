# comments

Show PR reviews and inline comments with diff context.

**Alias:** `devflow cm`

## Description

Displays all reviews and inline code comments on a PR, grouped by file. Each comment thread shows the surrounding diff hunk so you can see exactly what was commented on. Unresolved comments are shown first and highlighted; resolved comments are dimmed.

## Usage

```bash
# All comments (default — unresolved first, resolved dimmed)
devflow comments

# Only unresolved comments
devflow comments --unresolved

# Only resolved comments
devflow comments --resolved

# Specific PR
devflow comments --number 303
```

## Output

```
── #303 Contributing chores ──

Reviews

  @reviewer CHANGES REQUESTED 2h ago
    Please address the inline comments below.

  @teammate APPROVED 1h ago

Inline Comments (2 unresolved, 1 resolved)

  src/auth/login.ts (2 unresolved)

  line:42 · @copilot 3h ago
  ┃ - const user = getUser()
  ┃ + const user = await getUser()
  │ This async call needs error handling. Consider
  │ wrapping in a try/catch block.

  line:58 · @reviewer 2h ago
  ┃ + onClick={() => handleClick()}
  │ Consider debouncing this handler.

  line:12 · @copilot 5h ago [resolved]
  ┃ + import { auth } from "./utils"
  │ Unused import.

── 1 approval · 1 change request · 2 unresolved · 1 resolved ──
```

## Options

| Option | Description |
|--------|-------------|
| `--number <n>` | PR number (defaults to the current branch's PR) |
| `--unresolved` | Show only unresolved comment threads |
| `--resolved` | Show only resolved comment threads |

## Behavior

| Flags | What's shown |
|-------|-------------|
| *(none)* | All comments — unresolved first, resolved dimmed with `[resolved]` tag |
| `--unresolved` | Only unresolved threads |
| `--resolved` | Only resolved threads |

## Requirements

- `gh` CLI must be installed and authenticated
