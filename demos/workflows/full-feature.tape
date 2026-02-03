# VHS Tape for full feature workflow
# Complete workflow: issue -> branch -> commit -> pr
# Run with: vhs demos/workflows/full-feature.tape

Output demos/workflows/full-feature.gif
Set FontSize 18
Set Width 1000
Set Height 700
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 35ms

Sleep 1s

# Step 1: Check project issues
Type "# Step 1: Pick an issue from the board"
Enter
Sleep 500ms
Type "devflow issues --work"
Enter
Sleep 2s

# Select issue
Down
Enter
Sleep 1s

# Confirm branch creation
Enter
Sleep 2s

# Step 2: Make changes and commit
Type "clear"
Enter
Sleep 500ms
Type "# Step 2: Make changes and commit"
Enter
Sleep 500ms
Type "devflow commit"
Enter
Sleep 2s

# Stage files
Space
Enter
Sleep 1s

# Select type
Down
Enter
Sleep 1s

# Select scope
Enter
Sleep 1s

# Enter message
Type "implement dark mode toggle"
Enter
Sleep 2s

# Step 3: Create PR
Type "clear"
Enter
Sleep 500ms
Type "# Step 3: Create a pull request"
Enter
Sleep 500ms
Type "devflow pr"
Enter
Sleep 2s

# Confirm title
Enter
Sleep 1s

# Enter summary
Type "Adds dark mode toggle to user settings"
Enter
Sleep 1s

# Select test plan items
Space
Enter
Sleep 1s

# Confirm PR creation
Enter
Sleep 2s

# Show result
Sleep 3s
