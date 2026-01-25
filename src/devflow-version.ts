import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { yellow, dim, cyan } from "./colors.js";

interface DevflowVersionInfo {
  cliVersion: string;
  generatedAt: string;
  files: {
    aiInstructions?: string;
  };
}

const VERSION_FILE = ".devflow/version.json";

export function getVersionFilePath(cwd: string = process.cwd()): string {
  return resolve(cwd, VERSION_FILE);
}

export function readVersionInfo(cwd: string = process.cwd()): DevflowVersionInfo | null {
  const versionPath = getVersionFilePath(cwd);
  if (!existsSync(versionPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(versionPath, "utf-8"));
  } catch {
    return null;
  }
}

export function writeVersionInfo(cliVersion: string, cwd: string = process.cwd()): void {
  const versionPath = getVersionFilePath(cwd);
  const info: DevflowVersionInfo = {
    cliVersion,
    generatedAt: new Date().toISOString(),
    files: {
      aiInstructions: cliVersion,
    },
  };
  writeFileSync(versionPath, JSON.stringify(info, null, 2) + "\n");
}

export function getCliVersion(): string {
  try {
    const pkgPath = new URL("../package.json", import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

/**
 * Check if devflow generated files are outdated and show a warning.
 * Returns true if outdated.
 */
export function checkForDevflowUpdates(cwd: string = process.cwd()): boolean {
  // Only check if .devflow directory exists (project has been initialized)
  const devflowDir = resolve(cwd, ".devflow");
  if (!existsSync(devflowDir)) {
    return false;
  }

  const versionInfo = readVersionInfo(cwd);
  const currentVersion = getCliVersion();

  // If no version file, the files were generated with an older CLI
  if (!versionInfo) {
    console.log(
      yellow("\n⚠ DevFlow files may be outdated.") +
      dim(` Run ${cyan("devflow update")} to get the latest AI instructions.\n`)
    );
    return true;
  }

  // Compare versions (simple string comparison works for semver)
  if (versionInfo.cliVersion !== currentVersion) {
    const isNewer = compareVersions(currentVersion, versionInfo.cliVersion) > 0;
    if (isNewer) {
      console.log(
        yellow(`\n⚠ DevFlow files were generated with v${versionInfo.cliVersion} (current: v${currentVersion}).`) +
        dim(` Run ${cyan("devflow update")} to update.\n`)
      );
      return true;
    }
  }

  return false;
}

/**
 * Compare two semver versions.
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}
