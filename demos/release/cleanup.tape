# VHS Tape for devflow cleanup
# Deletes merged local branches
# Run with: vhs demos/release/cleanup.tape

Output demos/release/cleanup.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow cleanup"
Enter
Sleep 2s

# Show branches to delete
Sleep 1.5s

# Select branches
Space
Down
Space
Enter
Sleep 1s

# Confirm deletion
Enter
Sleep 2s

# Show result
Sleep 3s
