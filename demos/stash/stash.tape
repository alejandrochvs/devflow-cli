# VHS Tape for devflow stash
# Saves and manages named stashes
# Run with: vhs demos/stash/stash.tape

Output demos/stash/stash.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show current changes
Type "git status"
Enter
Sleep 2s

# Stash with a name
Type "devflow stash"
Enter
Sleep 3s

# Choose to save
Enter
Sleep 1.5s

# Enter stash name
Type "work-in-progress-auth"
Enter
Sleep 3s

# Show stash was created
Type "devflow stash"
Enter
Sleep 3s

# List shows the stash
Sleep 4s
