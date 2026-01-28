import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { confirm } from "@inquirer/prompts";
import { bold, dim, green, yellow } from "../colors.js";
import { loadConfig } from "../config.js";
import { writeVersionInfo, getCliVersion } from "../devflow-version.js";
import {
  confirmWithBack,
  BACK_VALUE,
} from "../prompts.js";

export interface UpdateOptions {
  yes?: boolean;
  dryRun?: boolean;
}

const AI_INSTRUCTIONS_TEMPLATE = `# DevFlow - AI Agent Instructions

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

2. **Commit format:** \`{type}[{ticket}]{breaking}({scope}): {message}\`
   - Example: \`feat[123](auth): add OAuth2 login\`

3. **Branch format:** \`{type}/{ticket}_{description}\`
   - Example: \`feat/123_add-login\`

4. **Before making changes:**
   - Check status: \`devflow status\`
   - Create branch if needed: \`devflow branch\`

5. **After making changes:**
   - Stage files: \`git add <files>\`
   - Commit: \`devflow commit\`
   - When ready: \`devflow pr\`

6. **Use \`--dry-run\` to preview** any command without executing

7. **Back navigation:** Press Escape to return to the previous step

## Non-Interactive Mode (AI-Friendly)

All commands support flags to bypass interactive prompts. Use \`--yes\` to skip confirmations.

### Branch Command
\`\`\`bash
devflow branch --type feat --ticket 123 --description "add-login" --yes
devflow branch --type fix --ticket UNTRACKED --description "typo" --yes
devflow branch --type feat --ticket 456 --description "oauth" --test-plan "Login works|Logout works" --yes
\`\`\`

### Commit Command
\`\`\`bash
devflow commit --type feat --scope auth --message "add OAuth2 login" --all --yes
devflow commit --type fix --message "fix typo" --files "src/app.ts,src/index.ts" --yes
devflow commit --type feat --message "add API" --breaking --breaking-desc "Changes API format" --yes
\`\`\`

### PR Command
\`\`\`bash
devflow pr --title "Add OAuth2 login" --summary "Implements OAuth2 flow" --yes
devflow pr --title "Feature X" --base develop --ready --yes
\`\`\`

### Issue Command
\`\`\`bash
devflow issue --type bug --title "Login crashes on iOS" --body "Steps to reproduce..." --yes
devflow issue --type user-story --json '{"asA":"user","iWant":"to login","soThat":"I can access my account"}' --yes
devflow issue --type task --title "Update deps" --create-branch --branch-desc "update-deps" --yes
\`\`\`

### Amend Command
\`\`\`bash
devflow amend --type fix --message "correct typo" --yes
devflow amend --scope auth --message "add validation" --yes
\`\`\`

### Undo Command
\`\`\`bash
devflow undo --yes
\`\`\`

### Fixup Command
\`\`\`bash
devflow fixup --target abc1234 --all --yes
devflow fixup --target abc1234 --files "src/app.ts" --auto-squash --yes
\`\`\`

### Cleanup Command
\`\`\`bash
devflow cleanup --all --yes
devflow cleanup --branches "feat/old,fix/done" --force --yes
\`\`\`

### Merge Command
\`\`\`bash
devflow merge --method squash --yes
devflow merge --method rebase --yes
\`\`\`

### Stash Command
\`\`\`bash
devflow stash --action save --message "WIP: feature X" --include-untracked
devflow stash --action pop --index 0 --yes
devflow stash --action drop --index 0 --yes
\`\`\`

### Test Plan Command
\`\`\`bash
devflow test-plan --add "Step 1|Step 2|Step 3"
devflow test-plan --replace "New step 1|New step 2"
devflow test-plan --clear
devflow test-plan --show
\`\`\`

### Changelog Command
\`\`\`bash
devflow changelog --version 2.0.0 --yes
\`\`\`

### Review Command
\`\`\`bash
devflow review --pr 123 --action checkout
devflow review --pr 123 --action approve --comment "LGTM!"
devflow review --pr 123 --action comment --comment "Please fix the typo"
devflow review --pr 123 --action request-changes --comment "Needs error handling"
\`\`\`

### Worktree Command
\`\`\`bash
devflow worktree --action list
devflow worktree --action add --branch feat/new-feature --path ../project-new-feature
devflow worktree --action remove --path ../project-old --yes
\`\`\`

### Release Command
\`\`\`bash
devflow release --bump patch --yes
devflow release --bump minor --yes
devflow release --version 2.0.0 --yes
\`\`\`

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

### Fully Automated Workflow (for AI agents)
\`\`\`bash
# Create branch
devflow branch --type feat --ticket 123 --description "add-login" --yes

# Make changes and commit
git add -A
devflow commit --type feat --scope auth --message "add login form" --yes

# Create PR
devflow pr --title "Add login form" --summary "Implements login UI" --yes
\`\`\`
`;

const CLAUDE_MD_SECTION = `
## Non-Interactive Mode

All commands support flags to bypass interactive prompts. Use \`--yes\` to skip confirmations:

\`\`\`bash
# Create branch without prompts
devflow branch --type feat --ticket 123 --description "add-login" --yes

# Commit without prompts
devflow commit --type feat --scope auth --message "add login" --all --yes

# Create PR without prompts
devflow pr --title "Add login" --summary "Implements login flow" --yes
\`\`\`

## Full Documentation

See \`.devflow/AI_INSTRUCTIONS.md\` for complete command reference and workflows.
`;

export async function updateCommand(options: UpdateOptions = {}): Promise<void> {
  try {
    const cwd = process.cwd();
    const devflowDir = resolve(cwd, ".devflow");
    const aiInstructionsPath = resolve(devflowDir, "AI_INSTRUCTIONS.md");
    const claudeMdPath = resolve(cwd, "CLAUDE.md");

    console.log(`\n${dim("───")} ${bold("Update DevFlow Files")} ${dim("───")}\n`);

    const updates: string[] = [];
    const config = loadConfig();

    // Check if .devflow directory exists
    if (!existsSync(devflowDir)) {
      if (options.dryRun) {
        console.log(dim("[dry-run] Would create .devflow directory"));
      } else {
        mkdirSync(devflowDir, { recursive: true });
      }
    }

    // Update AI_INSTRUCTIONS.md
    let updateAiInstructions = true;
    const aiInstructionsExists = existsSync(aiInstructionsPath);

    if (aiInstructionsExists && !options.yes) {
      const result = await confirmWithBack({
        message: "Update .devflow/AI_INSTRUCTIONS.md with latest template?",
        default: true,
        showBack: false, // First interactive step
      });
      updateAiInstructions = result === true;
    }

    if (updateAiInstructions) {
      // Customize template with project-specific formats if config exists
      let template = AI_INSTRUCTIONS_TEMPLATE;
      if (config.commitFormat) {
        template = template.replace(
          "{type}[{ticket}]{breaking}({scope}): {message}",
          config.commitFormat
        );
      }
      if (config.branchFormat) {
        template = template.replace(
          "{type}/{ticket}_{description}",
          config.branchFormat
        );
      }

      if (options.dryRun) {
        console.log(dim(`[dry-run] Would ${aiInstructionsExists ? "update" : "create"} .devflow/AI_INSTRUCTIONS.md`));
      } else {
        writeFileSync(aiInstructionsPath, template);
        updates.push(aiInstructionsExists ? "Updated .devflow/AI_INSTRUCTIONS.md" : "Created .devflow/AI_INSTRUCTIONS.md");
      }
    }

    // Update CLAUDE.md
    if (existsSync(claudeMdPath)) {
      const claudeMd = readFileSync(claudeMdPath, "utf-8");
      const hasNonInteractiveSection = claudeMd.includes("## Non-Interactive Mode");

      if (!hasNonInteractiveSection) {
        let updateClaudeMd = true;

        if (!options.yes) {
          const result = await confirmWithBack({
            message: "Add non-interactive mode section to CLAUDE.md?",
            default: true,
            showBack: false, // Can't go back to previous AI_INSTRUCTIONS update
          });
          updateClaudeMd = result === true;
        }

        if (updateClaudeMd) {
          // Find the best place to insert - before "## Full Documentation" if exists, or at end
          let newContent: string;
          if (claudeMd.includes("## Full Documentation")) {
            newContent = claudeMd.replace("## Full Documentation", CLAUDE_MD_SECTION.trim() + "\n\n## Full Documentation");
          } else {
            newContent = claudeMd.trimEnd() + "\n" + CLAUDE_MD_SECTION;
          }

          if (options.dryRun) {
            console.log(dim("[dry-run] Would add non-interactive section to CLAUDE.md"));
          } else {
            writeFileSync(claudeMdPath, newContent);
            updates.push("Added non-interactive mode section to CLAUDE.md");
          }
        }
      } else {
        console.log(dim("CLAUDE.md already has non-interactive mode section"));
      }
    }

    // Write version file to track when files were last updated
    if (!options.dryRun && updates.length > 0) {
      writeVersionInfo(getCliVersion(), cwd);
      updates.push("Updated .devflow/version.json");
    }

    // Summary
    if (options.dryRun) {
      console.log(dim("[dry-run] Would update .devflow/version.json"));
      console.log(dim("\n[dry-run] No files were modified."));
    } else if (updates.length > 0) {
      console.log("");
      for (const update of updates) {
        console.log(green(`✓ ${update}`));
      }
      console.log("");
    } else {
      console.log(yellow("No updates needed. Files are already up to date."));
    }
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
