# VHS Tape for release workflow
# Complete release: changelog -> release -> cleanup
# Run with: vhs demos/workflows/release-workflow.tape

Output demos/workflows/release-workflow.gif
Set FontSize 18
Set Width 1000
Set Height 700
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Step 1: Generate changelog
Type "# Step 1: Generate changelog"
Enter
Sleep 1s
Type "devflow changelog"
Enter
Sleep 3s

# Confirm range
Enter
Sleep 1.5s

# Save changelog
Enter
Sleep 3s

# Step 2: Create release
Type "clear"
Enter
Sleep 1s
Type "# Step 2: Create release"
Enter
Sleep 1s
Type "devflow release"
Enter
Sleep 3s

# Select version bump (minor)
Down
Enter
Sleep 1.5s

# Confirm release
Enter
Sleep 3s

# Step 3: Cleanup merged branches
Type "clear"
Enter
Sleep 1s
Type "# Step 3: Cleanup old branches"
Enter
Sleep 1s
Type "devflow cleanup"
Enter
Sleep 3s

# Select branches to delete
Space
Down
Space
Enter
Sleep 1.5s

# Confirm
Enter
Sleep 3s

# Show result
Sleep 4s
