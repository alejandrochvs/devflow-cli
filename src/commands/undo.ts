import { confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { bold, dim, green, yellow } from "../colors.js";

export interface UndoOptions {
  dryRun?: boolean;
  yes?: boolean;
}

export async function undoCommand(options: UndoOptions = {}): Promise<void> {
  try {
    // Check if there are commits to undo
    try {
      execSync("git log -1 --format=%H", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] });
    } catch {
      console.log("No commits to undo.");
      return;
    }

    const lastMessage = execSync("git log -1 --format=%s", { encoding: "utf-8" }).trim();
    const lastFiles = execSync("git diff-tree --no-commit-id --name-only -r HEAD", { encoding: "utf-8" }).trim();

    console.log(`\n${dim("───")} ${bold("Undo Last Commit")} ${dim("───")}\n`);
    console.log(`${dim("Message:")} ${yellow(lastMessage)}`);
    if (lastFiles) {
      console.log(`${dim("Files:")}`);
      lastFiles.split("\n").forEach((f) => console.log(`  ${f}`));
    }
    console.log(`\n${dim("Changes will be kept staged (soft reset).")}\n`);

    if (options.dryRun) {
      console.log(dim("[dry-run] No undo performed."));
      return;
    }

    // Confirm (skip if --yes)
    if (!options.yes) {
      const confirmed = await confirm({
        message: "Undo this commit? (changes will remain staged)",
        default: true,
      });

      if (!confirmed) {
        console.log("Aborted.");
        return;
      }
    }

    execSync("git reset --soft HEAD~1", { stdio: "inherit" });
    console.log(green("✓ Commit undone. Changes are staged."));
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
