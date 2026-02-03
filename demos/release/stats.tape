# VHS Tape for devflow stats
# Shows commit statistics and contributors
# Run with: vhs demos/release/stats.tape

Output demos/release/stats.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow stats"
Enter
Sleep 2s

# View commit types breakdown
Sleep 2s

# Scroll to see more stats
Down
Down
Sleep 1.5s

# Show contributors
Sleep 2s

# Show result
Sleep 3s
