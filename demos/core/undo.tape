# VHS Tape for devflow undo
# Undoes the last commit, keeping changes staged
# Run with: vhs demos/core/undo.tape

Output demos/core/undo.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show recent commits first
Type "git log --oneline -3"
Enter
Sleep 2s

# Run undo command
Type "devflow undo"
Enter
Sleep 2s

# Confirm undo
Enter
Sleep 2s

# Show result - changes are now staged
Type "git status"
Enter
Sleep 3s
