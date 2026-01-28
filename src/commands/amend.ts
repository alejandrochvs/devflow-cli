import { confirm, input, select, search } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig } from "../config.js";
import { inferTicket, inferScope } from "../git.js";
import { bold, dim, green, yellow, cyan } from "../colors.js";
import { selectWithBack, inputWithBack, confirmWithBack, searchWithBack, BACK_VALUE } from "../prompts.js";

function getLastCommitMessage(): string {
  return execSync("git log -1 --format=%s", { encoding: "utf-8" }).trim();
}

function parseCommitMessage(msg: string, format: string): {
  type?: string;
  ticket?: string;
  scope?: string;
  message?: string;
  breaking: boolean;
} {
  // Try to parse the default format: type[ticket]!(scope): message
  const match = msg.match(/^(\w+)\[([^\]]*)\](!?)\(([^)]*)\): (.+)$/);
  if (match) {
    return {
      type: match[1],
      ticket: match[2],
      breaking: match[3] === "!",
      scope: match[4],
      message: match[5],
    };
  }

  // Try standard conventional commit: type(scope): message
  const conventional = msg.match(/^(\w+)(!?)\(([^)]*)\): (.+)$/);
  if (conventional) {
    return {
      type: conventional[1],
      breaking: conventional[2] === "!",
      scope: conventional[3],
      message: conventional[4],
    };
  }

  // Fallback: treat whole thing as message
  return { message: msg, breaking: false };
}

export interface AmendOptions {
  dryRun?: boolean;
  type?: string;
  scope?: string;
  message?: string;
  breaking?: boolean;
  yes?: boolean;
}

interface AmendState {
  type: string;
  scope: string;
  message: string;
  isBreaking: boolean;
}

export async function amendCommand(options: AmendOptions = {}): Promise<void> {
  try {
    const config = loadConfig();
    const lastMessage = getLastCommitMessage();
    const parsed = parseCommitMessage(lastMessage, config.commitFormat);

    console.log(`\n${dim("Last commit:")} ${lastMessage}\n`);

    // Determine if we should edit (skip prompt if any edit flags provided or --yes)
    const hasEditFlags = !!(options.type || options.scope !== undefined || options.message || options.breaking !== undefined);
    let editMessage: boolean;
    if (hasEditFlags || options.yes) {
      editMessage = hasEditFlags;
    } else {
      editMessage = await confirm({
        message: "Edit commit message?",
        default: true,
      });
    }

    let newMessage = lastMessage;

    if (editMessage) {
      // Initialize state from parsed message
      const state: AmendState = {
        type: options.type || parsed.type || "",
        scope: options.scope ?? parsed.scope ?? "",
        message: options.message || parsed.message || "",
        isBreaking: options.breaking ?? parsed.breaking,
      };

      // Step-based flow with back navigation
      type StepName = "type" | "scope" | "message" | "breaking";
      let currentStep: StepName = "type";

      // Skip steps that have flags
      if (options.type) currentStep = "scope";

      while (currentStep !== undefined) {
        switch (currentStep) {
          case "type": {
            if (options.type) {
              currentStep = "scope";
              break;
            }

            const result = await selectWithBack({
              message: "Select commit type:",
              choices: config.commitTypes.map((t) => ({ value: t.value, name: t.label })),
              default: state.type,
              showBack: false, // First step
            });

            if (result === BACK_VALUE) {
              // Can't go back from first step
            } else {
              state.type = result;
              currentStep = "scope";
            }
            break;
          }

          case "scope": {
            if (options.scope !== undefined) {
              currentStep = "message";
              break;
            }

            if (config.scopes.length > 0) {
              const result = await searchWithBack({
                message: parsed.scope
                  ? `Select scope (current: ${cyan(parsed.scope)}):`
                  : "Select scope (type to filter):",
                source: (term) => {
                  const filtered = config.scopes.filter(
                    (s) =>
                      !term ||
                      s.value.includes(term.toLowerCase()) ||
                      s.description.toLowerCase().includes(term.toLowerCase())
                  );
                  if (parsed.scope) {
                    filtered.sort((a, b) =>
                      a.value === parsed.scope ? -1 : b.value === parsed.scope ? 1 : 0
                    );
                  }
                  return filtered.map((s) => ({
                    value: s.value,
                    name: `${s.value} — ${s.description}`,
                  }));
                },
                showBack: !options.type,
              });

              if (result === BACK_VALUE) {
                currentStep = "type";
              } else {
                state.scope = result;
                currentStep = "message";
              }
            } else {
              const result = await inputWithBack({
                message: "Enter scope (optional):",
                default: state.scope,
                showBack: !options.type,
              });

              if (result === BACK_VALUE) {
                currentStep = "type";
              } else {
                state.scope = result;
                currentStep = "message";
              }
            }
            break;
          }

          case "message": {
            if (options.message) {
              currentStep = "breaking";
              break;
            }

            const result = await inputWithBack({
              message: "Enter commit message:",
              default: state.message,
              validate: (val) => val.trim().length > 0 || "Commit message is required",
              showBack: true,
            });

            if (result === BACK_VALUE) {
              currentStep = options.scope !== undefined ? "type" : "scope";
            } else {
              state.message = result;
              currentStep = "breaking";
            }
            break;
          }

          case "breaking": {
            if (options.breaking !== undefined || options.yes) {
              currentStep = undefined as unknown as StepName;
              break;
            }

            const result = await confirmWithBack({
              message: "Is this a breaking change?",
              default: state.isBreaking,
              showBack: true,
            });

            if (result === BACK_VALUE) {
              currentStep = options.message ? "scope" : "message";
            } else {
              state.isBreaking = result;
              currentStep = undefined as unknown as StepName;
            }
            break;
          }

          default:
            currentStep = undefined as unknown as StepName;
        }
      }

      const ticket = parsed.ticket || inferTicket();
      const breaking = state.isBreaking ? "!" : "";
      const scope = state.scope || "";

      // Build using format
      let result = config.commitFormat;
      result = result.replace("{type}", state.type);
      result = result.replace("{ticket}", ticket);
      result = result.replace("{breaking}", breaking);
      result = result.replace("{scope}", scope);
      result = result.replace("{message}", state.message.trim());
      result = result.replace(/\[\]/g, "");
      result = result.replace(/\(\)/g, "");

      newMessage = result;
    }

    // Check for additional staged changes
    const staged = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();
    if (staged) {
      console.log(dim("\nStaged changes will be included:"));
      staged.split("\n").forEach((f) => console.log(dim(`  ${f}`)));
    }

    console.log(`\n${dim("───")} ${bold("Amend Preview")} ${dim("───")}`);
    console.log(`${dim("Before:")} ${yellow(lastMessage)}`);
    console.log(`${dim("After:")}  ${green(newMessage)}`);
    if (staged) {
      console.log(`${dim("Files:")}  +${staged.split("\n").length} staged`);
    }
    console.log(`${dim("───────────────────")}\n`);

    if (options.dryRun) {
      console.log(dim("[dry-run] No amend performed."));
      return;
    }

    // Confirm (skip if --yes)
    if (!options.yes) {
      const confirmResult = await selectWithBack({
        message: "Amend this commit?",
        choices: [
          { value: "yes", name: "Yes, amend commit" },
          { value: "no", name: "No, abort" },
        ],
        default: "yes",
        showBack: true,
      });

      if (confirmResult === BACK_VALUE) {
        return amendCommand(options);
      }

      if (confirmResult !== "yes") {
        console.log("Aborted.");
        process.exit(0);
      }
    }

    execSync(`git commit --amend -m ${JSON.stringify(newMessage)}`, {
      stdio: "inherit",
    });
    console.log(green("✓ Commit amended successfully."));
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
