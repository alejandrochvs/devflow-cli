import { select, input, confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { bold, dim, green, cyan, yellow } from "../colors.js";
import { getBranch } from "../git.js";
import {
  selectWithBack,
  inputWithBack,
  confirmWithBack,
  BACK_VALUE,
} from "../prompts.js";

interface StashEntry {
  index: number;
  branch: string;
  message: string;
  raw: string;
}

function listStashes(): StashEntry[] {
  try {
    const result = execSync("git stash list", { encoding: "utf-8" }).trim();
    if (!result) return [];
    return result.split("\n").map((line, i) => {
      const match = line.match(/^stash@\{(\d+)\}: (?:On (.+?): )?(.+)$/);
      if (match) {
        return { index: parseInt(match[1], 10), branch: match[2] || "", message: match[3], raw: line };
      }
      return { index: i, branch: "", message: line, raw: line };
    });
  } catch {
    return [];
  }
}

function hasChanges(): boolean {
  try {
    const status = execSync("git status --porcelain", { encoding: "utf-8" }).trim();
    return status.length > 0;
  } catch {
    return false;
  }
}

export interface StashOptions {
  action?: string;
  message?: string;
  index?: string;
  includeUntracked?: boolean;
  yes?: boolean;
}

export async function stashCommand(options: StashOptions = {}): Promise<void> {
  try {
    const stashes = listStashes();
    const dirty = hasChanges();

    // Show current state
    console.log(`\n${dim("───")} ${bold("Stash")} ${dim("───")}\n`);
    if (stashes.length > 0) {
      console.log(`${dim("Stashes:")} ${stashes.length}`);
      for (const s of stashes.slice(0, 5)) {
        console.log(`  ${dim(`[${s.index}]`)} ${s.message} ${s.branch ? dim(`(${s.branch})`) : ""}`);
      }
      if (stashes.length > 5) {
        console.log(dim(`  ... and ${stashes.length - 5} more`));
      }
      console.log("");
    }

    // Step-based flow with back navigation
    type StepName = "action" | "execute" | "done";
    let currentStep: StepName = "action";
    let selectedAction: string = options.action || "";
    let stashTarget: number | undefined;
    let stashMessage: string = "";
    let includeUntracked: boolean = options.includeUntracked ?? true;

    // If action provided via flag, skip to execute
    if (options.action) {
      currentStep = "execute";
    }

    while (currentStep !== "done") {
      switch (currentStep) {
        case "action": {
          const choices: Array<{ value: string; name: string }> = [];
          if (dirty) {
            choices.push({ value: "save", name: "Save current changes to stash" });
          }
          if (stashes.length > 0) {
            choices.push({ value: "pop", name: "Pop a stash (apply and remove)" });
            choices.push({ value: "apply", name: "Apply a stash (keep in list)" });
            choices.push({ value: "drop", name: "Drop a stash" });
            choices.push({ value: "show", name: "Show stash diff" });
          }

          if (choices.length === 0) {
            console.log("No stashes and no changes to stash.");
            return;
          }

          const result = await selectWithBack({
            message: "Action:",
            choices,
            showBack: false, // First step
          });

          if (result === BACK_VALUE) {
            // Can't go back from first step
          } else {
            selectedAction = result;
            currentStep = "execute";
          }
          break;
        }

        case "execute": {
          switch (selectedAction) {
            case "save": {
              const branch = getBranch();
              const defaultMsg = `WIP on ${branch}`;

              if (options.message) {
                stashMessage = options.message;
              } else if (options.yes) {
                stashMessage = defaultMsg;
              } else {
                const msgResult = await inputWithBack({
                  message: "Stash message:",
                  default: stashMessage || defaultMsg,
                  showBack: !options.action,
                });

                if (msgResult === BACK_VALUE) {
                  currentStep = "action";
                  break;
                }
                stashMessage = msgResult;
              }

              if (options.includeUntracked === undefined && !options.yes) {
                const untrackedResult = await confirmWithBack({
                  message: "Include untracked files?",
                  default: includeUntracked,
                  showBack: true,
                });

                if (untrackedResult === BACK_VALUE) {
                  // Stay on execute to re-prompt message
                  break;
                }
                includeUntracked = untrackedResult === true;
              }

              const untrackedFlag = includeUntracked ? " --include-untracked" : "";
              execSync(`git stash push -m ${JSON.stringify(stashMessage)}${untrackedFlag}`, {
                stdio: "inherit",
              });
              console.log(green(`✓ Stashed: ${stashMessage}`));
              currentStep = "done";
              break;
            }

            case "pop":
            case "apply": {
              if (options.index !== undefined) {
                stashTarget = parseInt(options.index, 10);
              } else {
                const target = await selectStashWithBack(stashes, `Select stash to ${selectedAction}:`, !options.action);
                if (target === BACK_VALUE) {
                  currentStep = "action";
                  break;
                }
                stashTarget = target as number;
              }

              try {
                execSync(`git stash ${selectedAction} stash@{${stashTarget}}`, { stdio: "inherit" });
                console.log(green(`✓ ${selectedAction === "pop" ? "Popped" : "Applied"} stash@{${stashTarget}}`));
              } catch {
                console.log(yellow("⚠ Stash could not be applied cleanly. Resolve conflicts manually."));
              }
              currentStep = "done";
              break;
            }

            case "drop": {
              if (options.index !== undefined) {
                stashTarget = parseInt(options.index, 10);
              } else {
                const target = await selectStashWithBack(stashes, "Select stash to drop:", !options.action);
                if (target === BACK_VALUE) {
                  currentStep = "action";
                  break;
                }
                stashTarget = target as number;
              }

              const confirmed = options.yes || await confirmWithBack({
                message: `Drop stash@{${stashTarget}}? This cannot be undone.`,
                default: false,
                showBack: true,
              });

              if (confirmed === BACK_VALUE) {
                currentStep = "action";
                break;
              }

              if (confirmed === true) {
                execSync(`git stash drop stash@{${stashTarget}}`, { stdio: "ignore" });
                console.log(green(`✓ Dropped stash@{${stashTarget}}`));
              }
              currentStep = "done";
              break;
            }

            case "show": {
              if (options.index !== undefined) {
                stashTarget = parseInt(options.index, 10);
              } else {
                const target = await selectStashWithBack(stashes, "Select stash to show:", !options.action);
                if (target === BACK_VALUE) {
                  currentStep = "action";
                  break;
                }
                stashTarget = target as number;
              }

              const diff = execSync(`git stash show -p stash@{${stashTarget}}`, { encoding: "utf-8" });
              console.log(diff);
              currentStep = "done";
              break;
            }

            default:
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

async function selectStash(stashes: StashEntry[], message: string): Promise<number | undefined> {
  return select({
    message,
    choices: stashes.map((s) => ({
      value: s.index,
      name: `${dim(`[${s.index}]`)} ${s.message} ${s.branch ? dim(`(${s.branch})`) : ""}`,
    })),
  });
}

async function selectStashWithBack(stashes: StashEntry[], message: string, showBack: boolean): Promise<number | typeof BACK_VALUE> {
  return selectWithBack({
    message,
    choices: stashes.map((s) => ({
      value: s.index,
      name: `${dim(`[${s.index}]`)} ${s.message} ${s.branch ? dim(`(${s.branch})`) : ""}`,
    })),
    showBack,
  });
}
