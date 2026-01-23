import { select, input, confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig } from "../config.js";
import { bold, dim, green, cyan } from "../colors.js";

export async function branchCommand(options: { dryRun?: boolean } = {}): Promise<void> {
  try {
    const config = loadConfig();

    const type = await select({
      message: "Select branch type:",
      choices: config.branchTypes.map((t) => ({ value: t, name: t })),
    });

    const ticket = await input({
      message: "Ticket number (leave blank for UNTRACKED):",
    });

    const description = await input({
      message: "Short description:",
      validate: (val) => val.trim().length > 0 || "Description is required",
    });

    const ticketPart = ticket.trim() || "UNTRACKED";
    const kebab = description
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const branchName = `${type}/${ticketPart}_${kebab}`;

    console.log(`\n${dim("───")} ${bold("Branch Preview")} ${dim("───")}`);
    console.log(cyan(branchName));
    console.log(`${dim("───────────────────")}\n`);

    if (options.dryRun) {
      console.log(dim("[dry-run] No branch created."));
      return;
    }

    const confirmed = await confirm({
      message: "Create this branch?",
      default: true,
    });

    if (!confirmed) {
      console.log("Aborted.");
      process.exit(0);
    }

    execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
    console.log(green(`✓ Branch created: ${branchName}`));
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
