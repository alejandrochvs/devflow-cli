import { select, input, confirm, editor } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig, IssueType, IssueField } from "../config.js";
import { bold, dim, green, cyan, gray } from "../colors.js";
import { checkGhInstalled } from "../git.js";
import { setTestPlan } from "../test-plan.js";
import { formatBranchName } from "./branch.js";

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

async function collectFieldValue(field: IssueField): Promise<string | string[]> {
  switch (field.type) {
    case "input":
      return await input({
        message: field.prompt,
        validate: field.required ? (val) => val.trim().length > 0 || "Required" : undefined,
      });

    case "multiline":
      return await editor({
        message: field.prompt,
        validate: field.required ? (val) => val.trim().length > 0 || "Required" : undefined,
      });

    case "select":
      if (!field.options || field.options.length === 0) {
        return await input({ message: field.prompt });
      }
      return await select({
        message: field.prompt,
        choices: field.options.map((opt) => ({ value: opt, name: opt })),
      });

    case "list":
      return await collectList(field.prompt);

    default:
      return await input({ message: field.prompt });
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

async function collectIssueData(issueType: IssueType): Promise<{ title: string; body: string }> {
  const values: Record<string, string | string[]> = {};

  for (const field of issueType.fields) {
    values[field.name] = await collectFieldValue(field);
  }

  // Apply template with collected values
  const body = applyTemplate(issueType.template, values);

  // Determine title: use first required field or first field
  const titleField = issueType.fields.find((f) => f.required) || issueType.fields[0];
  const titleValue = values[titleField?.name || ""];
  const title = Array.isArray(titleValue) ? titleValue[0] || "" : String(titleValue || "").trim();

  return { title, body };
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

export async function issueCommand(options: { dryRun?: boolean } = {}): Promise<void> {
  try {
    checkGhInstalled();
    const config = loadConfig();
    const issueTypes = config.issueTypes;
    const branchFormat = config.branchFormat;

    // Select issue type
    const issueType = await select({
      message: "Select issue type:",
      choices: issueTypes.map((t) => ({
        value: t,
        name: t.label,
      })),
    });

    // Collect type-specific data
    console.log("");
    const { title, body } = await collectIssueData(issueType);

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

    const confirmed = await confirm({
      message: "Create this issue?",
      default: true,
    });

    if (!confirmed) {
      console.log("Aborted.");
      process.exit(0);
    }

    // Create the issue using gh CLI
    const labelArg = labels.length > 0 ? `--label "${labels.join(",")}"` : "";
    const cmd = `gh issue create --title ${JSON.stringify(title)} --body ${JSON.stringify(body)} ${labelArg}`;

    const result = execSync(cmd, { encoding: "utf-8" }).trim();

    // Extract issue number from URL (format: https://github.com/owner/repo/issues/123)
    const issueUrlMatch = result.match(/\/issues\/(\d+)/);
    const issueNumber = issueUrlMatch ? issueUrlMatch[1] : null;

    console.log(green(`\n✓ Issue created: ${result}`));

    // Offer to create a branch
    const createBranch = await confirm({
      message: "Create a branch and start working on this issue?",
      default: true,
    });

    if (createBranch) {
      const description = await input({
        message: "Short branch description:",
        default: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 50),
        validate: (val) => val.trim().length > 0 || "Description is required",
      });

      const kebab = description
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Use configurable branch format
      const ticketPart = issueNumber ? `#${issueNumber}` : "UNTRACKED";
      const branchName = formatBranchName(branchFormat, {
        type: issueType.branchType,
        ticket: ticketPart,
        description: kebab,
      });

      console.log(`\n${dim("Branch:")} ${cyan(branchName)}`);

      const confirmBranch = await confirm({
        message: "Create this branch?",
        default: true,
      });

      if (confirmBranch) {
        execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
        console.log(green(`✓ Branch created: ${branchName}`));

        // Offer test plan for feature-like issues (user-story, feature) and bugs
        const isFeatureType = issueType.value === "user-story" || issueType.value === "feature";
        const isBugType = issueType.value === "bug";
        if (isFeatureType || isBugType) {
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

        console.log(dim("\nYou're ready to start working!"));
        console.log(dim(`  Make changes, then: ${cyan("devflow commit")}`));
      }
    }
  } catch (error) {
    if ((error as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    throw error;
  }
}
