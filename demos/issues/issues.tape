# VHS Tape for devflow issues
# Lists and manages project board issues
# Run with: vhs demos/issues/issues.tape

Output demos/issues/issues.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow issues"
Enter
Sleep 3s

# Navigate through issues
Down
Down
Sleep 1.5s

# Select an issue to work on
Enter
Sleep 1.5s

# Confirm start work
Enter
Sleep 3s

# Show result - branch created
Sleep 4s
