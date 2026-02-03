# VHS Tape for devflow issue
# Creates a GitHub issue with templates
# Run with: vhs demos/issues/issue.tape

Output demos/issues/issue.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow issue"
Enter
Sleep 3s

# Select issue type (feature)
Down
Enter
Sleep 1.5s

# Enter title
Type "Add dark mode toggle to settings"
Enter
Sleep 1.5s

# Enter description
Type "Users should be able to switch between light and dark themes"
Enter
Sleep 1.5s

# Add acceptance criteria
Type "Toggle persists across sessions"
Enter
Sleep 1.5s

# Create branch option
Enter
Sleep 3s

# Show result
Sleep 4s
