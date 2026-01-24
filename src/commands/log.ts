import { select } from "@inquirer/prompts";
import { execSync } from "child_process";
import { bold, dim, green, cyan, yellow } from "../colors.js";
import { getDefaultBase, getBranch } from "../git.js";

interface LogEntry {
  hash: string;
  shortHash: string;
  subject: string;
  author: string;
  date: string;
}

function getLog(base: string, limit: number = 20): LogEntry[] {
  try {
    const format = "%H|%h|%s|%an|%ar";
    const range = base ? `${base}..HEAD` : `HEAD~${limit}..HEAD`;
    const result = execSync(`git log ${range} --pretty=format:"${format}" -${limit}`, {
      encoding: "utf-8",
    }).trim();
    if (!result) return [];
    return result.split("\n").map((line) => {
      const [hash, shortHash, subject, author, date] = line.split("|");
      return { hash, shortHash, subject, author, date };
    });
  } catch {
    return [];
  }
}

export async function logCommand(): Promise<void> {
  try {
    const branch = getBranch();
    const base = getDefaultBase(branch);
    const entries = getLog(base);

    if (entries.length === 0) {
      console.log("No commits on this branch.");
      return;
    }

    console.log(`\n${dim("───")} ${bold("Log")} ${dim(`(${branch})`)} ${dim("───")}\n`);

    const selected = await select({
      message: "Select a commit:",
      choices: [
        ...entries.map((e) => ({
          value: e.hash,
          name: `${cyan(e.shortHash)} ${e.subject} ${dim(`(${e.author}, ${e.date})`)}`,
        })),
        { value: "__done__", name: dim("Done") },
      ],
    });

    if (selected === "__done__") return;

    const entry = entries.find((e) => e.hash === selected)!;

    // Show commit detail
    const detail = execSync(`git show --stat ${selected} --format="%B"`, {
      encoding: "utf-8",
    }).trim();
    console.log(`\n${dim(detail)}\n`);

    const action = await select({
      message: "Action:",
      choices: [
        { value: "cherry-pick", name: "Cherry-pick to current branch" },
        { value: "revert", name: "Revert this commit" },
        { value: "fixup", name: "Create fixup for this commit" },
        { value: "diff", name: "Show full diff" },
        { value: "done", name: "Done" },
      ],
    });

    switch (action) {
      case "cherry-pick":
        execSync(`git cherry-pick ${selected}`, { stdio: "inherit" });
        console.log(green(`✓ Cherry-picked ${entry.shortHash}`));
        break;

      case "revert":
        execSync(`git revert ${selected}`, { stdio: "inherit" });
        console.log(green(`✓ Reverted ${entry.shortHash}`));
        break;

      case "fixup":
        execSync(`git commit --fixup=${selected}`, { stdio: "inherit" });
        console.log(green(`✓ Created fixup for ${entry.shortHash}`));
        break;

      case "diff": {
        const diff = execSync(`git show ${selected}`, { encoding: "utf-8" });
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
