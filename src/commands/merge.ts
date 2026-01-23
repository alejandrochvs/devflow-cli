import { select, confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { bold, dim, green, cyan } from "../colors.js";
import { getBranch, checkGhInstalled } from "../git.js";
import { deleteTestPlan } from "../test-plan.js";

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

export async function mergeCommand(options: { dryRun?: boolean } = {}): Promise<void> {
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

    const method = await select({
      message: "Merge method:",
      choices: [
        { value: "squash", name: "Squash and merge (recommended)" },
        { value: "merge", name: "Create a merge commit" },
        { value: "rebase", name: "Rebase and merge" },
      ],
    });

    const deleteBranch = await confirm({
      message: "Delete branch after merge?",
      default: true,
    });

    if (options.dryRun) {
      console.log(dim(`[dry-run] Would ${method} PR #${pr.number}${deleteBranch ? " and delete branch" : ""}`));
      return;
    }

    const confirmed = await confirm({
      message: `${method.charAt(0).toUpperCase() + method.slice(1)} PR #${pr.number}?`,
      default: true,
    });

    if (!confirmed) {
      console.log("Aborted.");
      return;
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
