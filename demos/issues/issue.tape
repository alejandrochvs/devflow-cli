# VHS Tape for devflow issue
# Creates a GitHub issue with templates
# Run with: vhs demos/issues/issue.tape

Output demos/issues/issue.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow issue"
Enter
Sleep 2s

# Select issue type (feature)
Down
Enter
Sleep 1s

# Enter title
Type "Add dark mode toggle to settings"
Enter
Sleep 1s

# Enter description
Type "Users should be able to switch between light and dark themes"
Enter
Sleep 1s

# Add acceptance criteria
Type "Toggle persists across sessions"
Enter
Sleep 1s

# Create branch option
Enter
Sleep 2s

# Show result
Sleep 3s
