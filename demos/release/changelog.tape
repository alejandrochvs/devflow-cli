# VHS Tape for devflow changelog
# Generates changelog from conventional commits
# Run with: vhs demos/release/changelog.tape

Output demos/release/changelog.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow changelog"
Enter
Sleep 3s

# Version for this changelog entry (accept default)
Enter
Sleep 1.5s

# Preview changelog
Sleep 3s

# Write to CHANGELOG.md? yes (default)
Enter
Sleep 3s

# Show result
Sleep 4s
