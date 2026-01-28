import { execSync } from "child_process";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { confirm, input } from "@inquirer/prompts";
import { bold, dim, green, cyan, gray } from "../colors.js";
import {
  inputWithBack,
  confirmWithBack,
  BACK_VALUE,
} from "../prompts.js";

interface ChangelogEntry {
  type: string;
  scope?: string;
  message: string;
  breaking: boolean;
}

function getLatestTag(): string | undefined {
  try {
    return execSync("git describe --tags --abbrev=0", { encoding: "utf-8" }).trim();
  } catch {
    return undefined;
  }
}

function getCommitsSinceTag(tag?: string): string[] {
  try {
    const range = tag ? `${tag}..HEAD` : "HEAD";
    const log = execSync(`git log ${range} --format=%s`, { encoding: "utf-8" }).trim();
    return log ? log.split("\n") : [];
  } catch {
    return [];
  }
}

function parseCommit(msg: string): ChangelogEntry | undefined {
  // Match: type[ticket]!(scope): message
  const match = msg.match(/^(\w+)\[.*?\](!?)\(([^)]*)\): (.+)$/);
  if (match) {
    return {
      type: match[1],
      breaking: match[2] === "!",
      scope: match[3] || undefined,
      message: match[4],
    };
  }

  // Match: type!(scope): message
  const conventional = msg.match(/^(\w+)(!?)\(([^)]*)\): (.+)$/);
  if (conventional) {
    return {
      type: conventional[1],
      breaking: conventional[2] === "!",
      scope: conventional[3] || undefined,
      message: conventional[4],
    };
  }

  // Match: type: message
  const simple = msg.match(/^(\w+): (.+)$/);
  if (simple) {
    return { type: simple[1], breaking: false, message: simple[2] };
  }

  return undefined;
}

function groupByType(entries: ChangelogEntry[]): Record<string, ChangelogEntry[]> {
  const groups: Record<string, ChangelogEntry[]> = {};
  for (const entry of entries) {
    const key = entry.type;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return groups;
}

const TYPE_HEADINGS: Record<string, string> = {
  feat: "Features",
  fix: "Bug Fixes",
  perf: "Performance",
  refactor: "Refactoring",
  docs: "Documentation",
  test: "Tests",
  chore: "Maintenance",
  ci: "CI/CD",
  build: "Build",
  style: "Styling",
};

function formatChangelog(version: string, entries: ChangelogEntry[], date: string): string {
  const lines: string[] = [];
  lines.push(`## ${version} (${date})`);
  lines.push("");

  // Breaking changes first
  const breaking = entries.filter((e) => e.breaking);
  if (breaking.length > 0) {
    lines.push("### ⚠ Breaking Changes");
    lines.push("");
    for (const entry of breaking) {
      const scope = entry.scope ? `**${entry.scope}:** ` : "";
      lines.push(`- ${scope}${entry.message}`);
    }
    lines.push("");
  }

  // Grouped by type
  const grouped = groupByType(entries.filter((e) => !e.breaking));
  const typeOrder = ["feat", "fix", "perf", "refactor", "docs", "test", "chore", "ci", "build", "style"];

  for (const type of typeOrder) {
    const group = grouped[type];
    if (!group || group.length === 0) continue;
    const heading = TYPE_HEADINGS[type] || type;
    lines.push(`### ${heading}`);
    lines.push("");
    for (const entry of group) {
      const scope = entry.scope ? `**${entry.scope}:** ` : "";
      lines.push(`- ${scope}${entry.message}`);
    }
    lines.push("");
  }

  // Any remaining types not in the order
  for (const [type, group] of Object.entries(grouped)) {
    if (typeOrder.includes(type)) continue;
    const heading = TYPE_HEADINGS[type] || type;
    lines.push(`### ${heading}`);
    lines.push("");
    for (const entry of group) {
      const scope = entry.scope ? `**${entry.scope}:** ` : "";
      lines.push(`- ${scope}${entry.message}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export interface ChangelogOptions {
  dryRun?: boolean;
  version?: string;
  yes?: boolean;
}

export async function changelogCommand(options: ChangelogOptions = {}): Promise<void> {
  try {
    const latestTag = getLatestTag();
    const commits = getCommitsSinceTag(latestTag);

    if (commits.length === 0) {
      console.log("No commits found since last tag.");
      return;
    }

    console.log(`\n${dim("───")} ${bold("Changelog")} ${dim("───")}\n`);
    console.log(`${dim("Since:")} ${latestTag ? cyan(latestTag) : gray("beginning")}`);
    console.log(`${dim("Commits:")} ${commits.length}\n`);

    const entries = commits
      .map(parseCommit)
      .filter((e): e is ChangelogEntry => e !== undefined);

    if (entries.length === 0) {
      console.log("No conventional commits found to generate changelog from.");
      return;
    }

    // Step-based flow with back navigation
    type StepName = "version" | "confirm" | "execute";
    let currentStep: StepName = "version";
    let version: string = options.version || "";
    const defaultVersion = latestTag ? bumpVersion(latestTag, entries) : "0.1.0";

    // Skip to confirm if version provided
    if (options.version) {
      currentStep = "confirm";
    }

    let writeFile: boolean = false;

    while (currentStep !== "execute") {
      switch (currentStep) {
        case "version": {
          if (options.yes) {
            version = defaultVersion;
            currentStep = "confirm";
            break;
          }

          const result = await inputWithBack({
            message: "Version for this changelog entry:",
            default: version || defaultVersion,
            validate: (val) => val.trim().length > 0 || "Version is required",
            showBack: false, // First step
          });

          if (result === BACK_VALUE) {
            // Can't go back from first step
          } else {
            version = result;
            currentStep = "confirm";
          }
          break;
        }

        case "confirm": {
          const date = new Date().toISOString().split("T")[0];
          const changelog = formatChangelog(version.trim(), entries, date);

          console.log(`\n${dim("Preview:")}\n`);
          console.log(changelog);

          if (options.dryRun) {
            console.log(dim("[dry-run] No file written."));
            return;
          }

          // Confirm (skip if --yes)
          if (options.yes) {
            writeFile = true;
            currentStep = "execute";
          } else {
            const result = await confirmWithBack({
              message: "Write to CHANGELOG.md?",
              default: true,
              showBack: !options.version,
            });

            if (result === BACK_VALUE) {
              currentStep = "version";
            } else {
              writeFile = result === true;
              currentStep = "execute";
            }
          }
          break;
        }

        default:
          currentStep = "execute";
      }
    }

    const date = new Date().toISOString().split("T")[0];
    const changelog = formatChangelog(version.trim(), entries, date);

    if (writeFile) {
      const changelogPath = "CHANGELOG.md";
      let existing = "";
      if (existsSync(changelogPath)) {
        existing = readFileSync(changelogPath, "utf-8");
        // Insert after the title if it exists
        const titleMatch = existing.match(/^# .+\n/);
        if (titleMatch) {
          const afterTitle = existing.slice(titleMatch[0].length);
          writeFileSync(changelogPath, `${titleMatch[0]}\n${changelog}\n${afterTitle}`);
        } else {
          writeFileSync(changelogPath, `${changelog}\n\n${existing}`);
        }
      } else {
        writeFileSync(changelogPath, `# Changelog\n\n${changelog}\n`);
      }
      console.log(green("✓ CHANGELOG.md updated."));
    }
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}

function bumpVersion(tag: string, entries: ChangelogEntry[]): string {
  const clean = tag.replace(/^v/, "");
  const parts = clean.split(".").map(Number);
  if (parts.length !== 3) return clean;

  const hasBreaking = entries.some((e) => e.breaking);
  const hasFeature = entries.some((e) => e.type === "feat");

  if (hasBreaking) {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
  } else if (hasFeature) {
    parts[1]++;
    parts[2] = 0;
  } else {
    parts[2]++;
  }

  return parts.join(".");
}
