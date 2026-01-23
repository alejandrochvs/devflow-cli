import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { confirm, input } from "@inquirer/prompts";
import { execSync } from "child_process";
const DEFAULT_CHECKLIST = [
    "Code follows project conventions",
    "Self-reviewed the changes",
    "No new warnings or errors introduced",
];
function readPackageJson(cwd) {
    const pkgPath = resolve(cwd, "package.json");
    if (!existsSync(pkgPath))
        return undefined;
    try {
        return JSON.parse(readFileSync(pkgPath, "utf-8"));
    }
    catch {
        return undefined;
    }
}
function writePackageJson(cwd, pkg) {
    const pkgPath = resolve(cwd, "package.json");
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}
export async function initCommand() {
    try {
        const cwd = process.cwd();
        const configPath = resolve(cwd, ".devflow.json");
        if (existsSync(configPath)) {
            const overwrite = await confirm({
                message: ".devflow.json already exists. Overwrite?",
                default: false,
            });
            if (!overwrite) {
                console.log("Aborted.");
                process.exit(0);
            }
        }
        console.log("\n  devflow setup\n");
        // 1. Ticket base URL
        const ticketBaseUrl = await input({
            message: "Ticket base URL (e.g., https://github.com/org/repo/issues):",
        });
        // 2. Scopes
        console.log("\nLet's define your project scopes for commits.");
        console.log("Add scopes one at a time. Press Enter with empty name to finish.\n");
        const scopes = [];
        let addingScopes = true;
        while (addingScopes) {
            const value = await input({
                message: `Scope name${scopes.length > 0 ? " (blank to finish)" : ""}:`,
            });
            if (!value.trim()) {
                if (scopes.length === 0) {
                    const useDefaults = await confirm({
                        message: "No scopes added. Use defaults (core, ui, api, config, deps, ci)?",
                        default: true,
                    });
                    if (useDefaults) {
                        scopes.push({ value: "core", description: "Core functionality" }, { value: "ui", description: "UI components" }, { value: "api", description: "API layer" }, { value: "config", description: "Configuration" }, { value: "deps", description: "Dependencies" }, { value: "ci", description: "CI/CD" });
                    }
                }
                addingScopes = false;
            }
            else {
                const description = await input({
                    message: `Description for "${value.trim()}":`,
                });
                scopes.push({
                    value: value.trim().toLowerCase(),
                    description: description.trim() || value.trim(),
                });
            }
        }
        // 3. Checklist
        const customizeChecklist = await confirm({
            message: "Customize PR checklist items?",
            default: false,
        });
        let checklist = [...DEFAULT_CHECKLIST];
        if (customizeChecklist) {
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
                }
                else {
                    checklist.push(item.trim());
                }
            }
        }
        // Write .devflow.json
        const config = {
            scopes,
            checklist,
        };
        if (ticketBaseUrl.trim()) {
            config.ticketBaseUrl = ticketBaseUrl.trim();
        }
        writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
        console.log("\n✓ Created .devflow.json");
        // 4. Add scripts to package.json
        const pkg = readPackageJson(cwd);
        if (pkg) {
            const addScripts = await confirm({
                message: "Add commit/branch/pr scripts to package.json?",
                default: true,
            });
            if (addScripts) {
                const scripts = (pkg.scripts || {});
                scripts.commit = "devflow commit";
                scripts.branch = "devflow branch";
                scripts.pr = "devflow pr";
                pkg.scripts = scripts;
                writePackageJson(cwd, pkg);
                console.log("✓ Added scripts to package.json");
            }
        }
        // 5. Commitlint setup
        const setupCommitlint = await confirm({
            message: "Set up commitlint for the devflow commit format?",
            default: true,
        });
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
            const installCommitlint = await confirm({
                message: "Install @commitlint/cli and @commitlint/config-conventional?",
                default: true,
            });
            if (installCommitlint) {
                console.log("Installing commitlint...");
                try {
                    execSync("npm install -D @commitlint/cli @commitlint/config-conventional", {
                        cwd,
                        stdio: "inherit",
                    });
                    console.log("✓ Installed commitlint");
                }
                catch {
                    console.log("⚠ Failed to install commitlint. Run manually:");
                    console.log("  npm install -D @commitlint/cli @commitlint/config-conventional");
                }
            }
        }
        // 6. Husky setup
        const setupHusky = await confirm({
            message: "Set up husky with a commit-msg hook?",
            default: true,
        });
        if (setupHusky) {
            // Install husky
            const installHusky = await confirm({
                message: "Install husky?",
                default: true,
            });
            if (installHusky) {
                console.log("Installing husky...");
                try {
                    execSync("npm install -D husky", { cwd, stdio: "inherit" });
                    execSync("npx husky init", { cwd, stdio: "inherit" });
                    console.log("✓ Installed and initialized husky");
                }
                catch {
                    console.log("⚠ Failed to install husky. Run manually:");
                    console.log("  npm install -D husky && npx husky init");
                }
            }
            // Create commit-msg hook
            const huskyDir = resolve(cwd, ".husky");
            if (!existsSync(huskyDir)) {
                mkdirSync(huskyDir, { recursive: true });
            }
            const commitMsgHook = `npx --no -- commitlint --edit $1 || {
  echo ""
  echo "  Commit message does not follow the required format."
  echo "  Use: npm run commit"
  echo ""
  exit 1
}
`;
            writeFileSync(resolve(huskyDir, "commit-msg"), commitMsgHook);
            console.log("✓ Created .husky/commit-msg hook");
            // Add prepare script
            const updatedPkg = readPackageJson(cwd);
            if (updatedPkg) {
                const scripts = (updatedPkg.scripts || {});
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
        // 8. Summary
        console.log("\n  Setup complete!\n");
        console.log("Usage:");
        console.log("  npm run branch    Create a new branch");
        console.log("  npm run commit    Create a conventional commit");
        console.log("  npm run pr        Create or update a PR");
        console.log("  devflow status    Show branch and PR info");
        console.log("  devflow doctor    Verify setup");
        console.log("");
    }
    catch (error) {
        if (error.name === "ExitPromptError") {
            console.log("\nCancelled.");
            process.exit(0);
        }
        process.exit(1);
    }
}
//# sourceMappingURL=init.js.map