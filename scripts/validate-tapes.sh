#!/bin/bash
# Validates all VHS tape files.
# Phase 1: syntax check every tape with `vhs validate`.
# Phase 2: execute non-interactive tapes against the built CLI and assert exit 0.
#
# Requires VHS to be installed: brew install charmbracelet/tap/vhs
# DEVFLOW_BIN: path to the devflow CLI binary (default: tries `devflow` in PATH,
#              then falls back to dist/index.js relative to the repo root).

set -e

DEMO_DIR="demos"
FAILED=0
CHECKED=0

# Non-interactive tapes that can be executed safely in CI without gh auth.
# These commands just print output and exit (no prompts, no network calls).
NON_INTERACTIVE_TAPES=(
  "demos/setup/status.tape"
  "demos/setup/doctor.tape"
  "demos/setup/lint-config.tape"
  "demos/setup/completions.tape"
  "demos/release/stats.tape"
)

echo ""
echo "=== Validating Tape Files ==="
echo ""

# Check if VHS is installed
if ! command -v vhs &> /dev/null; then
    echo "Error: VHS is not installed"
    echo "Install with: brew install charmbracelet/tap/vhs"
    exit 1
fi

# Use a fixed VHS_PORT to avoid conflicts with other running VHS instances.
export VHS_PORT="${VHS_PORT:-7681}"

# ─── Phase 1: syntax validation ───────────────────────────────────────────────
echo "Phase 1: Syntax check"
echo ""

for tape in $(find "$DEMO_DIR" -name "*.tape" 2>/dev/null | sort); do
    CHECKED=$((CHECKED + 1))
    echo -n "  Checking: $tape ... "

    if vhs validate "$tape" 2>/dev/null; then
        echo -e "\033[32mOK\033[0m"
    else
        echo -e "\033[31mFAILED\033[0m"
        FAILED=$((FAILED + 1))
    fi
done

echo ""

if [ $CHECKED -eq 0 ]; then
    echo "No tape files found in $DEMO_DIR"
    exit 1
fi

if [ $FAILED -gt 0 ]; then
    echo -e "\033[31m$FAILED/$CHECKED tape files failed syntax validation\033[0m"
    exit 1
else
    echo -e "\033[32mAll $CHECKED tape files are syntactically valid\033[0m"
fi

echo ""

# ─── Phase 2: execute non-interactive tapes ──────────────────────────────────
# Resolve the devflow binary: prefer DEVFLOW_BIN env var, then PATH, then dist/.
DEVFLOW_SCRIPT=""
if [ -n "$DEVFLOW_BIN" ] && [ -f "$DEVFLOW_BIN" ]; then
    DEVFLOW_SCRIPT="$DEVFLOW_BIN"
elif command -v devflow &> /dev/null; then
    DEVFLOW_SCRIPT="$(command -v devflow)"
elif [ -f "dist/index.js" ]; then
    DEVFLOW_SCRIPT="$(pwd)/dist/index.js"
fi

if [ -z "$DEVFLOW_SCRIPT" ]; then
    echo "Skipping Phase 2: devflow binary not found (set DEVFLOW_BIN or run npm run build)"
    echo ""
    exit 0
fi

echo "Phase 2: Execute non-interactive tapes (devflow: $DEVFLOW_SCRIPT)"
echo ""

# Create a temporary PATH shim so `devflow` inside tapes resolves to our binary.
SHIM_DIR=$(mktemp -d)
cat > "$SHIM_DIR/devflow" << SHIM_EOF
#!/bin/bash
exec node "$DEVFLOW_SCRIPT" "\$@"
SHIM_EOF
chmod +x "$SHIM_DIR/devflow"

# Create a scratch git repo so git commands inside tapes have a valid repo.
SCRATCH_DIR=$(mktemp -d)
git -C "$SCRATCH_DIR" init -q
git -C "$SCRATCH_DIR" config user.email "vhs-validate@devflow.test"
git -C "$SCRATCH_DIR" config user.name "VHS Validate"
touch "$SCRATCH_DIR/README.md"
git -C "$SCRATCH_DIR" add .
git -C "$SCRATCH_DIR" commit -q -m "initial commit"

RUN_FAILED=0
RUN_CHECKED=0

run_tape() {
    local tape_path="$1"
    # VHS only supports relative paths for Output — use a temp name in cwd.
    local gif_name="vhs-validate-$$.gif"
    local tape_tmp
    tape_tmp=$(mktemp /tmp/vhs-validate-XXXXXX)

    # Rewrite the Output line to a relative temp path.
    sed "s|^Output .*|Output $gif_name|" "$tape_path" > "$tape_tmp"

    local exit_code=0
    (
        export PATH="$SHIM_DIR:$PATH"
        export VHS_PORT="$VHS_PORT"
        vhs "$tape_tmp" 2>/dev/null 1>/dev/null
    ) || exit_code=$?

    rm -f "$tape_tmp" "$gif_name"
    return $exit_code
}

for tape in "${NON_INTERACTIVE_TAPES[@]}"; do
    if [ ! -f "$tape" ]; then
        echo "  Skipping (not found): $tape"
        continue
    fi

    RUN_CHECKED=$((RUN_CHECKED + 1))
    echo -n "  Running:  $tape ... "

    if run_tape "$tape"; then
        echo -e "\033[32mOK\033[0m"
    else
        echo -e "\033[31mFAILED\033[0m"
        RUN_FAILED=$((RUN_FAILED + 1))
    fi
done

# Cleanup scratch dirs.
rm -rf "$SHIM_DIR" "$SCRATCH_DIR"

echo ""

if [ $RUN_CHECKED -eq 0 ]; then
    echo "No non-interactive tapes to execute."
elif [ $RUN_FAILED -gt 0 ]; then
    echo -e "\033[31m$RUN_FAILED/$RUN_CHECKED non-interactive tapes failed execution\033[0m"
    exit 1
else
    echo -e "\033[32mAll $RUN_CHECKED non-interactive tapes executed successfully\033[0m"
fi

echo ""
