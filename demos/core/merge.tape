# VHS Tape for devflow merge
# Merges the current PR with selected strategy
# Run with: vhs demos/core/merge.tape

Output demos/core/merge.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow merge"
Enter
Sleep 3s

# Select merge strategy
Down
Enter
Sleep 1.5s

# Confirm merge
Enter
Sleep 3s

# Show result
Sleep 4s
