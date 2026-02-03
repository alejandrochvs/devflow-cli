# VHS Tape for devflow comments
# Shows PR reviews with diff context
# Run with: vhs demos/pr/comments.tape

Output demos/pr/comments.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow comments"
Enter
Sleep 2s

# Scroll through comments
Down
Down
Sleep 1s

# View diff context
Enter
Sleep 2s

# Show result
Sleep 3s
