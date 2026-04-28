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

# Create a new PR for this branch? yes (default)
Enter
Sleep 1.5s

# Base branch (accept default)
Enter
Sleep 1.5s

# PR title (accept default from branch name / commits)
Enter
Sleep 1.5s

# PR summary
Type "Implements user authentication with OAuth2"
Enter
Sleep 1.5s

# Create this PR? yes
Enter
Sleep 3s

# Show result with PR URL
Sleep 4s
