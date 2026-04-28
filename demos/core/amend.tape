# VHS Tape for devflow amend
# Amends the last commit with new changes or message
# Run with: vhs demos/core/amend.tape

Output demos/core/amend.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show recent commits first
Type "git log --oneline -3"
Enter
Sleep 3s

# Run amend command
Type "devflow amend"
Enter
Sleep 3s

# Edit commit message? yes (default)
Enter
Sleep 1.5s

# Select commit type (feat = first)
Enter
Sleep 1.5s

# Scope (optional, skip)
Enter
Sleep 1.5s

# Edit the message
Type "fix typo in login validation"
Enter
Sleep 1.5s

# Is this a breaking change? no
Enter
Sleep 1.5s

# Amend this commit? yes
Enter
Sleep 3s

# Show result
Sleep 4s
