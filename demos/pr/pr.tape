# VHS Tape for devflow pr
# Creates or updates a pull request
# Run with: vhs demos/pr/pr.tape

Output demos/pr/pr.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow pr"
Enter
Sleep 3s

# Edit PR title
Enter
Sleep 1.5s

# Enter summary
Type "Implements user authentication with OAuth2"
Enter
Sleep 1.5s

# Add test plan items
Space
Down
Space
Enter
Sleep 1.5s

# Confirm creation
Enter
Sleep 3s

# Show result with PR URL
Sleep 4s
