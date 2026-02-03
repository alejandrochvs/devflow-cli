# VHS Tape for devflow cleanup
# Deletes merged local branches
# Run with: vhs demos/release/cleanup.tape

Output demos/release/cleanup.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow cleanup"
Enter
Sleep 3s

# Show branches to delete
Sleep 2s

# Select branches
Space
Down
Space
Enter
Sleep 1.5s

# Confirm deletion
Enter
Sleep 3s

# Show result
Sleep 4s
