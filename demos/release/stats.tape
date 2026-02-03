# VHS Tape for devflow stats
# Shows commit statistics and contributors
# Run with: vhs demos/release/stats.tape

Output demos/release/stats.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow stats"
Enter
Sleep 3s

# View commit types breakdown
Sleep 3s

# Scroll to see more stats
Down
Down
Sleep 2s

# Show contributors
Sleep 3s

# Show result
Sleep 4s
