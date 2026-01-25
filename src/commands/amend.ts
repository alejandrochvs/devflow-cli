import { confirm, input, select, search } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig } from "../config.js";
import { inferTicket, inferScope } from "../git.js";
import { bold, dim, green, yellow, cyan } from "../colors.js";

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
      // Get type from flag or prompt
      const type = options.type || await select({
        message: "Select commit type:",
        choices: config.commitTypes.map((t) => ({ value: t.value, name: t.label })),
        default: parsed.type,
      });

      // Get scope from flag or prompt
      let finalScope: string | undefined;
      if (options.scope !== undefined) {
        finalScope = options.scope;
      } else if (config.scopes.length > 0) {
        finalScope = await search({
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
        });
      } else {
        finalScope = await input({
          message: "Enter scope (optional):",
          default: parsed.scope,
        });
      }

      // Get message from flag or prompt
      let message: string;
      if (options.message) {
        message = options.message;
      } else {
        message = await input({
          message: "Enter commit message:",
          default: parsed.message,
          validate: (val) => val.trim().length > 0 || "Commit message is required",
        });
      }

      // Get breaking change status from flag or prompt
      let isBreaking: boolean;
      if (options.breaking !== undefined) {
        isBreaking = options.breaking;
      } else if (options.yes) {
        isBreaking = parsed.breaking;
      } else {
        isBreaking = await confirm({
          message: "Is this a breaking change?",
          default: parsed.breaking,
        });
      }

      const ticket = parsed.ticket || inferTicket();
      const breaking = isBreaking ? "!" : "";
      const scope = finalScope || "";

      // Build using format
      let result = config.commitFormat;
      result = result.replace("{type}", type);
      result = result.replace("{ticket}", ticket);
      result = result.replace("{breaking}", breaking);
      result = result.replace("{scope}", scope);
      result = result.replace("{message}", message.trim());
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
      const confirmed = await confirm({
        message: "Amend this commit?",
        default: true,
      });

      if (!confirmed) {
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
