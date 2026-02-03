# VHS Tape for devflow test-plan
# Views and edits test plans for branches
# Run with: vhs demos/issues/test-plan.tape

Output demos/issues/test-plan.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow test-plan"
Enter
Sleep 3s

# View current test plan
Sleep 1.5s

# Add a test item
Down
Enter
Sleep 1.5s

Type "Verify error handling for invalid input"
Enter
Sleep 1.5s

# Save changes
Enter
Sleep 3s

# Show result
Sleep 4s
