import { select, search, confirm, input, checkbox } from "@inquirer/prompts";
import { execSync } from "child_process";
import { loadConfig } from "../config.js";
import { inferTicket, inferScope } from "../git.js";
import { bold, cyan, dim, green } from "../colors.js";
function inferScopeFromPaths(stagedFiles, scopes) {
    const scopesWithPaths = scopes.filter((s) => s.paths && s.paths.length > 0);
    if (scopesWithPaths.length === 0)
        return undefined;
    const matchCounts = {};
    for (const file of stagedFiles) {
        for (const scope of scopesWithPaths) {
            for (const pattern of scope.paths) {
                if (fileMatchesPattern(file, pattern)) {
                    matchCounts[scope.value] = (matchCounts[scope.value] || 0) + 1;
                    break;
                }
            }
        }
    }
    const entries = Object.entries(matchCounts);
    if (entries.length === 0)
        return undefined;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
}
function fileMatchesPattern(file, pattern) {
    // Simple glob: support ** and * patterns
    const regex = pattern
        .replace(/\*\*/g, "{{GLOBSTAR}}")
        .replace(/\*/g, "[^/]*")
        .replace(/\{\{GLOBSTAR\}\}/g, ".*");
    return new RegExp(`^${regex}`).test(file);
}
function formatCommitMessage(format, vars) {
    let result = format;
    result = result.replace("{type}", vars.type);
    result = result.replace("{ticket}", vars.ticket);
    result = result.replace("{breaking}", vars.breaking);
    result = result.replace("{scope}", vars.scope);
    result = result.replace("{message}", vars.message);
    // Remove empty optional parts: []{} or ()
    result = result.replace(/\[\]/g, "");
    result = result.replace(/\(\)/g, "");
    return result;
}
export async function commitCommand(options = {}) {
    try {
        const config = loadConfig();
        // Check for staged files
        const staged = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();
        const unstaged = execSync("git diff --name-only", { encoding: "utf-8" }).trim();
        const untracked = execSync("git ls-files --others --exclude-standard", { encoding: "utf-8" }).trim();
        const allChanges = [
            ...unstaged.split("\n").filter(Boolean).map((f) => ({ file: f, label: `M  ${f}` })),
            ...untracked.split("\n").filter(Boolean).map((f) => ({ file: f, label: `?  ${f}` })),
        ];
        if (!staged && allChanges.length === 0) {
            console.log("Nothing to commit — working tree clean.");
            process.exit(0);
        }
        let stagedFiles = staged ? staged.split("\n") : [];
        if (!staged) {
            if (allChanges.length === 1) {
                const stageIt = await confirm({
                    message: `Stage ${allChanges[0].file}?`,
                    default: true,
                });
                if (!stageIt) {
                    console.log("No files staged. Aborting.");
                    process.exit(0);
                }
                if (!options.dryRun) {
                    execSync(`git add ${JSON.stringify(allChanges[0].file)}`);
                }
                stagedFiles = [allChanges[0].file];
            }
            else {
                const filesToStage = await checkbox({
                    message: "Select files to stage:",
                    choices: [
                        { value: "__ALL__", name: "Stage all" },
                        ...allChanges.map((c) => ({ value: c.file, name: c.label })),
                    ],
                    required: true,
                });
                if (!options.dryRun) {
                    if (filesToStage.includes("__ALL__")) {
                        execSync("git add -A");
                        stagedFiles = allChanges.map((c) => c.file);
                    }
                    else {
                        for (const file of filesToStage) {
                            execSync(`git add ${JSON.stringify(file)}`);
                        }
                        stagedFiles = filesToStage;
                    }
                }
                else {
                    stagedFiles = filesToStage.includes("__ALL__")
                        ? allChanges.map((c) => c.file)
                        : filesToStage;
                }
            }
        }
        else {
            console.log(dim("Staged files:"));
            staged.split("\n").forEach((f) => console.log(dim(`  ${f}`)));
            console.log("");
        }
        const type = await select({
            message: "Select commit type:",
            choices: config.commitTypes.map((t) => ({ value: t.value, name: t.label })),
        });
        let finalScope;
        if (config.scopes.length > 0) {
            const inferredFromPaths = inferScopeFromPaths(stagedFiles, config.scopes);
            const inferredFromLog = inferScope();
            const inferred = inferredFromPaths || inferredFromLog;
            finalScope = await search({
                message: inferred
                    ? `Select scope (suggested: ${cyan(inferred)}):`
                    : "Select scope (type to filter):",
                source: (term) => {
                    const filtered = config.scopes.filter((s) => !term ||
                        s.value.includes(term.toLowerCase()) ||
                        s.description.toLowerCase().includes(term.toLowerCase()));
                    if (inferred) {
                        filtered.sort((a, b) => a.value === inferred ? -1 : b.value === inferred ? 1 : 0);
                    }
                    return filtered.map((s) => ({
                        value: s.value,
                        name: `${s.value} — ${s.description}`,
                    }));
                },
            });
        }
        else {
            const inferredFromLog = inferScope();
            finalScope = await input({
                message: inferredFromLog
                    ? `Enter scope (default: ${inferredFromLog}):`
                    : "Enter scope (optional):",
                default: inferredFromLog,
            });
        }
        const message = await input({
            message: "Enter commit message:",
            validate: (val) => val.trim().length > 0 || "Commit message is required",
        });
        const isBreaking = await confirm({
            message: "Is this a breaking change?",
            default: false,
        });
        const ticket = inferTicket();
        const breaking = isBreaking ? "!" : "";
        const scope = finalScope || "";
        const fullMessage = formatCommitMessage(config.commitFormat, {
            type,
            ticket,
            breaking,
            scope,
            message: message.trim(),
        });
        console.log(`\n${dim("───")} ${bold("Commit Preview")} ${dim("───")}`);
        console.log(green(fullMessage));
        console.log(`${dim("───────────────────")}\n`);
        if (options.dryRun) {
            console.log(dim("[dry-run] No commit created."));
            return;
        }
        const confirmed = await confirm({
            message: "Create this commit?",
            default: true,
        });
        if (!confirmed) {
            console.log("Commit aborted.");
            process.exit(0);
        }
        execSync(`git commit -m ${JSON.stringify(fullMessage)}`, {
            stdio: "inherit",
        });
        console.log(green("✓ Commit created successfully."));
    }
    catch (error) {
        if (error.name === "ExitPromptError") {
            console.log("\nCancelled.");
            process.exit(0);
        }
        process.exit(1);
    }
}
//# sourceMappingURL=commit.js.map