# VHS Tape for devflow worktree
# Manages git worktrees for parallel work
# Run with: vhs demos/stash/worktree.tape

Output demos/stash/worktree.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow worktree"
Enter
Sleep 3s

# Choose to add worktree
Enter
Sleep 1.5s

# Select branch
Down
Enter
Sleep 1.5s

# Confirm creation
Enter
Sleep 3s

# Show result - worktree created
Sleep 4s
