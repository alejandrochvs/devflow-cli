import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { confirm, input, select } from "@inquirer/prompts";
import { execSync } from "child_process";
import { PRESETS, PresetType } from "../config.js";
import { writeVersionInfo, getCliVersion } from "../devflow-version.js";

interface Scope {
  value: string;
  description: string;
}

const DEFAULT_CHECKLIST = [
  "Code follows project conventions",
  "Self-reviewed the changes",
  "No new warnings or errors introduced",
];

function readPackageJson(cwd: string): Record<string, unknown> | undefined {
  const pkgPath = resolve(cwd, "package.json");
  if (!existsSync(pkgPath)) return undefined;
  try {
    return JSON.parse(readFileSync(pkgPath, "utf-8"));
  } catch {
    return undefined;
  }
}

function getGitHubIssuesUrl(): string | undefined {
  try {
    const remoteUrl = execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    // Parse GitHub URLs (SSH or HTTPS)
    // SSH: git@github.com:org/repo.git
    // HTTPS: https://github.com/org/repo.git
    const sshMatch = remoteUrl.match(/git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
    const httpsMatch = remoteUrl.match(/https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);

    const match = sshMatch || httpsMatch;
    if (match) {
      const [, org, repo] = match;
      return `https://github.com/${org}/${repo}/issues`;
    }
  } catch {
    // Not a git repo or no remote
  }
  return undefined;
}

function writePackageJson(cwd: string, pkg: Record<string, unknown>): void {
  const pkgPath = resolve(cwd, "package.json");
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

export async function initCommand(): Promise<void> {
  try {
    const cwd = process.cwd();
    const devflowDir = resolve(cwd, ".devflow");
    const configPath = resolve(devflowDir, "config.json");

    if (existsSync(configPath)) {
      const overwrite = await confirm({
        message: "Devflow config already exists. Overwrite?",
        default: false,
      });
      if (!overwrite) {
        console.log("Aborted.");
        process.exit(0);
      }
    }

    console.log("\n  devflow setup\n");

    // 0. Preset selection
    const preset = await select<PresetType>({
      message: "Select a workflow preset:",
      choices: [
        { value: "scrum" as PresetType, name: "Scrum - User stories, sprints, acceptance criteria" },
        { value: "kanban" as PresetType, name: "Kanban - Simple flow-based workflow" },
        { value: "simple" as PresetType, name: "Simple - Minimal configuration, no ticket required" },
        { value: "custom" as PresetType, name: "Custom - Configure everything manually" },
      ],
    });

    const presetConfig = PRESETS[preset];
    console.log("");

    // 1. Ticket base URL (skip for simple preset since no tickets)
    let ticketBaseUrl = "";
    let useGitHubIssues = false;

    if (preset !== "simple") {
      const detectedIssuesUrl = getGitHubIssuesUrl();
      ticketBaseUrl = await input({
        message: "Ticket base URL (e.g., https://github.com/org/repo/issues):",
        default: detectedIssuesUrl,
      });

      // 1b. GitHub Issues integration
      useGitHubIssues = await confirm({
        message: "Use GitHub Issues for ticket tracking? (enables issue picker in branch command)",
        default: ticketBaseUrl.includes("github.com"),
      });
    }

    // 2. Scopes
    const scopes: Scope[] = [];
    const scopeChoice = await select({
      message: "How would you like to configure commit scopes?",
      choices: [
        { value: "defaults", name: "Use defaults (core, ui, api, config, deps, ci)" },
        { value: "custom", name: "Define custom scopes" },
        { value: "skip", name: "Skip - configure later" },
      ],
    });

    if (scopeChoice === "defaults") {
      scopes.push(
        { value: "core", description: "Core functionality" },
        { value: "ui", description: "UI components" },
        { value: "api", description: "API layer" },
        { value: "config", description: "Configuration" },
        { value: "deps", description: "Dependencies" },
        { value: "ci", description: "CI/CD" },
      );
    } else if (scopeChoice === "custom") {
      console.log("\nAdd scopes one at a time. Press Enter with empty name to finish.\n");
      let addingScopes = true;
      while (addingScopes) {
        const value = await input({
          message: `Scope name${scopes.length > 0 ? " (blank to finish)" : ""}:`,
        });
        if (!value.trim()) {
          addingScopes = false;
        } else {
          const description = await input({
            message: `Description for "${value.trim()}":`,
          });
          scopes.push({
            value: value.trim().toLowerCase(),
            description: description.trim() || value.trim(),
          });
        }
      }
    }

    // 3. Checklist (shown in PR descriptions)
    let checklist = [...DEFAULT_CHECKLIST];
    const checklistChoice = await select({
      message: "PR checklist items (shown in pull request descriptions):",
      choices: [
        {
          value: "defaults",
          name: `Use defaults (${DEFAULT_CHECKLIST.length} items: conventions, self-review, no warnings)`,
        },
        { value: "custom", name: "Define custom checklist" },
        { value: "skip", name: "Skip - no checklist" },
      ],
    });

    if (checklistChoice === "custom") {
      console.log("\nAdd checklist items one at a time. Press Enter with empty text to finish.\n");
      checklist = [];
      let addingChecklist = true;
      while (addingChecklist) {
        const item = await input({
          message: `Checklist item${checklist.length > 0 ? " (blank to finish)" : ""}:`,
        });
        if (!item.trim()) {
          if (checklist.length === 0) {
            checklist = [...DEFAULT_CHECKLIST];
            console.log("Using default checklist.");
          }
          addingChecklist = false;
        } else {
          checklist.push(item.trim());
        }
      }
    } else if (checklistChoice === "skip") {
      checklist = [];
    }

    // 4. Format customization
    let branchFormat = presetConfig.branchFormat;
    let commitFormat = "{type}[{ticket}]{breaking}({scope}): {message}";

    const customizeFormats = await confirm({
      message: "Customize branch/commit formats? (advanced)",
      default: false,
    });

    if (customizeFormats) {
      console.log("\nAvailable placeholders:");
      console.log("  Branch: {type}, {ticket}, {description}");
      console.log("  Commit: {type}, {ticket}, {scope}, {message}, {breaking}\n");

      branchFormat = await input({
        message: "Branch format:",
        default: branchFormat,
      });

      commitFormat = await input({
        message: "Commit format:",
        default: commitFormat,
      });
    }

    // 5. Commitlint setup (validates commit messages on git commit)
    const commitlintChoice = await select({
      message: "Set up commitlint? (rejects commits that don't match the format)",
      choices: [
        { value: "yes", name: "Yes - enforce commit format with git hooks" },
        { value: "no", name: "No - I'll validate commits manually or use CI" },
      ],
    });
    const setupCommitlint = commitlintChoice === "yes";

    if (setupCommitlint) {
      const commitlintConfig = `module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\\w+)\\[.*?\\]!?\\((.+)\\): (.+)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  rules: {
    'subject-case': [0],
  },
};
`;
      writeFileSync(resolve(cwd, "commitlint.config.js"), commitlintConfig);
      console.log("✓ Created commitlint.config.js");

      // Install commitlint deps
      console.log("Installing commitlint...");
      try {
        execSync("npm install -D @commitlint/cli @commitlint/config-conventional", {
          cwd,
          stdio: "inherit",
        });
        console.log("✓ Installed commitlint");
      } catch {
        console.log("⚠ Failed to install commitlint. Run manually:");
        console.log("  npm install -D @commitlint/cli @commitlint/config-conventional");
      }
    }

    // 6. Husky setup
    const setupHusky = await confirm({
      message: "Set up husky with a commit-msg hook?",
      default: true,
    });

    if (setupHusky) {
      // Install husky
      console.log("Installing husky...");
      try {
        execSync("npm install -D husky", { cwd, stdio: "inherit" });
        execSync("npx husky init", { cwd, stdio: "inherit" });
        console.log("✓ Installed and initialized husky");
      } catch {
        console.log("⚠ Failed to install husky. Run manually:");
        console.log("  npm install -D husky && npx husky init");
      }

      // Create commit-msg hook
      const huskyDir = resolve(cwd, ".husky");
      if (!existsSync(huskyDir)) {
        mkdirSync(huskyDir, { recursive: true });
      }

      const commitMsgHook = `npx --no -- commitlint --edit $1 || {
  echo ""
  echo "  Commit message does not follow the required format."
  echo "  Use: devflow commit"
  echo ""
  exit 1
}
`;
      writeFileSync(resolve(huskyDir, "commit-msg"), commitMsgHook);
      console.log("✓ Created .husky/commit-msg hook");

      // Pre-push hook
      const addPrePush = await confirm({
        message: "Add pre-push hook (lint + typecheck)?",
        default: true,
      });

      if (addPrePush) {
        const prePushHook = `npm run lint
npx tsc --noEmit
`;
        writeFileSync(resolve(huskyDir, "pre-push"), prePushHook);
        console.log("✓ Created .husky/pre-push hook");
      }

      // Add prepare script
      const updatedPkg = readPackageJson(cwd);
      if (updatedPkg) {
        const scripts = (updatedPkg.scripts || {}) as Record<string, string>;
        if (!scripts.prepare) {
          scripts.prepare = "husky";
          updatedPkg.scripts = scripts;
          writePackageJson(cwd, updatedPkg);
          console.log("✓ Added prepare script to package.json");
        }
      }
    }

    // 7. CI workflow
    const setupCi = await confirm({
      message: "Generate a GitHub Actions CI workflow?",
      default: false,
    });

    if (setupCi) {
      const workflowDir = resolve(cwd, ".github/workflows");
      if (!existsSync(workflowDir)) {
        mkdirSync(workflowDir, { recursive: true });
      }

      const ciWorkflow = `name: CI

on:
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Test
        run: npm test
`;
      writeFileSync(resolve(workflowDir, "ci.yml"), ciWorkflow);
      console.log("✓ Created .github/workflows/ci.yml");
    }

    // 8. AI agent instructions
    const installAiInstructions = await confirm({
      message: "Install AI agent instructions? (helps Claude/Copilot use devflow)",
      default: true,
    });

    if (installAiInstructions) {
      if (!existsSync(devflowDir)) {
        mkdirSync(devflowDir, { recursive: true });
      }

      const aiInstructions = `# DevFlow - AI Agent Instructions

## Quick Reference

| Task | Command |
|------|---------|
| New branch | \`devflow branch\` |
| Commit changes | \`devflow commit\` or \`devflow commit -m "message"\` |
| Create/update PR | \`devflow pr\` |
| Create issue | \`devflow issue\` |
| Amend last commit | \`devflow amend\` |
| Check status | \`devflow status\` |
| View PR comments | \`devflow comments\` |

## Rules for AI Agents

1. **Use devflow instead of git for:**
   - Branches: \`devflow branch\` not \`git checkout -b\`
   - Commits: \`devflow commit\` not \`git commit\`
   - PRs: \`devflow pr\` not \`gh pr create\`

2. **Commit format:** \`${commitFormat}\`
   - Example: \`feat[123](auth): add OAuth2 login\`

3. **Branch format:** \`${branchFormat}\`
   - Example: \`feat/123_add-login\`

4. **Before making changes:**
   - Check status: \`devflow status\`
   - Create branch if needed: \`devflow branch\`

5. **After making changes:**
   - Stage files: \`git add <files>\`
   - Commit: \`devflow commit\`
   - When ready: \`devflow pr\`

6. **Use \`--dry-run\` to preview** any command without executing

## Common Workflows

### New Feature
\`\`\`bash
devflow branch          # Create feature branch
# ... make changes ...
git add <files>
devflow commit          # Commit with proper format
devflow pr              # Create pull request
\`\`\`

### Quick Fix
\`\`\`bash
git add <files>
devflow commit -m "fix typo in login form"
devflow amend           # If you need to add more changes
\`\`\`
`;

      writeFileSync(resolve(devflowDir, "AI_INSTRUCTIONS.md"), aiInstructions);
      console.log("✓ Created .devflow/AI_INSTRUCTIONS.md");

      // Write version file to track when files were generated
      writeVersionInfo(getCliVersion(), cwd);
      console.log("✓ Created .devflow/version.json");

      // Check if CLAUDE.md exists and offer to add reference
      const claudeMdPath = resolve(cwd, "CLAUDE.md");
      if (existsSync(claudeMdPath)) {
        const claudeMd = readFileSync(claudeMdPath, "utf-8");
        if (!claudeMd.includes(".devflow/AI_INSTRUCTIONS.md")) {
          const addReference = await confirm({
            message: "Add devflow reference to existing CLAUDE.md?",
            default: true,
          });
          if (addReference) {
            const reference = `\n\n## DevFlow\n\nThis project uses devflow for Git workflow automation. See \`.devflow/AI_INSTRUCTIONS.md\` for commands and usage.\n`;
            writeFileSync(claudeMdPath, claudeMd + reference);
            console.log("✓ Updated CLAUDE.md with devflow reference");
          }
        }
      }
    }

    // 10. Write .devflow/config.json
    const config: Record<string, unknown> = {
      preset,
      branchFormat,
      commitFormat,
      scopes,
      checklist,
    };

    if (ticketBaseUrl.trim()) {
      config.ticketBaseUrl = ticketBaseUrl.trim();
    }

    if (useGitHubIssues) {
      config.ticketProvider = { type: "github" };
    }

    if (preset === "custom") {
      config.issueTypes = presetConfig.issueTypes;
      config.prTemplate = presetConfig.prTemplate;
    }

    // Ensure .devflow directory exists
    if (!existsSync(devflowDir)) {
      mkdirSync(devflowDir, { recursive: true });
    }

    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
    console.log("✓ Created .devflow/config.json");

    // 11. Summary
    console.log("\n  Setup complete!\n");
    console.log("Usage:");
    console.log("  devflow branch    Create a new branch");
    console.log("  devflow commit    Create a conventional commit");
    console.log("  devflow pr        Create or update a PR");
    console.log("  devflow status    Show branch and PR info");
    console.log("  devflow doctor    Verify setup");
    console.log("");
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
