import { select, input, confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig } from "../config.js";
import { bold, dim, green, cyan, gray } from "../colors.js";
import { setTestPlan } from "../test-plan.js";
import {
  createTicketProvider,
  inferBranchTypeFromLabels,
  parseAcceptanceCriteria,
  Ticket,
} from "../providers/tickets.js";
import { selectWithBack, inputWithBack, BACK_VALUE } from "../prompts.js";

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

async function promptForTestSteps(): Promise<string[]> {
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
  return steps;
}

export interface BranchOptions {
  dryRun?: boolean;
  type?: string;
  ticket?: string;
  description?: string;
  testPlan?: string;
  yes?: boolean;
}

interface BranchState {
  ticket: string;
  selectedIssue?: Ticket;
  inferredType?: string;
  suggestedDescription?: string;
  type: string;
  description: string;
}

export async function branchCommand(options: BranchOptions = {}): Promise<void> {
  try {
    const config = loadConfig();
    const branchFormat = config.branchFormat;
    const needsTicket = branchFormat.includes("{ticket}");
    const ticketProvider = createTicketProvider(config.ticketProvider);

    // Initialize state
    const state: BranchState = {
      ticket: options.ticket?.trim() || "",
      type: options.type || "",
      description: options.description || "",
    };

    // Step-based flow with back navigation
    type StepName = "ticketMethod" | "ticketInput" | "ticketPick" | "type" | "description";

    // Determine starting step
    let currentStep: StepName = "ticketMethod";
    if (options.ticket !== undefined) {
      state.ticket = options.ticket.trim() || "UNTRACKED";
      currentStep = "type";
    } else if (!ticketProvider || !needsTicket) {
      if (needsTicket) {
        currentStep = "ticketInput";
      } else {
        currentStep = "type";
      }
    }

    if (options.type) {
      state.type = options.type;
      if (currentStep === "type") currentStep = "description";
    }

    if (options.description) {
      state.description = options.description;
    }

    // Skip interactive flow if all options provided
    if (options.ticket !== undefined && options.type && options.description) {
      state.ticket = options.ticket.trim() || "UNTRACKED";
      // Skip to branch creation
    } else {
      // Interactive step flow
      while (currentStep !== undefined) {
        switch (currentStep) {
          case "ticketMethod": {
            const result = await selectWithBack({
              message: "How do you want to select the ticket?",
              choices: [
                { value: "pick", name: "Pick from open issues (assigned to me)" },
                { value: "manual", name: "Enter manually" },
                { value: "skip", name: "Skip (UNTRACKED)" },
              ],
              showBack: false, // First step, no back
            });

            if (result === "pick") {
              currentStep = "ticketPick";
            } else if (result === "manual") {
              currentStep = "ticketInput";
            } else {
              state.ticket = "UNTRACKED";
              currentStep = "type";
            }
            break;
          }

          case "ticketInput": {
            const showBack = ticketProvider && needsTicket;
            const result = await inputWithBack({
              message: "Ticket number (leave blank for UNTRACKED):",
              default: state.ticket !== "UNTRACKED" ? state.ticket : undefined,
              showBack,
            });

            if (result === BACK_VALUE) {
              currentStep = "ticketMethod";
            } else {
              state.ticket = result.trim() || "UNTRACKED";
              currentStep = options.type ? "description" : "type";
            }
            break;
          }

          case "ticketPick": {
            if (!ticketProvider) {
              currentStep = "ticketInput";
              break;
            }

            const issues = ticketProvider.listOpen({ assignee: "@me" });

            if (issues.length === 0) {
              console.log(dim("No open issues assigned to you. Falling back to manual input."));
              currentStep = "ticketInput";
              break;
            }

            const result = await selectWithBack({
              message: "Select an issue:",
              choices: issues.map(formatIssueChoice),
              showBack: true,
            });

            if (result === BACK_VALUE) {
              currentStep = "ticketMethod";
            } else {
              state.selectedIssue = result as Ticket;
              state.ticket = state.selectedIssue.id;
              state.inferredType = inferBranchTypeFromLabels(state.selectedIssue.labels);
              state.suggestedDescription = toKebabCase(state.selectedIssue.title);

              if (state.inferredType) {
                console.log(dim(`  Inferred type from labels: ${cyan(state.inferredType)}`));
              }
              currentStep = options.type ? "description" : "type";
            }
            break;
          }

          case "type": {
            if (options.type) {
              currentStep = "description";
              break;
            }

            const typeChoices = config.branchTypes.map((t) => ({ value: t, name: t }));
            const defaultType = state.inferredType && config.branchTypes.includes(state.inferredType)
              ? state.inferredType
              : state.type || undefined;

            // Determine if we can go back
            const canGoBack = needsTicket && !options.ticket;

            const result = await selectWithBack({
              message: "Select branch type:",
              choices: typeChoices,
              default: defaultType,
              showBack: canGoBack,
            });

            if (result === BACK_VALUE) {
              if (ticketProvider && needsTicket) {
                currentStep = state.selectedIssue ? "ticketPick" : "ticketMethod";
              } else if (needsTicket) {
                currentStep = "ticketInput";
              }
            } else {
              state.type = result;
              currentStep = "description";
            }
            break;
          }

          case "description": {
            if (options.description) {
              currentStep = undefined as unknown as StepName;
              break;
            }

            const result = await inputWithBack({
              message: "Short description:",
              default: state.suggestedDescription || state.description || undefined,
              validate: (val) => val.trim().length > 0 || "Description is required",
              showBack: true,
            });

            if (result === BACK_VALUE) {
              currentStep = options.type ? (needsTicket ? "ticketMethod" : "type") : "type";
            } else {
              state.description = result;
              currentStep = undefined as unknown as StepName;
            }
            break;
          }

          default:
            currentStep = undefined as unknown as StepName;
        }
      }
    }

    const kebab = toKebabCase(state.description);

    const branchName = formatBranchName(branchFormat, {
      type: state.type,
      ticket: state.ticket,
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
      const confirmResult = await selectWithBack({
        message: "Create this branch?",
        choices: [
          { value: "yes", name: "Yes, create branch" },
          { value: "no", name: "No, abort" },
        ],
        default: "yes",
        showBack: true,
      });

      if (confirmResult === BACK_VALUE) {
        // Restart the flow
        return branchCommand(options);
      }

      if (confirmResult !== "yes") {
        console.log("Aborted.");
        process.exit(0);
      }
    }

    // Check if branch already exists
    let branchExists = false;
    try {
      execSync(`git rev-parse --verify ${branchName}`, { stdio: "pipe" });
      branchExists = true;
    } catch {
      branchExists = false;
    }

    if (branchExists) {
      const action = await select({
        message: `Branch "${branchName}" already exists. What do you want to do?`,
        choices: [
          { value: "checkout", name: "Checkout the existing branch" },
          { value: "new", name: "Create with a different name" },
          { value: "abort", name: "Abort" },
        ],
      });

      if (action === "checkout") {
        execSync(`git checkout ${branchName}`, { stdio: "inherit" });
        console.log(green(`✓ Checked out existing branch: ${branchName}`));
      } else if (action === "new") {
        console.log("Aborted. Please run devflow branch again with a different description.");
        process.exit(0);
      } else {
        console.log("Aborted.");
        process.exit(0);
      }
    } else {
      execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
      console.log(green(`✓ Branch created: ${branchName}`));
    }

    // Handle test plan from flag or prompt
    if (options.testPlan) {
      const steps = options.testPlan.split("|").map((s) => s.trim()).filter(Boolean);
      if (steps.length > 0) {
        setTestPlan(branchName, steps);
        console.log(green(`✓ Saved ${steps.length} test plan step${steps.length > 1 ? "s" : ""}`));
      }
    } else if (!options.yes) {
      // Check if we have acceptance criteria from the issue
      const acceptanceCriteria = state.selectedIssue
        ? parseAcceptanceCriteria(state.selectedIssue.body)
        : [];

      if (acceptanceCriteria.length > 0) {
        // Show the acceptance criteria and ask for confirmation
        console.log(dim("\n  Test Plan (from Acceptance Criteria):"));
        acceptanceCriteria.forEach((item, i) => {
          console.log(dim(`  ${i + 1}. ${item}`));
        });
        console.log("");

        const useAC = await select({
          message: "Use these as test plan steps?",
          choices: [
            { value: "yes", name: "Yes, save test plan" },
            { value: "custom", name: "No, enter custom steps" },
            { value: "skip", name: "Skip test plan" },
          ],
        });

        if (useAC === "yes") {
          setTestPlan(branchName, acceptanceCriteria);
          console.log(green(`✓ Saved ${acceptanceCriteria.length} test plan step${acceptanceCriteria.length > 1 ? "s" : ""}`));
          console.log(dim("  Edit later with: devflow test-plan"));
        } else if (useAC === "custom") {
          const steps = await promptForTestSteps();
          if (steps.length > 0) {
            setTestPlan(branchName, steps);
            console.log(green(`✓ Saved ${steps.length} test plan step${steps.length > 1 ? "s" : ""}`));
            console.log(dim("  Edit later with: devflow test-plan"));
          }
        }
      } else {
        // No acceptance criteria found - ask if they want to add steps
        const addTestPlan = await select({
          message: "Add test plan steps?",
          choices: [
            { value: "add", name: "Add custom steps" },
            { value: "skip", name: "Skip" },
          ],
        });

        if (addTestPlan === "add") {
          const steps = await promptForTestSteps();
          if (steps.length > 0) {
            setTestPlan(branchName, steps);
            console.log(green(`✓ Saved ${steps.length} test plan step${steps.length > 1 ? "s" : ""}`));
            console.log(dim("  Edit later with: devflow test-plan"));
          }
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
