# VHS Tape for devflow worktree
# Manages git worktrees for parallel work
# Run with: vhs demos/stash/worktree.tape

Output demos/stash/worktree.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow worktree"
Enter
Sleep 2s

# Choose to add worktree
Enter
Sleep 1s

# Select branch
Down
Enter
Sleep 1s

# Confirm creation
Enter
Sleep 2s

# Show result - worktree created
Sleep 3s
