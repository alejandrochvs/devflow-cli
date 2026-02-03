# VHS Tape for devflow issues
# Lists and manages project board issues
# Run with: vhs demos/issues/issues.tape

Output demos/issues/issues.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow issues"
Enter
Sleep 2s

# Navigate through issues
Down
Down
Sleep 1s

# Select an issue to work on
Enter
Sleep 1s

# Confirm start work
Enter
Sleep 2s

# Show result - branch created
Sleep 3s
