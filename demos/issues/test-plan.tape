# VHS Tape for devflow test-plan
# Views and edits test plans for branches
# Run with: vhs demos/issues/test-plan.tape

Output demos/issues/test-plan.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow test-plan"
Enter
Sleep 2s

# View current test plan
Sleep 1s

# Add a test item
Down
Enter
Sleep 1s

Type "Verify error handling for invalid input"
Enter
Sleep 1s

# Save changes
Enter
Sleep 2s

# Show result
Sleep 3s
