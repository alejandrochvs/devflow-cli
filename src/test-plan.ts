import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

interface TestPlanStore {
  [branch: string]: string[];
}

function getStorePath(cwd: string = process.cwd()): string {
  const dir = resolve(cwd, ".devflow");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return resolve(dir, "test-plans.json");
}

function readStore(cwd?: string): TestPlanStore {
  try {
    const path = getStorePath(cwd);
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, "utf-8"));
    }
  } catch {
    // ignore
  }
  return {};
}

function writeStore(store: TestPlanStore, cwd?: string): void {
  const path = getStorePath(cwd);
  writeFileSync(path, JSON.stringify(store, null, 2) + "\n");
}

export function getTestPlan(branch: string, cwd?: string): string[] {
  const store = readStore(cwd);
  return store[branch] || [];
}

export function setTestPlan(branch: string, steps: string[], cwd?: string): void {
  const store = readStore(cwd);
  if (steps.length === 0) {
    delete store[branch];
  } else {
    store[branch] = steps;
  }
  writeStore(store, cwd);
}

export function deleteTestPlan(branch: string, cwd?: string): void {
  const store = readStore(cwd);
  delete store[branch];
  writeStore(store, cwd);
}

export function listTestPlans(cwd?: string): Record<string, string[]> {
  return readStore(cwd);
}
