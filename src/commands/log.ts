import { execSync } from "child_process";
import { bold, dim, green, cyan, yellow } from "../colors.js";
import { getDefaultBase, getBranch } from "../git.js";
import { selectWithBack, BACK_VALUE } from "../prompts.js";

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

    // Step-based flow with back navigation
    type StepName = "selectCommit" | "action" | "done";
    let currentStep: StepName = "selectCommit";
    let selectedHash: string = "";

    while (currentStep !== "done") {
      switch (currentStep) {
        case "selectCommit": {
          const result = await selectWithBack({
            message: "Select a commit:",
            choices: [
              ...entries.map((e) => ({
                value: e.hash,
                name: `${cyan(e.shortHash)} ${e.subject} ${dim(`(${e.author}, ${e.date})`)}`,
              })),
              { value: "__done__", name: dim("Done") },
            ],
            showBack: false, // First step
          });

          if (result === BACK_VALUE) {
            // Can't go back from first step
          } else if (result === "__done__") {
            currentStep = "done";
          } else {
            selectedHash = result;
            currentStep = "action";
          }
          break;
        }

        case "action": {
          const entry = entries.find((e) => e.hash === selectedHash)!;

          // Show commit detail
          const detail = execSync(`git show --stat ${selectedHash} --format="%B"`, {
            encoding: "utf-8",
          }).trim();
          console.log(`\n${dim(detail)}\n`);

          const action = await selectWithBack({
            message: "Action:",
            choices: [
              { value: "cherry-pick", name: "Cherry-pick to current branch" },
              { value: "revert", name: "Revert this commit" },
              { value: "fixup", name: "Create fixup for this commit" },
              { value: "diff", name: "Show full diff" },
              { value: "done", name: "Done" },
            ],
            showBack: true,
          });

          if (action === BACK_VALUE) {
            currentStep = "selectCommit";
            break;
          }

          switch (action) {
            case "cherry-pick":
              execSync(`git cherry-pick ${selectedHash}`, { stdio: "inherit" });
              console.log(green(`✓ Cherry-picked ${entry.shortHash}`));
              currentStep = "done";
              break;

            case "revert":
              execSync(`git revert ${selectedHash}`, { stdio: "inherit" });
              console.log(green(`✓ Reverted ${entry.shortHash}`));
              currentStep = "done";
              break;

            case "fixup":
              execSync(`git commit --fixup=${selectedHash}`, { stdio: "inherit" });
              console.log(green(`✓ Created fixup for ${entry.shortHash}`));
              currentStep = "done";
              break;

            case "diff": {
              const diff = execSync(`git show ${selectedHash}`, { encoding: "utf-8" });
              console.log(diff);
              // Stay on action step to allow choosing another action
              break;
            }

            case "done":
              currentStep = "done";
              break;
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
