# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.3.x   | :white_check_mark: |
| < 0.3   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public issue
2. Email the maintainer or use [GitHub's private vulnerability reporting](https://github.com/alejandrochvs/devflow-cli/security/advisories/new)
3. Include a description of the vulnerability, steps to reproduce, and potential impact

You can expect an initial response within 72 hours. We will work with you to understand and address the issue before any public disclosure.

## Scope

devflow is a CLI tool that executes git and GitHub CLI commands on the user's behalf. Security considerations include:

- **Command injection** — User inputs (branch names, commit messages, file paths) are passed to shell commands. We use `JSON.stringify()` for escaping.
- **Config file parsing** — `.devflow/config.json` is parsed as JSON. The `extends` field resolves npm packages or local files.
- **Network access** — The update notifier checks npm for newer versions. The `pr` and `merge` commands use the GitHub CLI.

devflow does not collect telemetry, send analytics, or access any services beyond npm (for update checks) and GitHub (via `gh` CLI).
