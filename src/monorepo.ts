import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { resolve, basename, relative } from "path";
import { Scope } from "./config.js";

interface WorkspaceInfo {
  type: "npm" | "pnpm" | "lerna" | "nx" | "turborepo";
  packages: WorkspacePackage[];
}

interface WorkspacePackage {
  name: string;
  path: string;
}

export function detectMonorepo(cwd: string = process.cwd()): WorkspaceInfo | undefined {
  // Check pnpm workspaces
  const pnpmWorkspace = resolve(cwd, "pnpm-workspace.yaml");
  if (existsSync(pnpmWorkspace)) {
    const packages = parsePnpmWorkspaces(cwd, pnpmWorkspace);
    if (packages.length > 0) {
      return { type: "pnpm", packages };
    }
  }

  // Check npm/yarn workspaces in package.json
  const pkgPath = resolve(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.workspaces) {
        const patterns = Array.isArray(pkg.workspaces)
          ? pkg.workspaces
          : pkg.workspaces.packages || [];
        const packages = resolveWorkspacePatterns(cwd, patterns);
        if (packages.length > 0) {
          return { type: "npm", packages };
        }
      }
    } catch {
      // ignore
    }
  }

  // Check lerna.json
  const lernaPath = resolve(cwd, "lerna.json");
  if (existsSync(lernaPath)) {
    try {
      const lerna = JSON.parse(readFileSync(lernaPath, "utf-8"));
      const patterns = lerna.packages || ["packages/*"];
      const packages = resolveWorkspacePatterns(cwd, patterns);
      if (packages.length > 0) {
        return { type: "lerna", packages };
      }
    } catch {
      // ignore
    }
  }

  // Check nx.json (Nx uses project.json in each package or nx.json at root)
  const nxPath = resolve(cwd, "nx.json");
  if (existsSync(nxPath)) {
    const packages = discoverNxProjects(cwd);
    if (packages.length > 0) {
      return { type: "nx", packages };
    }
  }

  // Check turbo.json
  const turboPath = resolve(cwd, "turbo.json");
  if (existsSync(turboPath)) {
    // Turborepo uses npm/pnpm/yarn workspaces, so check package.json workspaces
    const pkgPath2 = resolve(cwd, "package.json");
    if (existsSync(pkgPath2)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath2, "utf-8"));
        if (pkg.workspaces) {
          const patterns = Array.isArray(pkg.workspaces)
            ? pkg.workspaces
            : pkg.workspaces.packages || [];
          const packages = resolveWorkspacePatterns(cwd, patterns);
          if (packages.length > 0) {
            return { type: "turborepo", packages };
          }
        }
      } catch {
        // ignore
      }
    }
  }

  return undefined;
}

function parsePnpmWorkspaces(cwd: string, filePath: string): WorkspacePackage[] {
  try {
    const content = readFileSync(filePath, "utf-8");
    // Simple YAML parsing for packages list
    const patterns: string[] = [];
    let inPackages = false;
    for (const line of content.split("\n")) {
      if (line.match(/^packages\s*:/)) {
        inPackages = true;
        continue;
      }
      if (inPackages) {
        const match = line.match(/^\s+-\s+['"]?(.+?)['"]?\s*$/);
        if (match) {
          patterns.push(match[1]);
        } else if (line.match(/^\S/) && line.trim()) {
          break; // New top-level key
        }
      }
    }
    return resolveWorkspacePatterns(cwd, patterns);
  } catch {
    return [];
  }
}

function resolveWorkspacePatterns(cwd: string, patterns: string[]): WorkspacePackage[] {
  const packages: WorkspacePackage[] = [];

  for (const pattern of patterns) {
    if (pattern.includes("*")) {
      // Glob pattern like "packages/*" or "apps/*"
      const parts = pattern.split("*");
      const baseDir = resolve(cwd, parts[0]);
      if (existsSync(baseDir) && statSync(baseDir).isDirectory()) {
        for (const entry of readdirSync(baseDir)) {
          const entryPath = resolve(baseDir, entry);
          if (statSync(entryPath).isDirectory()) {
            const pkgJsonPath = resolve(entryPath, "package.json");
            if (existsSync(pkgJsonPath)) {
              try {
                const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
                packages.push({
                  name: pkg.name || entry,
                  path: relative(cwd, entryPath),
                });
              } catch {
                packages.push({ name: entry, path: relative(cwd, entryPath) });
              }
            } else {
              packages.push({ name: entry, path: relative(cwd, entryPath) });
            }
          }
        }
      }
    } else {
      // Direct path
      const dirPath = resolve(cwd, pattern);
      if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
        const pkgJsonPath = resolve(dirPath, "package.json");
        const name = existsSync(pkgJsonPath)
          ? JSON.parse(readFileSync(pkgJsonPath, "utf-8")).name || basename(pattern)
          : basename(pattern);
        packages.push({ name, path: pattern });
      }
    }
  }

  return packages;
}

function discoverNxProjects(cwd: string): WorkspacePackage[] {
  const packages: WorkspacePackage[] = [];

  // Look for project.json files in common locations
  const searchDirs = ["packages", "apps", "libs"];
  for (const dir of searchDirs) {
    const dirPath = resolve(cwd, dir);
    if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
      for (const entry of readdirSync(dirPath)) {
        const entryPath = resolve(dirPath, entry);
        if (statSync(entryPath).isDirectory()) {
          const projectJson = resolve(entryPath, "project.json");
          if (existsSync(projectJson)) {
            try {
              const project = JSON.parse(readFileSync(projectJson, "utf-8"));
              packages.push({
                name: project.name || entry,
                path: relative(cwd, entryPath),
              });
            } catch {
              packages.push({ name: entry, path: relative(cwd, entryPath) });
            }
          }
        }
      }
    }
  }

  return packages;
}

export function workspacesToScopes(info: WorkspaceInfo): Scope[] {
  return info.packages.map((pkg) => {
    // Use the short package name (strip scope)
    const shortName = pkg.name.replace(/^@[^/]+\//, "");
    return {
      value: shortName,
      description: `Workspace: ${pkg.name}`,
      paths: [`${pkg.path}/**`],
    };
  });
}
