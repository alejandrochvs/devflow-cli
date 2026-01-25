# update

Updates devflow generated files (AI instructions, etc.) to the latest version.

**Alias:** `up`

## Usage

```bash
devflow update [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without writing files |
| `--yes` | Skip confirmation prompts |

## What it updates

- `.devflow/AI_INSTRUCTIONS.md` - Latest AI agent instructions with all non-interactive flags
- `.devflow/version.json` - Tracks which CLI version generated the files
- `CLAUDE.md` - Adds non-interactive mode section if missing

## Version tracking

When you run `devflow update`, it creates/updates `.devflow/version.json`:

```json
{
  "cliVersion": "1.2.0",
  "generatedAt": "2026-01-25T04:47:10.263Z",
  "files": {
    "aiInstructions": "1.2.0"
  }
}
```

When running any devflow command, if the CLI version is newer than the version in `version.json`, you'll see a warning:

```
⚠ DevFlow files were generated with v1.1.0 (current: v1.2.0). Run devflow update to update.
```

## Examples

```bash
# Interactive update
devflow update

# Non-interactive (for CI/scripts)
devflow update --yes

# Preview what would change
devflow update --dry-run
```

## For existing projects

If you initialized devflow before v1.2.0, run this to get the latest AI instructions:

```bash
npm install -g @alejandrochaves/devflow-cli@latest
devflow update --yes
```
