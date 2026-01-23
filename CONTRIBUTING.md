# Contributing to devflow

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/alejandrochvs/devflow-cli.git
cd devflow-cli
npm install
npm run dev    # Watch mode (recompiles on change)
```

To test your local build:

```bash
npm run build
node dist/index.js branch   # Run any command directly
```

Or link it globally:

```bash
npm link
devflow --help
```

## Project Structure

```
src/
├── index.ts           # CLI entry point (commander setup)
├── config.ts          # .devflow.json loading and validation
├── git.ts             # Shared git utilities
├── colors.ts          # ANSI color helpers
├── monorepo.ts        # Workspace detection
├── test-plan.ts       # Test plan storage
├── update-notifier.ts # npm update check
└── commands/          # One file per command
    ├── branch.ts
    ├── commit.ts
    ├── pr.ts
    ├── amend.ts
    ├── undo.ts
    ├── fixup.ts
    ├── merge.ts
    ├── status.ts
    ├── test-plan.ts
    ├── changelog.ts
    ├── cleanup.ts
    ├── doctor.ts
    └── init.ts
```

## Running Tests

```bash
npm test            # Run once
npm run test:watch  # Watch mode
```

## Making Changes

1. Create a branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Add tests if applicable (in `tests/`)
4. Ensure `npm run build` and `npm test` pass
5. Commit using conventional format: `type(scope): message`
6. Open a pull request against `main`

## Code Style

- TypeScript with strict mode
- ESM modules (`.js` extensions in imports)
- No external runtime dependencies beyond `commander` and `@inquirer/prompts`
- Use the `colors.ts` helpers for terminal output (no chalk/picocolors)
- Keep commands self-contained in their own file under `src/commands/`

## Adding a New Command

1. Create `src/commands/your-command.ts` exporting an async function
2. Register it in `src/index.ts` with `program.command(...)`
3. Add an alias if it's a core command
4. Update shell completions in `src/index.ts`
5. Add a section to `README.md`

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a description of what and why
- Add tests for new logic (especially parsers/formatters)
- Don't bump the version — maintainers handle releases

## Reporting Bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (Node version, OS, git version)
