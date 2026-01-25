import { select, search, confirm, input, checkbox } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig, Scope } from "../config.js";
import { inferTicket, inferScope, getBranch, isProtectedBranch } from "../git.js";
import { bold, cyan, dim, green, yellow } from "../colors.js";

export function inferScopeFromPaths(stagedFiles: string[], scopes: Scope[]): string | undefined {
  const scopesWithPaths = scopes.filter((s) => s.paths && s.paths.length > 0);
  if (scopesWithPaths.length === 0) return undefined;

  const matchCounts: Record<string, number> = {};

  for (const file of stagedFiles) {
    for (const scope of scopesWithPaths) {
      for (const pattern of scope.paths!) {
        if (fileMatchesPattern(file, pattern)) {
          matchCounts[scope.value] = (matchCounts[scope.value] || 0) + 1;
          break;
        }
      }
    }
  }

  const entries = Object.entries(matchCounts);
  if (entries.length === 0) return undefined;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export function fileMatchesPattern(file: string, pattern: string): boolean {
  let regex = pattern
    .replace(/\*\*\//g, "\u0000GLOBSTAR_SLASH\u0000")
    .replace(/\*\*/g, "\u0000GLOBSTAR\u0000")
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000GLOBSTAR_SLASH\u0000/g, "(.+/)?")
    .replace(/\u0000GLOBSTAR\u0000/g, ".*");
  return new RegExp(`^${regex}$`).test(file);
}

export function formatCommitMessage(
  format: string,
  vars: { type: string; ticket: string; breaking: string; scope: string; message: string }
): string {
  let result = format;
  result = result.replace("{type}", vars.type);
  result = result.replace("{ticket}", vars.ticket);
  result = result.replace("{breaking}", vars.breaking);
  result = result.replace("{scope}", vars.scope);
  result = result.replace("{message}", vars.message);

  // Remove empty optional parts: []{} or ()
  result = result.replace(/\[\]/g, "");
  result = result.replace(/\(\)/g, "");

  return result;
}

export interface CommitOptions {
  dryRun?: boolean;
  type?: string;
  scope?: string;
  message?: string;
  body?: string;
  breaking?: boolean;
  breakingDesc?: string;
  all?: boolean;
  files?: string;
  yes?: boolean;
}

export async function commitCommand(options: CommitOptions = {}): Promise<void> {
  try {
    const config = loadConfig();

    // Branch protection (skip if --yes is provided)
    if (isProtectedBranch() && !options.yes) {
      const branch = getBranch();
      console.log(yellow(`⚠ You are on ${bold(branch)}. Committing directly to protected branches is not recommended.`));
      const proceed = await confirm({
        message: `Continue committing to ${branch}?`,
        default: false,
      });
      if (!proceed) {
        console.log("Use: devflow branch");
        process.exit(0);
      }
    }

    // Stage files if --all or --files provided
    if (options.all) {
      if (!options.dryRun) {
        execSync("git add -A");
      }
    } else if (options.files) {
      const filesToStage = options.files.split(",").map((f) => f.trim());
      if (!options.dryRun) {
        for (const file of filesToStage) {
          execSync(`git add ${JSON.stringify(file)}`);
        }
      }
    }

    // Check for staged files
    const staged = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();
    const unstaged = execSync("git diff --name-only", { encoding: "utf-8" }).trim();
    const untracked = execSync("git ls-files --others --exclude-standard", { encoding: "utf-8" }).trim();

    const allChanges = [
      ...unstaged.split("\n").filter(Boolean).map((f) => ({ file: f, label: `M  ${f}` })),
      ...untracked.split("\n").filter(Boolean).map((f) => ({ file: f, label: `?  ${f}` })),
    ];

    if (!staged && allChanges.length === 0) {
      console.log("Nothing to commit — working tree clean.");
      process.exit(0);
    }

    let stagedFiles: string[] = staged ? staged.split("\n") : [];

    // Interactive file staging (only if no files staged and no --all/--files flags)
    if (!staged && !options.all && !options.files) {
      if (allChanges.length === 1) {
        if (options.yes) {
          // Auto-stage single file when --yes
          if (!options.dryRun) {
            execSync(`git add ${JSON.stringify(allChanges[0].file)}`);
          }
          stagedFiles = [allChanges[0].file];
        } else {
          const stageIt = await confirm({
            message: `Stage ${allChanges[0].file}?`,
            default: true,
          });
          if (!stageIt) {
            console.log("No files staged. Aborting.");
            process.exit(0);
          }
          if (!options.dryRun) {
            execSync(`git add ${JSON.stringify(allChanges[0].file)}`);
          }
          stagedFiles = [allChanges[0].file];
        }
      } else {
        if (options.yes) {
          // Auto-stage all files when --yes
          if (!options.dryRun) {
            execSync("git add -A");
          }
          stagedFiles = allChanges.map((c) => c.file);
        } else {
          const filesToStage = await checkbox({
            message: "Select files to stage:",
            choices: [
              { value: "__ALL__", name: "Stage all" },
              ...allChanges.map((c) => ({ value: c.file, name: c.label })),
            ],
            required: true,
          });

          if (!options.dryRun) {
            if (filesToStage.includes("__ALL__")) {
              execSync("git add -A");
              stagedFiles = allChanges.map((c) => c.file);
            } else {
              for (const file of filesToStage) {
                execSync(`git add ${JSON.stringify(file)}`);
              }
              stagedFiles = filesToStage;
            }
          } else {
            stagedFiles = filesToStage.includes("__ALL__")
              ? allChanges.map((c) => c.file)
              : filesToStage;
          }
        }
      }
    } else if (staged) {
      console.log(dim("Staged files:"));
      staged.split("\n").forEach((f) => console.log(dim(`  ${f}`)));
      console.log("");
    }

    // Get commit type (from flag or prompt)
    const type = options.type || await select({
      message: "Select commit type:",
      choices: config.commitTypes.map((t) => ({ value: t.value, name: t.label })),
    });

    // Get scope (from flag or prompt)
    let finalScope: string | undefined;

    if (options.scope !== undefined) {
      finalScope = options.scope;
    } else if (config.scopes.length > 0) {
      const inferredFromPaths = inferScopeFromPaths(stagedFiles, config.scopes);
      const inferredFromLog = inferScope();
      const inferred = inferredFromPaths || inferredFromLog;

      finalScope = await search({
        message: inferred
          ? `Select scope (suggested: ${cyan(inferred)}):`
          : "Select scope (type to filter):",
        source: (term) => {
          const filtered = config.scopes.filter(
            (s) =>
              !term ||
              s.value.includes(term.toLowerCase()) ||
              s.description.toLowerCase().includes(term.toLowerCase())
          );
          if (inferred) {
            filtered.sort((a, b) =>
              a.value === inferred ? -1 : b.value === inferred ? 1 : 0
            );
          }
          return filtered.map((s) => ({
            value: s.value,
            name: `${s.value} — ${s.description}`,
          }));
        },
      });
    } else {
      const inferredFromLog = inferScope();
      finalScope = await input({
        message: inferredFromLog
          ? `Enter scope (default: ${inferredFromLog}):`
          : "Enter scope (optional):",
        default: inferredFromLog,
      });
    }

    // Get message (from flag or prompt)
    let message: string;
    if (options.message) {
      message = options.message;
    } else {
      message = await input({
        message: "Enter commit message:",
        validate: (val) => val.trim().length > 0 || "Commit message is required",
      });
    }

    // Get breaking change status (from flag or prompt)
    let isBreaking: boolean;
    if (options.breaking !== undefined) {
      isBreaking = options.breaking;
    } else if (options.yes) {
      isBreaking = false;
    } else {
      isBreaking = await confirm({
        message: "Is this a breaking change?",
        default: false,
      });
    }

    const ticket = inferTicket();
    const breaking = isBreaking ? "!" : "";
    const scope = finalScope || "";

    const subject = formatCommitMessage(config.commitFormat, {
      type,
      ticket,
      breaking,
      scope,
      message: message.trim(),
    });

    // Get body (from flag or prompt)
    let body = options.body || "";
    if (!options.body && !options.yes) {
      const addBody = await confirm({
        message: "Add a longer description (body)?",
        default: false,
      });

      if (addBody) {
        body = await input({
          message: "Body (longer explanation):",
        });
      }
    }

    // Get breaking change description (from flag or prompt)
    let breakingFooter = "";
    if (isBreaking) {
      if (options.breakingDesc) {
        breakingFooter = options.breakingDesc;
      } else if (options.yes) {
        console.log(yellow("Warning: Breaking change without description. Use --breaking-desc to provide one."));
      } else {
        breakingFooter = await input({
          message: "Describe the breaking change:",
          validate: (val) => val.trim().length > 0 || "Breaking change description is required",
        });
      }
    }

    // Build full message
    const parts = [subject];
    if (body.trim()) parts.push(body.trim());
    const footers: string[] = [];
    if (breakingFooter.trim()) footers.push(`BREAKING CHANGE: ${breakingFooter.trim()}`);
    if (ticket && ticket !== "UNTRACKED") footers.push(`Refs: ${ticket}`);
    if (footers.length > 0) parts.push(footers.join("\n"));
    const fullMessage = parts.join("\n\n");

    console.log(`\n${dim("───")} ${bold("Commit Preview")} ${dim("───")}`);
    console.log(green(subject));
    if (body.trim()) console.log(`\n${body.trim()}`);
    if (footers.length > 0) console.log(`\n${dim(footers.join("\n"))}`);
    console.log(`${dim("───────────────────")}\n`);

    if (options.dryRun) {
      console.log(dim("[dry-run] No commit created."));
      return;
    }

    // Confirm (skip if --yes)
    if (!options.yes) {
      const confirmed = await confirm({
        message: "Create this commit?",
        default: true,
      });

      if (!confirmed) {
        console.log("Commit aborted.");
        process.exit(0);
      }
    }

    execSync(`git commit -m ${JSON.stringify(fullMessage)}`, {
      stdio: "inherit",
    });
    console.log(green("✓ Commit created successfully."));
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
