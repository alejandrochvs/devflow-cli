# VHS Tape for devflow release
# Bumps version, generates changelog, and tags a release
# Run with: vhs demos/release/release.tape

Output demos/release/release.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command (dry-run to avoid creating a real release)
Type "devflow release --dry-run"
Enter
Sleep 3s

# Select version bump: minor (index 1: patch[0] minor[1] major[2])
Down
Enter
Sleep 1.5s

# Release this version? yes (first select option)
Enter
Sleep 1.5s

# Create GitHub release? yes (triggers npm publish)
Enter
Sleep 3s

# Show result
Sleep 4s
