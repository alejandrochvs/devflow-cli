import { execSync } from "child_process";
import { loadConfig, Scope } from "../config.js";
import { inferTicket, inferScope, getBranch, isProtectedBranch } from "../git.js";
import { bold, cyan, dim, green, yellow } from "../colors.js";
import {
  selectWithBack,
  inputWithBack,
  confirmWithBack,
  searchWithBack,
  checkboxWithBack,
  BACK_VALUE,
} from "../prompts.js";

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

interface CommitState {
  stagedFiles: string[];
  type: string;
  scope: string;
  message: string;
  isBreaking: boolean;
  body: string;
  breakingDesc: string;
}

export async function commitCommand(options: CommitOptions = {}): Promise<void> {
  try {
    const config = loadConfig();

    // Branch protection (skip if --yes is provided)
    if (isProtectedBranch() && !options.yes) {
      const branch = getBranch();
      console.log(yellow(`⚠ You are on ${bold(branch)}. Committing directly to protected branches is not recommended.`));
      const proceed = await confirmWithBack({
        message: `Continue committing to ${branch}?`,
        default: false,
        showBack: false,
      });
      if (proceed !== true) {
        console.log("Use: devflow branch");
        process.exit(0);
      }
    }

    // Stage files if --all or --files provided (non-interactive)
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

    // Initialize state
    const state: CommitState = {
      stagedFiles: [],
      type: options.type || "",
      scope: options.scope ?? "",
      message: options.message || "",
      isBreaking: options.breaking ?? false,
      body: options.body || "",
      breakingDesc: options.breakingDesc || "",
    };

    // Step-based flow with back navigation
    type StepName = "stageFiles" | "type" | "scope" | "message" | "breaking" | "body" | "breakingDesc";
    let currentStep: StepName = "stageFiles";
    const stepOrder: StepName[] = ["stageFiles", "type", "scope", "message", "breaking", "body", "breakingDesc"];

    // Determine starting step based on flags
    if (options.all || options.files) {
      // Files already staged via flags, skip to type
      const staged = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();
      state.stagedFiles = staged ? staged.split("\n") : [];
      currentStep = "type";
    }

    const goBack = () => {
      const currentIndex = stepOrder.indexOf(currentStep);
      if (currentIndex > 0) {
        currentStep = stepOrder[currentIndex - 1];
        // Skip breakingDesc if not breaking
        if (currentStep === "breakingDesc" && !state.isBreaking) {
          const prevIndex = stepOrder.indexOf(currentStep) - 1;
          if (prevIndex >= 0) currentStep = stepOrder[prevIndex];
        }
        // Skip stageFiles if files were staged via flags
        if (currentStep === "stageFiles" && (options.all || options.files)) {
          // Can't go back further
          currentStep = "type";
        }
      }
    };

    const goNext = () => {
      const currentIndex = stepOrder.indexOf(currentStep);
      if (currentIndex < stepOrder.length - 1) {
        currentStep = stepOrder[currentIndex + 1];
        // Skip breakingDesc if not breaking
        if (currentStep === "breakingDesc" && !state.isBreaking) {
          currentStep = stepOrder[stepOrder.indexOf(currentStep) + 1] as StepName || currentStep;
        }
      }
    };

    while (currentStep !== undefined) {
      const canGoBackToStageFiles = !options.all && !options.files && !options.yes;
      const isFirstStep = (currentStep === "stageFiles") || (currentStep === "type" && !canGoBackToStageFiles);

      switch (currentStep) {
        case "stageFiles": {
          // Check for staged files
          const staged = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();
          const unstaged = execSync("git diff --name-only", { encoding: "utf-8" }).trim();
          const untracked = execSync("git ls-files --others --exclude-standard", { encoding: "utf-8" }).trim();

          const allChanges = [
            ...unstaged.split("\n").filter(Boolean).map((f) => ({ file: f, label: `M  ${f}` })),
            ...untracked.split("\n").filter(Boolean).map((f) => ({ file: f, label: `?  ${f}` })),
          ];

          // If already have staged changes, skip to type
          if (staged) {
            state.stagedFiles = staged.split("\n");
            console.log(dim("Staged files:"));
            staged.split("\n").forEach((f) => console.log(dim(`  ${f}`)));
            console.log("");
            goNext();
            break;
          }

          if (allChanges.length === 0) {
            console.log("Nothing to commit — working tree clean.");
            process.exit(0);
          }

          if (options.yes) {
            // Auto-stage all files when --yes
            if (!options.dryRun) {
              execSync("git add -A");
            }
            state.stagedFiles = allChanges.map((c) => c.file);
            goNext();
            break;
          }

          if (allChanges.length === 1) {
            const result = await confirmWithBack({
              message: `Stage ${allChanges[0].file}?`,
              default: true,
              showBack: false, // First step
            });
            if (result !== true) {
              console.log("No files staged. Aborting.");
              process.exit(0);
            }
            if (!options.dryRun) {
              execSync(`git add ${JSON.stringify(allChanges[0].file)}`);
            }
            state.stagedFiles = [allChanges[0].file];
            goNext();
          } else {
            // Ask: stage all or select specific files?
            const stageChoice = await selectWithBack({
              message: "Stage files:",
              choices: [
                { value: "all", name: `Stage all (${allChanges.length} files)` },
                { value: "select", name: "Select specific files" },
              ],
              default: "all",
              showBack: false, // First step
            });

            if (stageChoice === BACK_VALUE) {
              // Can't go back from first step
              break;
            }

            if (stageChoice === "all") {
              if (!options.dryRun) {
                execSync("git add -A");
              }
              state.stagedFiles = allChanges.map((c) => c.file);
              goNext();
            } else {
              const filesToStage = await checkboxWithBack({
                message: "Select files to stage:",
                choices: allChanges.map((c) => ({ value: c.file, name: c.label })),
                required: true,
                showBack: true,
              });

              if (filesToStage === BACK_VALUE) {
                // Stay on this step to re-show the all/select choice
                break;
              }

              if (filesToStage.length === 0) {
                console.log("No files selected. Please select at least one file.");
                break;
              }

              if (!options.dryRun) {
                for (const file of filesToStage) {
                  execSync(`git add ${JSON.stringify(file)}`);
                }
              }
              state.stagedFiles = filesToStage;
              goNext();
            }
          }
          break;
        }

        case "type": {
          if (options.type) {
            goNext();
            break;
          }
          const result = await selectWithBack({
            message: "Select commit type:",
            choices: config.commitTypes.map((t) => ({ value: t.value, name: t.label })),
            showBack: canGoBackToStageFiles,
          });
          if (result === BACK_VALUE) {
            // Unstage files before going back
            execSync("git reset HEAD", { stdio: "ignore" });
            goBack();
          } else {
            state.type = result;
            goNext();
          }
          break;
        }

        case "scope": {
          if (options.scope !== undefined) {
            goNext();
            break;
          }

          if (config.scopes.length > 0) {
            const inferredFromPaths = inferScopeFromPaths(state.stagedFiles, config.scopes);
            const inferredFromLog = inferScope();
            const inferred = inferredFromPaths || inferredFromLog;

            const result = await searchWithBack({
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
              showBack: true,
            });

            if (result === BACK_VALUE) {
              goBack();
            } else {
              state.scope = result;
              goNext();
            }
          } else {
            const inferredFromLog = inferScope();
            const result = await inputWithBack({
              message: inferredFromLog
                ? `Enter scope (default: ${inferredFromLog}):`
                : "Enter scope (optional):",
              default: inferredFromLog,
              showBack: true,
            });

            if (result === BACK_VALUE) {
              goBack();
            } else {
              state.scope = result;
              goNext();
            }
          }
          break;
        }

        case "message": {
          if (options.message) {
            goNext();
            break;
          }
          const result = await inputWithBack({
            message: "Enter commit message:",
            default: state.message || undefined,
            validate: (val) => val.trim().length > 0 || "Commit message is required",
            showBack: true,
          });

          if (result === BACK_VALUE) {
            goBack();
          } else {
            state.message = result;
            goNext();
          }
          break;
        }

        case "breaking": {
          if (options.breaking !== undefined || options.yes) {
            state.isBreaking = options.breaking ?? false;
            goNext();
            break;
          }
          const result = await confirmWithBack({
            message: "Is this a breaking change?",
            default: state.isBreaking,
            showBack: true,
          });

          if (result === BACK_VALUE) {
            goBack();
          } else {
            state.isBreaking = result;
            goNext();
          }
          break;
        }

        case "body": {
          if (options.body || options.yes) {
            goNext();
            break;
          }
          const result = await confirmWithBack({
            message: "Add a longer description (body)?",
            default: false,
            showBack: true,
          });

          if (result === BACK_VALUE) {
            goBack();
          } else if (result) {
            const bodyResult = await inputWithBack({
              message: "Body (longer explanation):",
              default: state.body || undefined,
              showBack: true,
            });

            if (bodyResult === BACK_VALUE) {
              // Stay on this step
            } else {
              state.body = bodyResult;
              goNext();
            }
          } else {
            state.body = "";
            goNext();
          }
          break;
        }

        case "breakingDesc": {
          if (!state.isBreaking) {
            // Exit the loop - we're done collecting input
            currentStep = undefined as unknown as StepName;
            break;
          }

          if (options.breakingDesc) {
            currentStep = undefined as unknown as StepName;
            break;
          }

          if (options.yes) {
            console.log(yellow("Warning: Breaking change without description. Use --breaking-desc to provide one."));
            currentStep = undefined as unknown as StepName;
            break;
          }

          const result = await inputWithBack({
            message: "Describe the breaking change:",
            default: state.breakingDesc || undefined,
            validate: (val) => val.trim().length > 0 || "Breaking change description is required",
            showBack: true,
          });

          if (result === BACK_VALUE) {
            goBack();
          } else {
            state.breakingDesc = result;
            currentStep = undefined as unknown as StepName;
          }
          break;
        }

        default:
          currentStep = undefined as unknown as StepName;
      }

      // Check if we've passed the last step
      if (currentStep && stepOrder.indexOf(currentStep) >= stepOrder.length) {
        break;
      }
    }

    const ticket = inferTicket();
    const breaking = state.isBreaking ? "!" : "";
    const scope = state.scope || "";

    const subject = formatCommitMessage(config.commitFormat, {
      type: state.type,
      ticket,
      breaking,
      scope,
      message: state.message.trim(),
    });

    // Build full message
    const parts = [subject];
    if (state.body.trim()) parts.push(state.body.trim());
    const footers: string[] = [];
    if (state.breakingDesc.trim()) footers.push(`BREAKING CHANGE: ${state.breakingDesc.trim()}`);
    if (ticket && ticket !== "UNTRACKED") footers.push(`Refs: ${ticket}`);
    if (footers.length > 0) parts.push(footers.join("\n"));
    const fullMessage = parts.join("\n\n");

    console.log(`\n${dim("───")} ${bold("Commit Preview")} ${dim("───")}`);
    console.log(green(subject));
    if (state.body.trim()) console.log(`\n${state.body.trim()}`);
    if (footers.length > 0) console.log(`\n${dim(footers.join("\n"))}`);
    console.log(`${dim("───────────────────")}\n`);

    if (options.dryRun) {
      console.log(dim("[dry-run] No commit created."));
      return;
    }

    // Confirm (skip if --yes)
    let confirmed = true;
    if (!options.yes) {
      const confirmResult = await selectWithBack({
        message: "Create this commit?",
        choices: [
          { value: "yes", name: "Yes, create commit" },
          { value: "no", name: "No, abort" },
        ],
        default: "yes",
        showBack: true,
      });

      if (confirmResult === BACK_VALUE) {
        // Go back to breaking desc or body step
        return commitCommand(options); // Restart for simplicity (state is lost)
      }
      confirmed = confirmResult === "yes";
    }

    if (!confirmed) {
      console.log("Commit aborted.");
      process.exit(0);
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
