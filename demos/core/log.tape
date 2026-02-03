# VHS Tape for devflow log
# Interactive commit log with cherry-pick/revert/fixup
# Run with: vhs demos/core/log.tape

Output demos/core/log.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow log"
Enter
Sleep 3s

# Navigate through commits
Down
Down
Sleep 1.5s

# Select a commit
Enter
Sleep 1.5s

# Choose action (view diff)
Enter
Sleep 3s

# Exit
Escape
Sleep 2s

# Show result
Sleep 4s
