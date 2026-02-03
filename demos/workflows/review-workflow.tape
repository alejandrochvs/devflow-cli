# VHS Tape for review workflow
# Code review: review -> comments -> merge
# Run with: vhs demos/workflows/review-workflow.tape

Output demos/workflows/review-workflow.gif
Set FontSize 18
Set Width 1000
Set Height 700
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 35ms

Sleep 1s

# Step 1: List PRs to review
Type "# Step 1: Find PRs to review"
Enter
Sleep 500ms
Type "devflow review"
Enter
Sleep 2s

# Select a PR
Down
Enter
Sleep 1.5s

# Step 2: View comments
Type "clear"
Enter
Sleep 500ms
Type "# Step 2: Check review comments"
Enter
Sleep 500ms
Type "devflow comments"
Enter
Sleep 2s

# Scroll through comments
Down
Down
Sleep 1.5s

# Step 3: Merge the PR
Type "clear"
Enter
Sleep 500ms
Type "# Step 3: Merge when ready"
Enter
Sleep 500ms
Type "devflow merge"
Enter
Sleep 2s

# Select merge strategy
Enter
Sleep 1s

# Confirm merge
Enter
Sleep 2s

# Show result
Sleep 3s
