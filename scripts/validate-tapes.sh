#!/bin/bash
# Validates all VHS tape files.
# Phase 1: syntax check every tape with `vhs validate`.
# Phase 2: run the devflow command from each non-interactive tape directly
#           against the built CLI and assert exit 0.
#           (VHS rendering requires fonts/display that may not be in all CI
#           environments; Phase 1 already catches VHS syntax errors.)
#
# Requires VHS to be installed: brew install charmbracelet/tap/vhs
# DEVFLOW_BIN: path to the devflow CLI binary (default: tries `devflow` in PATH,
#              then falls back to dist/index.js relative to the repo root).

set -e

DEMO_DIR="demos"
FAILED=0
CHECKED=0

# Non-interactive tapes and the devflow command each one demonstrates.
# Format: "tape-path:command"
# These commands just print output and exit (no prompts, no network calls).
NON_INTERACTIVE_TAPES=(
  "demos/setup/status.tape:devflow status"
  "demos/setup/doctor.tape:devflow doctor"
  "demos/setup/lint-config.tape:devflow lint-config"
  "demos/setup/completions.tape:devflow completions --shell bash"
  "demos/release/stats.tape:devflow stats"
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

# ─── Phase 2: execute non-interactive commands directly ──────────────────────
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

echo "Phase 2: Run non-interactive tape commands (devflow: $DEVFLOW_SCRIPT)"
echo ""

# Create a temporary PATH shim so `devflow` inside commands resolves to our binary.
SHIM_DIR=$(mktemp -d)
cat > "$SHIM_DIR/devflow" << SHIM_EOF
#!/bin/bash
exec node "$DEVFLOW_SCRIPT" "\$@"
SHIM_EOF
chmod +x "$SHIM_DIR/devflow"

RUN_FAILED=0
RUN_CHECKED=0

for entry in "${NON_INTERACTIVE_TAPES[@]}"; do
    tape="${entry%%:*}"
    cmd="${entry#*:}"

    if [ ! -f "$tape" ]; then
        echo "  Skipping (not found): $tape"
        continue
    fi

    RUN_CHECKED=$((RUN_CHECKED + 1))
    echo -n "  Running:  $tape ... "

    err_tmp=$(mktemp /tmp/vhs-validate-err-XXXXXX)
    exit_code=0
    (
        export PATH="$SHIM_DIR:$PATH"
        eval "$cmd" > /dev/null 2>"$err_tmp"
    ) || exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo -e "\033[32mOK\033[0m"
    else
        echo -e "\033[31mFAILED (exit $exit_code)\033[0m"
        if [ -s "$err_tmp" ]; then
            sed 's/^/    /' "$err_tmp" | head -10
        fi
        RUN_FAILED=$((RUN_FAILED + 1))
    fi
    rm -f "$err_tmp"
done

rm -rf "$SHIM_DIR"

echo ""

if [ $RUN_CHECKED -eq 0 ]; then
    echo "No non-interactive tapes to execute."
elif [ $RUN_FAILED -gt 0 ]; then
    echo -e "\033[31m$RUN_FAILED/$RUN_CHECKED non-interactive tape commands failed\033[0m"
    exit 1
else
    echo -e "\033[32mAll $RUN_CHECKED non-interactive tape commands executed successfully\033[0m"
fi

echo ""
