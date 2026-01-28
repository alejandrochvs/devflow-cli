# VHS Tape for devflow LinkedIn Demo
# Run with: vhs demo.tape

Output demo.gif
Set FontSize 20
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 50ms

# Title pause
Sleep 1s

# Show branch creation
Type "devflow branch"
Enter
Sleep 2s

# Choose ticket number
Down
Enter
Sleep 1s

# Type ticket number
Type "PROJ-112"
Enter
Sleep 1s

# Select type (feat)
Enter
Sleep 1s

# Enter description
Type "add user authentication"
Enter
Sleep 1.5s

# Show result
Sleep 2s

# Clear and show commit
Type "clear"
Enter
Sleep 500ms

Type "devflow commit"
Enter
Sleep 2s

# Stage files (press space to select, enter to continue)
Space
Enter
Sleep 1s

# Select type (feat)
Down
Enter
Sleep 1s

# Select scope
Enter
Sleep 1s

# Enter message
Type "implement OAuth2 login flow"
Enter
Sleep 1.5s

# Show result
Sleep 3s
