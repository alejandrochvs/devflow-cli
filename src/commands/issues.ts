import { select, input, confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig, DevflowConfig } from "../config.js";
import { bold, dim, green, cyan, yellow, gray } from "../colors.js";
import { checkGhInstalled } from "../git.js";
import {
  getProjectContext,
  listProjectItems,
  updateItemStatus,
  assignIssue,
  getCurrentUser,
  ProjectItem,
  ProjectContext,
} from "../providers/projects.js";
import { formatBranchName } from "./branch.js";
import { inferBranchTypeFromLabels } from "../providers/tickets.js";
import {
  selectWithBack,
  inputWithBack,
  BACK_VALUE,
} from "../prompts.js";

export interface IssuesOptions {
  status?: string;
  available?: boolean;
  work?: boolean;
  issue?: string;
  branchDesc?: string;
  dryRun?: boolean;
  yes?: boolean;
}

function toKebabCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatStatus(status: string | null, config: DevflowConfig): string {
  if (!status || !config.project) return gray("No Status");

  const statuses = config.project.statuses;
  if (status === statuses.todo) return cyan(status);
  if (status === statuses.inProgress) return yellow(status);
  if (status === statuses.inReview) return green(status);
  if (status === statuses.done) return dim(status);
  return status;
}

function formatAssignees(assignees: string[]): string {
  if (assignees.length === 0) return dim("unassigned");
  return assignees.map((a) => `@${a}`).join(", ");
}

function displayItems(items: ProjectItem[], config: DevflowConfig, groupByStatus: boolean = true): void {
  if (items.length === 0) {
    console.log(dim("  No items found."));
    return;
  }

  if (groupByStatus && config.project) {
    const byStatus = new Map<string, ProjectItem[]>();
    for (const item of items) {
      const status = item.status || "No Status";
      if (!byStatus.has(status)) byStatus.set(status, []);
      byStatus.get(status)!.push(item);
    }

    // Order: Todo, In Progress, In Review, Done, others
    const statusOrder = [
      config.project.statuses.todo,
      config.project.statuses.inProgress,
      config.project.statuses.inReview,
      config.project.statuses.done,
    ];

    const sortedStatuses = [...byStatus.keys()].sort((a, b) => {
      const aIdx = statusOrder.indexOf(a);
      const bIdx = statusOrder.indexOf(b);
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });

    for (const status of sortedStatuses) {
      const statusItems = byStatus.get(status)!;
      console.log(`\n${bold(formatStatus(status, config))} (${statusItems.length})`);
      console.log(dim("─".repeat(40)));
      for (const item of statusItems) {
        const assigneeStr = formatAssignees(item.assignees);
        const labels = item.labels.length > 0 ? gray(` [${item.labels.join(", ")}]`) : "";
        console.log(`  ${cyan(`#${item.issueNumber}`)} ${item.title}${labels}`);
        console.log(`     ${dim("→")} ${assigneeStr}`);
      }
    }
  } else {
    for (const item of items) {
      const statusStr = formatStatus(item.status, config);
      const assigneeStr = formatAssignees(item.assignees);
      console.log(`  ${cyan(`#${item.issueNumber}`)} ${item.title}`);
      console.log(`     ${statusStr} ${dim("·")} ${assigneeStr}`);
    }
  }
}

async function listIssues(options: IssuesOptions, config: DevflowConfig, ctx: ProjectContext): Promise<void> {
  const allItems = listProjectItems(ctx.projectInfo.id, config.project!.statusField);

  let filteredItems = allItems;

  // Filter by status
  if (options.status) {
    const statusMap: Record<string, string> = {
      todo: config.project!.statuses.todo,
      "in-progress": config.project!.statuses.inProgress,
      "in-review": config.project!.statuses.inReview,
      done: config.project!.statuses.done,
    };

    const targetStatus = statusMap[options.status.toLowerCase()];
    if (targetStatus) {
      filteredItems = allItems.filter((item) => item.status === targetStatus);
    } else {
      console.error(yellow(`Unknown status: ${options.status}. Valid: todo, in-progress, in-review, done`));
      process.exit(1);
    }
  } else if (options.available) {
    // Show unassigned Todo items
    filteredItems = allItems.filter(
      (item) => item.status === config.project!.statuses.todo && item.assignees.length === 0
    );
  } else {
    // Default: show Todo and In Progress
    filteredItems = allItems.filter(
      (item) =>
        item.status === config.project!.statuses.todo ||
        item.status === config.project!.statuses.inProgress
    );
  }

  console.log(`\n${dim("───")} ${bold(ctx.projectInfo.title)} ${dim("───")}`);
  displayItems(filteredItems, config);
  console.log("");
}

async function startWork(options: IssuesOptions, config: DevflowConfig, ctx: ProjectContext): Promise<void> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error(yellow("Could not determine current GitHub user."));
    process.exit(1);
  }

  // State for the flow
  interface WorkState {
    selectedItem: ProjectItem | undefined;
    branchDesc: string;
    branchType: string;
    inferredType: string | undefined;
  }

  const state: WorkState = {
    selectedItem: undefined,
    branchDesc: options.branchDesc || "",
    branchType: "",
    inferredType: undefined,
  };

  // Load items for selection
  const allItems = listProjectItems(ctx.projectInfo.id, config.project!.statusField);
  const todoItems = allItems.filter((item) => item.status === config.project!.statuses.todo);

  // If issue specified via flag, pre-select it
  if (options.issue) {
    const issueNumber = parseInt(options.issue, 10);
    const item = allItems.find((i) => i.issueNumber === issueNumber);

    if (!item) {
      console.error(yellow(`Issue #${issueNumber} not found in project.`));
      process.exit(1);
    }
    state.selectedItem = item;
  }

  // Step-based flow with back navigation
  type StepName = "selectIssue" | "branchDesc" | "branchType" | "confirm";
  let currentStep: StepName = options.issue ? "branchDesc" : "selectIssue";

  // Skip steps based on provided options
  if (options.branchDesc) {
    state.branchDesc = options.branchDesc;
    currentStep = state.selectedItem ? "branchType" : "selectIssue";
  }

  while (currentStep !== undefined) {
    switch (currentStep) {
      case "selectIssue": {
        if (options.issue) {
          currentStep = "branchDesc";
          break;
        }

        if (todoItems.length === 0) {
          console.log(dim("No Todo items found in project."));
          process.exit(0);
        }

        const choices = todoItems.map((item) => ({
          value: item,
          name: `#${item.issueNumber} ${item.title} ${formatAssignees(item.assignees)}`,
        }));

        const result = await selectWithBack({
          message: "Select an issue to work on:",
          choices,
          showBack: false, // First step
        });

        if (result === BACK_VALUE) {
          // Can't go back from first step
        } else {
          state.selectedItem = result as ProjectItem;
          state.inferredType = inferBranchTypeFromLabels(state.selectedItem.labels);
          currentStep = "branchDesc";
        }
        break;
      }

      case "branchDesc": {
        if (!state.selectedItem) {
          currentStep = "selectIssue";
          break;
        }

        console.log(`\n${dim("───")} ${bold("Starting Work")} ${dim("───")}`);
        console.log(`${bold("Issue:")}  ${cyan(`#${state.selectedItem.issueNumber}`)} ${state.selectedItem.title}`);

        if (options.branchDesc) {
          currentStep = "branchType";
          break;
        }

        if (options.yes) {
          state.branchDesc = toKebabCase(state.selectedItem.title).slice(0, 50);
          currentStep = "branchType";
          break;
        }

        const result = await inputWithBack({
          message: "Branch description:",
          default: state.branchDesc || toKebabCase(state.selectedItem.title).slice(0, 50),
          validate: (val) => val.trim().length > 0 || "Description is required",
          showBack: !options.issue,
        });

        if (result === BACK_VALUE) {
          currentStep = "selectIssue";
        } else {
          state.branchDesc = result;
          currentStep = "branchType";
        }
        break;
      }

      case "branchType": {
        if (!state.selectedItem) {
          currentStep = "selectIssue";
          break;
        }

        // Check for inferred type
        if (state.inferredType && config.branchTypes.includes(state.inferredType)) {
          state.branchType = state.inferredType;
          console.log(dim(`  Inferred type from labels: ${cyan(state.branchType)}`));
          currentStep = "confirm";
          break;
        }

        if (options.yes) {
          state.branchType = "feat";
          currentStep = "confirm";
          break;
        }

        const result = await selectWithBack({
          message: "Branch type:",
          choices: config.branchTypes.map((t) => ({ value: t, name: t })),
          default: state.branchType || "feat",
          showBack: true,
        });

        if (result === BACK_VALUE) {
          currentStep = "branchDesc";
        } else {
          state.branchType = result;
          currentStep = "confirm";
        }
        break;
      }

      case "confirm": {
        if (!state.selectedItem) {
          currentStep = "selectIssue";
          break;
        }

        const branchName = formatBranchName(config.branchFormat, {
          type: state.branchType,
          ticket: `#${state.selectedItem.issueNumber}`,
          description: toKebabCase(state.branchDesc),
        });

        console.log(`${bold("Branch:")} ${cyan(branchName)}`);

        // Preview actions
        const isAssigned = state.selectedItem.assignees.includes(currentUser);
        const needsStatusChange = state.selectedItem.status !== config.project!.statuses.inProgress;

        console.log(`\n${bold("Actions:")}`);
        if (!isAssigned) console.log(`  ${dim("→")} Assign to @${currentUser}`);
        if (needsStatusChange) console.log(`  ${dim("→")} Move to "${config.project!.statuses.inProgress}"`);
        console.log(`  ${dim("→")} Create branch: ${branchName}`);
        console.log("");

        if (options.dryRun) {
          console.log(dim("[dry-run] No changes made."));
          return;
        }

        // Confirm
        if (!options.yes) {
          const confirmResult = await selectWithBack({
            message: "Proceed?",
            choices: [
              { value: "yes", name: "Yes, start working" },
              { value: "no", name: "No, abort" },
            ],
            default: "yes",
            showBack: true,
          });

          if (confirmResult === BACK_VALUE) {
            currentStep = state.inferredType ? "branchDesc" : "branchType";
            break;
          }

          if (confirmResult !== "yes") {
            console.log("Aborted.");
            process.exit(0);
          }
        }

        // Exit loop and execute actions
        currentStep = undefined as unknown as StepName;
        break;
      }

      default:
        currentStep = undefined as unknown as StepName;
    }
  }

  if (!state.selectedItem) {
    process.exit(0);
  }

  const selectedItem = state.selectedItem;
  const branchName = formatBranchName(config.branchFormat, {
    type: state.branchType,
    ticket: `#${selectedItem.issueNumber}`,
    description: toKebabCase(state.branchDesc),
  });

  // Preview actions
  const isAssigned = selectedItem.assignees.includes(currentUser);
  const needsStatusChange = selectedItem.status !== config.project!.statuses.inProgress;

  // Execute actions
  let success = true;

  // 1. Assign issue
  if (!isAssigned) {
    if (assignIssue(selectedItem.issueNumber, currentUser)) {
      console.log(green(`✓ Assigned #${selectedItem.issueNumber} to @${currentUser}`));
    } else {
      console.log(yellow(`⚠ Could not assign issue`));
      success = false;
    }
  }

  // 2. Move to In Progress
  if (needsStatusChange) {
    const optionId = ctx.statusOptions.get("inProgress");
    if (optionId && updateItemStatus(ctx.projectInfo.id, selectedItem.id, ctx.statusField.id, optionId)) {
      console.log(green(`✓ Moved to "${config.project!.statuses.inProgress}"`));
    } else {
      console.log(yellow(`⚠ Could not update status`));
      success = false;
    }
  }

  // 3. Create branch
  try {
    execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
    console.log(green(`✓ Branch created: ${branchName}`));
  } catch {
    console.log(yellow(`⚠ Could not create branch`));
    success = false;
  }

  if (success) {
    console.log(dim(`\nReady to work! Make changes, then: ${cyan("devflow commit")}`));
  }
}

export async function issuesCommand(options: IssuesOptions = {}): Promise<void> {
  try {
    checkGhInstalled();
    const config = loadConfig();

    if (!config.project?.enabled) {
      console.error(yellow("Project integration is not enabled."));
      console.error(dim("Add to .devflow/config.json:"));
      console.error(dim(`  "project": {`));
      console.error(dim(`    "enabled": true,`));
      console.error(dim(`    "number": 1,`));
      console.error(dim(`    "statusField": "Status",`));
      console.error(dim(`    "statuses": { "todo": "Todo", "inProgress": "In Progress", "inReview": "In Review", "done": "Done" }`));
      console.error(dim(`  }`));
      process.exit(1);
    }

    const ctx = getProjectContext(config.project);
    if (!ctx) {
      process.exit(1);
    }

    if (options.work) {
      await startWork(options, config, ctx);
    } else {
      await listIssues(options, config, ctx);
    }
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    throw error;
  }
}
