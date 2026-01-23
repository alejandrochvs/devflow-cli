import { input, confirm } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig } from "../config.js";
import { bold, dim, green, cyan, gray } from "../colors.js";
import { getBranch, parseBranch, getCommits, getScopesFromCommits, getDefaultBase, checkGhInstalled, } from "../git.js";
const TYPE_LABELS = {
    feat: "Feature (new functionality)",
    fix: "Bug fix (non-breaking fix)",
    refactor: "Refactor (no functional changes)",
    hotfix: "Bug fix (non-breaking fix)",
    chore: "Chore (deps, CI, configs, docs)",
    docs: "Chore (deps, CI, configs, docs)",
    test: "Chore (deps, CI, configs, docs)",
    release: "Chore (deps, CI, configs, docs)",
};
const BRANCH_TYPE_TO_LABEL = {
    feat: { name: "feature", color: "0E8A16" },
    fix: { name: "bug", color: "D73A4A" },
    hotfix: { name: "bug", color: "D73A4A" },
    refactor: { name: "refactor", color: "1D76DB" },
    chore: { name: "chore", color: "FEF2C0" },
    docs: { name: "documentation", color: "0075CA" },
    test: { name: "test", color: "BFD4F2" },
    release: { name: "release", color: "6F42C1" },
};
function formatTicket(ticket, ticketBaseUrl) {
    if (ticket === "UNTRACKED")
        return "UNTRACKED";
    if (!ticketBaseUrl)
        return ticket;
    return `[${ticket}](${ticketBaseUrl}/${ticket})`;
}
function ensureLabel(label) {
    try {
        execSync(`gh label create ${JSON.stringify(label.name)} --color ${label.color} --force`, { stdio: "ignore" });
    }
    catch {
        // Label might already exist
    }
}
function getExistingPr() {
    try {
        const result = execSync("gh pr view --json url,number", {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "ignore"],
        }).trim();
        return JSON.parse(result);
    }
    catch {
        return undefined;
    }
}
function buildChecklist(items) {
    return items.map((c) => `- [ ] ${c}`).join("\n");
}
function buildTypeCheckboxes(type) {
    const types = [
        { key: "feat", label: "Feature (new functionality)" },
        { key: "fix", label: "Bug fix (non-breaking fix)" },
        { key: "refactor", label: "Refactor (no functional changes)" },
        { key: "breaking", label: "Breaking change (fix or feature that would cause existing functionality to change)" },
        { key: "chore", label: "Chore (deps, CI, configs, docs)" },
    ];
    return types
        .map((t) => {
        const checked = TYPE_LABELS[type || ""] === t.label ? "x" : " ";
        return `- [${checked}] ${t.label}`;
    })
        .join("\n");
}
function buildPrBody(config, opts) {
    const sections = {
        summary: `## Summary\n\n${opts.summary || "<!-- Brief description of what this PR does and why -->"}`,
        ticket: `## Ticket\n\n${formatTicket(opts.ticket, config.ticketBaseUrl)}`,
        type: `## Type of Change\n\n${buildTypeCheckboxes(opts.type)}`,
        screenshots: `## Screenshots\n\n<!-- Add before/after screenshots for UI changes, or remove this section if not applicable -->\n\n| Before | After |\n|--------|-------|\n|        |       |`,
        testPlan: `## Test Plan\n\n- [ ]`,
        checklist: `## Checklist\n\n${buildChecklist(config.checklist)}`,
    };
    const activeSections = config.prTemplate.sections;
    return activeSections
        .map((key) => sections[key])
        .filter(Boolean)
        .join("\n\n");
}
export async function prCommand(options = {}) {
    try {
        const config = loadConfig();
        checkGhInstalled();
        const branch = getBranch();
        const { type, ticket, description } = parseBranch(branch);
        const existingPr = getExistingPr();
        if (existingPr) {
            console.log(`\n${cyan(`PR #${existingPr.number}`)} already exists: ${existingPr.url}`);
            const shouldUpdate = await confirm({
                message: "Update this PR?",
                default: true,
            });
            if (!shouldUpdate) {
                process.exit(0);
            }
        }
        const defaultBase = getDefaultBase(branch);
        const base = await input({
            message: "Base branch:",
            default: defaultBase,
            validate: (val) => val.trim().length > 0 || "Base branch is required",
        });
        const commits = getCommits(base.trim());
        const commitList = commits.length > 0
            ? commits.map((c) => `- ${c}`).join("\n")
            : "";
        const title = await input({
            message: "PR title:",
            default: `${description.charAt(0).toUpperCase() + description.slice(1)}`,
            validate: (val) => val.trim().length > 0 || "Title is required",
        });
        const summaryInput = await input({
            message: "PR summary (optional, leave blank to use commits only):",
        });
        const summary = [summaryInput.trim(), commitList]
            .filter(Boolean)
            .join("\n\n");
        const body = buildPrBody(config, { summary, ticket, type, commitList });
        // Build preview labels
        const previewLabels = [];
        if (type && BRANCH_TYPE_TO_LABEL[type])
            previewLabels.push(BRANCH_TYPE_TO_LABEL[type].name);
        const previewScopes = getScopesFromCommits(commits);
        previewLabels.push(...previewScopes);
        const uniquePreviewLabels = [...new Set(previewLabels)];
        console.log(`\n${dim("───")} ${bold("PR Preview")} ${dim("───")}`);
        if (existingPr) {
            console.log(gray(`(Updating existing PR #${existingPr.number})`));
        }
        console.log(`${dim("Title:")}    ${bold(title)}`);
        console.log(`${dim("Branch:")}   ${cyan(branch)} → ${cyan(base.trim())}`);
        console.log(`${dim("Labels:")}   ${uniquePreviewLabels.length > 0 ? uniquePreviewLabels.join(", ") : "none"}`);
        console.log(`${dim("Assignee:")} @me`);
        if (config.prReviewers && config.prReviewers.length > 0) {
            console.log(`${dim("Reviewers:")} ${config.prReviewers.join(", ")}`);
        }
        console.log("");
        console.log(dim(body));
        console.log(`${dim("─────────────────")}\n`);
        if (options.dryRun) {
            console.log(dim("[dry-run] No PR created."));
            return;
        }
        const confirmed = await confirm({
            message: existingPr
                ? `Update PR #${existingPr.number}?`
                : "Create this PR?",
            default: true,
        });
        if (!confirmed) {
            console.log("Aborted.");
            process.exit(0);
        }
        // Push branch if needed
        try {
            execSync(`git push -u origin ${branch}`, { stdio: "inherit" });
        }
        catch {
            // Already pushed or push failed
        }
        // Collect all labels
        const labels = [];
        const labelInfo = type ? BRANCH_TYPE_TO_LABEL[type] : undefined;
        if (labelInfo) {
            ensureLabel(labelInfo);
            labels.push(labelInfo.name);
        }
        const scopes = getScopesFromCommits(commits);
        for (const scope of scopes) {
            ensureLabel({ name: scope, color: "EDEDED" });
            labels.push(scope);
        }
        const uniqueLabels = [...new Set(labels)];
        const labelFlag = uniqueLabels.length > 0
            ? uniqueLabels.map((l) => JSON.stringify(l)).join(",")
            : "";
        // Reviewers flag
        const reviewerFlag = config.prReviewers && config.prReviewers.length > 0
            ? ` --reviewer ${config.prReviewers.join(",")}`
            : "";
        if (existingPr) {
            execSync(`gh pr edit ${existingPr.number} --title ${JSON.stringify(title)} --body-file -${labelFlag ? ` --add-label ${labelFlag}` : ""}`, { input: body, stdio: ["pipe", "inherit", "inherit"] });
            console.log(green(`✓ PR #${existingPr.number} updated: ${existingPr.url}`));
        }
        else {
            execSync(`gh pr create --draft --title ${JSON.stringify(title)} --body-file - --base ${base.trim()} --head ${branch} --assignee @me${reviewerFlag}${labelFlag ? ` --label ${labelFlag}` : ""}`, { input: body, stdio: ["pipe", "inherit", "inherit"] });
            console.log(green("✓ PR created successfully."));
        }
    }
    catch (error) {
        if (error.name === "ExitPromptError") {
            console.log("\nCancelled.");
            process.exit(0);
        }
        process.exit(1);
    }
}
//# sourceMappingURL=pr.js.map