import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
const DEFAULT_CONFIG = {
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
};
export function loadConfig(cwd = process.cwd()) {
    const configPath = resolve(cwd, ".devflow.json");
    if (!existsSync(configPath)) {
        return DEFAULT_CONFIG;
    }
    try {
        const raw = JSON.parse(readFileSync(configPath, "utf-8"));
        return {
            ticketBaseUrl: raw.ticketBaseUrl ?? DEFAULT_CONFIG.ticketBaseUrl,
            scopes: raw.scopes ?? DEFAULT_CONFIG.scopes,
            branchTypes: raw.branchTypes ?? DEFAULT_CONFIG.branchTypes,
            commitTypes: raw.commitTypes ?? DEFAULT_CONFIG.commitTypes,
            checklist: raw.checklist ?? DEFAULT_CONFIG.checklist,
        };
    }
    catch {
        console.error("Warning: Failed to parse .devflow.json, using defaults.");
        return DEFAULT_CONFIG;
    }
}
//# sourceMappingURL=config.js.map