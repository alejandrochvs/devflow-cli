import { select, input, confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { bold, dim, green, cyan, yellow, red } from "../colors.js";
import {
  selectWithBack,
  inputWithBack,
  confirmWithBack,
  BACK_VALUE,
} from "../prompts.js";

export interface WorktreeOptions {
  action?: string;
  branch?: string;
  path?: string;
  yes?: boolean;
}

interface Worktree {
  path: string;
  branch: string;
  bare: boolean;
}

function listWorktrees(): Worktree[] {
  try {
    const result = execSync("git worktree list --porcelain", { encoding: "utf-8" }).trim();
    if (!result) return [];

    const trees: Worktree[] = [];
    let current: Partial<Worktree> = {};

    for (const line of result.split("\n")) {
      if (line.startsWith("worktree ")) {
        if (current.path) trees.push(current as Worktree);
        current = { path: line.substring(9), bare: false };
      } else if (line.startsWith("branch ")) {
        current.branch = line.substring(7).replace("refs/heads/", "");
      } else if (line === "bare") {
        current.bare = true;
      }
    }
    if (current.path) trees.push(current as Worktree);
    return trees;
  } catch {
    return [];
  }
}

function getRepoRoot(): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
}

export async function worktreeCommand(options: WorktreeOptions = {}): Promise<void> {
  try {
    const trees = listWorktrees();

    console.log(`\n${dim("───")} ${bold("Worktrees")} ${dim("───")}\n`);

    if (trees.length > 0) {
      for (const tree of trees) {
        const isCurrent = tree.path === getRepoRoot();
        const marker = isCurrent ? cyan("● ") : "  ";
        console.log(`${marker}${tree.branch || dim("(bare)")} ${dim(`→ ${tree.path}`)}`);
      }
      console.log("");
    }

    // Handle list action (just show and exit)
    if (options.action === "list") {
      return;
    }

    // Step-based flow with back navigation
    type StepName = "action" | "execute" | "done";
    let currentStep: StepName = "action";
    let selectedAction: string = options.action || "";

    // State for add/remove
    let branchName: string = options.branch || "";
    let worktreePath: string = options.path || "";

    // If action provided via flag, skip to execute
    if (options.action) {
      if (!["add", "remove", "list"].includes(options.action)) {
        console.error(`Invalid action: ${options.action}. Use: add, remove, or list`);
        process.exit(1);
      }
      currentStep = "execute";
    }

    while (currentStep !== "done") {
      switch (currentStep) {
        case "action": {
          const result = await selectWithBack({
            message: "Action:",
            choices: [
              { value: "add", name: "Add a new worktree" },
              ...(trees.length > 1
                ? [{ value: "remove", name: "Remove a worktree" }]
                : []),
              { value: "done", name: "Done" },
            ],
            showBack: false, // First step
          });

          if (result === BACK_VALUE) {
            // Can't go back from first step
          } else if (result === "done") {
            currentStep = "done";
          } else {
            selectedAction = result;
            currentStep = "execute";
          }
          break;
        }

        case "execute": {
          if (selectedAction === "add") {
            // Get branch from flag or prompt
            if (!options.branch) {
              const branchResult = await inputWithBack({
                message: "Branch name for new worktree:",
                default: branchName || undefined,
                validate: (val) => val.trim().length > 0 || "Branch name is required",
                showBack: !options.action,
              });

              if (branchResult === BACK_VALUE) {
                currentStep = "action";
                break;
              }
              branchName = branchResult;
            } else {
              branchName = options.branch;
            }

            if (!branchName.trim()) {
              console.error("Branch name is required.");
              process.exit(1);
            }

            const root = getRepoRoot();
            const defaultPath = `${root}-${branchName.trim().replace(/\//g, "-")}`;

            // Get path from flag or prompt
            if (!options.path) {
              const pathResult = await inputWithBack({
                message: "Worktree path:",
                default: worktreePath || defaultPath,
                showBack: true,
              });

              if (pathResult === BACK_VALUE) {
                // Go back to branch prompt if not provided via flag
                if (!options.branch) {
                  break; // Stay on execute to re-prompt branch
                } else {
                  currentStep = "action";
                  break;
                }
              }
              worktreePath = pathResult;
            } else {
              worktreePath = options.path;
            }

            // Check if branch exists
            let branchExists = false;
            try {
              execSync(`git rev-parse --verify ${branchName.trim()}`, { stdio: "ignore" });
              branchExists = true;
            } catch {
              // Branch doesn't exist
            }

            const createFlag = branchExists ? "" : "-b ";
            try {
              execSync(`git worktree add ${JSON.stringify(worktreePath.trim())} ${createFlag}${branchName.trim()}`, {
                stdio: "inherit",
              });
              console.log(green(`✓ Created worktree at ${worktreePath.trim()}`));
              console.log(dim(`  cd ${worktreePath.trim()}`));
            } catch {
              console.log(red("✗ Failed to create worktree"));
            }
            currentStep = "done";
          } else if (selectedAction === "remove") {
            const removable = trees.filter((t) => t.path !== getRepoRoot() && !t.bare);

            if (removable.length === 0) {
              console.log("No removable worktrees.");
              currentStep = "done";
              break;
            }

            // Get path from flag or prompt
            let selected: string;
            if (options.path) {
              const found = removable.find((t) => t.path === options.path);
              if (!found) {
                console.error(`Worktree not found: ${options.path}`);
                process.exit(1);
              }
              selected = options.path;
            } else {
              const selectResult = await selectWithBack({
                message: "Select worktree to remove:",
                choices: removable.map((t) => ({
                  value: t.path,
                  name: `${t.branch} ${dim(`→ ${t.path}`)}`,
                })),
                showBack: !options.action,
              });

              if (selectResult === BACK_VALUE) {
                currentStep = "action";
                break;
              }
              selected = selectResult;
            }

            // Confirm unless --yes
            const confirmed = options.yes || await confirmWithBack({
              message: `Remove worktree at ${selected}?`,
              default: false,
              showBack: true,
            });

            if (confirmed === BACK_VALUE) {
              currentStep = "action";
              break;
            }

            if (confirmed === true) {
              try {
                execSync(`git worktree remove ${JSON.stringify(selected)}`, { stdio: "inherit" });
                console.log(green("✓ Worktree removed"));
              } catch {
                const force = options.yes || await confirmWithBack({
                  message: "Worktree has changes. Force remove?",
                  default: false,
                  showBack: false,
                });
                if (force === true) {
                  execSync(`git worktree remove --force ${JSON.stringify(selected)}`, { stdio: "inherit" });
                  console.log(yellow("✓ Force removed worktree"));
                }
              }
            }
            currentStep = "done";
          } else {
            currentStep = "done";
          }
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
