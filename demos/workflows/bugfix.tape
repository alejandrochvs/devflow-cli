# VHS Tape for bugfix workflow
# Quick bugfix: branch -> fix -> commit -> pr
# Run with: vhs demos/workflows/bugfix.tape

Output demos/workflows/bugfix.gif
Set FontSize 18
Set Width 1000
Set Height 700
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 35ms

Sleep 1s

# Step 1: Create bugfix branch
Type "# Quick bugfix workflow"
Enter
Sleep 500ms
Type "devflow branch --type fix"
Enter
Sleep 2s

# Enter ticket
Type "456"
Enter
Sleep 1s

# Enter description
Type "login-validation-error"
Enter
Sleep 2s

# Step 2: Commit the fix
Type "clear"
Enter
Sleep 500ms
Type "devflow commit --all"
Enter
Sleep 2s

# Select type (fix)
Down
Down
Enter
Sleep 1s

# Select scope
Enter
Sleep 1s

# Enter message
Type "handle empty email validation"
Enter
Sleep 2s

# Step 3: Create PR
Type "clear"
Enter
Sleep 500ms
Type "devflow pr"
Enter
Sleep 2s

# Confirm and create
Enter
Sleep 1s
Enter
Sleep 2s

# Show result with PR URL
Sleep 3s
