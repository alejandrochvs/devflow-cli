# lint-config

Validate `.devflow/config.json` for errors and warnings.

**Alias:** `devflow lint`

## Description

Designed to run in CI pipelines — exits with code 1 on errors.

## Checks

- Valid JSON syntax
- Config structure validation (via `validateConfig`)
- Scopes have descriptions
- Scope path patterns contain globs or path separators
- PR template sections are recognized values
- Commit format placeholders are valid

## Usage

```bash
# In CI
npx devflow lint-config
```
