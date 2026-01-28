import { input, confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig, DevflowConfig } from "../config.js";
import { bold, dim, green, cyan, gray, yellow } from "../colors.js";
import {
  getBranch,
  parseBranch,
  getCommits,
  getScopesFromCommits,
  getDefaultBase,
  checkGhInstalled,
} from "../git.js";
import { getTestPlan } from "../test-plan.js";
import { moveIssueToStatus } from "../providers/projects.js";
import {
  selectWithBack,
  inputWithBack,
  confirmWithBack,
  BACK_VALUE,
} from "../prompts.js";

const TYPE_LABELS: Record<string, string> = {
  feat: "Feature (new functionality)",
  fix: "Bug fix (non-breaking fix)",
  refactor: "Refactor (no functional changes)",
  hotfix: "Bug fix (non-breaking fix)",
  chore: "Chore (deps, CI, configs, docs)",
  docs: "Chore (deps, CI, configs, docs)",
  test: "Chore (deps, CI, configs, docs)",
  release: "Chore (deps, CI, configs, docs)",
};

const BRANCH_TYPE_TO_LABEL: Record<string, { name: string; color: string }> = {
  feat: { name: "feature", color: "0E8A16" },
  fix: { name: "bug", color: "D73A4A" },
  hotfix: { name: "bug", color: "D73A4A" },
  refactor: { name: "refactor", color: "1D76DB" },
  chore: { name: "chore", color: "FEF2C0" },
  docs: { name: "documentation", color: "0075CA" },
  test: { name: "test", color: "BFD4F2" },
  release: { name: "release", color: "6F42C1" },
};

interface TicketFormatOptions {
  ticket: string;
  ticketBaseUrl?: string;
  ticketProvider?: { type: string };
}

function formatTicket(opts: TicketFormatOptions): string {
  const { ticket, ticketBaseUrl, ticketProvider } = opts;

  if (ticket === "UNTRACKED") return "UNTRACKED";

  // If using GitHub provider and ticket is numeric, use "Closes #N" syntax
  if (ticketProvider?.type === "github") {
    // Remove # prefix if present, check if numeric
    const numericTicket = ticket.replace(/^#/, "");
    if (/^\d+$/.test(numericTicket)) {
      return `Closes #${numericTicket}`;
    }
  }

  // Fallback to link format
  if (!ticketBaseUrl) return ticket;
  return `[${ticket}](${ticketBaseUrl}/${ticket})`;
}

function ensureLabel(label: { name: string; color: string }): void {
  try {
    execSync(
      `gh label create ${JSON.stringify(label.name)} --color ${label.color} --force`,
      { stdio: "ignore" }
    );
  } catch {
    // Label might already exist
  }
}

function getExistingPr(): { url: string; number: number } | undefined {
  try {
    const result = execSync("gh pr view --json url,number", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    return JSON.parse(result);
  } catch {
    return undefined;
  }
}

function buildChecklist(items: string[]): string {
  return items.map((c) => `- [ ] ${c}`).join("\n");
}

function buildTypeCheckboxes(type: string | undefined): string {
  const types = [
    { key: "feat", label: "Feature (new functionality)" },
    { key: "fix", label: "Bug fix (non-breaking fix)" },
    { key: "refactor", label: "Refactor (no functional changes)" },
    { key: "breaking", label: "Breaking change (fix or feature that would cause existing functionality to change)" },
    { key: "chore", label: "Chore (deps, CI, configs, docs)" },
  ];
  return types
    .map((t) => {
      const checked = TYPE_LABELS[type || ""] === t.label ? "x" : " ";
      return `- [${checked}] ${t.label}`;
    })
    .join("\n");
}

function buildTestPlanSection(steps: string[]): string {
  if (steps.length > 0) {
    return `## Test Plan\n\n${steps.map((s) => `- [ ] ${s}`).join("\n")}`;
  }
  return `## Test Plan\n\n- [ ] <!-- Add testing steps -->`;
}

function buildPrBody(
  config: DevflowConfig,
  opts: { summary: string; ticket: string; type: string | undefined; commitList: string; testPlanSteps: string[] }
): string {
  const ticketFormatted = formatTicket({
    ticket: opts.ticket,
    ticketBaseUrl: config.ticketBaseUrl,
    ticketProvider: config.ticketProvider,
  });

  const sections: Record<string, string> = {
    summary: `## Summary\n\n${opts.summary || "<!-- Brief description of what this PR does and why -->"}`,
    ticket: `## Ticket\n\n${ticketFormatted}`,
    type: `## Type of Change\n\n${buildTypeCheckboxes(opts.type)}`,
    screenshots: `## Screenshots\n\n<!-- Add before/after screenshots for UI changes, or remove this section if not applicable -->\n\n| Before | After |\n|--------|-------|\n|        |       |`,
    testPlan: buildTestPlanSection(opts.testPlanSteps),
    checklist: `## Checklist\n\n${buildChecklist(config.checklist)}`,
  };

  const activeSections = config.prTemplate.sections;
  return activeSections
    .map((key) => sections[key])
    .filter(Boolean)
    .join("\n\n");
}

export interface PrOptions {
  dryRun?: boolean;
  title?: string;
  summary?: string;
  base?: string;
  yes?: boolean;
  ready?: boolean;
}

export async function prCommand(options: PrOptions = {}): Promise<void> {
  try {
    const config = loadConfig();
    checkGhInstalled();

    const branch = getBranch();
    const { type, ticket, description } = parseBranch(branch);
    const existingPr = getExistingPr();

    if (existingPr && !options.yes) {
      console.log(`\n${cyan(`PR #${existingPr.number}`)} already exists: ${existingPr.url}`);
      const shouldUpdate = await confirmWithBack({
        message: "Update this PR?",
        default: true,
        showBack: false,
      });
      if (shouldUpdate !== true) {
        process.exit(0);
      }
    }

    const defaultBase = getDefaultBase(branch);

    // State for the flow
    interface PrState {
      base: string;
      title: string;
      summaryInput: string;
    }

    const state: PrState = {
      base: options.base || "",
      title: options.title || "",
      summaryInput: options.summary ?? "",
    };

    // Step-based flow with back navigation
    type StepName = "base" | "title" | "summary" | "preview";
    let currentStep: StepName = "base";

    // Skip steps based on provided options
    if (options.base) {
      state.base = options.base;
      currentStep = "title";
    }
    if (options.title) {
      state.title = options.title;
      if (currentStep === "title") currentStep = "summary";
    }
    if (options.summary !== undefined || options.yes) {
      state.summaryInput = options.summary ?? "";
      if (currentStep === "summary") currentStep = "preview";
    }

    // Interactive step flow
    while (currentStep !== undefined) {
      switch (currentStep) {
        case "base": {
          if (options.base) {
            currentStep = "title";
            break;
          }
          const result = await inputWithBack({
            message: "Base branch:",
            default: state.base || defaultBase,
            validate: (val) => val.trim().length > 0 || "Base branch is required",
            showBack: false, // First step
          });

          if (result === BACK_VALUE) {
            // Can't go back from first step
          } else {
            state.base = result;
            currentStep = "title";
          }
          break;
        }

        case "title": {
          if (options.title) {
            currentStep = "summary";
            break;
          }
          const result = await inputWithBack({
            message: "PR title:",
            default: state.title || `${description.charAt(0).toUpperCase() + description.slice(1)}`,
            validate: (val) => val.trim().length > 0 || "Title is required",
            showBack: !options.base,
          });

          if (result === BACK_VALUE) {
            currentStep = "base";
          } else {
            state.title = result;
            currentStep = "summary";
          }
          break;
        }

        case "summary": {
          if (options.summary !== undefined || options.yes) {
            currentStep = "preview";
            break;
          }
          const result = await inputWithBack({
            message: "PR summary (optional, leave blank to use commits only):",
            default: state.summaryInput || undefined,
            showBack: true,
          });

          if (result === BACK_VALUE) {
            currentStep = options.title ? "base" : "title";
          } else {
            state.summaryInput = result;
            currentStep = "preview";
          }
          break;
        }

        case "preview": {
          // Exit the loop to continue with preview and creation
          currentStep = undefined as unknown as StepName;
          break;
        }

        default:
          currentStep = undefined as unknown as StepName;
      }
    }

    const commits = getCommits(state.base.trim());
    const commitList = commits.length > 0
      ? commits.map((c) => `- ${c}`).join("\n")
      : "";

    const summary = [state.summaryInput.trim(), commitList]
      .filter(Boolean)
      .join("\n\n");

    const testPlanSteps = getTestPlan(branch);
    const body = buildPrBody(config, { summary, ticket, type, commitList, testPlanSteps });

    // Use state values for the rest of the function
    const base = state.base;
    const title = state.title;

    // Build preview labels
    const previewLabels: string[] = [];
    if (type && BRANCH_TYPE_TO_LABEL[type]) previewLabels.push(BRANCH_TYPE_TO_LABEL[type].name);
    const previewScopes = getScopesFromCommits(commits);
    previewLabels.push(...previewScopes);
    const uniquePreviewLabels = [...new Set(previewLabels)];

    console.log(`\n${dim("───")} ${bold("PR Preview")} ${dim("───")}`);
    if (existingPr) {
      console.log(gray(`(Updating existing PR #${existingPr.number})`));
    }
    console.log(`${dim("Title:")}    ${bold(title)}`);
    console.log(`${dim("Branch:")}   ${cyan(branch)} → ${cyan(base.trim())}`);
    console.log(`${dim("Labels:")}   ${uniquePreviewLabels.length > 0 ? uniquePreviewLabels.join(", ") : "none"}`);
    console.log(`${dim("Assignee:")} @me`);
    if (config.prReviewers && config.prReviewers.length > 0) {
      console.log(`${dim("Reviewers:")} ${config.prReviewers.join(", ")}`);
    }
    console.log("");
    console.log(dim(body));
    console.log(`${dim("─────────────────")}\n`);

    if (options.dryRun) {
      console.log(dim("[dry-run] No PR created."));
      return;
    }

    // Confirm (skip if --yes)
    if (!options.yes) {
      const confirmResult = await selectWithBack({
        message: existingPr
          ? `Update PR #${existingPr.number}?`
          : "Create this PR?",
        choices: [
          { value: "yes", name: existingPr ? "Yes, update PR" : "Yes, create PR" },
          { value: "no", name: "No, abort" },
        ],
        default: "yes",
        showBack: true,
      });

      if (confirmResult === BACK_VALUE) {
        // Restart the flow
        return prCommand(options);
      }

      if (confirmResult !== "yes") {
        console.log("Aborted.");
        process.exit(0);
      }
    }

    // Push branch if needed
    try {
      execSync(`git push -u origin ${branch}`, { stdio: "inherit" });
    } catch {
      // Already pushed or push failed
    }

    // Collect all labels
    const labels: string[] = [];
    const labelInfo = type ? BRANCH_TYPE_TO_LABEL[type] : undefined;
    if (labelInfo) {
      ensureLabel(labelInfo);
      labels.push(labelInfo.name);
    }
    const scopes = getScopesFromCommits(commits);
    for (const scope of scopes) {
      ensureLabel({ name: scope, color: "EDEDED" });
      labels.push(scope);
    }
    const uniqueLabels = [...new Set(labels)];
    const labelFlag = uniqueLabels.length > 0
      ? uniqueLabels.map((l) => JSON.stringify(l)).join(",")
      : "";

    // Reviewers flag
    const reviewerFlag = config.prReviewers && config.prReviewers.length > 0
      ? ` --reviewer ${config.prReviewers.join(",")}`
      : "";

    // Draft flag (unless --ready is specified)
    const draftFlag = options.ready ? "" : " --draft";

    if (existingPr) {
      execSync(
        `gh pr edit ${existingPr.number} --title ${JSON.stringify(title)} --body-file -${labelFlag ? ` --add-label ${labelFlag}` : ""}`,
        { input: body, stdio: ["pipe", "inherit", "inherit"] }
      );
      console.log(green(`✓ PR #${existingPr.number} updated: ${existingPr.url}`));
    } else {
      execSync(
        `gh pr create${draftFlag} --title ${JSON.stringify(title)} --body-file - --base ${base.trim()} --head ${branch} --assignee @me${reviewerFlag}${labelFlag ? ` --label ${labelFlag}` : ""}`,
        { input: body, stdio: ["pipe", "inherit", "inherit"] }
      );
      console.log(green("✓ PR created successfully."));
    }

    // Move linked issue to "In Review" if project integration is enabled
    if (config.project?.enabled && ticket && ticket !== "UNTRACKED") {
      try {
        const issueNumber = ticket.replace(/^#/, "");
        if (/^\d+$/.test(issueNumber)) {
          const success = moveIssueToStatus(parseInt(issueNumber, 10), "inReview", config.project);
          if (success) {
            console.log(dim(`  Moved issue #${issueNumber} to "${config.project.statuses.inReview}"`));
          }
        }
      } catch {
        // Non-fatal: don't fail PR creation if project update fails
        console.log(yellow("  ⚠ Could not update issue status"));
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
