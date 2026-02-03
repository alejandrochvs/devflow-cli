# VHS Tape for devflow fixup
# Creates a fixup commit targeting a previous commit
# Run with: vhs demos/core/fixup.tape

Output demos/core/fixup.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow fixup"
Enter
Sleep 2s

# Stage files
Space
Enter
Sleep 1s

# Select target commit from list
Down
Enter
Sleep 2s

# Confirm fixup
Enter
Sleep 2s

# Show result
Sleep 3s
