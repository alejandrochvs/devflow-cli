import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import { yellow, dim, cyan } from "./colors.js";

const PACKAGE_NAME = "@alejandrochaves/devflow-cli";
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

interface UpdateCache {
  lastCheck: number;
  latestVersion?: string;
}

function getCachePath(): string {
  const dir = resolve(homedir(), ".devflow");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return resolve(dir, "update-cache.json");
}

function readCache(): UpdateCache {
  try {
    const cachePath = getCachePath();
    if (existsSync(cachePath)) {
      return JSON.parse(readFileSync(cachePath, "utf-8"));
    }
  } catch {
    // Ignore
  }
  return { lastCheck: 0 };
}

function writeCache(cache: UpdateCache): void {
  try {
    writeFileSync(getCachePath(), JSON.stringify(cache));
  } catch {
    // Ignore
  }
}

function getCurrentVersion(): string {
  try {
    const pkgPath = new URL("../package.json", import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

function fetchLatestVersion(): string | undefined {
  try {
    const result = execSync(`npm view ${PACKAGE_NAME} version`, {
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    return result;
  } catch {
    return undefined;
  }
}

function isNewer(latest: string, current: string): boolean {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

export function checkForUpdates(): void {
  const cache = readCache();
  const now = Date.now();

  if (now - cache.lastCheck < CHECK_INTERVAL) {
    // Show cached notification if available
    if (cache.latestVersion && isNewer(cache.latestVersion, getCurrentVersion())) {
      showNotification(cache.latestVersion);
    }
    return;
  }

  // Check in background (non-blocking)
  const latest = fetchLatestVersion();
  const newCache: UpdateCache = { lastCheck: now, latestVersion: latest };
  writeCache(newCache);

  if (latest && isNewer(latest, getCurrentVersion())) {
    showNotification(latest);
  }
}

function showNotification(latest: string): void {
  const current = getCurrentVersion();
  console.log(
    dim("─") + " " +
    yellow("Update available:") + " " +
    dim(current) + " → " + cyan(latest) + " " +
    dim(`(npm update ${PACKAGE_NAME})`) + " " +
    dim("─")
  );
  console.log("");
}
