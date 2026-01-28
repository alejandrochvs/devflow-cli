import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { confirm, input, select } from "@inquirer/prompts";
import { execSync } from "child_process";
import { PRESETS, PresetType } from "../config.js";
import { writeVersionInfo, getCliVersion } from "../devflow-version.js";
import {
  selectWithBack,
  inputWithBack,
  confirmWithBack,
  BACK_VALUE,
} from "../prompts.js";

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

interface GitHubRepo {
  owner: string;
  name: string;
}

function getGitHubRepo(): GitHubRepo | undefined {
  try {
    const remoteUrl = execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const sshMatch = remoteUrl.match(/git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
    const httpsMatch = remoteUrl.match(/https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);

    const match = sshMatch || httpsMatch;
    if (match) {
      return { owner: match[1], name: match[2] };
    }
  } catch {
    // Not a git repo or no remote
  }
  return undefined;
}

function hasProjectScopes(): boolean {
  try {
    // Try to list projects - if it fails with scope error, we don't have permissions
    execSync("gh project list --owner @me --limit 1", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch (error) {
    const errorMessage = (error as Error).message || "";
    return !errorMessage.includes("missing required scopes") && !errorMessage.includes("read:project");
  }
}

interface GitHubProject {
  number: number;
  title: string;
}

function getRepoLinkedProjects(repo: GitHubRepo): GitHubProject[] {
  try {
    const query = `{
      repository(owner: "${repo.owner}", name: "${repo.name}") {
        projectsV2(first: 20) {
          nodes { number title }
        }
      }
    }`;
    const result = execSync(`gh api graphql -f query='${query}'`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    if (!result) return [];

    const data = JSON.parse(result);
    const nodes = data?.data?.repository?.projectsV2?.nodes || [];
    return nodes.map((p: { number: number; title: string }) => ({
      number: p.number,
      title: p.title,
    }));
  } catch {
    return [];
  }
}

function refreshProjectScopes(): boolean {
  try {
    execSync("gh auth refresh -s project", {
      stdio: "inherit",
    });
    return true;
  } catch {
    return false;
  }
}

function createAndLinkProject(repo: GitHubRepo, title: string): GitHubProject | null {
  try {
    // Create the project
    const createResult = execSync(
      `gh project create --owner ${repo.owner} --title "${title}" --format json`,
      {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    ).trim();

    const project = JSON.parse(createResult);
    const projectNumber = project.number;

    // Link it to the repo
    execSync(`gh project link ${projectNumber} --owner ${repo.owner} --repo ${repo.name}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    return { number: projectNumber, title };
  } catch {
    return null;
  }
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
      const overwrite = await confirmWithBack({
        message: "Devflow config already exists. Overwrite?",
        default: false,
        showBack: false,
      });
      if (overwrite !== true) {
        console.log("Aborted.");
        process.exit(0);
      }
    }

    console.log("\n  devflow setup\n");

    // State for configuration
    interface InitState {
      preset: PresetType;
      ticketBaseUrl: string;
      useGitHubIssues: boolean;
      projectEnabled: boolean;
      projectNumber: number | null;
      scopeChoice: string;
      scopes: Scope[];
      checklistChoice: string;
      checklist: string[];
      customizeFormats: boolean;
      branchFormat: string;
      commitFormat: string;
    }

    const state: InitState = {
      preset: "scrum",
      ticketBaseUrl: "",
      useGitHubIssues: false,
      projectEnabled: false,
      projectNumber: null,
      scopeChoice: "",
      scopes: [],
      checklistChoice: "",
      checklist: [...DEFAULT_CHECKLIST],
      customizeFormats: false,
      branchFormat: "",
      commitFormat: "{type}[{ticket}]{breaking}({scope}): {message}",
    };

    // Step-based flow with back navigation
    type StepName = "preset" | "ticketUrl" | "githubIssues" | "projectSetup" | "scopes" | "checklist" | "formats" | "done";
    let currentStep: StepName = "preset";

    while (currentStep !== "done") {
      switch (currentStep) {
        case "preset": {
          const result = await selectWithBack<PresetType>({
            message: "Select a workflow preset:",
            choices: [
              { value: "scrum" as PresetType, name: "Scrum - User stories, sprints, acceptance criteria" },
              { value: "kanban" as PresetType, name: "Kanban - Simple flow-based workflow" },
              { value: "simple" as PresetType, name: "Simple - Minimal configuration, no ticket required" },
              { value: "custom" as PresetType, name: "Custom - Configure everything manually" },
            ],
            default: state.preset,
            showBack: false, // First step
          });

          if (result === BACK_VALUE) {
            // Can't go back from first step
          } else {
            state.preset = result as PresetType;
            state.branchFormat = PRESETS[state.preset].branchFormat;
            console.log("");
            // Skip ticket URL for simple preset
            currentStep = state.preset === "simple" ? "scopes" : "ticketUrl";
          }
          break;
        }

        case "ticketUrl": {
          const detectedIssuesUrl = getGitHubIssuesUrl();
          const result = await inputWithBack({
            message: "Ticket base URL (e.g., https://github.com/org/repo/issues):",
            default: state.ticketBaseUrl || detectedIssuesUrl,
            showBack: true,
          });

          if (result === BACK_VALUE) {
            currentStep = "preset";
          } else {
            state.ticketBaseUrl = result;
            currentStep = "githubIssues";
          }
          break;
        }

        case "githubIssues": {
          const result = await confirmWithBack({
            message: "Use GitHub Issues for ticket tracking? (enables issue picker in branch command)",
            default: state.useGitHubIssues || state.ticketBaseUrl.includes("github.com"),
            showBack: true,
          });

          if (result === BACK_VALUE) {
            currentStep = "ticketUrl";
          } else {
            state.useGitHubIssues = result === true;
            // If using GitHub issues, offer project integration
            currentStep = result === true ? "projectSetup" : "scopes";
          }
          break;
        }

        case "projectSetup": {
          // Check if we have project scopes
          const hasScopes = hasProjectScopes();

          if (!hasScopes) {
            console.log("\n  GitHub Projects Integration\n");
            console.log("  Connecting to a GitHub Project enables:");
            console.log("  • Auto-move issues to 'In Progress' when you start a branch");
            console.log("  • Auto-move issues to 'In Review' when you open a PR");
            console.log("  • View project issues with `devflow issues`\n");
            console.log("  This requires the 'project' OAuth scope for your GitHub CLI.");
            console.log("  If you skip this, you can still use GitHub Issues without board automation.\n");
            const addScopes = await confirmWithBack({
              message: "Authorize project access?",
              default: true,
              showBack: true,
            });

            if (addScopes === BACK_VALUE) {
              currentStep = "githubIssues";
              break;
            }

            if (addScopes === true) {
              console.log("\nOpening GitHub to authorize project permissions...\n");
              const success = refreshProjectScopes();
              if (!success) {
                console.log("⚠ Failed to add project permissions. Skipping project integration.");
                currentStep = "scopes";
                break;
              }
              console.log("✓ Project permissions added\n");
            } else {
              // Skip project integration
              state.projectEnabled = false;
              currentStep = "scopes";
              break;
            }
          }

          // Now we have scopes, list available projects
          const repo = getGitHubRepo();
          if (!repo) {
            console.log("⚠ Could not determine repository. Skipping project integration.");
            currentStep = "scopes";
            break;
          }

          // First, try to get projects linked to this repo
          const linkedProjects = getRepoLinkedProjects(repo);

          if (linkedProjects.length > 0) {
            // Show only linked projects
            const projectResult = await selectWithBack({
              message: "Select a GitHub Project for issue tracking:",
              choices: [
                ...linkedProjects.map((p) => ({
                  value: p.number,
                  name: `#${p.number} ${p.title}`,
                })),
                { value: -1, name: "Skip - don't use project integration" },
              ],
              showBack: true,
            });

            if (projectResult === BACK_VALUE) {
              currentStep = "githubIssues";
            } else if (projectResult === -1) {
              state.projectEnabled = false;
              currentStep = "scopes";
            } else {
              state.projectEnabled = true;
              state.projectNumber = projectResult;
              console.log(`✓ Will use project #${projectResult}\n`);
              currentStep = "scopes";
            }
            break;
          }

          // No linked projects - offer to create one
          console.log(`\n  No GitHub Projects are linked to ${repo.owner}/${repo.name}.`);
          const createChoice = await selectWithBack({
            message: "What would you like to do?",
            choices: [
              { value: "create", name: "Create a new project" },
              { value: "skip", name: "Skip project integration for now" },
            ],
            showBack: true,
          });

          if (createChoice === BACK_VALUE) {
            currentStep = "githubIssues";
            break;
          }

          if (createChoice === "skip") {
            state.projectEnabled = false;
            currentStep = "scopes";
            break;
          }

          // Ask for project name
          const defaultProjectName = `${repo.name} Board`;
          const projectName = await inputWithBack({
            message: "Project name:",
            default: defaultProjectName,
            showBack: true,
          });

          if (projectName === BACK_VALUE) {
            // Go back to the create/skip choice - stay on this step
            break;
          }

          // Create and link a new project
          console.log(`\nCreating project "${projectName}"...`);
          const newProject = createAndLinkProject(repo, projectName);

          if (newProject) {
            console.log(`✓ Created and linked project #${newProject.number}\n`);
            state.projectEnabled = true;
            state.projectNumber = newProject.number;
          } else {
            console.log("⚠ Failed to create project. Skipping project integration.");
            state.projectEnabled = false;
          }
          currentStep = "scopes";
          break;
        }

        case "scopes": {
          const result = await selectWithBack({
            message: "How would you like to configure commit scopes?",
            choices: [
              { value: "defaults", name: "Use defaults (core, ui, api, config, deps, ci)" },
              { value: "custom", name: "Define custom scopes" },
              { value: "skip", name: "Skip - configure later" },
            ],
            default: state.scopeChoice || undefined,
            showBack: true,
          });

          if (result === BACK_VALUE) {
            // Go back to appropriate step based on config
            if (state.preset === "simple") {
              currentStep = "preset";
            } else if (state.useGitHubIssues) {
              currentStep = "projectSetup";
            } else {
              currentStep = "githubIssues";
            }
          } else {
            state.scopeChoice = result;
            state.scopes = [];

            if (result === "defaults") {
              state.scopes = [
                { value: "core", description: "Core functionality" },
                { value: "ui", description: "UI components" },
                { value: "api", description: "API layer" },
                { value: "config", description: "Configuration" },
                { value: "deps", description: "Dependencies" },
                { value: "ci", description: "CI/CD" },
              ];
              currentStep = "checklist";
            } else if (result === "custom") {
              console.log("\nAdd scopes one at a time. Press Enter with empty name to finish.\n");
              let addingScopes = true;
              while (addingScopes) {
                const scopeValue = await input({
                  message: `Scope name${state.scopes.length > 0 ? " (blank to finish)" : ""}:`,
                });
                if (!scopeValue.trim()) {
                  addingScopes = false;
                } else {
                  const description = await input({
                    message: `Description for "${scopeValue.trim()}":`,
                  });
                  state.scopes.push({
                    value: scopeValue.trim().toLowerCase(),
                    description: description.trim() || scopeValue.trim(),
                  });
                }
              }
              currentStep = "checklist";
            } else {
              currentStep = "checklist";
            }
          }
          break;
        }

        case "checklist": {
          const result = await selectWithBack({
            message: "PR checklist items (shown in pull request descriptions):",
            choices: [
              {
                value: "defaults",
                name: `Use defaults (${DEFAULT_CHECKLIST.length} items: conventions, self-review, no warnings)`,
              },
              { value: "custom", name: "Define custom checklist" },
              { value: "skip", name: "Skip - no checklist" },
            ],
            default: state.checklistChoice || undefined,
            showBack: true,
          });

          if (result === BACK_VALUE) {
            currentStep = "scopes";
          } else {
            state.checklistChoice = result;

            if (result === "custom") {
              console.log("\nAdd checklist items one at a time. Press Enter with empty text to finish.\n");
              state.checklist = [];
              let addingChecklist = true;
              while (addingChecklist) {
                const item = await input({
                  message: `Checklist item${state.checklist.length > 0 ? " (blank to finish)" : ""}:`,
                });
                if (!item.trim()) {
                  if (state.checklist.length === 0) {
                    state.checklist = [...DEFAULT_CHECKLIST];
                    console.log("Using default checklist.");
                  }
                  addingChecklist = false;
                } else {
                  state.checklist.push(item.trim());
                }
              }
            } else if (result === "skip") {
              state.checklist = [];
            } else {
              state.checklist = [...DEFAULT_CHECKLIST];
            }
            currentStep = "formats";
          }
          break;
        }

        case "formats": {
          const result = await confirmWithBack({
            message: "Customize branch/commit formats? (advanced)",
            default: state.customizeFormats,
            showBack: true,
          });

          if (result === BACK_VALUE) {
            currentStep = "checklist";
          } else {
            state.customizeFormats = result === true;

            if (state.customizeFormats) {
              console.log("\nAvailable placeholders:");
              console.log("  Branch: {type}, {ticket}, {description}");
              console.log("  Commit: {type}, {ticket}, {scope}, {message}, {breaking}\n");

              const branchResult = await inputWithBack({
                message: "Branch format:",
                default: state.branchFormat,
                showBack: true,
              });

              if (branchResult === BACK_VALUE) {
                // Stay on formats step
                break;
              }
              state.branchFormat = branchResult;

              const commitResult = await inputWithBack({
                message: "Commit format:",
                default: state.commitFormat,
                showBack: true,
              });

              if (commitResult === BACK_VALUE) {
                // Stay on formats step
                break;
              }
              state.commitFormat = commitResult;
            }
            currentStep = "done";
          }
          break;
        }

        default:
          currentStep = "done";
      }
    }

    // Extract configuration from state
    const preset = state.preset;
    const presetConfig = PRESETS[preset];
    const ticketBaseUrl = state.ticketBaseUrl;
    const useGitHubIssues = state.useGitHubIssues;
    const scopes = state.scopes;
    const checklist = state.checklist;
    const branchFormat = state.branchFormat || presetConfig.branchFormat;
    const commitFormat = state.commitFormat;

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

    if (state.projectEnabled && state.projectNumber) {
      config.project = {
        enabled: true,
        number: state.projectNumber,
        statusField: "Status",
        statuses: {
          todo: "Todo",
          inProgress: "In Progress",
          inReview: "In Review",
          done: "Done",
        },
      };
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
