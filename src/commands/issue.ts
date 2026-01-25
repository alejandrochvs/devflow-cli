import { select, input, confirm, editor } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig } from "../config.js";
import { bold, dim, green, cyan, yellow, gray } from "../colors.js";
import { checkGhInstalled } from "../git.js";
import { setTestPlan } from "../test-plan.js";

interface IssueType {
  value: string;
  label: string;
  labelColor: string;
  branchType: string;
}

const ISSUE_TYPES: IssueType[] = [
  { value: "user-story", label: "User Story", labelColor: "feature", branchType: "feat" },
  { value: "bug", label: "Bug", labelColor: "bug", branchType: "fix" },
  { value: "task", label: "Task", labelColor: "task", branchType: "chore" },
  { value: "spike", label: "Spike", labelColor: "spike", branchType: "chore" },
  { value: "tech-debt", label: "Tech Debt", labelColor: "tech-debt", branchType: "refactor" },
];

interface IssueData {
  type: IssueType;
  title: string;
  body: string;
  labels: string[];
}

async function collectUserStory(): Promise<{ title: string; body: string }> {
  const asA = await input({
    message: "As a:",
    validate: (val) => val.trim().length > 0 || "Required",
  });

  const iWant = await input({
    message: "I want to:",
    validate: (val) => val.trim().length > 0 || "Required",
  });

  const soThat = await input({
    message: "So that:",
    validate: (val) => val.trim().length > 0 || "Required",
  });

  console.log(dim("\nAdd acceptance criteria (one per line). Empty line to finish:\n"));
  const criteria: string[] = [];
  let adding = true;
  while (adding) {
    const criterion = await input({
      message: `  ${criteria.length + 1}.${criteria.length > 0 ? " (blank to finish)" : ""}`,
    });
    if (!criterion.trim()) {
      adding = false;
    } else {
      criteria.push(criterion.trim());
    }
  }

  const notes = await input({
    message: "Additional notes (optional):",
  });

  const title = iWant.trim();
  const body = `## User Story

**As a** ${asA.trim()}
**I want to** ${iWant.trim()}
**So that** ${soThat.trim()}

## Acceptance Criteria

${criteria.map((c) => `- [ ] ${c}`).join("\n")}
${notes.trim() ? `\n## Notes\n\n${notes.trim()}` : ""}`;

  return { title, body };
}

async function collectBug(): Promise<{ title: string; body: string }> {
  const description = await input({
    message: "What happened?",
    validate: (val) => val.trim().length > 0 || "Required",
  });

  const expected = await input({
    message: "What was expected?",
    validate: (val) => val.trim().length > 0 || "Required",
  });

  console.log(dim("\nSteps to reproduce (one per line). Empty line to finish:\n"));
  const steps: string[] = [];
  let adding = true;
  while (adding) {
    const step = await input({
      message: `  ${steps.length + 1}.${steps.length > 0 ? " (blank to finish)" : ""}`,
    });
    if (!step.trim()) {
      adding = false;
    } else {
      steps.push(step.trim());
    }
  }

  const environment = await input({
    message: "Environment (browser, OS, version - optional):",
  });

  const logs = await input({
    message: "Error logs or screenshots URL (optional):",
  });

  const title = description.trim();
  const body = `## Bug Report

### Description
${description.trim()}

### Expected Behavior
${expected.trim()}

### Steps to Reproduce
${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
${environment.trim() ? `\n### Environment\n${environment.trim()}` : ""}
${logs.trim() ? `\n### Logs / Screenshots\n${logs.trim()}` : ""}`;

  return { title, body };
}

async function collectTask(): Promise<{ title: string; body: string }> {
  const what = await input({
    message: "What needs to be done?",
    validate: (val) => val.trim().length > 0 || "Required",
  });

  const why = await input({
    message: "Why is this needed?",
  });

  console.log(dim("\nDone criteria (one per line). Empty line to finish:\n"));
  const criteria: string[] = [];
  let adding = true;
  while (adding) {
    const criterion = await input({
      message: `  ${criteria.length + 1}.${criteria.length > 0 ? " (blank to finish)" : ""}`,
    });
    if (!criterion.trim()) {
      adding = false;
    } else {
      criteria.push(criterion.trim());
    }
  }

  const title = what.trim();
  const body = `## Task

### Description
${what.trim()}
${why.trim() ? `\n### Context\n${why.trim()}` : ""}

### Done Criteria

${criteria.map((c) => `- [ ] ${c}`).join("\n")}`;

  return { title, body };
}

async function collectSpike(): Promise<{ title: string; body: string }> {
  const question = await input({
    message: "What question needs to be answered?",
    validate: (val) => val.trim().length > 0 || "Required",
  });

  const timebox = await select({
    message: "Timebox:",
    choices: [
      { value: "2 hours", name: "2 hours" },
      { value: "4 hours", name: "4 hours" },
      { value: "1 day", name: "1 day" },
      { value: "2 days", name: "2 days" },
    ],
  });

  const output = await select({
    message: "Expected output:",
    choices: [
      { value: "Document with findings", name: "Document with findings" },
      { value: "Proof of concept", name: "Proof of concept" },
      { value: "Recommendation", name: "Recommendation" },
      { value: "Prototype", name: "Prototype" },
    ],
  });

  const context = await input({
    message: "Background context (optional):",
  });

  const title = question.trim();
  const body = `## Spike

### Question to Answer
${question.trim()}

### Timebox
${timebox}

### Expected Output
${output}
${context.trim() ? `\n### Background Context\n${context.trim()}` : ""}

### Findings
_To be filled after investigation_`;

  return { title, body };
}

async function collectTechDebt(): Promise<{ title: string; body: string }> {
  const what = await input({
    message: "What technical debt needs to be addressed?",
    validate: (val) => val.trim().length > 0 || "Required",
  });

  const impact = await input({
    message: "Why does it matter? (impact on codebase/team)",
    validate: (val) => val.trim().length > 0 || "Required",
  });

  const approach = await input({
    message: "Proposed approach (optional):",
  });

  const title = what.trim();
  const body = `## Tech Debt

### Description
${what.trim()}

### Impact
${impact.trim()}
${approach.trim() ? `\n### Proposed Approach\n${approach.trim()}` : ""}`;

  return { title, body };
}

async function collectIssueData(issueType: IssueType): Promise<{ title: string; body: string }> {
  switch (issueType.value) {
    case "user-story":
      return collectUserStory();
    case "bug":
      return collectBug();
    case "task":
      return collectTask();
    case "spike":
      return collectSpike();
    case "tech-debt":
      return collectTechDebt();
    default:
      throw new Error(`Unknown issue type: ${issueType.value}`);
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

export async function issueCommand(options: { dryRun?: boolean } = {}): Promise<void> {
  try {
    checkGhInstalled();
    const config = loadConfig();

    // Select issue type
    const issueType = await select({
      message: "Select issue type:",
      choices: ISSUE_TYPES.map((t) => ({
        value: t,
        name: `${t.label}`,
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

      const ticketPart = issueNumber ? `#${issueNumber}` : "UNTRACKED";
      const kebab = description
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const branchName = `${issueType.branchType}/${ticketPart}_${kebab}`;

      console.log(`\n${dim("Branch:")} ${cyan(branchName)}`);

      const confirmBranch = await confirm({
        message: "Create this branch?",
        default: true,
      });

      if (confirmBranch) {
        execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
        console.log(green(`✓ Branch created: ${branchName}`));

        // Offer test plan for user stories and bugs
        if (issueType.value === "user-story" || issueType.value === "bug") {
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
