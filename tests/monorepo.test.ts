import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { detectMonorepo, workspacesToScopes } from "../src/monorepo.js";

describe("monorepo", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "devflow-monorepo-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("workspacesToScopes", () => {
    it("converts workspace packages to scopes", () => {
      const result = workspacesToScopes({
        type: "npm",
        packages: [
          { name: "auth", path: "packages/auth" },
          { name: "api", path: "packages/api" },
        ],
      });

      expect(result).toEqual([
        { value: "auth", description: "Workspace: auth", paths: ["packages/auth/**"] },
        { value: "api", description: "Workspace: api", paths: ["packages/api/**"] },
      ]);
    });

    it("strips scope prefix from scoped package names", () => {
      const result = workspacesToScopes({
        type: "npm",
        packages: [
          { name: "@myorg/auth", path: "packages/auth" },
          { name: "@company/utils", path: "packages/utils" },
        ],
      });

      expect(result).toEqual([
        { value: "auth", description: "Workspace: @myorg/auth", paths: ["packages/auth/**"] },
        { value: "utils", description: "Workspace: @company/utils", paths: ["packages/utils/**"] },
      ]);
    });

    it("handles empty packages array", () => {
      const result = workspacesToScopes({
        type: "npm",
        packages: [],
      });

      expect(result).toEqual([]);
    });

    it("handles different monorepo types", () => {
      const types: Array<"npm" | "pnpm" | "lerna" | "nx" | "turborepo"> = [
        "npm", "pnpm", "lerna", "nx", "turborepo"
      ];

      for (const type of types) {
        const result = workspacesToScopes({
          type,
          packages: [{ name: "pkg", path: "packages/pkg" }],
        });

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe("pkg");
      }
    });
  });

  describe("detectMonorepo", () => {
    describe("npm workspaces", () => {
      it("detects npm workspaces from package.json array format", () => {
        // Create package.json with workspaces
        writeFileSync(
          join(tempDir, "package.json"),
          JSON.stringify({
            name: "monorepo",
            workspaces: ["packages/*"],
          })
        );

        // Create packages directory with a package
        mkdirSync(join(tempDir, "packages", "auth"), { recursive: true });
        writeFileSync(
          join(tempDir, "packages", "auth", "package.json"),
          JSON.stringify({ name: "@myorg/auth" })
        );

        const result = detectMonorepo(tempDir);

        expect(result).toBeDefined();
        expect(result?.type).toBe("npm");
        expect(result?.packages).toHaveLength(1);
        expect(result?.packages[0].name).toBe("@myorg/auth");
        expect(result?.packages[0].path).toBe("packages/auth");
      });

      it("detects npm workspaces from package.json object format", () => {
        writeFileSync(
          join(tempDir, "package.json"),
          JSON.stringify({
            name: "monorepo",
            workspaces: { packages: ["packages/*"] },
          })
        );

        mkdirSync(join(tempDir, "packages", "api"), { recursive: true });
        writeFileSync(
          join(tempDir, "packages", "api", "package.json"),
          JSON.stringify({ name: "api" })
        );

        const result = detectMonorepo(tempDir);

        expect(result).toBeDefined();
        expect(result?.type).toBe("npm");
        expect(result?.packages[0].name).toBe("api");
      });
    });

    describe("pnpm workspaces", () => {
      it("detects pnpm workspaces from pnpm-workspace.yaml", () => {
        // Create pnpm-workspace.yaml
        writeFileSync(
          join(tempDir, "pnpm-workspace.yaml"),
          `packages:
  - 'packages/*'
  - 'apps/*'
`
        );

        // Create packages
        mkdirSync(join(tempDir, "packages", "shared"), { recursive: true });
        writeFileSync(
          join(tempDir, "packages", "shared", "package.json"),
          JSON.stringify({ name: "@mono/shared" })
        );

        const result = detectMonorepo(tempDir);

        expect(result).toBeDefined();
        expect(result?.type).toBe("pnpm");
        expect(result?.packages).toHaveLength(1);
        expect(result?.packages[0].name).toBe("@mono/shared");
      });
    });

    describe("lerna", () => {
      it("detects lerna monorepo from lerna.json", () => {
        // Create lerna.json
        writeFileSync(
          join(tempDir, "lerna.json"),
          JSON.stringify({
            version: "independent",
            packages: ["packages/*"],
          })
        );

        // Create package
        mkdirSync(join(tempDir, "packages", "core"), { recursive: true });
        writeFileSync(
          join(tempDir, "packages", "core", "package.json"),
          JSON.stringify({ name: "core" })
        );

        const result = detectMonorepo(tempDir);

        expect(result).toBeDefined();
        expect(result?.type).toBe("lerna");
        expect(result?.packages[0].name).toBe("core");
      });

      it("uses default packages/* when lerna.json has no packages field", () => {
        writeFileSync(join(tempDir, "lerna.json"), JSON.stringify({ version: "1.0.0" }));

        mkdirSync(join(tempDir, "packages", "default"), { recursive: true });
        writeFileSync(
          join(tempDir, "packages", "default", "package.json"),
          JSON.stringify({ name: "default" })
        );

        const result = detectMonorepo(tempDir);

        expect(result).toBeDefined();
        expect(result?.type).toBe("lerna");
      });
    });

    describe("nx", () => {
      it("detects nx monorepo from nx.json and project.json files", () => {
        // Create nx.json
        writeFileSync(join(tempDir, "nx.json"), JSON.stringify({ version: 2 }));

        // Create project with project.json
        mkdirSync(join(tempDir, "packages", "nx-lib"), { recursive: true });
        writeFileSync(
          join(tempDir, "packages", "nx-lib", "project.json"),
          JSON.stringify({ name: "nx-lib", projectType: "library" })
        );

        const result = detectMonorepo(tempDir);

        expect(result).toBeDefined();
        expect(result?.type).toBe("nx");
        expect(result?.packages[0].name).toBe("nx-lib");
      });

      it("discovers nx projects in apps directory", () => {
        writeFileSync(join(tempDir, "nx.json"), JSON.stringify({}));

        mkdirSync(join(tempDir, "apps", "web"), { recursive: true });
        writeFileSync(
          join(tempDir, "apps", "web", "project.json"),
          JSON.stringify({ name: "web-app" })
        );

        const result = detectMonorepo(tempDir);

        expect(result?.packages.some((p) => p.name === "web-app")).toBe(true);
      });
    });

    describe("turborepo", () => {
      it("detects as npm when turbo.json exists with npm workspaces", () => {
        // Note: Turborepo uses npm/pnpm workspaces under the hood
        // Detection order means npm workspaces are found first
        writeFileSync(join(tempDir, "turbo.json"), JSON.stringify({ pipeline: {} }));

        writeFileSync(
          join(tempDir, "package.json"),
          JSON.stringify({
            name: "turbo-monorepo",
            workspaces: ["packages/*"],
          })
        );

        mkdirSync(join(tempDir, "packages", "ui"), { recursive: true });
        writeFileSync(
          join(tempDir, "packages", "ui", "package.json"),
          JSON.stringify({ name: "@turbo/ui" })
        );

        const result = detectMonorepo(tempDir);

        expect(result).toBeDefined();
        // Turborepo uses npm workspaces, so detected as npm type
        expect(result?.type).toBe("npm");
        expect(result?.packages[0].name).toBe("@turbo/ui");
      });
    });

    describe("no monorepo", () => {
      it("returns undefined for regular project without workspaces", () => {
        writeFileSync(
          join(tempDir, "package.json"),
          JSON.stringify({ name: "single-package" })
        );

        const result = detectMonorepo(tempDir);

        expect(result).toBeUndefined();
      });

      it("returns undefined for empty directory", () => {
        const result = detectMonorepo(tempDir);

        expect(result).toBeUndefined();
      });
    });

    describe("multiple packages", () => {
      it("detects multiple packages in workspaces", () => {
        writeFileSync(
          join(tempDir, "package.json"),
          JSON.stringify({
            name: "monorepo",
            workspaces: ["packages/*"],
          })
        );

        // Create multiple packages
        const packages = ["auth", "api", "utils", "ui"];
        for (const pkg of packages) {
          mkdirSync(join(tempDir, "packages", pkg), { recursive: true });
          writeFileSync(
            join(tempDir, "packages", pkg, "package.json"),
            JSON.stringify({ name: `@org/${pkg}` })
          );
        }

        const result = detectMonorepo(tempDir);

        expect(result).toBeDefined();
        expect(result?.packages).toHaveLength(4);
        expect(result?.packages.map((p) => p.name).sort()).toEqual([
          "@org/api",
          "@org/auth",
          "@org/ui",
          "@org/utils",
        ]);
      });
    });
  });
});
