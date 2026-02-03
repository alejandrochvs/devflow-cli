# VHS Tape for devflow amend
# Amends the last commit with new changes or message
# Run with: vhs demos/core/amend.tape

Output demos/core/amend.gif
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

# Run amend command
Type "devflow amend"
Enter
Sleep 2s

# Select files to stage (if any)
Enter
Sleep 1s

# Choose to edit message
Down
Enter
Sleep 1s

# Edit the message
Type "fix typo in login validation"
Enter
Sleep 2s

# Show result
Sleep 3s
