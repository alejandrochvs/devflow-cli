/**
 * Helper to run the devflow CLI in a test repository context
 */

import { execFileSync, spawnSync } from "child_process";
import { resolve } from "path";
import { fileURLToPath } from "url";

const CLI_PATH = resolve(fileURLToPath(import.meta.url), "../../../../dist/index.js");

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Run a devflow CLI command in a specific directory, returning combined output.
 * Never throws — callers inspect exitCode.
 */
export function runDevflow(args: string[], cwd: string): CliResult {
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd,
    encoding: "utf-8",
    env: {
      ...process.env,
      // Disable update-notifier cache reads during tests
      NO_UPDATE_NOTIFIER: "1",
      // Force non-interactive mode for CI-style tests
      CI: "true",
      // Suppress devflow version warnings
      DEVFLOW_SKIP_VERSION_CHECK: "1",
    },
  });

  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status ?? 1,
  };
}

/** Run devflow and assert it exits 0, returning stdout. */
export function runDevflowOk(args: string[], cwd: string): string {
  const result = runDevflow(args, cwd);
  if (result.exitCode !== 0) {
    throw new Error(
      `devflow ${args.join(" ")} exited ${result.exitCode}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`
    );
  }
  return result.stdout;
}
