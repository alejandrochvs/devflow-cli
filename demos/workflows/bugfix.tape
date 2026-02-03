# VHS Tape for bugfix workflow
# Quick bugfix: branch -> fix -> commit -> pr
# Run with: vhs demos/workflows/bugfix.tape

Output demos/workflows/bugfix.gif
Set FontSize 18
Set Width 1000
Set Height 700
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Step 1: Create bugfix branch
Type "# Quick bugfix workflow"
Enter
Sleep 1s
Type "devflow branch --type fix"
Enter
Sleep 3s

# Enter ticket
Type "456"
Enter
Sleep 1.5s

# Enter description
Type "login-validation-error"
Enter
Sleep 3s

# Step 2: Commit the fix
Type "clear"
Enter
Sleep 1s
Type "devflow commit --all"
Enter
Sleep 3s

# Select type (fix)
Down
Down
Enter
Sleep 1.5s

# Select scope
Enter
Sleep 1.5s

# Enter message
Type "handle empty email validation"
Enter
Sleep 3s

# Step 3: Create PR
Type "clear"
Enter
Sleep 1s
Type "devflow pr"
Enter
Sleep 3s

# Confirm and create
Enter
Sleep 1.5s
Enter
Sleep 3s

# Show result with PR URL
Sleep 4s
