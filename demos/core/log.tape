# VHS Tape for devflow log
# Interactive commit log with cherry-pick/revert/fixup
# Run with: vhs demos/core/log.tape

Output demos/core/log.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow log"
Enter
Sleep 2s

# Navigate through commits
Down
Down
Sleep 1s

# Select a commit
Enter
Sleep 1s

# Choose action (view diff)
Enter
Sleep 2s

# Exit
Escape
Sleep 2s

# Show result
Sleep 2s
