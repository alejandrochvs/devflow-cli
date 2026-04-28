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

# Action: save (first option when no existing stashes)
Enter
Sleep 1.5s

# Enter stash message
Type "work-in-progress-auth"
Enter
Sleep 1.5s

# Include untracked files? no (default)
Enter
Sleep 3s

# Pop the stash to restore work
Type "devflow stash"
Enter
Sleep 3s

# Action: pop (second option — save[0] pop[1])
Down
Enter
Sleep 1.5s

# Select stash: first (and only) stash
Enter
Sleep 3s

# Show result
Sleep 4s
