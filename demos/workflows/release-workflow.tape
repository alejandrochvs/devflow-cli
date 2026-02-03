# VHS Tape for release workflow
# Complete release: changelog -> release -> cleanup
# Run with: vhs demos/workflows/release-workflow.tape

Output demos/workflows/release-workflow.gif
Set FontSize 18
Set Width 1000
Set Height 700
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 35ms

Sleep 1s

# Step 1: Generate changelog
Type "# Step 1: Generate changelog"
Enter
Sleep 500ms
Type "devflow changelog"
Enter
Sleep 2s

# Confirm range
Enter
Sleep 1s

# Save changelog
Enter
Sleep 2s

# Step 2: Create release
Type "clear"
Enter
Sleep 500ms
Type "# Step 2: Create release"
Enter
Sleep 500ms
Type "devflow release"
Enter
Sleep 2s

# Select version bump (minor)
Down
Enter
Sleep 1s

# Confirm release
Enter
Sleep 2s

# Step 3: Cleanup merged branches
Type "clear"
Enter
Sleep 500ms
Type "# Step 3: Cleanup old branches"
Enter
Sleep 500ms
Type "devflow cleanup"
Enter
Sleep 2s

# Select branches to delete
Space
Down
Space
Enter
Sleep 1s

# Confirm
Enter
Sleep 2s

# Show result
Sleep 3s
