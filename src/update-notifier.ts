import { spawn } from "child_process";
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

function isNewer(latest: string, current: string): boolean {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

function fetchLatestVersionAsync(cachePath: string, existingVersion: string | undefined): void {
  const child = spawn("npm", ["view", PACKAGE_NAME, "version"], {
    detached: true,
    stdio: ["ignore", "pipe", "ignore"],
  });

  let output = "";
  child.stdout.on("data", (data: Buffer) => {
    output += data.toString();
  });

  child.on("close", (code: number) => {
    if (code === 0) {
      const version = output.trim();
      const newCache: UpdateCache = { lastCheck: Date.now(), latestVersion: version };
      try {
        writeFileSync(cachePath, JSON.stringify(newCache));
      } catch {
        // Ignore write errors in background process
      }
    }
  });

  child.unref();
}

export function checkForUpdates(): void {
  const cache = readCache();
  const now = Date.now();
  const cachePath = getCachePath();

  // Always show a notification if the cached version is newer (instant, no network)
  if (cache.latestVersion && isNewer(cache.latestVersion, getCurrentVersion())) {
    showNotification(cache.latestVersion);
  }

  if (now - cache.lastCheck < CHECK_INTERVAL) {
    return;
  }

  // Stamp lastCheck immediately so concurrent invocations don't all spawn
  writeCache({ lastCheck: now, latestVersion: cache.latestVersion });

  // Fetch in the background; result lands in cache for the next invocation
  fetchLatestVersionAsync(cachePath, cache.latestVersion);
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
