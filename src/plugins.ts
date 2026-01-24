import { existsSync, readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { Command } from "commander";
import { dim, yellow } from "./colors.js";

const PLUGIN_PREFIX = "devflow-plugin-";

interface PluginModule {
  register: (program: Command) => void;
}

function findPlugins(cwd: string): string[] {
  const plugins: string[] = [];

  // Check package.json for devflow plugins in dependencies
  const pkgPath = resolve(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      for (const dep of Object.keys(allDeps || {})) {
        if (dep.startsWith(PLUGIN_PREFIX) || dep.startsWith("@") && dep.includes(`/${PLUGIN_PREFIX}`)) {
          plugins.push(dep);
        }
      }
    } catch {
      // ignore
    }
  }

  // Check .devflow.json for explicit plugin list
  const configPath = resolve(cwd, ".devflow.json");
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      if (Array.isArray(config.plugins)) {
        for (const plugin of config.plugins) {
          if (!plugins.includes(plugin)) {
            plugins.push(plugin);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return plugins;
}

export async function loadPlugins(program: Command, cwd: string = process.cwd()): Promise<void> {
  const plugins = findPlugins(cwd);

  for (const pluginName of plugins) {
    try {
      // Try to resolve the plugin from node_modules
      const pluginPath = resolve(cwd, "node_modules", pluginName);
      if (!existsSync(pluginPath)) continue;

      const pkgJson = resolve(pluginPath, "package.json");
      if (!existsSync(pkgJson)) continue;

      const pkg = JSON.parse(readFileSync(pkgJson, "utf-8"));
      const mainFile = pkg.main || pkg.exports?.["."] || "index.js";
      const entryPoint = resolve(pluginPath, mainFile);

      const mod: PluginModule = await import(entryPoint);
      if (typeof mod.register === "function") {
        mod.register(program);
      }
    } catch (err) {
      console.error(yellow(`⚠ Failed to load plugin: ${pluginName}`));
    }
  }
}
