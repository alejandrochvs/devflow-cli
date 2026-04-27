import { red, bold, dim } from "./colors.js";

export function failWith(message: string, hint?: string): never {
  console.error(`${red("✗")} ${bold(message)}`);
  if (hint) console.error(dim(`  ${hint}`));
  process.exit(1);
}

export function printHeader(title: string): void {
  console.log(`\n${dim("───")} ${bold(title)} ${dim("───")}\n`);
}

export function printFooter(): void {
  console.log(dim("─────────────────────"));
}
