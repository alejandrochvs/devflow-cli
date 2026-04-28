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

# If no plan exists: "Add test plan steps?" → yes (default)
# If plan exists: action select → "Add more steps" (first option)
Enter
Sleep 1.5s

# Type a step
Type "Verify error handling for invalid input"
Enter
Sleep 1s

# Blank line to finish adding steps
Enter
Sleep 1.5s

# If plan existed: navigate to Done in action menu (edit[1] clear[2] done[3])
Down
Down
Down
Enter
Sleep 3s

# Show result
Sleep 4s
