# Integrations

## Commitlint

If you use [commitlint](https://commitlint.js.org/) to enforce commit conventions, add this parser preset to handle the `type[ticket](scope): message` format:

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)\[.*?\]!?\((.+)\): (.+)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  rules: {
    'subject-case': [0],
  },
};
```

## Husky

Pair with [husky](https://typicode.github.io/husky/) for a guided commit experience:

### commit-msg hook

```bash
# .husky/commit-msg
npx --no -- commitlint --edit $1 || {
  echo ""
  echo "  Commit message does not follow the required format."
  echo "  Use: npm run commit"
  echo ""
  exit 1
}
```

### pre-push hook

The `devflow init` wizard can set up a **pre-push** hook that runs lint and type checking before push:

```bash
# .husky/pre-push
npm run lint
npx tsc --noEmit
```

## CI Workflow

The `devflow init` wizard can generate a `.github/workflows/ci.yml` that runs lint, typecheck, and tests on pull requests.

You can also validate your devflow configuration in CI:

```bash
npx devflow lint-config
```

This exits with code 1 on errors, making it suitable for CI pipelines.

## Update Notifications

devflow checks for newer versions on npm once every 24 hours and displays a non-blocking notification if an update is available:

```
─ Update available: 0.2.0 → 0.3.0 (npm update @alejandrochaves/devflow-cli) ─
```
