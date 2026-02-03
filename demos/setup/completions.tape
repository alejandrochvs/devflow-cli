# VHS Tape for devflow completions
# Generates shell completion scripts
# Run with: vhs demos/setup/completions.tape

Output demos/setup/completions.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command for bash
Type "devflow completions bash"
Enter
Sleep 2s

# Show completion script output
Sleep 2s

# Show usage hint
Type "# Add to ~/.bashrc for auto-completion"
Enter
Sleep 2s
