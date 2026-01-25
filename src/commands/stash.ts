import { select, input, confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { bold, dim, green, cyan, yellow } from "../colors.js";
import { getBranch } from "../git.js";

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

    // Get action from flag or prompt
    let action: string;
    if (options.action) {
      action = options.action;
    } else {
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

      action = await select({
        message: "Action:",
        choices,
      });
    }

    switch (action) {
      case "save": {
        const branch = getBranch();
        const defaultMsg = `WIP on ${branch}`;
        const message = options.message || (options.yes ? defaultMsg : await input({
          message: "Stash message:",
          default: defaultMsg,
        }));

        const includeUntracked = options.includeUntracked !== undefined
          ? options.includeUntracked
          : (options.yes ? true : await confirm({
              message: "Include untracked files?",
              default: true,
            }));

        const untrackedFlag = includeUntracked ? " --include-untracked" : "";
        execSync(`git stash push -m ${JSON.stringify(message)}${untrackedFlag}`, {
          stdio: "inherit",
        });
        console.log(green(`✓ Stashed: ${message}`));
        break;
      }

      case "pop":
      case "apply": {
        let target: number | undefined;
        if (options.index !== undefined) {
          target = parseInt(options.index, 10);
        } else {
          target = await selectStash(stashes, `Select stash to ${action}:`);
        }
        if (target === undefined) break;

        try {
          execSync(`git stash ${action} stash@{${target}}`, { stdio: "inherit" });
          console.log(green(`✓ ${action === "pop" ? "Popped" : "Applied"} stash@{${target}}`));
        } catch {
          console.log(yellow("⚠ Stash could not be applied cleanly. Resolve conflicts manually."));
        }
        break;
      }

      case "drop": {
        let target: number | undefined;
        if (options.index !== undefined) {
          target = parseInt(options.index, 10);
        } else {
          target = await selectStash(stashes, "Select stash to drop:");
        }
        if (target === undefined) break;

        const confirmed = options.yes || await confirm({
          message: `Drop stash@{${target}}? This cannot be undone.`,
          default: false,
        });
        if (confirmed) {
          execSync(`git stash drop stash@{${target}}`, { stdio: "ignore" });
          console.log(green(`✓ Dropped stash@{${target}}`));
        }
        break;
      }

      case "show": {
        let target: number | undefined;
        if (options.index !== undefined) {
          target = parseInt(options.index, 10);
        } else {
          target = await selectStash(stashes, "Select stash to show:");
        }
        if (target === undefined) break;

        const diff = execSync(`git stash show -p stash@{${target}}`, { encoding: "utf-8" });
        console.log(diff);
        break;
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
