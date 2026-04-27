import { red } from "./colors.js";

export async function runCommand(fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
  } catch (error) {
    if ((error as Error)?.name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    const message = (error as Error)?.message;
    if (message) {
      console.error(`${red("✗")} ${message}`);
    }
    process.exit(1);
  }
}
