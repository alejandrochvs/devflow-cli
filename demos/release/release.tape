# VHS Tape for devflow release
# Bumps version, generates changelog, and tags
# Run with: vhs demos/release/release.tape

Output demos/release/release.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow release"
Enter
Sleep 3s

# Select version bump type
Down
Enter
Sleep 1.5s

# Confirm release notes
Enter
Sleep 1.5s

# Confirm tag creation
Enter
Sleep 3s

# Show result
Sleep 4s
