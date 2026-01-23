const enabled = process.stdout.isTTY !== false;

function wrap(code: number, resetCode: number) {
  return (text: string) =>
    enabled ? `\x1b[${code}m${text}\x1b[${resetCode}m` : text;
}

export const bold = wrap(1, 22);
export const dim = wrap(2, 22);
export const green = wrap(32, 39);
export const yellow = wrap(33, 39);
export const red = wrap(31, 39);
export const cyan = wrap(36, 39);
export const gray = wrap(90, 39);
export const magenta = wrap(35, 39);
