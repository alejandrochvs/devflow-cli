import { select, search, confirm, input, checkbox } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig } from "../config.js";
import { inferTicket, inferScope } from "../git.js";

export async function commitCommand(): Promise<void> {
  try {
    const config = loadConfig();

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

    if (!staged) {
      if (allChanges.length === 1) {
        const stageIt = await confirm({
          message: `Stage ${allChanges[0].file}?`,
          default: true,
        });
        if (!stageIt) {
          console.log("No files staged. Aborting.");
          process.exit(0);
        }
        execSync(`git add ${JSON.stringify(allChanges[0].file)}`);
      } else {
        const filesToStage = await checkbox({
          message: "Select files to stage:",
          choices: [
            { value: "__ALL__", name: "Stage all" },
            ...allChanges.map((c) => ({ value: c.file, name: c.label })),
          ],
          required: true,
        });

        if (filesToStage.includes("__ALL__")) {
          execSync("git add -A");
        } else {
          for (const file of filesToStage) {
            execSync(`git add ${JSON.stringify(file)}`);
          }
        }
      }
    } else {
      console.log("Staged files:");
      staged.split("\n").forEach((f) => console.log(`  ${f}`));
      console.log("");
    }

    const type = await select({
      message: "Select commit type:",
      choices: config.commitTypes.map((t) => ({ value: t.value, name: t.label })),
    });

    let finalScope: string | undefined;

    if (config.scopes.length > 0) {
      const inferredScope = inferScope();
      finalScope = await search({
        message: inferredScope
          ? `Select scope (inferred: ${inferredScope}):`
          : "Select scope (type to filter):",
        source: (term) => {
          const filtered = config.scopes.filter(
            (s) =>
              !term ||
              s.value.includes(term.toLowerCase()) ||
              s.description.toLowerCase().includes(term.toLowerCase())
          );
          if (inferredScope) {
            filtered.sort((a, b) =>
              a.value === inferredScope ? -1 : b.value === inferredScope ? 1 : 0
            );
          }
          return filtered.map((s) => ({
            value: s.value,
            name: `${s.value} — ${s.description}`,
          }));
        },
      });
    } else {
      const inferredScope = inferScope();
      finalScope = await input({
        message: inferredScope
          ? `Enter scope (default: ${inferredScope}):`
          : "Enter scope (optional):",
        default: inferredScope,
      });
    }

    const message = await input({
      message: "Enter commit message:",
      validate: (val) => val.trim().length > 0 || "Commit message is required",
    });

    const isBreaking = await confirm({
      message: "Is this a breaking change?",
      default: false,
    });

    const ticket = inferTicket();
    const breaking = isBreaking ? "!" : "";
    const scopePart = finalScope ? `(${finalScope})` : "";
    const fullMessage = `${type}[${ticket}]${breaking}${scopePart}: ${message.trim()}`;

    console.log("\n--- Commit Preview ---");
    console.log(fullMessage);
    console.log("----------------------\n");

    const confirmed = await confirm({
      message: "Create this commit?",
      default: true,
    });

    if (!confirmed) {
      console.log("Commit aborted.");
      process.exit(0);
    }

    execSync(`git commit -m ${JSON.stringify(fullMessage)}`, {
      stdio: "inherit",
    });
    console.log("Commit created successfully.");
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
