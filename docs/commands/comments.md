# comments

Show PR reviews and inline comments with diff context.

**Alias:** `devflow cm`

## Description

Displays all reviews and inline code comments on a PR in a readable terminal format. Each inline comment shows the surrounding diff hunk so you can see exactly what was commented on without opening the browser.

## Usage

```bash
# Comments for the current branch's PR
devflow comments

# Comments for a specific PR
devflow comments --number 303
```

## Output

```
── #303 Contributing chores ──

Reviews

  @reviewer CHANGES REQUESTED 2h ago
    Please address the inline comments below.

  @teammate APPROVED 1h ago

Inline Comments (3)

  src/auth/login.ts
  line:42 · @copilot 3h ago
  ┃ - const user = getUser()
  ┃ + const user = await getUser()
  │ This async call needs error handling. Consider
  │ wrapping in a try/catch block.

  src/components/Button.tsx
  line:15 · @reviewer 2h ago
  ┃ + onClick={() => handleClick()}
  │ Consider debouncing this handler for performance.

── 1 approval · 1 change request · 3 inline comments ──
```

## Options

| Option | Description |
|--------|-------------|
| `--number <n>` | PR number (defaults to the current branch's PR) |

## Requirements

- `gh` CLI must be installed and authenticated
