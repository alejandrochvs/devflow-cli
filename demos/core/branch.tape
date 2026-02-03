# VHS Tape for devflow branch
# Creates a new git branch with type/ticket/description format
# Run with: vhs demos/core/branch.tape

Output demos/core/branch.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow branch"
Enter
Sleep 2s

# Select "Enter ticket number"
Down
Enter
Sleep 1s

# Type ticket number
Type "123"
Enter
Sleep 1s

# Select type (feat)
Enter
Sleep 1s

# Enter description
Type "add user authentication"
Enter
Sleep 2s

# Show result
Sleep 3s
