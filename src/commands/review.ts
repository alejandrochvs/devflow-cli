import { select, confirm, input } from "@inquirer/prompts";
import { execSync } from "child_process";
import { bold, dim, green, cyan, yellow } from "../colors.js";
import { checkGhInstalled } from "../git.js";

interface PrInfo {
  number: number;
  title: string;
  headRefName: string;
  author: { login: string };
  additions: number;
  deletions: number;
  reviewDecision: string;
}

function listOpenPrs(): PrInfo[] {
  try {
    const result = execSync(
      "gh pr list --state open --json number,title,headRefName,author,additions,deletions,reviewDecision",
      { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }
    ).trim();
    return JSON.parse(result);
  } catch {
    return [];
  }
}

function getPrDiffStat(number: number): string {
  try {
    return execSync(`gh pr diff ${number} --stat`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

export async function reviewCommand(): Promise<void> {
  try {
    checkGhInstalled();

    const prs = listOpenPrs();

    if (prs.length === 0) {
      console.log("No open pull requests.");
      return;
    }

    console.log(`\n${dim("───")} ${bold("Open PRs")} ${dim("───")}\n`);

    const selected = await select({
      message: "Select a PR to review:",
      choices: prs.map((pr) => ({
        value: pr.number,
        name: `#${pr.number} ${pr.title} ${dim(`(${pr.author.login} · +${pr.additions}/-${pr.deletions})`)}`,
      })),
    });

    const pr = prs.find((p) => p.number === selected)!;

    console.log(`\n${dim("───")} ${cyan(`#${pr.number}`)} ${bold(pr.title)} ${dim("───")}\n`);

    // Show diff stat
    const stat = getPrDiffStat(pr.number);
    if (stat) {
      console.log(dim(stat));
      console.log("");
    }

    const action = await select({
      message: "What would you like to do?",
      choices: [
        { value: "checkout", name: "Checkout this branch locally" },
        { value: "approve", name: "Approve this PR" },
        { value: "comment", name: "Leave a comment" },
        { value: "request-changes", name: "Request changes" },
        { value: "view", name: "Open in browser" },
        { value: "done", name: "Done" },
      ],
    });

    switch (action) {
      case "checkout":
        execSync(`gh pr checkout ${pr.number}`, { stdio: "inherit" });
        console.log(green(`✓ Checked out ${pr.headRefName}`));
        break;

      case "approve": {
        const approveBody = await input({
          message: "Approval comment (optional):",
        });
        const approveFlag = approveBody.trim()
          ? `--body ${JSON.stringify(approveBody.trim())}`
          : "";
        execSync(`gh pr review ${pr.number} --approve ${approveFlag}`, { stdio: "inherit" });
        console.log(green(`✓ Approved #${pr.number}`));
        break;
      }

      case "comment": {
        const comment = await input({
          message: "Comment:",
          validate: (val) => val.trim().length > 0 || "Comment is required",
        });
        execSync(`gh pr comment ${pr.number} --body ${JSON.stringify(comment.trim())}`, {
          stdio: "inherit",
        });
        console.log(green("✓ Comment added"));
        break;
      }

      case "request-changes": {
        const changesBody = await input({
          message: "Describe requested changes:",
          validate: (val) => val.trim().length > 0 || "Description is required",
        });
        execSync(
          `gh pr review ${pr.number} --request-changes --body ${JSON.stringify(changesBody.trim())}`,
          { stdio: "inherit" }
        );
        console.log(yellow(`✓ Requested changes on #${pr.number}`));
        break;
      }

      case "view":
        execSync(`gh pr view ${pr.number} --web`, { stdio: "inherit" });
        break;
    }
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
