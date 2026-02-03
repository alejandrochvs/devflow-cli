# VHS Tape for devflow merge
# Merges the current PR with selected strategy
# Run with: vhs demos/core/merge.tape

Output demos/core/merge.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow merge"
Enter
Sleep 2s

# Select merge strategy
Down
Enter
Sleep 1s

# Confirm merge
Enter
Sleep 2s

# Show result
Sleep 3s
