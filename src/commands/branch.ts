import { select, input, confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig } from "../config.js";
import { bold, dim, green, cyan, gray } from "../colors.js";
import { setTestPlan } from "../test-plan.js";
import { createTicketProvider, inferBranchTypeFromLabels, Ticket } from "../providers/tickets.js";

export function formatBranchName(
  format: string,
  vars: { type: string; ticket?: string; description: string; scope?: string }
): string {
  let result = format;
  result = result.replace("{type}", vars.type);
  result = result.replace("{ticket}", vars.ticket || "");
  result = result.replace("{description}", vars.description);
  result = result.replace("{scope}", vars.scope || "");
  // Clean up empty parts: double slashes, leading/trailing slashes
  result = result.replace(/\/\//g, "/").replace(/^\/|\/$/g, "");
  // Clean up empty parts: double underscores, leading/trailing underscores
  result = result.replace(/__+/g, "_").replace(/^_|_$/g, "");
  // Clean up underscore next to slash
  result = result.replace(/\/_/g, "/").replace(/_\//g, "/");
  return result;
}

function toKebabCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatIssueChoice(ticket: Ticket): { value: Ticket; name: string } {
  const labels = ticket.labels.length > 0 ? gray(` (${ticket.labels.join(", ")})`) : "";
  return {
    value: ticket,
    name: `#${ticket.id} ${ticket.title}${labels}`,
  };
}

export interface BranchOptions {
  dryRun?: boolean;
  type?: string;
  ticket?: string;
  description?: string;
  testPlan?: string;
  yes?: boolean;
}

export async function branchCommand(options: BranchOptions = {}): Promise<void> {
  try {
    const config = loadConfig();
    const branchFormat = config.branchFormat;
    const needsTicket = branchFormat.includes("{ticket}");

    // Check if ticket provider is configured
    const ticketProvider = createTicketProvider(config.ticketProvider);

    let ticket: string | undefined;
    let selectedIssue: Ticket | undefined;
    let inferredType: string | undefined;
    let suggestedDescription: string | undefined;

    // Use ticket from flag if provided
    if (options.ticket !== undefined) {
      ticket = options.ticket.trim() || "UNTRACKED";
    } else if (ticketProvider && needsTicket) {
      // If provider is configured and format needs ticket, offer issue picker
      const ticketMethod = await select({
        message: "How do you want to select the ticket?",
        choices: [
          { value: "pick", name: "Pick from open issues (assigned to me)" },
          { value: "manual", name: "Enter manually" },
          { value: "skip", name: "Skip (UNTRACKED)" },
        ],
      });

      if (ticketMethod === "pick") {
        const issues = ticketProvider.listOpen({ assignee: "@me" });

        if (issues.length === 0) {
          console.log(dim("No open issues assigned to you. Falling back to manual input."));
          ticket = await input({
            message: "Ticket number (leave blank for UNTRACKED):",
          });
          ticket = ticket.trim() || "UNTRACKED";
        } else {
          selectedIssue = await select({
            message: "Select an issue:",
            choices: issues.map(formatIssueChoice),
          });

          ticket = selectedIssue.id;
          inferredType = inferBranchTypeFromLabels(selectedIssue.labels);
          suggestedDescription = toKebabCase(selectedIssue.title);

          if (inferredType) {
            console.log(dim(`  Inferred type from labels: ${cyan(inferredType)}`));
          }
        }
      } else if (ticketMethod === "manual") {
        ticket = await input({
          message: "Ticket number (leave blank for UNTRACKED):",
        });
        ticket = ticket.trim() || "UNTRACKED";
      } else {
        ticket = "UNTRACKED";
      }
    } else if (needsTicket) {
      // No provider, use manual input
      ticket = await input({
        message: "Ticket number (leave blank for UNTRACKED):",
      });
      ticket = ticket.trim() || "UNTRACKED";
    }

    // Get type from flag or prompt
    let type: string;
    if (options.type) {
      type = options.type;
    } else {
      const typeChoices = config.branchTypes.map((t) => ({ value: t, name: t }));
      const defaultType = inferredType && config.branchTypes.includes(inferredType) ? inferredType : undefined;

      type = await select({
        message: "Select branch type:",
        choices: typeChoices,
        default: defaultType,
      });
    }

    // Get description from flag or prompt
    let description: string;
    if (options.description) {
      description = options.description;
    } else {
      description = await input({
        message: "Short description:",
        default: suggestedDescription,
        validate: (val) => val.trim().length > 0 || "Description is required",
      });
    }

    const kebab = toKebabCase(description);

    const branchName = formatBranchName(branchFormat, {
      type,
      ticket,
      description: kebab,
    });

    console.log(`\n${dim("───")} ${bold("Branch Preview")} ${dim("───")}`);
    console.log(cyan(branchName));
    console.log(`${dim("───────────────────")}\n`);

    if (options.dryRun) {
      console.log(dim("[dry-run] No branch created."));
      return;
    }

    // Confirm (skip if --yes)
    if (!options.yes) {
      const confirmed = await confirm({
        message: "Create this branch?",
        default: true,
      });

      if (!confirmed) {
        console.log("Aborted.");
        process.exit(0);
      }
    }

    execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
    console.log(green(`✓ Branch created: ${branchName}`));

    // Handle test plan from flag or prompt
    if (options.testPlan) {
      const steps = options.testPlan.split("|").map((s) => s.trim()).filter(Boolean);
      if (steps.length > 0) {
        setTestPlan(branchName, steps);
        console.log(green(`✓ Saved ${steps.length} test plan step${steps.length > 1 ? "s" : ""}`));
      }
    } else if (!options.yes) {
      const addTestPlan = await confirm({
        message: "Add test plan steps for this branch?",
        default: false,
      });

      if (addTestPlan) {
        const steps: string[] = [];
        console.log(dim("\nAdd testing steps one at a time. Press Enter with empty text to finish.\n"));
        let adding = true;
        while (adding) {
          const step = await input({
            message: `Step ${steps.length + 1}${steps.length > 0 ? " (blank to finish)" : ""}:`,
          });
          if (!step.trim()) {
            adding = false;
          } else {
            steps.push(step.trim());
          }
        }
        if (steps.length > 0) {
          setTestPlan(branchName, steps);
          console.log(green(`✓ Saved ${steps.length} test plan step${steps.length > 1 ? "s" : ""}`));
          console.log(dim("  Edit later with: devflow test-plan"));
        }
      }
    }
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    process.exit(1);
  }
}
