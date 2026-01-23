import { confirm, checkbox } from "@inquirer/prompts";
import { execSync } from "child_process";
import { bold, dim, green, red, yellow, gray } from "../colors.js";
import { deleteTestPlan } from "../test-plan.js";

function getMergedBranches(): string[] {
  try {
    const result = execSync("git branch --merged main", { encoding: "utf-8" }).trim();
    return result
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b && !b.startsWith("*") && b !== "main" && b !== "master");
  } catch {
    return [];
  }
}

function getGoneBranches(): string[] {
  try {
    // Branches whose remote tracking branch is gone
    const result = execSync("git branch -vv", { encoding: "utf-8" }).trim();
    return result
      .split("\n")
      .filter((line) => line.includes(": gone]"))
      .map((line) => line.trim().split(/\s+/)[0])
      .filter((b) => b && b !== "*");
  } catch {
    return [];
  }
}

export async function cleanupCommand(options: { dryRun?: boolean } = {}): Promise<void> {
  try {
    console.log(`\n${dim("───")} ${bold("Branch Cleanup")} ${dim("───")}\n`);

    // Fetch latest remote state
    console.log(dim("Fetching remote state..."));
    try {
      execSync("git fetch --prune", { stdio: "ignore" });
    } catch {
      console.log(yellow("⚠ Could not fetch from remote."));
    }

    const merged = getMergedBranches();
    const gone = getGoneBranches();

    // Combine and deduplicate
    const allCandidates = [...new Set([...merged, ...gone])];

    if (allCandidates.length === 0) {
      console.log(green("✓ No branches to clean up."));
      return;
    }

    console.log(`Found ${allCandidates.length} branch(es) that can be removed:\n`);

    const choices = allCandidates.map((b) => {
      const isMerged = merged.includes(b);
      const isGone = gone.includes(b);
      const tags = [];
      if (isMerged) tags.push(green("merged"));
      if (isGone) tags.push(gray("remote gone"));
      return {
        value: b,
        name: `${b} ${dim(`(${tags.join(", ")})`)}`,
      };
    });

    const toDelete = await checkbox({
      message: "Select branches to delete:",
      choices: [
        { value: "__ALL__", name: bold("Delete all") },
        ...choices,
      ],
    });

    if (toDelete.length === 0) {
      console.log("No branches selected.");
      return;
    }

    const branches = toDelete.includes("__ALL__") ? allCandidates : toDelete;

    console.log("");
    for (const branch of branches) {
      if (options.dryRun) {
        console.log(dim(`[dry-run] Would delete: ${branch}`));
      } else {
        try {
          execSync(`git branch -d ${branch}`, { stdio: "ignore" });
          deleteTestPlan(branch);
          console.log(`${green("✓")} Deleted ${branch}`);
        } catch {
          try {
            // Force delete if not fully merged
            const force = await confirm({
              message: `${branch} is not fully merged. Force delete?`,
              default: false,
            });
            if (force) {
              execSync(`git branch -D ${branch}`, { stdio: "ignore" });
              deleteTestPlan(branch);
              console.log(`${yellow("✓")} Force deleted ${branch}`);
            } else {
              console.log(`${dim("  Skipped")} ${branch}`);
            }
          } catch {
            console.log(`${red("✗")} Failed to delete ${branch}`);
          }
        }
      }
    }

    if (options.dryRun) {
      console.log(dim("\n[dry-run] No branches deleted."));
    } else {
      console.log(green(`\n✓ Cleanup complete.`));
    }
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
