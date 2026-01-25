import { select, confirm, input } from "@inquirer/prompts";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { bold, dim, green, cyan, yellow } from "../colors.js";
import { checkGhInstalled } from "../git.js";

interface CommitInfo {
  hash: string;
  type: string;
  message: string;
  breaking: boolean;
}

function getCurrentVersion(cwd: string): string {
  const pkgPath = resolve(cwd, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  return pkg.version || "0.0.0";
}

function getLastTag(): string | undefined {
  try {
    return execSync("git describe --tags --abbrev=0", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

function getCommitsSinceTag(tag?: string): CommitInfo[] {
  const range = tag ? `${tag}..HEAD` : "HEAD";
  try {
    const log = execSync(`git log ${range} --pretty=format:"%H %s"`, {
      encoding: "utf-8",
    }).trim();
    if (!log) return [];
    return log.split("\n").map((line) => {
      const hash = line.substring(0, 40);
      const subject = line.substring(41);
      const match = subject.match(/^(\w+)(?:\[.*?\])?(!)?\(.*?\): (.+)$/);
      if (match) {
        return { hash, type: match[1], breaking: !!match[2], message: match[3] };
      }
      return { hash, type: "other", breaking: false, message: subject };
    });
  } catch {
    return [];
  }
}

function suggestBump(commits: CommitInfo[]): "major" | "minor" | "patch" {
  if (commits.some((c) => c.breaking)) return "major";
  if (commits.some((c) => c.type === "feat")) return "minor";
  return "patch";
}

function bumpVersion(current: string, bump: "major" | "minor" | "patch"): string {
  const [major, minor, patch] = current.split(".").map(Number);
  switch (bump) {
    case "major": return `${major + 1}.0.0`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "patch": return `${major}.${minor}.${patch + 1}`;
  }
}

function buildReleaseNotes(commits: CommitInfo[]): string {
  const groups: Record<string, CommitInfo[]> = {};
  const groupLabels: Record<string, string> = {
    feat: "Features",
    fix: "Bug Fixes",
    refactor: "Refactoring",
    perf: "Performance",
    docs: "Documentation",
    test: "Tests",
    ci: "CI/CD",
    chore: "Chores",
    build: "Build",
    style: "Style",
  };

  for (const commit of commits) {
    const group = groupLabels[commit.type] ? commit.type : "other";
    if (!groups[group]) groups[group] = [];
    groups[group].push(commit);
  }

  const sections: string[] = [];

  // Breaking changes first
  const breaking = commits.filter((c) => c.breaking);
  if (breaking.length > 0) {
    sections.push("### Breaking Changes\n\n" + breaking.map((c) => `- ${c.message}`).join("\n"));
  }

  for (const [type, label] of Object.entries(groupLabels)) {
    if (groups[type] && groups[type].length > 0) {
      sections.push(`### ${label}\n\n` + groups[type].map((c) => `- ${c.message}`).join("\n"));
    }
  }

  if (groups.other && groups.other.length > 0) {
    sections.push("### Other\n\n" + groups.other.map((c) => `- ${c.message}`).join("\n"));
  }

  return sections.join("\n\n");
}

function updateChangelog(cwd: string, version: string, notes: string): void {
  const changelogPath = resolve(cwd, "CHANGELOG.md");
  const date = new Date().toISOString().split("T")[0];
  const entry = `## [${version}] - ${date}\n\n${notes}`;

  if (existsSync(changelogPath)) {
    const existing = readFileSync(changelogPath, "utf-8");
    const headerEnd = existing.indexOf("\n## ");
    if (headerEnd !== -1) {
      const header = existing.substring(0, headerEnd);
      const rest = existing.substring(headerEnd);
      writeFileSync(changelogPath, `${header}\n\n${entry}\n${rest}`);
    } else {
      writeFileSync(changelogPath, `${existing}\n${entry}\n`);
    }
  } else {
    writeFileSync(changelogPath, `# Changelog\n\n${entry}\n`);
  }
}

export interface ReleaseOptions {
  dryRun?: boolean;
  bump?: string;
  version?: string;
  yes?: boolean;
}

export async function releaseCommand(options: ReleaseOptions = {}): Promise<void> {
  try {
    const cwd = process.cwd();
    checkGhInstalled();

    const currentVersion = getCurrentVersion(cwd);
    const lastTag = getLastTag();
    const commits = getCommitsSinceTag(lastTag);

    if (commits.length === 0) {
      console.log("No commits since last release. Nothing to do.");
      return;
    }

    console.log(`\n${dim("───")} ${bold("Release")} ${dim("───")}\n`);
    console.log(`${dim("Current version:")} ${cyan(currentVersion)}`);
    console.log(`${dim("Last tag:")}        ${lastTag || "none"}`);
    console.log(`${dim("Commits:")}         ${commits.length}\n`);

    const suggested = suggestBump(commits);

    // Determine new version from flags or prompt
    let newVersion: string;

    if (options.version) {
      // Explicit version provided
      newVersion = options.version;
    } else if (options.bump) {
      // Bump type provided
      if (!["patch", "minor", "major"].includes(options.bump)) {
        console.error(`Invalid bump type: ${options.bump}. Use: patch, minor, or major`);
        process.exit(1);
      }
      newVersion = bumpVersion(currentVersion, options.bump as "major" | "minor" | "patch");
    } else {
      // Prompt for bump type
      const bump = await select({
        message: `Version bump (suggested: ${suggested}):`,
        choices: [
          { value: "patch", name: `patch → ${bumpVersion(currentVersion, "patch")}` },
          { value: "minor", name: `minor → ${bumpVersion(currentVersion, "minor")}` },
          { value: "major", name: `major → ${bumpVersion(currentVersion, "major")}` },
        ],
        default: suggested,
      }) as "major" | "minor" | "patch";
      newVersion = bumpVersion(currentVersion, bump);
    }

    const notes = buildReleaseNotes(commits);

    console.log(`\n${dim("───")} ${bold(`v${newVersion}`)} ${dim("───")}\n`);
    console.log(notes);
    console.log(`\n${dim("─────────────────")}\n`);

    if (options.dryRun) {
      console.log(dim("[dry-run] No release created."));
      return;
    }

    // Confirm unless --yes
    if (!options.yes) {
      const confirmed = await confirm({
        message: `Release v${newVersion}?`,
        default: true,
      });

      if (!confirmed) {
        console.log("Aborted.");
        return;
      }
    }

    // 1. Update package.json version
    const pkgPath = resolve(cwd, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    pkg.version = newVersion;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(green(`✓ Updated package.json to ${newVersion}`));

    // 2. Update CHANGELOG.md
    updateChangelog(cwd, newVersion, notes);
    console.log(green("✓ Updated CHANGELOG.md"));

    // 3. Commit
    execSync("git add package.json CHANGELOG.md", { stdio: "ignore" });
    execSync(`git commit -m ${JSON.stringify(`${newVersion}`)}`, { stdio: "ignore" });
    console.log(green("✓ Created release commit"));

    // 4. Tag
    execSync(`git tag v${newVersion}`, { stdio: "ignore" });
    console.log(green(`✓ Tagged v${newVersion}`));

    // 5. Push
    execSync("git push origin HEAD --tags", { stdio: "inherit" });
    console.log(green("✓ Pushed to remote"));

    // 6. Create GitHub release (auto-create with --yes)
    const createRelease = options.yes || await confirm({
      message: "Create GitHub release? (triggers npm publish)",
      default: true,
    });

    if (createRelease) {
      execSync(
        `gh release create v${newVersion} --title "v${newVersion}" --notes-file -`,
        { input: notes, stdio: ["pipe", "inherit", "inherit"] }
      );
      console.log(green(`\n✓ Released v${newVersion}`));
      console.log(dim("  npm publish will be triggered by the publish workflow."));
    }
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
