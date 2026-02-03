# VHS Tape for devflow comments
# Shows PR reviews with diff context
# Run with: vhs demos/pr/comments.tape

Output demos/pr/comments.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow comments"
Enter
Sleep 3s

# Scroll through comments
Down
Down
Sleep 1.5s

# View diff context
Enter
Sleep 3s

# Show result
Sleep 4s
