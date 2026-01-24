# test-plan

View or edit the test plan for the current branch.

**Alias:** `devflow tp`

## Description

Test plan steps are stored locally and automatically included in the PR body.

## Flow

- If a test plan exists: view steps and choose to add, replace, or clear
- If no test plan: prompted to add steps

Steps are also optionally collected during `devflow branch` creation.

## PR Integration

When you run `devflow pr`, stored test plan steps auto-populate the "Test Plan" section as checkboxes:

```markdown
## Test Plan

- [ ] Verify login flow with valid credentials
- [ ] Test error handling for expired tokens
- [ ] Confirm logout clears session data
```
