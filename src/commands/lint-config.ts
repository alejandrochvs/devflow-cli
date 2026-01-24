import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { bold, dim, green, yellow, red } from "../colors.js";
import { validateConfig } from "../config.js";

export function lintConfigCommand(): void {
  const cwd = process.cwd();
  const configPath = resolve(cwd, ".devflow.json");

  console.log(`\n${dim("───")} ${bold("Config Lint")} ${dim("───")}\n`);

  if (!existsSync(configPath)) {
    console.log(red("✗ No .devflow.json found"));
    console.log(dim("  Run: devflow init"));
    process.exit(1);
  }

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch (err) {
    console.log(red("✗ Invalid JSON in .devflow.json"));
    console.log(dim(`  ${(err as Error).message}`));
    process.exit(1);
  }

  const warnings = validateConfig(raw);

  // Additional checks for CI
  const errors: string[] = [];

  // Check scopes have descriptions
  if (raw.scopes && Array.isArray(raw.scopes)) {
    for (let i = 0; i < raw.scopes.length; i++) {
      const scope = raw.scopes[i] as Record<string, unknown>;
      if (!scope.description) {
        warnings.push({
          field: `scopes[${i}]`,
          message: `Scope "${scope.value}" is missing a description`,
        });
      }
      if (scope.paths && Array.isArray(scope.paths)) {
        for (const pattern of scope.paths as string[]) {
          if (!pattern.includes("*") && !pattern.includes("/")) {
            warnings.push({
              field: `scopes[${i}].paths`,
              message: `Pattern "${pattern}" may not match any files (missing glob or path separator)`,
            });
          }
        }
      }
    }
  }

  // Check PR template sections are valid
  if (raw.prTemplate && typeof raw.prTemplate === "object") {
    const template = raw.prTemplate as Record<string, unknown>;
    const validSections = ["summary", "ticket", "type", "screenshots", "testPlan", "checklist"];
    if (template.sections && Array.isArray(template.sections)) {
      for (const section of template.sections as string[]) {
        if (!validSections.includes(section)) {
          errors.push(`Unknown PR template section: "${section}"`);
        }
      }
    }
  }

  // Check commit format placeholders
  if (raw.commitFormat && typeof raw.commitFormat === "string") {
    const format = raw.commitFormat as string;
    const validPlaceholders = ["{type}", "{ticket}", "{breaking}", "{scope}", "{message}"];
    const found = format.match(/\{[^}]+\}/g) || [];
    for (const ph of found) {
      if (!validPlaceholders.includes(ph)) {
        errors.push(`Unknown placeholder in commitFormat: "${ph}"`);
      }
    }
  }

  // Report
  if (errors.length === 0 && warnings.length === 0) {
    console.log(green("✓ .devflow.json is valid"));
    return;
  }

  if (warnings.length > 0) {
    console.log(yellow(`${warnings.length} warning(s):\n`));
    for (const w of warnings) {
      console.log(`  ${yellow("⚠")} ${dim(`[${w.field}]`)} ${w.message}`);
    }
  }

  if (errors.length > 0) {
    console.log(red(`\n${errors.length} error(s):\n`));
    for (const e of errors) {
      console.log(`  ${red("✗")} ${e}`);
    }
    process.exit(1);
  }

  console.log("");
}
