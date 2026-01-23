import { select, confirm, checkbox } from "@inquirer/prompts";
import { execSync } from "child_process";
import { bold, dim, green, cyan } from "../colors.js";
import { getDefaultBase, getBranch } from "../git.js";

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

export async function fixupCommand(options: { dryRun?: boolean } = {}): Promise<void> {
  try {
    const branch = getBranch();
    const base = getDefaultBase(branch);
    const commits = getCommitsOnBranch(base);

    if (commits.length < 2) {
      console.log("Need at least 2 commits on the branch to fixup.");
      return;
    }

    // Check for unstaged/staged changes
    const staged = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();
    const unstaged = execSync("git diff --name-only", { encoding: "utf-8" }).trim();
    const untracked = execSync("git ls-files --others --exclude-standard", { encoding: "utf-8" }).trim();

    const hasChanges = staged || unstaged || untracked;

    if (hasChanges) {
      // Stage changes first
      const allChanges = [
        ...unstaged.split("\n").filter(Boolean).map((f) => ({ file: f, label: `M  ${f}` })),
        ...untracked.split("\n").filter(Boolean).map((f) => ({ file: f, label: `?  ${f}` })),
      ];

      if (!staged && allChanges.length > 0) {
        const filesToStage = await checkbox({
          message: "Select files to include in fixup:",
          choices: [
            { value: "__ALL__", name: "Stage all" },
            ...allChanges.map((c) => ({ value: c.file, name: c.label })),
          ],
          required: true,
        });

        if (!options.dryRun) {
          if (filesToStage.includes("__ALL__")) {
            execSync("git add -A");
          } else {
            for (const file of filesToStage) {
              execSync(`git add ${JSON.stringify(file)}`);
            }
          }
        }
      }
    }

    console.log(`\n${dim("───")} ${bold("Fixup Commit")} ${dim("───")}\n`);
    console.log(`${dim("Branch commits (newest first):")}\n`);

    const target = await select({
      message: "Which commit should this fixup apply to?",
      choices: commits.map((c) => ({
        value: c.hash,
        name: `${cyan(c.hash.slice(0, 7))} ${c.message}`,
      })),
    });

    if (options.dryRun) {
      const targetCommit = commits.find((c) => c.hash === target);
      console.log(dim(`[dry-run] Would create fixup for: ${targetCommit?.message}`));
      return;
    }

    // Create fixup commit
    execSync(`git commit --fixup=${target}`, { stdio: "inherit" });
    console.log(green("✓ Fixup commit created."));

    const autoSquash = await confirm({
      message: "Auto-squash now? (interactive rebase)",
      default: false,
    });

    if (autoSquash) {
      execSync(`GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash ${base}`, {
        stdio: "inherit",
        env: { ...process.env, GIT_SEQUENCE_EDITOR: "true" },
      });
      console.log(green("✓ Commits squashed."));
    } else {
      console.log(dim("Run later: git rebase -i --autosquash " + base));
    }
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
