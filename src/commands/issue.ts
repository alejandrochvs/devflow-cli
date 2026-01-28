import { select, input, confirm, editor } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig, IssueType, IssueField } from "../config.js";
import { bold, dim, green, cyan, gray } from "../colors.js";
import { checkGhInstalled } from "../git.js";
import { setTestPlan } from "../test-plan.js";
import { formatBranchName } from "./branch.js";
import { assignIssue, getCurrentUser } from "../providers/projects.js";
import {
  selectWithBack,
  inputWithBack,
  confirmWithBack,
  BACK_VALUE,
} from "../prompts.js";

interface IssueData {
  type: IssueType;
  title: string;
  body: string;
  labels: string[];
}

async function collectList(prompt: string): Promise<string[]> {
  console.log(dim(`\n${prompt} (one per line). Empty line to finish:\n`));
  const items: string[] = [];
  let adding = true;
  while (adding) {
    const item = await input({
      message: `  ${items.length + 1}.${items.length > 0 ? " (blank to finish)" : ""}`,
    });
    if (!item.trim()) {
      adding = false;
    } else {
      items.push(item.trim());
    }
  }
  return items;
}

async function collectFieldValue(
  field: IssueField,
  showBack: boolean,
  currentValue?: string | string[]
): Promise<string | string[] | typeof BACK_VALUE> {
  switch (field.type) {
    case "input": {
      const result = await inputWithBack({
        message: field.prompt,
        default: typeof currentValue === "string" ? currentValue : undefined,
        validate: field.required ? (val) => val.trim().length > 0 || "Required" : undefined,
        showBack,
      });
      return result;
    }

    case "multiline":
      // Editor doesn't support back navigation easily, use input with note
      if (showBack) {
        const result = await inputWithBack({
          message: `${field.prompt} (single line, or use editor for multiline)`,
          default: typeof currentValue === "string" ? currentValue : undefined,
          validate: field.required ? (val) => val.trim().length > 0 || "Required" : undefined,
          showBack,
        });
        return result;
      }
      return await editor({
        message: field.prompt,
        validate: field.required ? (val) => val.trim().length > 0 || "Required" : undefined,
      });

    case "select": {
      if (!field.options || field.options.length === 0) {
        const result = await inputWithBack({
          message: field.prompt,
          default: typeof currentValue === "string" ? currentValue : undefined,
          showBack,
        });
        return result;
      }
      const result = await selectWithBack({
        message: field.prompt,
        choices: field.options.map((opt) => ({ value: opt, name: opt })),
        default: typeof currentValue === "string" ? currentValue : undefined,
        showBack,
      });
      return result;
    }

    case "list":
      // For lists, show back option before collecting
      if (showBack) {
        const goBack = await selectWithBack({
          message: field.prompt,
          choices: [{ value: "continue", name: "Continue to add items" }],
          showBack: true,
        });
        if (goBack === BACK_VALUE) return BACK_VALUE;
      }
      return await collectList(field.prompt);

    default: {
      const result = await inputWithBack({
        message: field.prompt,
        default: typeof currentValue === "string" ? currentValue : undefined,
        showBack,
      });
      return result;
    }
  }
}

function applyTemplate(template: string, values: Record<string, string | string[]>): string {
  let result = template;

  // Handle conditional sections: {field:section:Title}
  // These only appear if the field has a value
  const sectionRegex = /\{(\w+):section:([^}]+)\}/g;
  result = result.replace(sectionRegex, (_, fieldName, sectionTitle) => {
    const value = values[fieldName];
    if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === "string" && !value.trim())) {
      return "";
    }
    if (Array.isArray(value)) {
      return `\n### ${sectionTitle}\n${value.map((v, i) => `${i + 1}. ${v}`).join("\n")}`;
    }
    return `\n### ${sectionTitle}\n${value}`;
  });

  // Handle list as checkboxes: {field:checkbox}
  const checkboxRegex = /\{(\w+):checkbox\}/g;
  result = result.replace(checkboxRegex, (_, fieldName) => {
    const value = values[fieldName];
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return "";
    }
    if (Array.isArray(value)) {
      return value.map((v) => `- [ ] ${v}`).join("\n");
    }
    return `- [ ] ${value}`;
  });

  // Handle list as numbered: {field:numbered}
  const numberedRegex = /\{(\w+):numbered\}/g;
  result = result.replace(numberedRegex, (_, fieldName) => {
    const value = values[fieldName];
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return "";
    }
    if (Array.isArray(value)) {
      return value.map((v, i) => `${i + 1}. ${v}`).join("\n");
    }
    return `1. ${value}`;
  });

  // Handle simple placeholders: {field}
  const simpleRegex = /\{(\w+)\}/g;
  result = result.replace(simpleRegex, (_, fieldName) => {
    const value = values[fieldName];
    if (value === undefined || value === null) return "";
    if (Array.isArray(value)) {
      return value.join("\n");
    }
    return String(value);
  });

  // Clean up multiple blank lines
  result = result.replace(/\n{3,}/g, "\n\n").trim();

  return result;
}

async function collectIssueData(issueType: IssueType): Promise<{ title: string; body: string; values: Record<string, string | string[]> } | typeof BACK_VALUE> {
  const values: Record<string, string | string[]> = {};
  const fields = issueType.fields;

  // Step through fields with back navigation
  let fieldIndex = 0;
  while (fieldIndex < fields.length) {
    const field = fields[fieldIndex];
    const isFirst = fieldIndex === 0;
    const currentValue = values[field.name];

    const result = await collectFieldValue(field, !isFirst, currentValue);

    if (result === BACK_VALUE) {
      if (fieldIndex > 0) {
        fieldIndex--;
      } else {
        // At first field, return back to issue type selection
        return BACK_VALUE;
      }
    } else {
      values[field.name] = result;
      fieldIndex++;
    }
  }

  // Apply template with collected values
  const body = applyTemplate(issueType.template, values);

  // Generate a default title suggestion from the first required field
  const titleField = issueType.fields.find((f) => f.required) || issueType.fields[0];
  const titleValue = values[titleField?.name || ""];
  const defaultTitle = Array.isArray(titleValue) ? titleValue[0] || "" : String(titleValue || "").trim();

  // Prompt for explicit title with back navigation
  const titleResult = await inputWithBack({
    message: "Issue title:",
    default: defaultTitle,
    validate: (val) => val.trim().length > 0 || "Title is required",
    showBack: true,
  });

  if (titleResult === BACK_VALUE) {
    // Go back to last field - recursively handle this by going back one field
    // We need to re-collect from the last field
    const lastField = fields[fields.length - 1];
    const lastResult = await collectFieldValue(lastField, true, values[lastField.name]);
    if (lastResult === BACK_VALUE) {
      // User wants to go further back, restart the whole collection
      return collectIssueData(issueType);
    }
    values[lastField.name] = lastResult;
    // Now re-prompt for title
    return collectIssueData(issueType);
  }

  return { title: titleResult, body, values };
}

function ensureLabelsExist(labels: string[]): void {
  for (const label of labels) {
    try {
      // Check if label exists
      execSync(`gh label list --search "${label}" --json name`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Parse results to see if exact match exists
      const result = execSync(`gh label list --search "${label}" --json name`, {
        encoding: "utf-8",
      });
      const existingLabels = JSON.parse(result) as { name: string }[];
      const exactMatch = existingLabels.some((l) => l.name.toLowerCase() === label.toLowerCase());

      if (!exactMatch) {
        // Create the label with a default color
        console.log(dim(`Creating label "${label}"...`));
        execSync(`gh label create "${label}" --color "0e8a16" --force`, {
          stdio: ["pipe", "pipe", "pipe"],
        });
      }
    } catch {
      // Label doesn't exist or error checking, try to create it
      try {
        console.log(dim(`Creating label "${label}"...`));
        execSync(`gh label create "${label}" --color "0e8a16" --force`, {
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch {
        // If we can't create the label, we'll let the issue creation fail with the original error
        console.warn(dim(`Warning: Could not create label "${label}"`));
      }
    }
  }
}

function formatIssuePreview(data: IssueData): string {
  const lines = [
    `${dim("───")} ${bold("Issue Preview")} ${dim("───")}`,
    "",
    `${bold("Type:")}   ${data.type.label}`,
    `${bold("Title:")}  ${cyan(data.title)}`,
    `${bold("Labels:")} ${data.labels.join(", ")}`,
    "",
    gray("─── Body ───"),
    "",
    data.body,
    "",
    dim("─────────────────────"),
  ];
  return lines.join("\n");
}

export interface IssueOptions {
  dryRun?: boolean;
  type?: string;
  title?: string;
  body?: string;
  json?: string;
  createBranch?: boolean;
  branchDesc?: string;
  yes?: boolean;
}

export async function issueCommand(options: IssueOptions = {}): Promise<void> {
  try {
    checkGhInstalled();
    const config = loadConfig();
    const issueTypes = config.issueTypes;
    const branchFormat = config.branchFormat;

    // State for the flow
    let issueType: IssueType | undefined;
    let title: string = "";
    let body: string = "";
    let collectedValues: Record<string, string | string[]> = {};

    // Step-based flow with back navigation
    type StepName = "type" | "fields" | "preview";
    let currentStep: StepName = "type";

    // Skip type step if provided via flag
    if (options.type) {
      const found = issueTypes.find((t) => t.value === options.type);
      if (!found) {
        console.error(`Unknown issue type: ${options.type}. Available types: ${issueTypes.map((t) => t.value).join(", ")}`);
        process.exit(1);
      }
      issueType = found;
      currentStep = "fields";
    }

    // Skip fields if --title and --body provided
    if (options.title && options.body) {
      title = options.title;
      body = options.body;
      currentStep = "preview";
    } else if (options.json && issueType) {
      // Parse JSON and apply template
      try {
        collectedValues = JSON.parse(options.json) as Record<string, string | string[]>;
        body = applyTemplate(issueType.template, collectedValues);
        const titleField = issueType.fields.find((f) => f.required) || issueType.fields[0];
        const titleValue = collectedValues[titleField?.name || ""];
        title = options.title || (Array.isArray(titleValue) ? titleValue[0] || "" : String(titleValue || "").trim());
        currentStep = "preview";
      } catch {
        console.error("Invalid JSON provided to --json flag");
        process.exit(1);
      }
    }

    // Interactive step flow
    while (currentStep !== undefined) {
      switch (currentStep) {
        case "type": {
          const result = await selectWithBack({
            message: "Select issue type:",
            choices: issueTypes.map((t) => ({
              value: t,
              name: t.label,
            })),
            showBack: false, // First step
          });

          if (result === BACK_VALUE) {
            // Can't go back from first step
          } else {
            issueType = result as IssueType;
            currentStep = "fields";
          }
          break;
        }

        case "fields": {
          if (!issueType) {
            currentStep = "type";
            break;
          }

          console.log("");
          const collected = await collectIssueData(issueType);

          if (collected === BACK_VALUE) {
            // Go back to type selection (only if type wasn't provided via flag)
            if (!options.type) {
              currentStep = "type";
            }
            // If type was provided via flag, stay on fields
          } else {
            title = options.title || collected.title;
            body = collected.body;
            collectedValues = collected.values;
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

    if (!issueType) {
      console.log("Aborted.");
      process.exit(0);
    }

    // Determine labels
    const labels = [issueType.labelColor];

    // Build issue data
    const issueData: IssueData = {
      type: issueType,
      title,
      body,
      labels,
    };

    // Preview
    console.log("\n" + formatIssuePreview(issueData));

    if (options.dryRun) {
      console.log(dim("[dry-run] No issue created."));
      return;
    }

    // Confirm (skip if --yes)
    if (!options.yes) {
      const confirmResult = await selectWithBack({
        message: "Create this issue?",
        choices: [
          { value: "yes", name: "Yes, create issue" },
          { value: "no", name: "No, abort" },
        ],
        default: "yes",
        showBack: true,
      });

      if (confirmResult === BACK_VALUE) {
        // Restart the flow
        return issueCommand(options);
      }

      if (confirmResult !== "yes") {
        console.log("Aborted.");
        process.exit(0);
      }
    }

    // Ensure labels exist before creating issue
    if (labels.length > 0) {
      ensureLabelsExist(labels);
    }

    // Create the issue using gh CLI
    const labelArg = labels.length > 0 ? `--label "${labels.join(",")}"` : "";
    const cmd = `gh issue create --title ${JSON.stringify(title)} --body-file - ${labelArg}`;

    const result = execSync(cmd, { input: body, encoding: "utf-8" }).trim();

    // Extract issue number from URL (format: https://github.com/owner/repo/issues/123)
    const issueUrlMatch = result.match(/\/issues\/(\d+)/);
    const issueNumber = issueUrlMatch ? issueUrlMatch[1] : null;

    console.log(green(`\n✓ Issue created: ${result}`));

    // Self-assign the issue to the current user
    if (issueNumber) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        if (assignIssue(parseInt(issueNumber, 10), currentUser)) {
          console.log(green(`✓ Assigned #${issueNumber} to @${currentUser}`));
        }
      }
    }

    // Handle branch creation from flag or prompt
    let shouldCreateBranch: boolean;
    if (options.createBranch !== undefined) {
      shouldCreateBranch = options.createBranch;
    } else if (options.yes) {
      shouldCreateBranch = false;
    } else {
      const branchResult = await confirmWithBack({
        message: "Create a branch and start working on this issue?",
        default: true,
        showBack: false, // Can't go back after issue is created
      });
      shouldCreateBranch = branchResult === true;
    }

    if (shouldCreateBranch) {
      // Branch creation step loop
      type BranchStep = "description" | "confirm" | "done";
      let branchStep: BranchStep = "description";
      let description: string = "";
      let branchName: string = "";

      // Pre-fill if options provided
      if (options.branchDesc) {
        description = options.branchDesc;
        branchStep = "confirm";
      } else if (options.yes) {
        description = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 50);
        branchStep = "confirm";
      }

      while (branchStep !== "done") {
        switch (branchStep) {
          case "description": {
            const descResult = await inputWithBack({
              message: "Short branch description:",
              default: description || title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
                .slice(0, 50),
              validate: (val) => val.trim().length > 0 || "Description is required",
              showBack: false, // First step after issue creation
            });

            if (descResult === BACK_VALUE) {
              // Can't go back, issue already created
            } else {
              description = descResult;
              branchStep = "confirm";
            }
            break;
          }

          case "confirm": {
            const kebab = description
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");

            // Use configurable branch format
            const ticketPart = issueNumber ? `#${issueNumber}` : "UNTRACKED";
            branchName = formatBranchName(branchFormat, {
              type: issueType.branchType,
              ticket: ticketPart,
              description: kebab,
            });

            console.log(`\n${dim("Branch:")} ${cyan(branchName)}`);

            // Confirm branch creation (skip if --yes)
            if (options.yes) {
              branchStep = "done";
            } else {
              const confirmResult = await selectWithBack({
                message: "Create this branch?",
                choices: [
                  { value: "yes", name: "Yes, create branch" },
                  { value: "no", name: "No, skip branch" },
                ],
                default: "yes",
                showBack: !options.branchDesc, // Can go back if description was entered interactively
              });

              if (confirmResult === BACK_VALUE) {
                branchStep = "description";
              } else if (confirmResult === "yes") {
                branchStep = "done";
              } else {
                // User said no, skip branch creation
                return;
              }
            }
            break;
          }

          default:
            branchStep = "done";
        }
      }

      // Create the branch
      execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
      console.log(green(`✓ Branch created: ${branchName}`));

        // Skip test plan prompts if --yes is provided
        if (!options.yes) {
          // Offer test plan for feature-like issues (user-story, feature) and bugs
          const isFeatureType = issueType.value === "user-story" || issueType.value === "feature";
          const isBugType = issueType.value === "bug";
          if (isFeatureType || isBugType) {
            // For bugs, check if we have steps to reproduce that can be used as test plan
            const stepsToReproduce = collectedValues.steps;
            const hasSteps = Array.isArray(stepsToReproduce) && stepsToReproduce.length > 0;

            if (isBugType && hasSteps) {
              // Offer to use steps to reproduce as test plan
              console.log(dim("\nSteps to reproduce from bug report:"));
              stepsToReproduce.forEach((step, i) => console.log(dim(`  ${i + 1}. ${step}`)));

              const useSteps = await select({
                message: "Use these as test plan steps?",
                choices: [
                  { value: "use", name: "Yes, use these steps" },
                  { value: "edit", name: "Edit/add more steps" },
                  { value: "skip", name: "Skip test plan" },
                ],
              });

              if (useSteps === "use") {
                setTestPlan(branchName, stepsToReproduce);
                console.log(green(`✓ Saved ${stepsToReproduce.length} test plan step${stepsToReproduce.length > 1 ? "s" : ""}`));
              } else if (useSteps === "edit") {
                const steps: string[] = [...stepsToReproduce];
                console.log(dim("\nEdit steps or add more. Empty line to finish.\n"));
                let adding = true;
                while (adding) {
                  const step = await input({
                    message: `Step ${steps.length + 1} (blank to finish):`,
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
                }
              }
            } else {
              // Regular flow for features or bugs without steps
              const addTestPlan = await confirm({
                message: "Add test plan steps?",
                default: false,
              });

              if (addTestPlan) {
                const steps: string[] = [];
                console.log(dim("\nAdd testing steps. Empty line to finish.\n"));
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
                }
              }
            }
          }
        }

      console.log(dim("\nYou're ready to start working!"));
      console.log(dim(`  Make changes, then: ${cyan("devflow commit")}`));
    }
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    throw error;
  }
}
