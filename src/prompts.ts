import { select, input, confirm, checkbox, search } from "@inquirer/prompts";
import * as readline from "readline";

export const BACK_VALUE = "__BACK__";

// Track the current abort controller for escape key handling
let currentAbortController: AbortController | null = null;
let escapeListenerSetup = false;

/**
 * Sets up a global keypress listener for the Escape key.
 * When Escape is pressed during a prompt with showBack enabled,
 * it aborts the prompt and returns BACK_VALUE.
 */
function setupEscapeListener(): void {
  if (escapeListenerSetup) return;
  escapeListenerSetup = true;

  // Enable keypress events on stdin
  readline.emitKeypressEvents(process.stdin);

  process.stdin.on("keypress", (_str, key) => {
    if (key && key.name === "escape" && currentAbortController) {
      currentAbortController.abort();
    }
  });
}

/**
 * Wraps a prompt function to support Escape key for back navigation.
 * When showBack is true, pressing Escape will abort the prompt and return BACK_VALUE.
 */
async function withEscapeBack<T>(
  showBack: boolean,
  promptFn: (signal?: AbortSignal) => Promise<T>
): Promise<T | typeof BACK_VALUE> {
  if (!showBack) {
    return promptFn();
  }

  setupEscapeListener();

  const controller = new AbortController();
  currentAbortController = controller;

  try {
    const result = await promptFn(controller.signal);
    currentAbortController = null;
    return result;
  } catch (error) {
    currentAbortController = null;
    // Check if this was an abort (Escape key pressed)
    // @inquirer/prompts throws AbortPromptError when aborted
    if (error instanceof Error && (error.name === "AbortPromptError" || error.name === "AbortError")) {
      return BACK_VALUE;
    }
    throw error;
  }
}

interface SelectChoice<T> {
  value: T;
  name: string;
  description?: string;
}

interface SelectWithBackOptions<T> {
  message: string;
  choices: SelectChoice<T>[];
  default?: T;
  showBack?: boolean;
}

export async function selectWithBack<T>(
  options: SelectWithBackOptions<T>
): Promise<T | typeof BACK_VALUE> {
  const message = options.showBack
    ? `${options.message} ${dim("(Esc to go back)")}`
    : options.message;

  return withEscapeBack(options.showBack ?? false, (signal) =>
    select(
      {
        message,
        choices: options.choices,
        default: options.default,
      },
      { signal }
    )
  );
}

interface InputWithBackOptions {
  message: string;
  default?: string;
  validate?: (value: string) => boolean | string;
  showBack?: boolean;
}

export async function inputWithBack(
  options: InputWithBackOptions
): Promise<string | typeof BACK_VALUE> {
  const message = options.showBack
    ? `${options.message} ${dim("(Esc to go back)")}`
    : options.message;

  return withEscapeBack(options.showBack ?? false, (signal) =>
    input(
      {
        message,
        default: options.default,
        validate: options.validate,
      },
      { signal }
    )
  );
}

interface ConfirmWithBackOptions {
  message: string;
  default?: boolean;
  showBack?: boolean;
}

export async function confirmWithBack(
  options: ConfirmWithBackOptions
): Promise<boolean | typeof BACK_VALUE> {
  const message = options.showBack
    ? `${options.message} ${dim("(Esc to go back)")}`
    : options.message;

  return withEscapeBack(options.showBack ?? false, (signal) =>
    confirm(
      {
        message,
        default: options.default,
      },
      { signal }
    )
  );
}

interface CheckboxChoice<T> {
  value: T;
  name: string;
  checked?: boolean;
}

interface CheckboxWithBackOptions<T> {
  message: string;
  choices: CheckboxChoice<T>[];
  required?: boolean;
  showBack?: boolean;
}

export async function checkboxWithBack<T>(
  options: CheckboxWithBackOptions<T>
): Promise<T[] | typeof BACK_VALUE> {
  const message = options.showBack
    ? `${options.message} ${dim("(Esc to go back)")}`
    : options.message;

  return withEscapeBack(options.showBack ?? false, (signal) =>
    checkbox(
      {
        message,
        choices: options.choices,
        required: options.required,
      },
      { signal }
    )
  );
}

interface SearchChoice<T> {
  value: T;
  name: string;
}

interface SearchWithBackOptions<T> {
  message: string;
  source: (term: string | undefined) => SearchChoice<T>[] | Promise<SearchChoice<T>[]>;
  showBack?: boolean;
}

export async function searchWithBack<T>(
  options: SearchWithBackOptions<T>
): Promise<T | typeof BACK_VALUE> {
  const message = options.showBack
    ? `${options.message} ${dim("(Esc to go back)")}`
    : options.message;

  return withEscapeBack(options.showBack ?? false, (signal) =>
    search(
      {
        message,
        source: options.source,
      },
      { signal }
    )
  );
}

// Helper for dim text (used in prompts)
function dim(text: string): string {
  return `\x1b[2m${text}\x1b[22m`;
}

// Step-based flow runner
export type StepResult<T> = { action: "next"; value: T } | { action: "back" };

export interface Step<TState> {
  id: string;
  run: (state: TState, isFirst: boolean) => Promise<StepResult<Partial<TState>>>;
  skip?: (state: TState) => boolean;
}

export async function runSteps<TState extends Record<string, unknown>>(
  steps: Step<TState>[],
  initialState: TState
): Promise<TState> {
  let state = { ...initialState };
  let stepIndex = 0;

  while (stepIndex < steps.length) {
    const step = steps[stepIndex];

    // Check if step should be skipped
    if (step.skip && step.skip(state)) {
      stepIndex++;
      continue;
    }

    const isFirst = stepIndex === 0;
    const result = await step.run(state, isFirst);

    if (result.action === "back") {
      // Go back to previous non-skipped step
      stepIndex--;
      while (stepIndex > 0 && steps[stepIndex].skip && steps[stepIndex].skip!(state)) {
        stepIndex--;
      }
      if (stepIndex < 0) stepIndex = 0;
    } else {
      state = { ...state, ...result.value };
      stepIndex++;
    }
  }

  return state;
}
