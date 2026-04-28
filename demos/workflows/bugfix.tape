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

# Step 1: Create bugfix branch (type pre-set via flag)
Type "# Quick bugfix workflow"
Enter
Sleep 1s
Type "devflow branch --type fix"
Enter
Sleep 3s

# Ticket method: select "Enter manually"
Down
Enter
Sleep 1.5s

# Enter ticket
Type "456"
Enter
Sleep 1.5s

# Enter description (type already set)
Type "login-validation-error"
Enter
Sleep 1.5s

# Confirm branch creation
Enter
Sleep 1.5s

# Test plan? Skip
Down
Enter
Sleep 3s

# Step 2: Commit the fix (stage all with --all flag)
Type "clear"
Enter
Sleep 1s
Type "devflow commit --all"
Enter
Sleep 3s

# Select type: fix (index 1: feat[0] fix[1])
Down
Enter
Sleep 1.5s

# Enter message
Type "handle empty email validation"
Enter
Sleep 1.5s

# Is this a breaking change? no
Enter
Sleep 1.5s

# Add body? no
Enter
Sleep 1.5s

# Create this commit? yes
Enter
Sleep 3s

# Step 3: Create PR
Type "clear"
Enter
Sleep 1s
Type "devflow pr"
Enter
Sleep 3s

# Create a new PR for this branch? yes
Enter
Sleep 1.5s

# Base branch (accept default)
Enter
Sleep 1.5s

# PR title (accept default)
Enter
Sleep 1.5s

# Summary (blank = use commits)
Enter
Sleep 1.5s

# Create this PR? yes
Enter
Sleep 3s

# Show result with PR URL
Sleep 4s
