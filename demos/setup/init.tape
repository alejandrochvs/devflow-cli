# VHS Tape for devflow init
# Initializes devflow configuration in a project
# Run with: vhs demos/setup/init.tape

Output demos/setup/init.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow init"
Enter
Sleep 2s

# Select preset
Down
Enter
Sleep 1s

# Configure ticket provider
Enter
Sleep 1s

# Configure branch format
Enter
Sleep 1s

# Confirm creation
Enter
Sleep 2s

# Show result - config file created
Type "cat .devflow/config.json"
Enter
Sleep 3s
