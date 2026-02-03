# VHS Tape for full feature workflow
# Complete workflow: branch -> commit -> pr
# Run with: vhs demos/workflows/full-feature.tape

Output demos/workflows/full-feature.gif
Set FontSize 18
Set Width 1000
Set Height 700
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Step 1: Create a feature branch
Type "# Step 1: Create a feature branch"
Enter
Sleep 1s
Type "devflow branch"
Enter
Sleep 3s

# Select ticket option
Down
Enter
Sleep 1.5s

# Enter ticket number
Type "42"
Enter
Sleep 1.5s

# Select type (feat)
Enter
Sleep 1.5s

# Enter description
Type "dark-mode-toggle"
Enter
Sleep 3s

# Step 2: Make changes and commit
Type "clear"
Enter
Sleep 1s
Type "# Step 2: Make changes and commit"
Enter
Sleep 1s
Type "devflow commit"
Enter
Sleep 3s

# Stage files
Space
Enter
Sleep 1.5s

# Select type (feat)
Down
Enter
Sleep 1.5s

# Select scope
Enter
Sleep 1.5s

# Enter message
Type "implement dark mode toggle"
Enter
Sleep 3s

# Step 3: Create PR
Type "clear"
Enter
Sleep 1s
Type "# Step 3: Create a pull request"
Enter
Sleep 1s
Type "devflow pr"
Enter
Sleep 3s

# Confirm title
Enter
Sleep 1.5s

# Enter summary
Type "Adds dark mode toggle to user settings"
Enter
Sleep 1.5s

# Select test plan items
Space
Enter
Sleep 1.5s

# Confirm PR creation
Enter
Sleep 3s

# Show result
Sleep 4s
