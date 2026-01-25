import { execSync } from "child_process";

const PROTECTED_BRANCHES = ["main", "master", "develop", "production"];

export function getBranch(): string {
  return execSync("git branch --show-current", { encoding: "utf-8" }).trim();
}

interface ParsedBranch {
  type: string | undefined;
  ticket: string;
  description: string;
}

export function parseBranch(branch: string, format?: string): ParsedBranch {
  // Default format for backwards compatibility
  const fmt = format || "{type}/{ticket}_{description}";

  // Determine which placeholders exist in the format
  const hasTicket = fmt.includes("{ticket}");

  // Build regex from format - replace placeholders with capture groups
  // Escape special regex chars first, then replace placeholders
  let regexStr = fmt
    .replace(/[.*+?^${}()|[\]\\]/g, (c) => (c === "{" || c === "}" ? c : "\\" + c))
    .replace("{type}", "([^/]+)")
    .replace("{ticket}", "([^_]+)")
    .replace("{description}", "(.+)")
    .replace("{scope}", "([^/]+)");

  // Find the order of placeholders in the format
  const placeholderOrder: string[] = [];
  const placeholderRegex = /\{(type|ticket|description|scope)\}/g;
  let placeholderMatch;
  while ((placeholderMatch = placeholderRegex.exec(fmt)) !== null) {
    placeholderOrder.push(placeholderMatch[1]);
  }

  const match = branch.match(new RegExp(`^${regexStr}$`));
  if (!match) {
    return { type: undefined, ticket: "UNTRACKED", description: branch };
  }

  // Map captures back to field names based on placeholder order
  const result: Record<string, string> = {};
  for (let i = 0; i < placeholderOrder.length; i++) {
    result[placeholderOrder[i]] = match[i + 1];
  }

  return {
    type: result.type,
    ticket: hasTicket ? (result.ticket || "UNTRACKED") : "UNTRACKED",
    description: (result.description || branch).replace(/-/g, " "),
  };
}

export function inferTicket(format?: string): string {
  try {
    const branch = getBranch();
    const parsed = parseBranch(branch, format);
    return parsed.ticket;
  } catch {
    // Not on a branch
  }
  return "UNTRACKED";
}

export function inferScope(): string | undefined {
  try {
    const log = execSync("git log main..HEAD --format=%s", {
      encoding: "utf-8",
    }).trim();
    if (!log) return undefined;
    const lines = log.split("\n");
    for (const line of lines) {
      const match = line.match(/^\w+\[.*?\]!?\(([^)]+)\)/);
      if (match) return match[1];
    }
  } catch {
    // No commits on branch or main doesn't exist
  }
  return undefined;
}

export function getCommits(base: string): string[] {
  try {
    const log = execSync(`git log ${base}..HEAD --format=%s`, { encoding: "utf-8" }).trim();
    return log ? log.split("\n") : [];
  } catch {
    return [];
  }
}

export function getScopesFromCommits(commits: string[]): string[] {
  const scopes = new Set<string>();
  for (const commit of commits) {
    const match = commit.match(/\(([^)]+)\)/);
    if (match) scopes.add(match[1]);
  }
  return [...scopes];
}

export function getDefaultBase(currentBranch: string): string {
  try {
    const remoteBranches = execSync("git branch -r", { encoding: "utf-8" })
      .trim()
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b && !b.includes("HEAD") && !b.endsWith(`/${currentBranch}`));

    let closest = "main";
    let minAhead = Infinity;

    for (const remote of remoteBranches) {
      try {
        const mergeBase = execSync(`git merge-base HEAD ${remote}`, {
          encoding: "utf-8",
        }).trim();
        const ahead = execSync(`git rev-list --count ${mergeBase}..HEAD`, {
          encoding: "utf-8",
        }).trim();
        const count = parseInt(ahead, 10);
        if (count < minAhead) {
          minAhead = count;
          closest = remote.replace(/^origin\//, "");
        }
      } catch {
        // Skip branches that can't be compared
      }
    }

    return closest;
  } catch {
    return "main";
  }
}

export function checkGhInstalled(): void {
  try {
    execSync("gh --version", { stdio: "ignore" });
  } catch {
    console.error("Error: GitHub CLI (gh) is not installed.");
    console.error("Install it with: brew install gh");
    console.error("Then authenticate: gh auth login");
    process.exit(1);
  }
}

export function isProtectedBranch(branch?: string): boolean {
  const current = branch || getBranch();
  return PROTECTED_BRANCHES.includes(current);
}
