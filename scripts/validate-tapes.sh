#!/bin/bash
# Validates all VHS tape files for syntax errors
# Requires VHS to be installed: brew install charmbracelet/tap/vhs

set -e

DEMO_DIR="demos"
FAILED=0
CHECKED=0

echo ""
echo "=== Validating Tape Files ==="
echo ""

# Check if VHS is installed
if ! command -v vhs &> /dev/null; then
    echo "Error: VHS is not installed"
    echo "Install with: brew install charmbracelet/tap/vhs"
    exit 1
fi

# Find all tape files
for tape in $(find "$DEMO_DIR" -name "*.tape" 2>/dev/null | sort); do
    CHECKED=$((CHECKED + 1))
    echo -n "  Checking: $tape ... "

    # VHS validate command (dry run without generating output)
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
    echo -e "\033[31m$FAILED/$CHECKED tape files have errors\033[0m"
    exit 1
else
    echo -e "\033[32mAll $CHECKED tape files are valid\033[0m"
fi

echo ""
