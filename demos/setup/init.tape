# VHS Tape for devflow init
# Initializes devflow configuration in a project
# Run with: vhs demos/setup/init.tape

Output demos/setup/init.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow init"
Enter
Sleep 3s

# Select preset
Down
Enter
Sleep 1.5s

# Configure ticket provider
Enter
Sleep 1.5s

# Configure branch format
Enter
Sleep 1.5s

# Confirm creation
Enter
Sleep 3s

# Show result - config file created
Type "cat .devflow/config.json"
Enter
Sleep 4s
