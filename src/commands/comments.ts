import { execSync } from "child_process";
import { bold, dim, cyan, yellow, green, magenta, gray } from "../colors.js";
import { checkGhInstalled, getBranch } from "../git.js";

interface ReviewComment {
  path: string;
  line: number | null;
  body: string;
  diffHunk: string;
  author: string;
  createdAt: string;
}

interface Review {
  author: string;
  state: string;
  body: string;
  submittedAt: string;
}

interface PrInfo {
  number: number;
  title: string;
  url: string;
}

function getCurrentPr(): PrInfo | undefined {
  try {
    const result = execSync("gh pr view --json number,title,url", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    return JSON.parse(result);
  } catch {
    return undefined;
  }
}

function getRepoInfo(): { owner: string; repo: string } | undefined {
  try {
    const result = execSync("gh repo view --json owner,name", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    const data = JSON.parse(result);
    return { owner: data.owner.login, repo: data.name };
  } catch {
    return undefined;
  }
}

function getInlineComments(owner: string, repo: string, prNumber: number): ReviewComment[] {
  try {
    const result = execSync(
      `gh api repos/${owner}/${repo}/pulls/${prNumber}/comments --jq '[.[] | {path: .path, line: .line, body: .body, diffHunk: .diff_hunk, author: .user.login, createdAt: .created_at}]'`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }
    ).trim();
    return result ? JSON.parse(result) : [];
  } catch {
    return [];
  }
}

function getReviews(owner: string, repo: string, prNumber: number): Review[] {
  try {
    const result = execSync(
      `gh api repos/${owner}/${repo}/pulls/${prNumber}/reviews --jq '[.[] | {author: .user.login, state: .state, body: .body, submittedAt: .submitted_at}]'`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }
    ).trim();
    return result ? JSON.parse(result) : [];
  } catch {
    return [];
  }
}

function formatState(state: string): string {
  switch (state) {
    case "APPROVED":
      return green("APPROVED");
    case "CHANGES_REQUESTED":
      return yellow("CHANGES REQUESTED");
    case "COMMENTED":
      return cyan("COMMENTED");
    case "DISMISSED":
      return gray("DISMISSED");
    default:
      return state;
  }
}

function formatDiffHunk(hunk: string): string {
  const lines = hunk.split("\n").slice(-4); // Show last 4 lines of context
  return lines
    .map((line) => {
      if (line.startsWith("+")) return green(`  ┃ ${line}`);
      if (line.startsWith("-")) return yellow(`  ┃ ${line}`);
      if (line.startsWith("@@")) return dim(`  ┃ ${line}`);
      return gray(`  ┃ ${line}`);
    })
    .join("\n");
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export async function commentsCommand(opts: { number?: string }): Promise<void> {
  checkGhInstalled();

  const repoInfo = getRepoInfo();
  if (!repoInfo) {
    console.error("Error: Could not determine repository info.");
    process.exit(1);
  }

  let prNumber: number;
  let prTitle: string;

  if (opts.number) {
    prNumber = parseInt(opts.number, 10);
    prTitle = `PR #${prNumber}`;
  } else {
    const pr = getCurrentPr();
    if (!pr) {
      console.error("No PR found for the current branch. Use --number <n> to specify a PR.");
      process.exit(1);
    }
    prNumber = pr.number;
    prTitle = pr.title;
  }

  const reviews = getReviews(repoInfo.owner, repoInfo.repo, prNumber);
  const comments = getInlineComments(repoInfo.owner, repoInfo.repo, prNumber);

  console.log(`\n${dim("───")} ${cyan(`#${prNumber}`)} ${bold(prTitle)} ${dim("───")}\n`);

  // Show reviews (top-level)
  const meaningfulReviews = reviews.filter((r) => r.state !== "PENDING");
  if (meaningfulReviews.length > 0) {
    console.log(`${bold("Reviews")}\n`);
    for (const review of meaningfulReviews) {
      console.log(`  ${magenta(`@${review.author}`)} ${formatState(review.state)} ${dim(formatDate(review.submittedAt))}`);
      if (review.body && review.body.trim()) {
        const bodyLines = review.body.trim().split("\n");
        for (const line of bodyLines) {
          console.log(`    ${line}`);
        }
      }
      console.log("");
    }
  }

  // Show inline comments grouped by file
  if (comments.length > 0) {
    console.log(`${bold("Inline Comments")} ${dim(`(${comments.length})`)}\n`);

    // Group by file
    const byFile = new Map<string, ReviewComment[]>();
    for (const comment of comments) {
      const existing = byFile.get(comment.path) || [];
      existing.push(comment);
      byFile.set(comment.path, existing);
    }

    for (const [file, fileComments] of byFile) {
      console.log(`  ${cyan(file)}`);

      for (const comment of fileComments) {
        const lineInfo = comment.line ? `:${comment.line}` : "";
        console.log(`  ${dim(`line${lineInfo}`)} ${dim("·")} ${magenta(`@${comment.author}`)} ${dim(formatDate(comment.createdAt))}`);

        if (comment.diffHunk) {
          console.log(formatDiffHunk(comment.diffHunk));
        }

        const bodyLines = comment.body.trim().split("\n");
        for (const line of bodyLines) {
          console.log(`  ${dim("│")} ${line}`);
        }
        console.log("");
      }
    }
  }

  if (meaningfulReviews.length === 0 && comments.length === 0) {
    console.log(dim("  No reviews or comments yet."));
    console.log("");
  }

  // Summary
  const approvals = reviews.filter((r) => r.state === "APPROVED").length;
  const changesRequested = reviews.filter((r) => r.state === "CHANGES_REQUESTED").length;
  const parts: string[] = [];
  if (approvals > 0) parts.push(green(`${approvals} approval${approvals > 1 ? "s" : ""}`));
  if (changesRequested > 0) parts.push(yellow(`${changesRequested} change request${changesRequested > 1 ? "s" : ""}`));
  if (comments.length > 0) parts.push(cyan(`${comments.length} inline comment${comments.length > 1 ? "s" : ""}`));

  if (parts.length > 0) {
    console.log(`${dim("───")} ${parts.join(dim(" · "))} ${dim("───")}\n`);
  }
}
