# VHS Tape for devflow fixup
# Creates a fixup commit targeting a previous commit
# Run with: vhs demos/core/fixup.tape

Output demos/core/fixup.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow fixup"
Enter
Sleep 3s

# Stage files
Space
Enter
Sleep 1.5s

# Select target commit from list
Down
Enter
Sleep 3s

# Confirm fixup
Enter
Sleep 3s

# Show result
Sleep 4s
