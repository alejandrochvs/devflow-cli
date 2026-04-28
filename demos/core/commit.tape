# VHS Tape for devflow commit
# Creates conventional commits with guided prompts
# Run with: vhs demos/core/commit.tape

Output demos/core/commit.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow commit"
Enter
Sleep 3s

# Stage files: Enter picks "Stage all files"
Enter
Sleep 1.5s

# Select type (fix = second option)
Down
Enter
Sleep 1.5s

# Enter commit message
Type "implement OAuth2 login flow"
Enter
Sleep 1.5s

# Is this a breaking change? no
Enter
Sleep 1.5s

# Add body? no
Enter
Sleep 1.5s

# Create this commit? yes
Enter
Sleep 3s

# Show result
Sleep 4s
