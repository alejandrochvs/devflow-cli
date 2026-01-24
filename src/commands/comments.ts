import { execSync } from "child_process";
import { bold, dim, cyan, yellow, green, magenta, gray } from "../colors.js";
import { checkGhInstalled } from "../git.js";

interface ThreadComment {
  author: string;
  body: string;
  createdAt: string;
}

interface ReviewThread {
  isResolved: boolean;
  path: string;
  line: number | null;
  diffHunk: string;
  comments: ThreadComment[];
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
}

function getCurrentPr(): PrInfo | undefined {
  try {
    const result = execSync("gh pr view --json number,title", {
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

function getReviewThreads(owner: string, repo: string, prNumber: number): ReviewThread[] {
  const query = `
    query {
      repository(owner: "${owner}", name: "${repo}") {
        pullRequest(number: ${prNumber}) {
          reviewThreads(first: 100) {
            nodes {
              isResolved
              path
              line
              diffHunk
              comments(first: 20) {
                nodes {
                  author { login }
                  body
                  createdAt
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = execSync(`gh api graphql -f query='${query.replace(/'/g, "'\\''")}'`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();

    const data = JSON.parse(result);
    const threads = data.data.repository.pullRequest.reviewThreads.nodes;

    return threads.map((t: any) => ({
      isResolved: t.isResolved,
      path: t.path,
      line: t.line,
      diffHunk: t.diffHunk || "",
      comments: t.comments.nodes.map((c: any) => ({
        author: c.author?.login || "unknown",
        body: c.body,
        createdAt: c.createdAt,
      })),
    }));
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

function formatDiffHunk(hunk: string, resolved: boolean): string {
  const lines = hunk.split("\n").slice(-4);
  const format = resolved ? dim : (s: string) => s;
  return lines
    .map((line) => {
      if (line.startsWith("+")) return format(green(`  ┃ ${line}`));
      if (line.startsWith("-")) return format(yellow(`  ┃ ${line}`));
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

function renderThread(thread: ReviewThread): void {
  const resolvedTag = thread.isResolved ? dim(gray(" [resolved]")) : "";
  const lineInfo = thread.line ? `:${thread.line}` : "";
  const firstComment = thread.comments[0];

  console.log(
    `  ${dim(`line${lineInfo}`)} ${dim("·")} ${magenta(`@${firstComment.author}`)} ${dim(formatDate(firstComment.createdAt))}${resolvedTag}`
  );

  if (thread.diffHunk) {
    console.log(formatDiffHunk(thread.diffHunk, thread.isResolved));
  }

  for (const comment of thread.comments) {
    const bodyLines = comment.body.trim().split("\n");
    const prefix = thread.comments.length > 1 ? `${magenta(`@${comment.author}`)} ` : "";
    for (let i = 0; i < bodyLines.length; i++) {
      const line = thread.isResolved ? dim(bodyLines[i]) : bodyLines[i];
      if (i === 0 && prefix && thread.comments.indexOf(comment) > 0) {
        console.log(`  ${dim("│")} ${prefix}${line}`);
      } else {
        console.log(`  ${dim("│")} ${line}`);
      }
    }
  }
  console.log("");
}

export async function commentsCommand(opts: {
  number?: string;
  resolved?: boolean;
  unresolved?: boolean;
}): Promise<void> {
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

  // Determine filter mode
  const showResolved = opts.resolved === true;
  const showUnresolved = opts.unresolved === true;
  const showAll = !showResolved && !showUnresolved; // default: show all with distinction

  const reviews = getReviews(repoInfo.owner, repoInfo.repo, prNumber);
  const allThreads = getReviewThreads(repoInfo.owner, repoInfo.repo, prNumber);

  // Filter threads
  let threads: ReviewThread[];
  if (showResolved) {
    threads = allThreads.filter((t) => t.isResolved);
  } else if (showUnresolved) {
    threads = allThreads.filter((t) => !t.isResolved);
  } else {
    threads = allThreads;
  }

  const filterLabel = showResolved
    ? dim(" (resolved only)")
    : showUnresolved
      ? dim(" (unresolved only)")
      : "";

  console.log(`\n${dim("───")} ${cyan(`#${prNumber}`)} ${bold(prTitle)}${filterLabel} ${dim("───")}\n`);

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

  // Show threads grouped by file
  if (threads.length > 0) {
    const unresolvedCount = threads.filter((t) => !t.isResolved).length;
    const resolvedCount = threads.filter((t) => t.isResolved).length;

    const countParts: string[] = [];
    if (unresolvedCount > 0) countParts.push(yellow(`${unresolvedCount} unresolved`));
    if (resolvedCount > 0) countParts.push(dim(`${resolvedCount} resolved`));

    console.log(`${bold("Inline Comments")} ${dim("(")}${countParts.join(dim(", "))}${dim(")")}\n`);

    // Group by file
    const byFile = new Map<string, ReviewThread[]>();
    for (const thread of threads) {
      const existing = byFile.get(thread.path) || [];
      existing.push(thread);
      byFile.set(thread.path, existing);
    }

    for (const [file, fileThreads] of byFile) {
      const fileUnresolved = fileThreads.filter((t) => !t.isResolved).length;
      const fileLabel = fileUnresolved > 0 ? ` ${yellow(`(${fileUnresolved} unresolved)`)}` : "";
      console.log(`  ${cyan(file)}${fileLabel}`);
      console.log("");

      // Show unresolved first, then resolved
      const sorted = [...fileThreads].sort((a, b) => {
        if (a.isResolved === b.isResolved) return 0;
        return a.isResolved ? 1 : -1;
      });

      for (const thread of sorted) {
        renderThread(thread);
      }
    }
  }

  if (meaningfulReviews.length === 0 && threads.length === 0) {
    console.log(dim("  No reviews or comments yet."));
    console.log("");
  }

  // Summary
  const approvals = reviews.filter((r) => r.state === "APPROVED").length;
  const changesRequested = reviews.filter((r) => r.state === "CHANGES_REQUESTED").length;
  const unresolvedTotal = allThreads.filter((t) => !t.isResolved).length;
  const resolvedTotal = allThreads.filter((t) => t.isResolved).length;

  const parts: string[] = [];
  if (approvals > 0) parts.push(green(`${approvals} approval${approvals > 1 ? "s" : ""}`));
  if (changesRequested > 0) parts.push(yellow(`${changesRequested} change request${changesRequested > 1 ? "s" : ""}`));
  if (unresolvedTotal > 0) parts.push(yellow(`${unresolvedTotal} unresolved`));
  if (resolvedTotal > 0) parts.push(dim(`${resolvedTotal} resolved`));

  if (parts.length > 0) {
    console.log(`${dim("───")} ${parts.join(dim(" · "))} ${dim("───")}\n`);
  }
}
