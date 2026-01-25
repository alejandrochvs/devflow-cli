import { select, input, confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { bold, dim, green, cyan, yellow, red } from "../colors.js";

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

    // Get action from flag or prompt
    let action: string;
    if (options.action) {
      if (!["add", "remove", "list"].includes(options.action)) {
        console.error(`Invalid action: ${options.action}. Use: add, remove, or list`);
        process.exit(1);
      }
      action = options.action;
    } else {
      action = await select({
        message: "Action:",
        choices: [
          { value: "add", name: "Add a new worktree" },
          ...(trees.length > 1
            ? [{ value: "remove", name: "Remove a worktree" }]
            : []),
          { value: "done", name: "Done" },
        ],
      });
    }

    if (action === "add") {
      // Get branch from flag or prompt
      const branch = options.branch ?? await input({
        message: "Branch name for new worktree:",
        validate: (val) => val.trim().length > 0 || "Branch name is required",
      });

      if (!branch.trim()) {
        console.error("Branch name is required.");
        process.exit(1);
      }

      const root = getRepoRoot();
      const defaultPath = `${root}-${branch.trim().replace(/\//g, "-")}`;

      // Get path from flag or prompt
      const worktreePath = options.path ?? await input({
        message: "Worktree path:",
        default: defaultPath,
      });

      // Check if branch exists
      let branchExists = false;
      try {
        execSync(`git rev-parse --verify ${branch.trim()}`, { stdio: "ignore" });
        branchExists = true;
      } catch {
        // Branch doesn't exist
      }

      const createFlag = branchExists ? "" : "-b ";
      try {
        execSync(`git worktree add ${JSON.stringify(worktreePath.trim())} ${createFlag}${branch.trim()}`, {
          stdio: "inherit",
        });
        console.log(green(`✓ Created worktree at ${worktreePath.trim()}`));
        console.log(dim(`  cd ${worktreePath.trim()}`));
      } catch {
        console.log(red("✗ Failed to create worktree"));
      }
    } else if (action === "remove") {
      const removable = trees.filter((t) => t.path !== getRepoRoot() && !t.bare);

      if (removable.length === 0) {
        console.log("No removable worktrees.");
        return;
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
        selected = await select({
          message: "Select worktree to remove:",
          choices: removable.map((t) => ({
            value: t.path,
            name: `${t.branch} ${dim(`→ ${t.path}`)}`,
          })),
        });
      }

      // Confirm unless --yes
      const confirmed = options.yes || await confirm({
        message: `Remove worktree at ${selected}?`,
        default: false,
      });

      if (confirmed) {
        try {
          execSync(`git worktree remove ${JSON.stringify(selected)}`, { stdio: "inherit" });
          console.log(green("✓ Worktree removed"));
        } catch {
          const force = options.yes || await confirm({
            message: "Worktree has changes. Force remove?",
            default: false,
          });
          if (force) {
            execSync(`git worktree remove --force ${JSON.stringify(selected)}`, { stdio: "inherit" });
            console.log(yellow("✓ Force removed worktree"));
          }
        }
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
