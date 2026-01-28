import { select, confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { bold, dim, green, cyan } from "../colors.js";
import { getBranch, checkGhInstalled } from "../git.js";
import { deleteTestPlan } from "../test-plan.js";
import {
  selectWithBack,
  confirmWithBack,
  BACK_VALUE,
} from "../prompts.js";

function getPrForBranch(): { number: number; url: string; title: string; state: string } | undefined {
  try {
    const result = execSync("gh pr view --json number,url,title,state", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    return JSON.parse(result);
  } catch {
    return undefined;
  }
}

export interface MergeOptions {
  dryRun?: boolean;
  method?: string;
  yes?: boolean;
}

export async function mergeCommand(options: MergeOptions = {}): Promise<void> {
  try {
    checkGhInstalled();

    const branch = getBranch();
    const pr = getPrForBranch();

    if (!pr) {
      console.log("No PR found for the current branch.");
      console.log(dim("Create one with: devflow pr"));
      return;
    }

    if (pr.state !== "OPEN") {
      console.log(`PR #${pr.number} is already ${pr.state.toLowerCase()}.`);
      return;
    }

    console.log(`\n${dim("───")} ${bold("Merge PR")} ${dim("───")}\n`);
    console.log(`${dim("PR:")}     ${cyan(`#${pr.number}`)} ${pr.title}`);
    console.log(`${dim("Branch:")} ${cyan(branch)}`);
    console.log(`${dim("URL:")}    ${dim(pr.url)}\n`);

    // Step-based flow with back navigation
    type StepName = "method" | "deleteBranch" | "confirm" | "execute";
    let currentStep: StepName = "method";
    let method: string = options.method || "";
    let deleteBranch: boolean = options.yes ? true : false;

    // Validate and skip if method provided
    if (options.method) {
      if (!["squash", "merge", "rebase"].includes(options.method)) {
        console.error(`Invalid merge method: ${options.method}. Use: squash, merge, or rebase`);
        process.exit(1);
      }
      currentStep = "deleteBranch";
    }

    while (currentStep !== "execute") {
      switch (currentStep) {
        case "method": {
          const result = await selectWithBack({
            message: "Merge method:",
            choices: [
              { value: "squash", name: "Squash and merge (recommended)" },
              { value: "merge", name: "Create a merge commit" },
              { value: "rebase", name: "Rebase and merge" },
            ],
            default: method || "squash",
            showBack: false, // First step
          });

          if (result === BACK_VALUE) {
            // Can't go back from first step
          } else {
            method = result;
            currentStep = "deleteBranch";
          }
          break;
        }

        case "deleteBranch": {
          if (options.yes) {
            deleteBranch = true;
            currentStep = "confirm";
            break;
          }

          const result = await confirmWithBack({
            message: "Delete branch after merge?",
            default: true,
            showBack: !options.method,
          });

          if (result === BACK_VALUE) {
            currentStep = "method";
          } else {
            deleteBranch = result === true;
            currentStep = "confirm";
          }
          break;
        }

        case "confirm": {
          if (options.dryRun) {
            console.log(dim(`[dry-run] Would ${method} PR #${pr.number}${deleteBranch ? " and delete branch" : ""}`));
            return;
          }

          // Confirm (skip if --yes)
          if (!options.yes) {
            const confirmResult = await selectWithBack({
              message: `${method.charAt(0).toUpperCase() + method.slice(1)} PR #${pr.number}?`,
              choices: [
                { value: "yes", name: "Yes, merge" },
                { value: "no", name: "No, abort" },
              ],
              default: "yes",
              showBack: true,
            });

            if (confirmResult === BACK_VALUE) {
              currentStep = "deleteBranch";
              break;
            }

            if (confirmResult !== "yes") {
              console.log("Aborted.");
              return;
            }
          }
          currentStep = "execute";
          break;
        }

        default:
          currentStep = "execute";
      }
    }

    const deleteFlag = deleteBranch ? " --delete-branch" : "";
    execSync(`gh pr merge ${pr.number} --${method}${deleteFlag}`, { stdio: "inherit" });

    console.log(green(`\n✓ PR #${pr.number} merged via ${method}.`));

    if (deleteBranch) {
      deleteTestPlan(branch);
      // Switch to main after merge
      try {
        execSync("git checkout main", { stdio: "inherit" });
        execSync("git pull", { stdio: "inherit" });
        console.log(green("✓ Switched to main and pulled latest."));
      } catch {
        // May not have main locally
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
