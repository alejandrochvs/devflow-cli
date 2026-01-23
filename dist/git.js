import { execSync } from "child_process";
export function getBranch() {
    return execSync("git branch --show-current", { encoding: "utf-8" }).trim();
}
export function parseBranch(branch) {
    const match = branch.match(/^([^/]+)\/([^_]+)_(.+)$/);
    if (!match)
        return { type: undefined, ticket: "UNTRACKED", description: branch };
    return { type: match[1], ticket: match[2], description: match[3].replace(/-/g, " ") };
}
export function inferTicket() {
    try {
        const branch = getBranch();
        const match = branch.match(/^[^/]+\/([^_]+)_/);
        if (match)
            return match[1];
    }
    catch {
        // Not on a branch
    }
    return "UNTRACKED";
}
export function inferScope() {
    try {
        const log = execSync("git log main..HEAD --format=%s", {
            encoding: "utf-8",
        }).trim();
        if (!log)
            return undefined;
        const lines = log.split("\n");
        for (const line of lines) {
            const match = line.match(/^\w+\[.*?\]!?\(([^)]+)\)/);
            if (match)
                return match[1];
        }
    }
    catch {
        // No commits on branch or main doesn't exist
    }
    return undefined;
}
export function getCommits(base) {
    try {
        const log = execSync(`git log ${base}..HEAD --format=%s`, { encoding: "utf-8" }).trim();
        return log ? log.split("\n") : [];
    }
    catch {
        return [];
    }
}
export function getScopesFromCommits(commits) {
    const scopes = new Set();
    for (const commit of commits) {
        const match = commit.match(/\(([^)]+)\)/);
        if (match)
            scopes.add(match[1]);
    }
    return [...scopes];
}
export function getDefaultBase(currentBranch) {
    try {
        const remoteBranches = execSync("git branch -r", { encoding: "utf-8" })
            .trim()
            .split("\n")
            .map((b) => b.trim())
            .filter((b) => b && !b.includes("HEAD") && !b.endsWith(`/${currentBranch}`));
        let closest = "main";
        let minAhead = Infinity;
        for (const remote of remoteBranches) {
            try {
                const mergeBase = execSync(`git merge-base HEAD ${remote}`, {
                    encoding: "utf-8",
                }).trim();
                const ahead = execSync(`git rev-list --count ${mergeBase}..HEAD`, {
                    encoding: "utf-8",
                }).trim();
                const count = parseInt(ahead, 10);
                if (count < minAhead) {
                    minAhead = count;
                    closest = remote.replace(/^origin\//, "");
                }
            }
            catch {
                // Skip branches that can't be compared
            }
        }
        return closest;
    }
    catch {
        return "main";
    }
}
export function checkGhInstalled() {
    try {
        execSync("gh --version", { stdio: "ignore" });
    }
    catch {
        console.error("Error: GitHub CLI (gh) is not installed.");
        console.error("Install it with: brew install gh");
        console.error("Then authenticate: gh auth login");
        process.exit(1);
    }
}
//# sourceMappingURL=git.js.map