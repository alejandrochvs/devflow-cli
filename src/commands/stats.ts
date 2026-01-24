import { execSync } from "child_process";
import { bold, dim, green, cyan, yellow } from "../colors.js";

interface CommitStat {
  type: string;
  scope: string;
  author: string;
}

function getCommitStats(limit: number = 100): CommitStat[] {
  try {
    const result = execSync(
      `git log --pretty=format:"%s|%an" -${limit}`,
      { encoding: "utf-8" }
    ).trim();
    if (!result) return [];

    return result.split("\n").map((line) => {
      const [subject, author] = line.split("|");
      const match = subject.match(/^(\w+)(?:\[.*?\])?(?:!)?\((.+?)\):/);
      return {
        type: match ? match[1] : "other",
        scope: match ? match[2] : "none",
        author: author || "unknown",
      };
    });
  } catch {
    return [];
  }
}

function topN(counts: Record<string, number>, n: number): Array<[string, number]> {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function bar(value: number, max: number, width: number = 20): string {
  const filled = Math.round((value / max) * width);
  return "█".repeat(filled) + dim("░".repeat(width - filled));
}

export function statsCommand(): void {
  const stats = getCommitStats(200);

  if (stats.length === 0) {
    console.log("No commits found.");
    return;
  }

  console.log(`\n${dim("───")} ${bold("Stats")} ${dim(`(last ${stats.length} commits)`)} ${dim("───")}\n`);

  // Commit types
  const typeCounts: Record<string, number> = {};
  for (const s of stats) {
    typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
  }
  const topTypes = topN(typeCounts, 8);
  const maxType = topTypes[0]?.[1] || 1;

  console.log(bold("  Commit Types"));
  for (const [type, count] of topTypes) {
    const pct = Math.round((count / stats.length) * 100);
    console.log(`  ${type.padEnd(12)} ${bar(count, maxType)} ${cyan(String(count))} ${dim(`(${pct}%)`)}`);
  }

  // Scopes
  console.log("");
  const scopeCounts: Record<string, number> = {};
  for (const s of stats) {
    if (s.scope !== "none") {
      scopeCounts[s.scope] = (scopeCounts[s.scope] || 0) + 1;
    }
  }
  const topScopes = topN(scopeCounts, 8);
  const maxScope = topScopes[0]?.[1] || 1;

  if (topScopes.length > 0) {
    console.log(bold("  Top Scopes"));
    for (const [scope, count] of topScopes) {
      console.log(`  ${scope.padEnd(12)} ${bar(count, maxScope)} ${cyan(String(count))}`);
    }
  }

  // Contributors
  console.log("");
  const authorCounts: Record<string, number> = {};
  for (const s of stats) {
    authorCounts[s.author] = (authorCounts[s.author] || 0) + 1;
  }
  const topAuthors = topN(authorCounts, 5);
  const maxAuthor = topAuthors[0]?.[1] || 1;

  console.log(bold("  Contributors"));
  for (const [author, count] of topAuthors) {
    const pct = Math.round((count / stats.length) * 100);
    console.log(`  ${author.padEnd(16)} ${bar(count, maxAuthor)} ${cyan(String(count))} ${dim(`(${pct}%)`)}`);
  }

  // Activity
  console.log("");
  try {
    const firstCommit = execSync("git log --reverse --format=%ar | head -1", {
      encoding: "utf-8",
      shell: "/bin/bash",
    }).trim();
    const totalCommits = execSync("git rev-list --count HEAD", { encoding: "utf-8" }).trim();
    const branches = execSync("git branch | wc -l", { encoding: "utf-8", shell: "/bin/bash" }).trim();

    console.log(bold("  Summary"));
    console.log(`  ${dim("Total commits:")}  ${cyan(totalCommits)}`);
    console.log(`  ${dim("Local branches:")} ${cyan(branches.trim())}`);
    console.log(`  ${dim("First commit:")}   ${dim(firstCommit)}`);
  } catch {
    // ignore
  }

  console.log("");
}
