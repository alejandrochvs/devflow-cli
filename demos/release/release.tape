# VHS Tape for devflow release
# Bumps version, generates changelog, and tags
# Run with: vhs demos/release/release.tape

Output demos/release/release.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow release"
Enter
Sleep 2s

# Select version bump type
Down
Enter
Sleep 1s

# Confirm release notes
Enter
Sleep 1s

# Confirm tag creation
Enter
Sleep 2s

# Show result
Sleep 3s
