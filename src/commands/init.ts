import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { confirm, input } from "@inquirer/prompts";

const TEMPLATE = {
  ticketBaseUrl: "",
  scopes: [
    { value: "core", description: "Core functionality" },
    { value: "ui", description: "UI components" },
    { value: "api", description: "API layer" },
    { value: "config", description: "Configuration" },
    { value: "deps", description: "Dependencies" },
    { value: "ci", description: "CI/CD" },
  ],
  checklist: [
    "Code follows project conventions",
    "Self-reviewed the changes",
    "No new warnings or errors introduced",
  ],
};

export async function initCommand(): Promise<void> {
  try {
    const configPath = resolve(process.cwd(), ".devflow.json");

    if (existsSync(configPath)) {
      const overwrite = await confirm({
        message: ".devflow.json already exists. Overwrite?",
        default: false,
      });
      if (!overwrite) {
        console.log("Aborted.");
        process.exit(0);
      }
    }

    const ticketBaseUrl = await input({
      message: "Ticket base URL (e.g., https://github.com/org/repo/issues):",
    });

    const config = {
      ...TEMPLATE,
      ticketBaseUrl: ticketBaseUrl.trim() || undefined,
    };

    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
    console.log("Created .devflow.json");
    console.log("Edit this file to customize scopes, checklist items, and more.");
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
