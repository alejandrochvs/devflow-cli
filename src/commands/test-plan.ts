import { select, input, confirm } from "@inquirer/prompts";
import { getBranch } from "../git.js";
import { getTestPlan, setTestPlan, deleteTestPlan } from "../test-plan.js";
import { bold, dim, green, yellow, cyan } from "../colors.js";
import {
  selectWithBack,
  confirmWithBack,
  BACK_VALUE,
} from "../prompts.js";

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
        // Step-based flow with back navigation
        type StepName = "display" | "action" | "confirm" | "done";
        let currentStep: StepName = "display";
        let selectedAction: string = "";

        while (currentStep !== "done") {
          switch (currentStep) {
            case "display": {
              console.log(`\n${dim("───")} ${bold("Test Plan")} ${dim("for")} ${cyan(branch)} ${dim("───")}`);
              steps.forEach((step, i) => {
                console.log(`  ${dim(`${i + 1}.`)} ${step}`);
              });
              console.log("");
              currentStep = "action";
              break;
            }

            case "action": {
              const action = await selectWithBack({
                message: "What would you like to do?",
                choices: [
                  { value: "add", name: "Add more steps" },
                  { value: "edit", name: "Replace all steps" },
                  { value: "clear", name: "Clear test plan" },
                  { value: "done", name: "Done (keep current)" },
                ],
                showBack: false, // First interactive step
              });

              if (action === BACK_VALUE) {
                // Can't go back from first step
              } else if (action === "done") {
                currentStep = "done";
              } else {
                selectedAction = action;
                currentStep = "confirm";
              }
              break;
            }

            case "confirm": {
              if (selectedAction === "add") {
                const newSteps = await collectSteps(steps.length);
                if (newSteps.length > 0) {
                  setTestPlan(branch, [...steps, ...newSteps]);
                  console.log(green(`✓ Added ${newSteps.length} step${newSteps.length > 1 ? "s" : ""} (${steps.length + newSteps.length} total)`));
                }
                currentStep = "done";
              } else if (selectedAction === "edit") {
                const newSteps = await collectSteps(0);
                if (newSteps.length > 0) {
                  setTestPlan(branch, newSteps);
                  console.log(green(`✓ Replaced with ${newSteps.length} step${newSteps.length > 1 ? "s" : ""}`));
                } else {
                  console.log(yellow("No steps entered. Keeping existing plan."));
                }
                currentStep = "done";
              } else if (selectedAction === "clear") {
                const confirmed = await confirmWithBack({
                  message: "Remove all test plan steps?",
                  default: false,
                  showBack: true,
                });

                if (confirmed === BACK_VALUE) {
                  currentStep = "action";
                } else if (confirmed === true) {
                  deleteTestPlan(branch);
                  console.log(green("✓ Test plan cleared"));
                  currentStep = "done";
                } else {
                  currentStep = "done";
                }
              } else {
                currentStep = "done";
              }
              break;
            }

            default:
              currentStep = "done";
          }
        }
      } else {
        console.log(dim(`No test plan for ${branch}\n`));

        const add = await confirmWithBack({
          message: "Add test plan steps?",
          default: true,
          showBack: false,
        });

        if (add === true) {
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
