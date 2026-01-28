import { select, confirm, input } from "@inquirer/prompts";
import { execSync } from "child_process";
import { bold, dim, green, cyan, yellow } from "../colors.js";
import { checkGhInstalled } from "../git.js";
import {
  selectWithBack,
  inputWithBack,
  BACK_VALUE,
} from "../prompts.js";

export interface ReviewOptions {
  pr?: string;
  action?: string;
  comment?: string;
}

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

export async function reviewCommand(options: ReviewOptions = {}): Promise<void> {
  try {
    checkGhInstalled();

    const prs = listOpenPrs();

    if (prs.length === 0) {
      console.log("No open pull requests.");
      return;
    }

    // Step-based flow with back navigation
    type StepName = "selectPr" | "action" | "execute" | "done";
    let currentStep: StepName = "selectPr";
    let prNumber: number = options.pr ? parseInt(options.pr, 10) : 0;
    let selectedAction: string = options.action || "";

    // Validate options if provided
    if (options.pr) {
      const found = prs.find((p) => p.number === prNumber);
      if (!found) {
        console.error(`PR #${options.pr} not found in open PRs.`);
        process.exit(1);
      }
      currentStep = "action";
    }

    if (options.action) {
      if (!["checkout", "approve", "comment", "request-changes", "view"].includes(options.action)) {
        console.error(`Invalid action: ${options.action}. Use: checkout, approve, comment, request-changes, or view`);
        process.exit(1);
      }
      selectedAction = options.action;
      currentStep = "execute";
    }

    while (currentStep !== "done") {
      switch (currentStep) {
        case "selectPr": {
          console.log(`\n${dim("───")} ${bold("Open PRs")} ${dim("───")}\n`);

          const result = await selectWithBack({
            message: "Select a PR to review:",
            choices: prs.map((p) => ({
              value: p.number,
              name: `#${p.number} ${p.title} ${dim(`(${p.author.login} · +${p.additions}/-${p.deletions})`)}`,
            })),
            showBack: false, // First step
          });

          if (result === BACK_VALUE) {
            // Can't go back from first step
          } else {
            prNumber = result as number;
            currentStep = "action";
          }
          break;
        }

        case "action": {
          const pr = prs.find((p) => p.number === prNumber)!;

          console.log(`\n${dim("───")} ${cyan(`#${pr.number}`)} ${bold(pr.title)} ${dim("───")}\n`);

          // Show diff stat
          const stat = getPrDiffStat(pr.number);
          if (stat) {
            console.log(dim(stat));
            console.log("");
          }

          if (options.action) {
            currentStep = "execute";
            break;
          }

          const result = await selectWithBack({
            message: "What would you like to do?",
            choices: [
              { value: "checkout", name: "Checkout this branch locally" },
              { value: "approve", name: "Approve this PR" },
              { value: "comment", name: "Leave a comment" },
              { value: "request-changes", name: "Request changes" },
              { value: "view", name: "Open in browser" },
              { value: "done", name: "Done" },
            ],
            showBack: !options.pr,
          });

          if (result === BACK_VALUE) {
            currentStep = "selectPr";
          } else if (result === "done") {
            currentStep = "done";
          } else {
            selectedAction = result;
            currentStep = "execute";
          }
          break;
        }

        case "execute": {
          const pr = prs.find((p) => p.number === prNumber)!;

          switch (selectedAction) {
            case "checkout":
              execSync(`gh pr checkout ${pr.number}`, { stdio: "inherit" });
              console.log(green(`✓ Checked out ${pr.headRefName}`));
              currentStep = "done";
              break;

            case "approve": {
              const approveBodyResult = options.comment ?? await inputWithBack({
                message: "Approval comment (optional):",
                showBack: !options.action,
              });

              if (approveBodyResult === BACK_VALUE) {
                currentStep = "action";
                break;
              }

              const approveBody = approveBodyResult as string;
              const approveFlag = approveBody.trim()
                ? `--body ${JSON.stringify(approveBody.trim())}`
                : "";
              execSync(`gh pr review ${pr.number} --approve ${approveFlag}`, { stdio: "inherit" });
              console.log(green(`✓ Approved #${pr.number}`));
              currentStep = "done";
              break;
            }

            case "comment": {
              const commentResult = options.comment ?? await inputWithBack({
                message: "Comment:",
                validate: (val) => val.trim().length > 0 || "Comment is required",
                showBack: !options.action,
              });

              if (commentResult === BACK_VALUE) {
                currentStep = "action";
                break;
              }

              const comment = commentResult as string;
              if (!comment.trim()) {
                console.error("Comment is required.");
                process.exit(1);
              }
              execSync(`gh pr comment ${pr.number} --body ${JSON.stringify(comment.trim())}`, {
                stdio: "inherit",
              });
              console.log(green("✓ Comment added"));
              currentStep = "done";
              break;
            }

            case "request-changes": {
              const changesResult = options.comment ?? await inputWithBack({
                message: "Describe requested changes:",
                validate: (val) => val.trim().length > 0 || "Description is required",
                showBack: !options.action,
              });

              if (changesResult === BACK_VALUE) {
                currentStep = "action";
                break;
              }

              const changesBody = changesResult as string;
              if (!changesBody.trim()) {
                console.error("Description is required.");
                process.exit(1);
              }
              execSync(
                `gh pr review ${pr.number} --request-changes --body ${JSON.stringify(changesBody.trim())}`,
                { stdio: "inherit" }
              );
              console.log(yellow(`✓ Requested changes on #${pr.number}`));
              currentStep = "done";
              break;
            }

            case "view":
              execSync(`gh pr view ${pr.number} --web`, { stdio: "inherit" });
              currentStep = "done";
              break;

            default:
              currentStep = "done";
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
