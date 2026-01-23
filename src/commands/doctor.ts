import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { bold, dim, green, red, yellow, gray } from "../colors.js";

interface Check {
  name: string;
  status: "ok" | "warning" | "error";
  detail?: string;
}

function checkCommand(cmd: string): string | undefined {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
  } catch {
    return undefined;
  }
}

export async function doctorCommand(): Promise<void> {
  const cwd = process.cwd();
  const checks: Check[] = [];

  console.log(`\n${dim("───")} ${bold("devflow doctor")} ${dim("───")}\n`);

  // 1. Git
  const gitVersion = checkCommand("git --version");
  checks.push(gitVersion
    ? { name: "git", status: "ok", detail: gitVersion.replace("git version ", "") }
    : { name: "git", status: "error", detail: "Not installed" }
  );

  // 2. Node
  const nodeVersion = checkCommand("node --version");
  if (nodeVersion) {
    const major = parseInt(nodeVersion.replace("v", "").split(".")[0], 10);
    checks.push(major >= 18
      ? { name: "node", status: "ok", detail: nodeVersion }
      : { name: "node", status: "warning", detail: `${nodeVersion} (>= 18 recommended)` }
    );
  } else {
    checks.push({ name: "node", status: "error", detail: "Not installed" });
  }

  // 3. GitHub CLI
  const ghVersion = checkCommand("gh --version");
  if (ghVersion) {
    const version = ghVersion.split("\n")[0];
    checks.push({ name: "gh (GitHub CLI)", status: "ok", detail: version.replace("gh version ", "").split(" ")[0] });
  } else {
    checks.push({ name: "gh (GitHub CLI)", status: "warning", detail: "Not installed (needed for PR command)" });
  }

  // 4. gh auth
  if (ghVersion) {
    const ghAuth = checkCommand("gh auth status");
    checks.push(ghAuth
      ? { name: "gh auth", status: "ok", detail: "Authenticated" }
      : { name: "gh auth", status: "warning", detail: "Not authenticated (run: gh auth login)" }
    );
  }

  // 5. Git repo
  const isRepo = checkCommand("git rev-parse --is-inside-work-tree");
  checks.push(isRepo === "true"
    ? { name: "git repository", status: "ok" }
    : { name: "git repository", status: "error", detail: "Not inside a git repository" }
  );

  // 6. .devflow.json
  const configExists = existsSync(resolve(cwd, ".devflow.json"));
  checks.push(configExists
    ? { name: ".devflow.json", status: "ok" }
    : { name: ".devflow.json", status: "warning", detail: "Not found (run: devflow init)" }
  );

  // 7. commitlint
  const commitlintConfig = existsSync(resolve(cwd, "commitlint.config.js"))
    || existsSync(resolve(cwd, "commitlint.config.cjs"))
    || existsSync(resolve(cwd, ".commitlintrc.js"));
  checks.push(commitlintConfig
    ? { name: "commitlint config", status: "ok" }
    : { name: "commitlint config", status: "warning", detail: "Not found" }
  );

  // 8. Husky
  const huskyDir = existsSync(resolve(cwd, ".husky"));
  checks.push(huskyDir
    ? { name: "husky (.husky/)", status: "ok" }
    : { name: "husky (.husky/)", status: "warning", detail: "Not found" }
  );

  // 9. commit-msg hook
  const commitMsgHook = existsSync(resolve(cwd, ".husky/commit-msg"));
  checks.push(commitMsgHook
    ? { name: "commit-msg hook", status: "ok" }
    : { name: "commit-msg hook", status: "warning", detail: "Not found" }
  );

  // 10. package.json scripts
  try {
    const pkgPath = resolve(cwd, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const scripts = pkg.scripts || {};
      const hasCommit = scripts.commit?.includes("devflow");
      const hasBranch = scripts.branch?.includes("devflow");
      const hasPr = scripts.pr?.includes("devflow");

      if (hasCommit && hasBranch && hasPr) {
        checks.push({ name: "package.json scripts", status: "ok", detail: "commit, branch, pr" });
      } else {
        const missing = [];
        if (!hasCommit) missing.push("commit");
        if (!hasBranch) missing.push("branch");
        if (!hasPr) missing.push("pr");
        checks.push({ name: "package.json scripts", status: "warning", detail: `Missing: ${missing.join(", ")}` });
      }
    }
  } catch {
    checks.push({ name: "package.json scripts", status: "warning", detail: "Could not read package.json" });
  }

  // Print results
  let hasErrors = false;
  for (const check of checks) {
    const icon = check.status === "ok" ? green("✓")
      : check.status === "warning" ? yellow("⚠")
      : red("✗");
    const detail = check.detail ? gray(` ${check.detail}`) : "";
    console.log(`  ${icon} ${check.name}${detail}`);
    if (check.status === "error") hasErrors = true;
  }

  const okCount = checks.filter((c) => c.status === "ok").length;
  const warnCount = checks.filter((c) => c.status === "warning").length;
  const errCount = checks.filter((c) => c.status === "error").length;

  console.log(`\n  ${green(`${okCount} passed`)}${warnCount ? `, ${yellow(`${warnCount} warnings`)}` : ""}${errCount ? `, ${red(`${errCount} errors`)}` : ""}\n`);

  if (hasErrors) {
    process.exit(1);
  }
}
