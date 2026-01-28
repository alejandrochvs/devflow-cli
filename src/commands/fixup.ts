import { execSync } from "child_process";
import { bold, dim, green, cyan } from "../colors.js";
import { getDefaultBase, getBranch } from "../git.js";
import {
  selectWithBack,
  confirmWithBack,
  checkboxWithBack,
  BACK_VALUE,
} from "../prompts.js";

function getCommitsOnBranch(base: string): Array<{ hash: string; message: string }> {
  try {
    const log = execSync(`git log ${base}..HEAD --format=%H|%s`, { encoding: "utf-8" }).trim();
    if (!log) return [];
    return log.split("\n").map((line) => {
      const [hash, ...rest] = line.split("|");
      return { hash, message: rest.join("|") };
    });
  } catch {
    return [];
  }
}

export interface FixupOptions {
  dryRun?: boolean;
  target?: string;
  all?: boolean;
  files?: string;
  autoSquash?: boolean;
  yes?: boolean;
}

export async function fixupCommand(options: FixupOptions = {}): Promise<void> {
  try {
    const branch = getBranch();
    const base = getDefaultBase(branch);
    const commits = getCommitsOnBranch(base);

    if (commits.length < 2) {
      console.log("Need at least 2 commits on the branch to fixup.");
      return;
    }

    // Stage files if --all or --files provided (non-interactive)
    if (options.all) {
      if (!options.dryRun) {
        execSync("git add -A");
      }
    } else if (options.files) {
      const filesToStage = options.files.split(",").map((f) => f.trim());
      if (!options.dryRun) {
        for (const file of filesToStage) {
          execSync(`git add ${JSON.stringify(file)}`);
        }
      }
    }

    console.log(`\n${dim("───")} ${bold("Fixup Commit")} ${dim("───")}\n`);

    // Step-based flow with back navigation
    type StepName = "stageFiles" | "selectTarget" | "confirm" | "done";
    let currentStep: StepName = "stageFiles";
    let target: string = "";

    // Determine starting step based on flags
    if (options.target) {
      const found = commits.find((c) => c.hash.startsWith(options.target!) || c.hash === options.target);
      if (!found) {
        console.error(`Commit not found: ${options.target}`);
        process.exit(1);
      }
      target = found.hash;
      currentStep = "confirm";
    } else if (options.all || options.files) {
      // Files already staged via flags, skip to target selection
      currentStep = "selectTarget";
    }

    while (currentStep !== "done") {
      switch (currentStep) {
        case "stageFiles": {
          // Check for unstaged/staged changes
          const staged = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();
          const unstaged = execSync("git diff --name-only", { encoding: "utf-8" }).trim();
          const untracked = execSync("git ls-files --others --exclude-standard", { encoding: "utf-8" }).trim();

          // If already have staged changes, skip to target selection
          if (staged) {
            currentStep = "selectTarget";
            break;
          }

          const allChanges = [
            ...unstaged.split("\n").filter(Boolean).map((f) => ({ file: f, label: `M  ${f}` })),
            ...untracked.split("\n").filter(Boolean).map((f) => ({ file: f, label: `?  ${f}` })),
          ];

          if (allChanges.length === 0) {
            // No changes to stage, go to target selection
            currentStep = "selectTarget";
            break;
          }

          if (options.yes) {
            // Auto-stage all when --yes
            if (!options.dryRun) {
              execSync("git add -A");
            }
            currentStep = "selectTarget";
            break;
          }

          const result = await checkboxWithBack({
            message: "Select files to include in fixup:",
            choices: [
              { value: "__ALL__", name: "Stage all" },
              ...allChanges.map((c) => ({ value: c.file, name: c.label })),
            ],
            required: true,
            showBack: false, // First step
          });

          if (result === BACK_VALUE) {
            // Can't go back from first step
          } else {
            if (result.length === 0) {
              console.log("No files selected. Please select at least one file.");
              break;
            }

            if (!options.dryRun) {
              if (result.includes("__ALL__")) {
                execSync("git add -A");
              } else {
                for (const file of result) {
                  execSync(`git add ${JSON.stringify(file)}`);
                }
              }
            }
            currentStep = "selectTarget";
          }
          break;
        }

        case "selectTarget": {
          console.log(`${dim("Branch commits (newest first):")}\n`);

          // Determine if we can go back (only if we came from stageFiles interactively)
          const canGoBack = !options.all && !options.files && !options.yes;

          const result = await selectWithBack({
            message: "Which commit should this fixup apply to?",
            choices: commits.map((c) => ({
              value: c.hash,
              name: `${cyan(c.hash.slice(0, 7))} ${c.message}`,
            })),
            showBack: canGoBack,
          });

          if (result === BACK_VALUE) {
            // Unstage files before going back
            execSync("git reset HEAD", { stdio: "ignore" });
            currentStep = "stageFiles";
          } else {
            target = result;
            currentStep = "confirm";
          }
          break;
        }

        case "confirm": {
          if (options.dryRun) {
            const targetCommit = commits.find((c) => c.hash === target);
            console.log(dim(`[dry-run] Would create fixup for: ${targetCommit?.message}`));
            return;
          }

          // Create fixup commit
          execSync(`git commit --fixup=${target}`, { stdio: "inherit" });
          console.log(green("✓ Fixup commit created."));

          // Handle auto-squash from flag or prompt
          let autoSquash: boolean;
          if (options.autoSquash !== undefined) {
            autoSquash = options.autoSquash;
          } else if (options.yes) {
            autoSquash = false;
          } else {
            const squashResult = await confirmWithBack({
              message: "Auto-squash now? (interactive rebase)",
              default: false,
              showBack: false, // Can't go back after fixup commit created
            });
            autoSquash = squashResult === true;
          }

          if (autoSquash) {
            execSync(`GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash ${base}`, {
              stdio: "inherit",
              env: { ...process.env, GIT_SEQUENCE_EDITOR: "true" },
            });
            console.log(green("✓ Commits squashed."));
          } else {
            console.log(dim("Run later: git rebase -i --autosquash " + base));
          }
          currentStep = "done";
          break;
        }

        default:
          currentStep = "done";
      }
    }
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
