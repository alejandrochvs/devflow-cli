import { select, input, confirm } from "@inquirer/prompts";
import { getBranch } from "../git.js";
import { getTestPlan, setTestPlan, deleteTestPlan } from "../test-plan.js";
import { bold, dim, green, yellow, cyan } from "../colors.js";

export interface TestPlanOptions {
  add?: string;
  replace?: string;
  clear?: boolean;
  show?: boolean;
}

export async function testPlanCommand(options: TestPlanOptions = {}): Promise<void> {
  try {
    const branch = getBranch();
    const steps = getTestPlan(branch);

    // Handle flag-based operations
    if (options.add) {
      const newSteps = options.add.split("|").map((s) => s.trim()).filter(Boolean);
      if (newSteps.length > 0) {
        setTestPlan(branch, [...steps, ...newSteps]);
        console.log(green(`✓ Added ${newSteps.length} step${newSteps.length > 1 ? "s" : ""} (${steps.length + newSteps.length} total)`));
      }
      return;
    }

    if (options.replace) {
      const newSteps = options.replace.split("|").map((s) => s.trim()).filter(Boolean);
      if (newSteps.length > 0) {
        setTestPlan(branch, newSteps);
        console.log(green(`✓ Replaced with ${newSteps.length} step${newSteps.length > 1 ? "s" : ""}`));
      }
      return;
    }

    if (options.clear) {
      deleteTestPlan(branch);
      console.log(green("✓ Test plan cleared"));
      return;
    }

    // Show mode (default or explicit)
    if (options.show || Object.keys(options).length === 0) {
      if (steps.length > 0) {
        console.log(`\n${dim("───")} ${bold("Test Plan")} ${dim("for")} ${cyan(branch)} ${dim("───")}`);
        steps.forEach((step, i) => {
          console.log(`  ${dim(`${i + 1}.`)} ${step}`);
        });
        console.log("");

        const action = await select({
          message: "What would you like to do?",
          choices: [
            { value: "add", name: "Add more steps" },
            { value: "edit", name: "Replace all steps" },
            { value: "clear", name: "Clear test plan" },
            { value: "done", name: "Done (keep current)" },
          ],
        });

        if (action === "add") {
          const newSteps = await collectSteps(steps.length);
          if (newSteps.length > 0) {
            setTestPlan(branch, [...steps, ...newSteps]);
            console.log(green(`✓ Added ${newSteps.length} step${newSteps.length > 1 ? "s" : ""} (${steps.length + newSteps.length} total)`));
          }
        } else if (action === "edit") {
          const newSteps = await collectSteps(0);
          if (newSteps.length > 0) {
            setTestPlan(branch, newSteps);
            console.log(green(`✓ Replaced with ${newSteps.length} step${newSteps.length > 1 ? "s" : ""}`));
          } else {
            console.log(yellow("No steps entered. Keeping existing plan."));
          }
        } else if (action === "clear") {
          const confirmed = await confirm({
            message: "Remove all test plan steps?",
            default: false,
          });
          if (confirmed) {
            deleteTestPlan(branch);
            console.log(green("✓ Test plan cleared"));
          }
        }
      } else {
        console.log(dim(`No test plan for ${branch}\n`));

        const add = await confirm({
          message: "Add test plan steps?",
          default: true,
        });

        if (add) {
          const newSteps = await collectSteps(0);
          if (newSteps.length > 0) {
            setTestPlan(branch, newSteps);
            console.log(green(`✓ Saved ${newSteps.length} test plan step${newSteps.length > 1 ? "s" : ""}`));
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

async function collectSteps(startIndex: number): Promise<string[]> {
  const steps: string[] = [];
  console.log(dim("\nAdd steps one at a time. Press Enter with empty text to finish.\n"));
  let adding = true;
  while (adding) {
    const step = await input({
      message: `Step ${startIndex + steps.length + 1}${steps.length > 0 ? " (blank to finish)" : ""}:`,
    });
    if (!step.trim()) {
      adding = false;
    } else {
      steps.push(step.trim());
    }
  }
  return steps;
}
