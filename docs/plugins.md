# Plugins

Extend devflow with custom commands via the plugin system.

## Discovery

Plugins are automatically discovered from:

1. **npm packages** — any dependency matching `devflow-plugin-*` or `@scope/devflow-plugin-*`
2. **Config** — explicit list in `.devflow.json`:

```json
{
  "plugins": ["devflow-plugin-jira", "@myorg/devflow-plugin-deploy"]
}
```

## Config-Based Loading

When listed in the `plugins` array, devflow resolves and loads each plugin at startup. Plugins from both npm packages and local paths are supported:

```json
{
  "plugins": [
    "devflow-plugin-jira",
    "./plugins/my-custom-plugin.js"
  ]
}
```

## Writing a Plugin

A plugin is an npm package that exports a `register` function:

```typescript
import { Command } from "commander";

export function register(program: Command): void {
  program
    .command("deploy")
    .description("Deploy the current branch")
    .action(() => {
      // your logic here
    });
}
```

Plugins receive the Commander `program` instance and can add commands, options, or hooks.

### Plugin Structure

A typical plugin package looks like:

```
devflow-plugin-deploy/
├── package.json
├── src/
│   └── index.ts
└── dist/
    └── index.js
```

### package.json

```json
{
  "name": "devflow-plugin-deploy",
  "main": "dist/index.js",
  "keywords": ["devflow-plugin"],
  "peerDependencies": {
    "commander": "^13.0.0"
  }
}
```

### Tips

- Use the `devflow-plugin` keyword in your package.json for discoverability
- Plugins should handle their own dependencies
- Use `peerDependencies` for `commander` to avoid version conflicts
- Plugins can add multiple commands in a single `register` call
