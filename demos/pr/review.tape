# VHS Tape for devflow review
# Lists and interacts with open PRs
# Run with: vhs demos/pr/review.tape

Output demos/pr/review.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow review"
Enter
Sleep 3s

# Navigate to second PR
Down
Sleep 1.5s

# Select PR
Enter
Sleep 1.5s

# Action: checkout this branch locally (first option — no text input required)
Enter
Sleep 3s

# Show result
Sleep 4s
