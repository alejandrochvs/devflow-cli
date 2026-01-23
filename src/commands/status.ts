import { execSync } from "child_process";
import { loadConfig } from "../config.js";
import { bold, dim, cyan, green, yellow, gray } from "../colors.js";
import { getBranch, parseBranch, getDefaultBase, getCommits } from "../git.js";

function getPrInfo(): { url: string; number: number; state: string } | undefined {
  try {
    const result = execSync("gh pr view --json url,number,state", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    return JSON.parse(result);
  } catch {
    return undefined;
  }
}

function getUncommittedCount(): { staged: number; unstaged: number; untracked: number } {
  const staged = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();
  const unstaged = execSync("git diff --name-only", { encoding: "utf-8" }).trim();
  const untracked = execSync("git ls-files --others --exclude-standard", { encoding: "utf-8" }).trim();

  return {
    staged: staged ? staged.split("\n").length : 0,
    unstaged: unstaged ? unstaged.split("\n").length : 0,
    untracked: untracked ? untracked.split("\n").length : 0,
  };
}

export async function statusCommand(): Promise<void> {
  const config = loadConfig();
  const branch = getBranch();
  const { type, ticket, description } = parseBranch(branch);
  const base = getDefaultBase(branch);
  const commits = getCommits(base);
  const changes = getUncommittedCount();
  const pr = getPrInfo();

  console.log(`\n${dim("───")} ${bold("devflow status")} ${dim("───")}\n`);

  // Branch info
  console.log(`${dim("Branch:")}  ${cyan(branch)}`);
  if (type) {
    console.log(`${dim("Type:")}    ${type}`);
    console.log(`${dim("Ticket:")}  ${ticket === "UNTRACKED" ? yellow(ticket) : green(ticket)}`);
    console.log(`${dim("Desc:")}    ${description}`);
  }
  console.log(`${dim("Base:")}    ${cyan(base)}`);

  // Commits
  console.log(`\n${dim("Commits:")} ${commits.length > 0 ? commits.length.toString() : gray("none")}`);
  if (commits.length > 0) {
    const shown = commits.slice(0, 5);
    for (const c of shown) {
      console.log(`  ${dim("•")} ${c}`);
    }
    if (commits.length > 5) {
      console.log(gray(`  ... and ${commits.length - 5} more`));
    }
  }

  // Working tree
  const totalChanges = changes.staged + changes.unstaged + changes.untracked;
  if (totalChanges > 0) {
    console.log(`\n${dim("Changes:")}`);
    if (changes.staged > 0) console.log(`  ${green(`${changes.staged} staged`)}`);
    if (changes.unstaged > 0) console.log(`  ${yellow(`${changes.unstaged} modified`)}`);
    if (changes.untracked > 0) console.log(`  ${gray(`${changes.untracked} untracked`)}`);
  } else {
    console.log(`\n${dim("Changes:")} ${green("clean")}`);
  }

  // PR info
  if (pr) {
    const stateColor = pr.state === "OPEN" ? green : pr.state === "MERGED" ? cyan : gray;
    console.log(`\n${dim("PR:")}      ${stateColor(`#${pr.number} (${pr.state.toLowerCase()})`)} ${dim(pr.url)}`);
  } else {
    console.log(`\n${dim("PR:")}      ${gray("none")}`);
  }

  // Config info
  if (config.ticketBaseUrl) {
    console.log(`\n${dim("Config:")}  ${green("✓")} .devflow.json loaded`);
  }

  console.log("");
}
