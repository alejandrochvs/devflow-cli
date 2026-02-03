# VHS Tape for devflow status
# Shows current branch, ticket, and PR info
# Run with: vhs demos/setup/status.tape

Output demos/setup/status.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow status"
Enter
Sleep 2s

# Display status info
Sleep 3s
