import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { yellow } from "./colors.js";

export interface Scope {
  value: string;
  description: string;
  paths?: string[];
}

export interface DevflowConfig {
  ticketBaseUrl?: string;
  scopes: Scope[];
  branchTypes: string[];
  commitTypes: Array<{ value: string; label: string }>;
  checklist: string[];
  commitFormat: string;
  prTemplate: PrTemplate;
  prReviewers?: string[];
}

export interface PrTemplate {
  sections: string[];
  screenshotsTable: boolean;
}

const DEFAULT_PR_TEMPLATE: PrTemplate = {
  sections: ["summary", "ticket", "type", "screenshots", "testPlan", "checklist"],
  screenshotsTable: true,
};

const DEFAULT_CONFIG: DevflowConfig = {
  scopes: [],
  branchTypes: ["feat", "fix", "chore", "refactor", "docs", "test", "release", "hotfix"],
  commitTypes: [
    { value: "feat", label: "feat:     A new feature" },
    { value: "fix", label: "fix:      A bug fix" },
    { value: "chore", label: "chore:    Maintenance tasks" },
    { value: "refactor", label: "refactor: Code restructuring" },
    { value: "docs", label: "docs:     Documentation changes" },
    { value: "test", label: "test:     Adding or updating tests" },
    { value: "style", label: "style:    Code style changes" },
    { value: "ci", label: "ci:       CI/CD changes" },
    { value: "perf", label: "perf:     Performance improvements" },
    { value: "build", label: "build:    Build system changes" },
  ],
  checklist: [
    "Code follows project conventions",
    "Self-reviewed the changes",
    "No new warnings or errors introduced",
  ],
  commitFormat: "{type}[{ticket}]{breaking}({scope}): {message}",
  prTemplate: DEFAULT_PR_TEMPLATE,
};

export interface ConfigWarning {
  field: string;
  message: string;
}

export function validateConfig(raw: Record<string, unknown>): ConfigWarning[] {
  const warnings: ConfigWarning[] = [];
  const validFields = [
    "ticketBaseUrl", "scopes", "branchTypes", "commitTypes",
    "checklist", "commitFormat", "prTemplate", "prReviewers",
  ];

  for (const key of Object.keys(raw)) {
    if (!validFields.includes(key)) {
      warnings.push({ field: key, message: `Unknown field "${key}" will be ignored` });
    }
  }

  if (raw.scopes && Array.isArray(raw.scopes)) {
    for (let i = 0; i < raw.scopes.length; i++) {
      const scope = raw.scopes[i] as Record<string, unknown>;
      if (!scope.value) {
        warnings.push({ field: `scopes[${i}]`, message: "Scope is missing required field \"value\"" });
      }
    }
  }

  if (raw.commitFormat && typeof raw.commitFormat === "string") {
    const format = raw.commitFormat as string;
    if (!format.includes("{type}") || !format.includes("{message}")) {
      warnings.push({ field: "commitFormat", message: "Format should include at least {type} and {message} placeholders" });
    }
  }

  if (raw.commitTypes && Array.isArray(raw.commitTypes)) {
    for (let i = 0; i < raw.commitTypes.length; i++) {
      const ct = raw.commitTypes[i] as Record<string, unknown>;
      if (!ct.value || !ct.label) {
        warnings.push({ field: `commitTypes[${i}]`, message: "Commit type is missing \"value\" or \"label\"" });
      }
    }
  }

  return warnings;
}

export function loadConfig(cwd: string = process.cwd()): DevflowConfig {
  const configPath = resolve(cwd, ".devflow.json");

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const raw = JSON.parse(readFileSync(configPath, "utf-8"));

    const warnings = validateConfig(raw);
    if (warnings.length > 0) {
      for (const w of warnings) {
        console.error(yellow(`⚠ .devflow.json: ${w.message}`));
      }
    }

    return {
      ticketBaseUrl: raw.ticketBaseUrl ?? DEFAULT_CONFIG.ticketBaseUrl,
      scopes: raw.scopes ?? DEFAULT_CONFIG.scopes,
      branchTypes: raw.branchTypes ?? DEFAULT_CONFIG.branchTypes,
      commitTypes: raw.commitTypes ?? DEFAULT_CONFIG.commitTypes,
      checklist: raw.checklist ?? DEFAULT_CONFIG.checklist,
      commitFormat: raw.commitFormat ?? DEFAULT_CONFIG.commitFormat,
      prTemplate: raw.prTemplate ?? DEFAULT_CONFIG.prTemplate,
      prReviewers: raw.prReviewers,
    };
  } catch {
    console.error(yellow("⚠ Failed to parse .devflow.json, using defaults."));
    return DEFAULT_CONFIG;
  }
}
