# issue

Create GitHub issues using configurable templates with an interactive flow.

**Alias:** `devflow i`

## Issue Types by Preset

Issue types are configurable and depend on your selected preset:

### Scrum Preset

| Type | Label | Branch Type |
|------|-------|-------------|
| User Story | `feature` | `feat/` |
| Bug | `bug` | `fix/` |
| Task | `task` | `chore/` |
| Spike | `spike` | `chore/` |
| Tech Debt | `tech-debt` | `refactor/` |

### Kanban Preset

| Type | Label | Branch Type |
|------|-------|-------------|
| Feature | `enhancement` | `feat/` |
| Bug | `bug` | `fix/` |
| Improvement | `enhancement` | `refactor/` |
| Task | `task` | `chore/` |

### Simple Preset

| Type | Label | Branch Type |
|------|-------|-------------|
| Feature | `enhancement` | `feat/` |
| Bug | `bug` | `fix/` |
| Task | `task` | `chore/` |

## Flow

1. Select issue type
2. Fill in type-specific fields (guided prompts)
3. Preview the issue
4. Confirm and create via `gh issue create`
5. Optionally create a branch and start working

## Templates

### User Story

Prompts for:
- **As a** (user role)
- **I want to** (goal)
- **So that** (benefit)
- Acceptance criteria (checklist)
- Notes (optional)

```markdown
## User Story

**As a** logged-in user
**I want to** export my data as CSV
**So that** I can use it in spreadsheets

## Acceptance Criteria

- [ ] CSV includes all user data
- [ ] Download works in all browsers
```

### Bug

Prompts for:
- What happened?
- What was expected?
- Steps to reproduce
- Environment (optional)
- Logs/screenshots (optional)

```markdown
## Bug Report

### Description
Login button unresponsive on mobile

### Expected Behavior
Button should trigger login flow

### Steps to Reproduce
1. Open app on mobile
2. Enter credentials
3. Tap login button

### Environment
iOS 17, Safari
```

### Task

Prompts for:
- What needs to be done?
- Why is this needed?
- Done criteria (checklist)

```markdown
## Task

### Description
Set up CI pipeline for the frontend

### Context
Automated testing will catch regressions early

### Done Criteria

- [ ] GitHub Actions workflow created
- [ ] Tests run on PR
- [ ] Status checks required for merge
```

### Spike

Prompts for:
- Question to answer
- Timebox (2h, 4h, 1d, 2d)
- Expected output (doc, POC, recommendation, prototype)
- Background context (optional)

```markdown
## Spike

### Question to Answer
Should we use Redis or Memcached for session caching?

### Timebox
4 hours

### Expected Output
Recommendation

### Findings
_To be filled after investigation_
```

### Tech Debt

Prompts for:
- What technical debt?
- Why does it matter?
- Proposed approach (optional)

```markdown
## Tech Debt

### Description
Migrate from deprecated authentication library

### Impact
Current library has known security vulnerabilities

### Proposed Approach
Use the new official SDK with minimal API changes
```

## Branch Creation

After creating the issue, you're prompted to create a branch:

```
✓ Issue created: https://github.com/owner/repo/issues/42

? Create a branch and start working on this issue? › Yes
? Short branch description: › export-csv
Branch: feat/#42_export-csv
? Create this branch? › Yes
✓ Branch created: feat/#42_export-csv

You're ready to start working!
  Make changes, then: devflow commit
```

The branch name format is: `{branchType}/#{issueNumber}_{description}`

For User Stories and Bugs, you can also add test plan steps that will be included in your PR.

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview the issue without creating it |

## Custom Issue Types

You can define custom issue types in `.devflow/config.json`:

```json
{
  "issueTypes": [
    {
      "value": "feature",
      "label": "Feature",
      "labelColor": "enhancement",
      "branchType": "feat",
      "fields": [
        { "name": "description", "prompt": "Describe the feature:", "type": "input", "required": true },
        { "name": "value", "prompt": "Business value:", "type": "input", "required": false },
        { "name": "criteria", "prompt": "Done criteria:", "type": "list", "required": true }
      ],
      "template": "## Feature\n\n{description}\n{value:section:Business Value}\n\n### Done Criteria\n\n{criteria:checkbox}"
    }
  ]
}
```

### Field Types

| Type | Description |
|------|-------------|
| `input` | Single line text |
| `multiline` | Opens text editor |
| `select` | Dropdown (requires `options` array) |
| `list` | Collect items until blank line |

### Template Syntax

| Syntax | Description |
|--------|-------------|
| `{field}` | Simple replacement |
| `{field:checkbox}` | List as checkboxes (`- [ ] item`) |
| `{field:numbered}` | List as numbered (`1. item`) |
| `{field:section:Title}` | Only shown if field has value |

## Requirements

- GitHub CLI (`gh`) must be installed and authenticated
- Run `gh auth login` if not already authenticated
