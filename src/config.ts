import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { createRequire } from "module";
import { yellow } from "./colors.js";
import { detectMonorepo, workspacesToScopes } from "./monorepo.js";

export interface Scope {
  value: string;
  description: string;
  paths?: string[];
}

export interface IssueField {
  name: string;
  prompt: string;
  type: "input" | "multiline" | "select" | "list";
  required: boolean;
  options?: string[];
}

export interface IssueType {
  value: string;
  label: string;
  labelColor: string;
  branchType: string;
  fields: IssueField[];
  template: string;
}

export type PresetType = "scrum" | "kanban" | "simple" | "custom";

export interface TicketProviderConfig {
  type: string;
  [key: string]: unknown;
}

export interface ProjectStatusMap {
  todo: string;
  inProgress: string;
  inReview: string;
  done: string;
}

export interface ProjectConfig {
  enabled: boolean;
  number: number;
  statusField: string;
  statuses: ProjectStatusMap;
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
  preset?: PresetType;
  branchFormat: string;
  issueTypes: IssueType[];
  ticketProvider?: TicketProviderConfig;
  project?: ProjectConfig;
}

export interface PrTemplate {
  sections: string[];
  screenshotsTable: boolean;
}

const DEFAULT_PR_TEMPLATE: PrTemplate = {
  sections: [
    "summary",
    "ticket",
    "type",
    "screenshots",
    "testPlan",
    "checklist",
  ],
  screenshotsTable: true,
};

// Scrum preset - full Agile workflow with user stories, acceptance criteria
export const SCRUM_PRESET = {
  branchFormat: "{type}/{ticket}_{description}",
  issueTypes: [
    {
      value: "user-story",
      label: "User Story",
      labelColor: "feature",
      branchType: "feat",
      fields: [
        {
          name: "asA",
          prompt: "As a:",
          type: "input" as const,
          required: true,
        },
        {
          name: "iWant",
          prompt: "I want to:",
          type: "input" as const,
          required: true,
        },
        {
          name: "soThat",
          prompt: "So that:",
          type: "input" as const,
          required: true,
        },
        {
          name: "criteria",
          prompt: "Acceptance criteria:",
          type: "list" as const,
          required: true,
        },
        {
          name: "notes",
          prompt: "Additional notes (optional):",
          type: "input" as const,
          required: false,
        },
      ],
      template: `## User Story

**As a** {asA}
**I want to** {iWant}
**So that** {soThat}

## Acceptance Criteria

{criteria:checkbox}
{notes:section:Notes}`,
    },
    {
      value: "bug",
      label: "Bug",
      labelColor: "bug",
      branchType: "fix",
      fields: [
        {
          name: "description",
          prompt: "What happened?",
          type: "input" as const,
          required: true,
        },
        {
          name: "expected",
          prompt: "What was expected?",
          type: "input" as const,
          required: true,
        },
        {
          name: "steps",
          prompt: "Steps to reproduce:",
          type: "list" as const,
          required: true,
        },
        {
          name: "environment",
          prompt: "Environment (browser, OS, version - optional):",
          type: "input" as const,
          required: false,
        },
        {
          name: "logs",
          prompt: "Error logs or screenshots URL (optional):",
          type: "input" as const,
          required: false,
        },
      ],
      template: `## Bug Report

### Description
{description}

### Expected Behavior
{expected}

### Steps to Reproduce
{steps:numbered}
{environment:section:Environment}
{logs:section:Logs / Screenshots}`,
    },
    {
      value: "task",
      label: "Task",
      labelColor: "task",
      branchType: "chore",
      fields: [
        {
          name: "what",
          prompt: "What needs to be done?",
          type: "input" as const,
          required: true,
        },
        {
          name: "why",
          prompt: "Why is this needed? (optional):",
          type: "input" as const,
          required: false,
        },
        {
          name: "criteria",
          prompt: "Done criteria:",
          type: "list" as const,
          required: true,
        },
      ],
      template: `## Task

### Description
{what}
{why:section:Context}

### Done Criteria

{criteria:checkbox}`,
    },
    {
      value: "spike",
      label: "Spike",
      labelColor: "spike",
      branchType: "chore",
      fields: [
        {
          name: "question",
          prompt: "What question needs to be answered?",
          type: "input" as const,
          required: true,
        },
        {
          name: "timebox",
          prompt: "Timebox:",
          type: "select" as const,
          required: true,
          options: ["2 hours", "4 hours", "1 day", "2 days"],
        },
        {
          name: "output",
          prompt: "Expected output:",
          type: "select" as const,
          required: true,
          options: [
            "Document with findings",
            "Proof of concept",
            "Recommendation",
            "Prototype",
          ],
        },
        {
          name: "context",
          prompt: "Background context (optional):",
          type: "input" as const,
          required: false,
        },
      ],
      template: `## Spike

### Question to Answer
{question}

### Timebox
{timebox}

### Expected Output
{output}
{context:section:Background Context}

### Findings
_To be filled after investigation_`,
    },
    {
      value: "tech-debt",
      label: "Tech Debt",
      labelColor: "tech-debt",
      branchType: "refactor",
      fields: [
        {
          name: "what",
          prompt: "What technical debt needs to be addressed?",
          type: "input" as const,
          required: true,
        },
        {
          name: "impact",
          prompt: "Why does it matter? (impact on codebase/team):",
          type: "input" as const,
          required: true,
        },
        {
          name: "approach",
          prompt: "Proposed approach (optional):",
          type: "input" as const,
          required: false,
        },
      ],
      template: `## Tech Debt

### Description
{what}

### Impact
{impact}
{approach:section:Proposed Approach}`,
    },
  ] as IssueType[],
  prTemplate: {
    sections: [
      "summary",
      "ticket",
      "type",
      "screenshots",
      "testPlan",
      "checklist",
    ],
    screenshotsTable: true,
  } as PrTemplate,
};

// Kanban preset - simpler flow-based workflow
export const KANBAN_PRESET = {
  branchFormat: "{type}/{ticket}_{description}",
  issueTypes: [
    {
      value: "feature",
      label: "Feature",
      labelColor: "enhancement",
      branchType: "feat",
      fields: [
        {
          name: "description",
          prompt: "Describe the feature:",
          type: "input" as const,
          required: true,
        },
        {
          name: "value",
          prompt: "Business value (optional):",
          type: "input" as const,
          required: false,
        },
        {
          name: "criteria",
          prompt: "Done criteria:",
          type: "list" as const,
          required: true,
        },
      ],
      template: `## Feature

{description}
{value:section:Business Value}

### Done Criteria

{criteria:checkbox}`,
    },
    {
      value: "bug",
      label: "Bug",
      labelColor: "bug",
      branchType: "fix",
      fields: [
        {
          name: "description",
          prompt: "What's broken?",
          type: "input" as const,
          required: true,
        },
        {
          name: "expected",
          prompt: "Expected behavior (optional):",
          type: "input" as const,
          required: false,
        },
        {
          name: "steps",
          prompt: "Steps to reproduce:",
          type: "list" as const,
          required: false,
        },
      ],
      template: `## Bug

{description}
{expected:section:Expected Behavior}
{steps:section:Steps to Reproduce:numbered}`,
    },
    {
      value: "improvement",
      label: "Improvement",
      labelColor: "enhancement",
      branchType: "refactor",
      fields: [
        {
          name: "description",
          prompt: "What should be improved?",
          type: "input" as const,
          required: true,
        },
        {
          name: "benefit",
          prompt: "What's the benefit?",
          type: "input" as const,
          required: false,
        },
      ],
      template: `## Improvement

{description}
{benefit:section:Benefit}`,
    },
    {
      value: "task",
      label: "Task",
      labelColor: "task",
      branchType: "chore",
      fields: [
        {
          name: "description",
          prompt: "What needs to be done?",
          type: "input" as const,
          required: true,
        },
        {
          name: "criteria",
          prompt: "Done criteria:",
          type: "list" as const,
          required: false,
        },
      ],
      template: `## Task

{description}

{criteria:checkbox}`,
    },
  ] as IssueType[],
  prTemplate: {
    sections: ["summary", "ticket", "type", "checklist"],
    screenshotsTable: false,
  } as PrTemplate,
};

// Simple preset - minimal configuration, no ticket required
export const SIMPLE_PRESET = {
  branchFormat: "{type}/{description}",
  issueTypes: [
    {
      value: "feature",
      label: "Feature",
      labelColor: "enhancement",
      branchType: "feat",
      fields: [
        {
          name: "description",
          prompt: "What needs to be built?",
          type: "input" as const,
          required: true,
        },
      ],
      template: `{description}`,
    },
    {
      value: "bug",
      label: "Bug",
      labelColor: "bug",
      branchType: "fix",
      fields: [
        {
          name: "description",
          prompt: "What's broken?",
          type: "input" as const,
          required: true,
        },
        {
          name: "expected",
          prompt: "Expected behavior (optional):",
          type: "input" as const,
          required: false,
        },
      ],
      template: `{description}
{expected:section:Expected Behavior}`,
    },
    {
      value: "task",
      label: "Task",
      labelColor: "task",
      branchType: "chore",
      fields: [
        {
          name: "description",
          prompt: "What needs to be done?",
          type: "input" as const,
          required: true,
        },
      ],
      template: `{description}`,
    },
  ] as IssueType[],
  prTemplate: {
    sections: ["summary", "checklist"],
    screenshotsTable: false,
  } as PrTemplate,
};

export const PRESETS: Record<
  PresetType,
  { branchFormat: string; issueTypes: IssueType[]; prTemplate: PrTemplate }
> = {
  scrum: SCRUM_PRESET,
  kanban: KANBAN_PRESET,
  simple: SIMPLE_PRESET,
  custom: SCRUM_PRESET, // Custom starts with Scrum defaults
};

const DEFAULT_CONFIG: DevflowConfig = {
  scopes: [],
  branchTypes: [
    "feat",
    "fix",
    "chore",
    "refactor",
    "docs",
    "test",
    "release",
    "hotfix",
  ],
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
  branchFormat: SCRUM_PRESET.branchFormat,
  issueTypes: SCRUM_PRESET.issueTypes,
};

export interface ConfigWarning {
  field: string;
  message: string;
}

export function validateConfig(raw: Record<string, unknown>): ConfigWarning[] {
  const warnings: ConfigWarning[] = [];
  const validFields = [
    "extends",
    "ticketBaseUrl",
    "scopes",
    "branchTypes",
    "commitTypes",
    "checklist",
    "commitFormat",
    "prTemplate",
    "prReviewers",
    "preset",
    "branchFormat",
    "issueTypes",
    "ticketProvider",
    "project",
  ];

  for (const key of Object.keys(raw)) {
    if (!validFields.includes(key)) {
      warnings.push({
        field: key,
        message: `Unknown field "${key}" will be ignored`,
      });
    }
  }

  if (raw.scopes && Array.isArray(raw.scopes)) {
    for (let i = 0; i < raw.scopes.length; i++) {
      const scope = raw.scopes[i] as Record<string, unknown>;
      if (!scope.value) {
        warnings.push({
          field: `scopes[${i}]`,
          message: 'Scope is missing required field "value"',
        });
      }
    }
  }

  if (raw.commitFormat && typeof raw.commitFormat === "string") {
    const format = raw.commitFormat as string;
    if (!format.includes("{type}") || !format.includes("{message}")) {
      warnings.push({
        field: "commitFormat",
        message:
          "Format should include at least {type} and {message} placeholders",
      });
    }
  }

  if (raw.commitTypes && Array.isArray(raw.commitTypes)) {
    for (let i = 0; i < raw.commitTypes.length; i++) {
      const ct = raw.commitTypes[i] as Record<string, unknown>;
      if (!ct.value || !ct.label) {
        warnings.push({
          field: `commitTypes[${i}]`,
          message: 'Commit type is missing "value" or "label"',
        });
      }
    }
  }

  // Validate branchFormat
  if (raw.branchFormat && typeof raw.branchFormat === "string") {
    const format = raw.branchFormat as string;
    if (!format.includes("{type}") || !format.includes("{description}")) {
      warnings.push({
        field: "branchFormat",
        message:
          "Format should include at least {type} and {description} placeholders",
      });
    }
  }

  // Validate preset
  if (raw.preset && typeof raw.preset === "string") {
    const validPresets = ["scrum", "kanban", "simple", "custom"];
    if (!validPresets.includes(raw.preset)) {
      warnings.push({
        field: "preset",
        message: `Invalid preset "${raw.preset}". Valid: ${validPresets.join(", ")}`,
      });
    }
  }

  // Validate issueTypes
  if (raw.issueTypes && Array.isArray(raw.issueTypes)) {
    for (let i = 0; i < raw.issueTypes.length; i++) {
      const it = raw.issueTypes[i] as Record<string, unknown>;
      if (!it.value || !it.label || !it.branchType) {
        warnings.push({
          field: `issueTypes[${i}]`,
          message: 'Issue type is missing "value", "label", or "branchType"',
        });
      }
    }
  }

  // Validate ticketProvider
  if (raw.ticketProvider) {
    const tp = raw.ticketProvider as Record<string, unknown>;
    if (!tp.type || typeof tp.type !== "string") {
      warnings.push({
        field: "ticketProvider",
        message: 'ticketProvider must have a "type" field',
      });
    } else {
      const validTypes = ["github"];
      if (!validTypes.includes(tp.type)) {
        warnings.push({
          field: "ticketProvider.type",
          message: `Unknown provider type "${tp.type}". Valid: ${validTypes.join(", ")}`,
        });
      }
    }
  }

  // Validate project config
  if (raw.project) {
    const proj = raw.project as Record<string, unknown>;
    if (proj.enabled && !proj.number) {
      warnings.push({
        field: "project",
        message: "project.enabled is true but project.number is missing",
      });
    }
    if (proj.enabled && !proj.statusField) {
      warnings.push({
        field: "project.statusField",
        message: "project.statusField is required when project is enabled",
      });
    }
    if (proj.statuses) {
      const statuses = proj.statuses as Record<string, unknown>;
      const required = ["todo", "inProgress", "inReview", "done"];
      for (const key of required) {
        if (!statuses[key]) {
          warnings.push({
            field: `project.statuses.${key}`,
            message: `Missing status mapping for "${key}"`,
          });
        }
      }
    } else if (proj.enabled) {
      warnings.push({
        field: "project.statuses",
        message: "project.statuses is required when project is enabled",
      });
    }
  }

  return warnings;
}

function resolveExtends(
  extendsPath: string,
  cwd: string,
): Record<string, unknown> {
  try {
    // Try as npm package first
    const require = createRequire(resolve(cwd, "package.json"));
    const resolved = require.resolve(extendsPath);
    return JSON.parse(readFileSync(resolved, "utf-8"));
  } catch {
    // Try as relative path
    const absPath = resolve(cwd, extendsPath);
    if (existsSync(absPath)) {
      return JSON.parse(readFileSync(absPath, "utf-8"));
    }
  }
  console.error(yellow(`⚠ Could not resolve extends: "${extendsPath}"`));
  return {};
}

function mergeConfigs(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (key === "extends") continue;
    result[key] = value;
  }
  return result;
}

export function addScopeToConfig(
  scope: Scope,
  cwd: string = process.cwd(),
): void {
  const configDir = resolve(cwd, ".devflow");
  const configPath = resolve(configDir, "config.json");

  let raw: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try {
      raw = JSON.parse(readFileSync(configPath, "utf-8"));
    } catch {
      raw = {};
    }
  } else {
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
  }

  const scopes = Array.isArray(raw.scopes) ? (raw.scopes as Scope[]) : [];

  // Don't add duplicates
  if (scopes.some((s) => s.value === scope.value)) {
    return;
  }

  scopes.push(scope);
  raw.scopes = scopes;
  writeFileSync(configPath, JSON.stringify(raw, null, 2) + "\n", "utf-8");
}

export function loadConfig(cwd: string = process.cwd()): DevflowConfig {
  const configPath = resolve(cwd, ".devflow/config.json");

  if (!existsSync(configPath)) {
    // Even without config, detect monorepo workspaces as scopes
    const mono = detectMonorepo(cwd);
    if (mono) {
      return { ...DEFAULT_CONFIG, scopes: workspacesToScopes(mono) };
    }
    return DEFAULT_CONFIG;
  }

  try {
    let raw = JSON.parse(readFileSync(configPath, "utf-8"));

    // Handle extends
    if (raw.extends) {
      const base = resolveExtends(raw.extends, cwd);
      raw = mergeConfigs(base, raw);
    }

    const warnings = validateConfig(raw);
    if (warnings.length > 0) {
      for (const w of warnings) {
        console.error(yellow(`⚠ .devflow/config.json: ${w.message}`));
      }
    }

    // Auto-discover scopes from monorepo workspaces if none configured
    let scopes = raw.scopes ?? DEFAULT_CONFIG.scopes;
    if ((!scopes || scopes.length === 0) && !raw.scopes) {
      const mono = detectMonorepo(cwd);
      if (mono) {
        scopes = workspacesToScopes(mono);
      }
    }

    // Determine preset and its defaults
    const preset = raw.preset as PresetType | undefined;
    const presetDefaults = preset ? PRESETS[preset] : undefined;

    return {
      ticketBaseUrl: raw.ticketBaseUrl ?? DEFAULT_CONFIG.ticketBaseUrl,
      scopes,
      branchTypes: raw.branchTypes ?? DEFAULT_CONFIG.branchTypes,
      commitTypes: raw.commitTypes ?? DEFAULT_CONFIG.commitTypes,
      checklist: raw.checklist ?? DEFAULT_CONFIG.checklist,
      commitFormat: raw.commitFormat ?? DEFAULT_CONFIG.commitFormat,
      prTemplate:
        raw.prTemplate ??
        presetDefaults?.prTemplate ??
        DEFAULT_CONFIG.prTemplate,
      prReviewers: raw.prReviewers,
      preset,
      branchFormat:
        raw.branchFormat ??
        presetDefaults?.branchFormat ??
        DEFAULT_CONFIG.branchFormat,
      issueTypes:
        raw.issueTypes ??
        presetDefaults?.issueTypes ??
        DEFAULT_CONFIG.issueTypes,
      ticketProvider: raw.ticketProvider as TicketProviderConfig | undefined,
      project: raw.project as ProjectConfig | undefined,
    };
  } catch {
    console.error(
      yellow("⚠ Failed to parse .devflow/config.json, using defaults."),
    );
    return DEFAULT_CONFIG;
  }
}
